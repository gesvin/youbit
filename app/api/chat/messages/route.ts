// app/api/chat/messages/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { translateChatMessage } from '@/lib/translation'
import { checkMinuteRateLimit, evaluateQuotaState } from '@/lib/chat-quota'
import { notifyOwnerNewChatMessage } from '@/lib/push-notify'

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(req.url)

    const conversationId = searchParams.get('conversationId')
    const ownerUserIdParam = searchParams.get('ownerUserId')
    const visitorToken = searchParams.get('visitorToken')
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get('limit') || 40))
    )
    const before = searchParams.get('before')

    if (!conversationId && !(ownerUserIdParam && visitorToken)) {
      return NextResponse.json(
        { error: 'Parámetros insuficientes para cargar la conversación.' },
        { status: 400 }
      )
    }

    let convQuery = supabase.from('chat_conversations').select('*')

    if (conversationId) {
      convQuery = convQuery.eq('id', conversationId)
      if (visitorToken) {
        convQuery = convQuery.eq('visitor_token', visitorToken)
      }
    } else if (ownerUserIdParam && visitorToken) {
      convQuery = convQuery
        .eq('owner_user_id', ownerUserIdParam)
        .eq('visitor_token', visitorToken)
    }

    const { data: conversation, error: convErr } =
      await convQuery.maybeSingle()

    if (convErr || !conversation) {
      return NextResponse.json(
        { error: 'Conversación no encontrada.' },
        { status: 404 }
      )
    }

    let msgQuery = supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (before) {
      msgQuery = msgQuery.lt('created_at', before)
    }

    const { data: messagesDesc, error: msgErr } = await msgQuery

    if (msgErr) {
      return NextResponse.json(
        { error: 'Error al obtener mensajes.' },
        { status: 500 }
      )
    }

    const messages = (messagesDesc ?? []).reverse()

    return NextResponse.json({
      conversation,
      messages,
    })
  } catch {
    return NextResponse.json(
      { error: 'Error interno al cargar mensajes.' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = createAdminClient()

    // Anti-spam honeypot
    if (typeof body.honeypot === 'string' && body.honeypot.trim().length > 0) {
      return NextResponse.json({ error: 'Solicitud rechazada.' }, { status: 400 })
    }

    const senderType: 'visitor' | 'owner' =
      body.senderType === 'owner' ? 'owner' : 'visitor'
    const rawText = typeof body.text === 'string' ? body.text.trim() : ''

    if (!rawText || rawText.length > 2000) {
      return NextResponse.json(
        { error: 'El mensaje debe tener entre 1 y 2000 caracteres.' },
        { status: 400 }
      )
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateKey =
      senderType === 'visitor'
        ? `visitor:${body.visitorToken || ip}:${ip}`
        : `owner:${body.ownerUserId || ip}`

    const rateCheck = checkMinuteRateLimit(rateKey, 12)
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Has enviado demasiados mensajes en poco tiempo.' },
        { status: 429 }
      )
    }

    // Resolver dueño del perfil
    let ownerUserId: string | null =
      typeof body.ownerUserId === 'string' ? body.ownerUserId : null

    if (!ownerUserId && typeof body.ownerUsername === 'string') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', body.ownerUsername.trim().toLowerCase())
        .maybeSingle()

      ownerUserId = profile?.id ?? null
    }

    if (!ownerUserId) {
      return NextResponse.json(
        { error: 'Perfil de destino no encontrado.' },
        { status: 404 }
      )
    }

    // Leer configuración del plugin multilingual_chat del dueño
    const { data: pluginRow } = await supabase
      .from('user_plugins')
      .select('status, config')
      .eq('user_id', ownerUserId)
      .eq('plugin_id', 'multilingual_chat')
      .maybeSingle()

    if (!pluginRow || pluginRow.status !== 'active') {
      return NextResponse.json(
        { error: 'El Chat Multilingüe no está activo para este perfil.' },
        { status: 403 }
      )
    }

    const pluginConfig = (pluginRow.config ?? {}) as Record<string, unknown>
    const visibility =
      pluginConfig.visibility === 'link_only' ||
      pluginConfig.visibility === 'paused' ||
      pluginConfig.visibility === 'public'
        ? pluginConfig.visibility
        : 'public'

    if (visibility === 'paused') {
      return NextResponse.json(
        { error: 'El chat está pausado por el propietario del perfil.' },
        { status: 403 }
      )
    }

    const viaLinkOrQr = Boolean(body.viaLinkOrQr)
    if (visibility === 'link_only' && senderType === 'visitor' && !viaLinkOrQr) {
      return NextResponse.json(
        { error: 'Este chat solo está disponible mediante enlace o QR.' },
        { status: 403 }
      )
    }

    const ownerBaseLang =
      typeof pluginConfig.base_language === 'string'
        ? pluginConfig.base_language
        : 'nl'
    const autoTranslateEnabled =
      typeof pluginConfig.auto_translate === 'boolean'
        ? pluginConfig.auto_translate
        : true

    // Reinicio automático de ciclo mensual si corresponde
    let usedMonth = Number(pluginConfig.translations_used_month ?? 0)
    const monthlyLimit = Number(pluginConfig.monthly_translation_limit ?? 500)
    const extraCredits = Number(pluginConfig.extra_credits ?? 0)
    let cycleResetAt =
      typeof pluginConfig.usage_cycle_reset_at === 'string'
        ? pluginConfig.usage_cycle_reset_at
        : new Date(
            Date.UTC(
              new Date().getUTCFullYear(),
              new Date().getUTCMonth() + 1,
              1
            )
          ).toISOString()

    if (new Date(cycleResetAt).getTime() <= Date.now()) {
      usedMonth = 0
      cycleResetAt = new Date(
        Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 1)
      ).toISOString()
    }

    // Buscar o crear conversación 1 a 1
    let conversation: Record<string, unknown> | null = null

    if (typeof body.conversationId === 'string' && body.conversationId) {
      const { data: existingById } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('id', body.conversationId)
        .eq('owner_user_id', ownerUserId)
        .maybeSingle()
      conversation = existingById
    }

    const visitorToken =
      typeof body.visitorToken === 'string' && body.visitorToken.trim()
        ? body.visitorToken.trim()
        : null

    if (!conversation && visitorToken) {
      const { data: existingByVisitor } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('owner_user_id', ownerUserId)
        .eq('visitor_token', visitorToken)
        .maybeSingle()
      conversation = existingByVisitor
    }

    if (conversation && conversation.status === 'blocked') {
      return NextResponse.json(
        { error: 'Esta conversación está bloqueada.' },
        { status: 403 }
      )
    }

    const visitorLang =
      typeof body.visitorLanguage === 'string' && body.visitorLanguage.trim()
        ? body.visitorLanguage.trim().toLowerCase()
        : typeof conversation?.visitor_language === 'string'
        ? conversation.visitor_language
        : 'en'

    if (!conversation) {
      if (!visitorToken) {
        return NextResponse.json(
          { error: 'Falta visitorToken para iniciar la conversación.' },
          { status: 400 }
        )
      }   

      const { data: createdConv, error: createConvErr } = await supabase
        .from('chat_conversations')
        .insert({
          owner_user_id: ownerUserId,
          visitor_token: visitorToken,
          visitor_name:
            typeof body.visitorName === 'string' && body.visitorName.trim()
              ? body.visitorName.trim().slice(0, 80)
              : null,
          visitor_email:
            typeof body.visitorEmail === 'string' && body.visitorEmail.trim()
              ? body.visitorEmail.trim().slice(0, 120)
              : null,
          visitor_language: visitorLang,
          owner_language: ownerBaseLang,
          status: 'open',
          unread_by_owner: 0,
          last_message_preview: rawText.slice(0, 140),
          last_message_at: new Date().toISOString(),
        })
        .select('*')
        .single()

      if (createConvErr || !createdConv) {
        return NextResponse.json(
          { error: 'No se pudo crear la conversación.' },
          { status: 500 }
        )
      }

      conversation = createdConv
    } else if (
      senderType === 'visitor' &&
      typeof body.visitorLanguage === 'string' &&
      body.visitorLanguage.trim() &&
      body.visitorLanguage.trim().toLowerCase() !== conversation.visitor_language
    ) {
      await supabase
        .from('chat_conversations')
        .update({ visitor_language: visitorLang })
        .eq('id', conversation.id)
      conversation.visitor_language = visitorLang
    }

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversación no disponible.' },
        { status: 500 }
      )
    }

    const activeConversation = conversation

    const conversationId = String(conversation.id)
    const convVisitorLang = String(conversation.visitor_language || visitorLang)
    const convOwnerLang = String(conversation.owner_language || ownerBaseLang)

    const sourceLang = senderType === 'visitor' ? convVisitorLang : convOwnerLang
    const targetLang = senderType === 'visitor' ? convOwnerLang : convVisitorLang

    // Tope anti-abuso diario por visitante (25 mensajes/día)
    if (senderType === 'visitor') {
      const startOfTodayUtc = new Date()
      startOfTodayUtc.setUTCHours(0, 0, 0, 0)

      const { count } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conversationId)
        .eq('sender_type', 'visitor')
        .gte('created_at', startOfTodayUtc.toISOString())

      if ((count ?? 0) >= 25) {
        return NextResponse.json(
          { error: 'Has alcanzado el límite diario de mensajes en este chat.' },
          { status: 429 }
        )
      }
    }

    // Contexto ligero de los últimos 2 mensajes
    const { data: recentRows } = await supabase
      .from('chat_messages')
      .select('sender_type, original_text')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(2)

    const recentContext = (recentRows ?? []).reverse().map((r) => ({
      sender_type: (r.sender_type === 'owner' ? 'owner' : 'visitor') as
        | 'visitor'
        | 'owner',
      text: String(r.original_text || ''),
    }))

    const quotaBefore = evaluateQuotaState({
      usedMonth,
      monthlyLimit,
      extraCredits,
      cycleResetAt,
    })

    const translationResult = await translateChatMessage({
      text: rawText,
      sourceLang,
      targetLang,
      autoTranslateEnabled,
      canTranslateByQuota: quotaBefore.canTranslate,
      recentContext,
    })

    if (translationResult.wasTranslated) {
      usedMonth += 1
    }

    const quotaAfter = evaluateQuotaState({
      usedMonth,
      monthlyLimit,
      extraCredits,
      cycleResetAt,
    })

    const { data: insertedMessage, error: insertErr } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        owner_user_id: ownerUserId,
        sender_type: senderType,
        original_text: rawText,
        original_lang: sourceLang,
        translated_text: translationResult.translatedText,
        translated_lang: translationResult.translatedLang,
        was_translated: translationResult.wasTranslated,
        translation_fallback_reason:
          translationResult.translationFallbackReason,
        read_by_owner: senderType === 'owner',
      })
      .select('*')
      .single()

    if (insertErr || !insertedMessage) {
      return NextResponse.json(
        { error: 'No se pudo guardar el mensaje.' },
        { status: 500 }
      )
    }

    const previewText = (
      translationResult.translatedText || rawText
    ).slice(0, 140)

    const currentUnread = Number(conversation.unread_by_owner ?? 0)
    await supabase
      .from('chat_conversations')
      .update({
        last_message_preview: previewText,
        last_message_at: new Date().toISOString(),
        unread_by_owner:
          senderType === 'visitor' ? currentUnread + 1 : currentUnread,
      })
      .eq('id', conversationId)

    // Persistir contador de traducciones y ciclo si cambió
    if (
      translationResult.wasTranslated ||
      cycleResetAt !== pluginConfig.usage_cycle_reset_at
    ) {
      await supabase
        .from('user_plugins')
        .update({
          config: {
            ...pluginConfig,
            translations_used_month: quotaAfter.usedMonth,
            usage_cycle_reset_at: quotaAfter.cycleResetAt,
          },
        })
        .eq('user_id', ownerUserId)
        .eq('plugin_id', 'multilingual_chat')
    }

    // Notificar por Push al dueño si escribe un visitante
    if (senderType === 'visitor') {
      await notifyOwnerNewChatMessage({
        ownerUserId,
        visitorName:
          typeof conversation.visitor_name === 'string'
            ? conversation.visitor_name
            : null,
        previewText: translationResult.translatedText || rawText,
        conversationId,
      })
    }

    return NextResponse.json({
      message: insertedMessage,
      conversationId,
      quota: quotaAfter,
    })
  } catch {
    return NextResponse.json(
      { error: 'Error interno al procesar el mensaje.' },
      { status: 500 }
    )
  }
}