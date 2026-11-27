// app/api/chat/typing/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const conversationId =
      typeof body.conversationId === 'string' ? body.conversationId.trim() : ''
    const senderType: 'visitor' | 'owner' =
      body.senderType === 'owner' ? 'owner' : 'visitor'
    const isTyping = Boolean(body.isTyping)

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Falta conversationId.' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const channel = supabase.channel(`chat:${conversationId}`)

    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        conversationId,
        senderType,
        isTyping,
        sentAt: Date.now(),
      },
    })

    await supabase.removeChannel(channel)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: 'No se pudo emitir el indicador de escritura.' },
      { status: 500 }
    )
  }
}