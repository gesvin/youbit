// lib/push-notify.ts
import { createAdminClient } from '@/lib/supabase-admin'

export interface PushNotifyInput {
  ownerUserId: string
  visitorName?: string | null
  previewText: string
  conversationId: string
}

/**
 * Despacha una notificación push al dueño del perfil si tiene suscripciones
 * registradas en `push_subscriptions` y un despachador configurado en servidor.
 * Nunca bloquea ni rompe el flujo de envío del chat si falla.
 */
export async function notifyOwnerNewChatMessage(
  input: PushNotifyInput
): Promise<void> {
  try {
    const webhookUrl = process.env.CHAT_PUSH_WEBHOOK_URL
    if (!webhookUrl) {
      return
    }

    const supabase = createAdminClient()
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('id, subscription')
      .eq('user_id', input.ownerUserId)

    if (error || !subs || subs.length === 0) {
      return
    }

    const senderLabel = input.visitorName?.trim() || 'Visitante'
    const payload = {
      title: `Nuevo mensaje de ${senderLabel}`,
      body: input.previewText.slice(0, 120),
      url: `/dashboard/apps/multilingual-chat?conversationId=${encodeURIComponent(
        input.conversationId
      )}`,
      conversationId: input.conversationId,
      ownerUserId: input.ownerUserId,
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (process.env.CHAT_PUSH_WEBHOOK_SECRET) {
      headers['x-push-secret'] = process.env.CHAT_PUSH_WEBHOOK_SECRET
    }

    await Promise.allSettled(
      subs.map(async (row) => {
        if (!row.subscription) return
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            subscription: row.subscription,
            notification: payload,
          }),
        })

        if (res.status === 404 || res.status === 410) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', row.id)
        }
      })
    )
  } catch {
    // Silencioso: un fallo de notificación nunca debe impedir guardar/entregar el mensaje
  }
}