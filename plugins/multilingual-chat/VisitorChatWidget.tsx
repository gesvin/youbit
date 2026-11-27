'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { MessageCircle, Send, Languages, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { getChatTranslations } from '@/plugins/multilingual-chat/i18n'

interface VisitorChatWidgetProps {
  ownerUserId: string
  ownerUsername: string
  ownerDisplayName: string
  ownerLanguage?: string
  autoTranslate?: boolean
}

interface ChatMessageItem {
  id: string
  conversation_id: string
  sender_type: 'visitor' | 'owner' | string
  original_text: string
  original_lang: string | null
  translated_text: string | null
  translated_lang: string | null
  was_translated: boolean | null
  created_at: string
}

const VISITOR_LANGUAGES = [
  { code: 'es', label: 'Español (ES)' },
  { code: 'en', label: 'English (EN)' },
  { code: 'nl', label: 'Nederlands (NL)' },
  { code: 'de', label: 'Deutsch (DE)' },
  { code: 'fr', label: 'Français (FR)' },
  { code: 'pt', label: 'Português (PT)' },
  { code: 'it', label: 'Italiano (IT)' },
  { code: 'ar', label: 'العربية (AR)' },
  { code: 'tr', label: 'Türkçe (TR)' },
  { code: 'pl', label: 'Polski (PL)' },
]

function detectBrowserLang(): string {
  if (typeof navigator === 'undefined') return 'en'
  const raw = (navigator.language || 'en').slice(0, 2).toLowerCase()
  return VISITOR_LANGUAGES.some((l) => l.code === raw) ? raw : 'en'
}

export default function VisitorChatWidget({
  ownerUserId,
  ownerUsername,
  ownerDisplayName,
  ownerLanguage = 'nl',
  autoTranslate = true,
}: VisitorChatWidgetProps) {
  const supabase = useMemo(() => createClient(), [])
  const [isOpen, setIsOpen] = useState(false)
  const [visitorLang, setVisitorLang] = useState<string>(() => {
    if (typeof window === 'undefined') return 'en'
    const saved = localStorage.getItem(`youbit_chat_lang_${ownerUserId}`)
    return saved || detectBrowserLang()
  })
  const [visitorToken, setVisitorToken] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    const tokenKey = `youbit_chat_visitor_token_${ownerUserId}`
    let existingToken = localStorage.getItem(tokenKey)
    if (!existingToken) {
      existingToken =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      localStorage.setItem(tokenKey, existingToken)
    }
    return existingToken
  })
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [visitorName, setVisitorName] = useState<string>('')
  const [visitorEmail, setVisitorEmail] = useState<string>('')
  const [draft, setDraft] = useState<string>('')
  const [messages, setMessages] = useState<ChatMessageItem[]>([])
  const [showOriginalByMsgId, setShowOriginalByMsgId] = useState<Record<string, boolean>>({})
  const [sending, setSending] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const lastTypingSentRef = useRef<number>(0)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const t = getChatTranslations(visitorLang)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const convKey = `youbit_chat_conv_${ownerUserId}`
    const savedConv = localStorage.getItem(convKey)
    if (!savedConv) return
    queueMicrotask(() => {
      setConversationId(savedConv)
    })
  }, [ownerUserId])

  useEffect(() => {
    if (typeof window !== 'undefined' && visitorLang) {
      localStorage.setItem(`youbit_chat_lang_${ownerUserId}`, visitorLang)
    }
  }, [ownerUserId, visitorLang])

  useEffect(() => {
    if (!isOpen || !conversationId) return

    let active = true
    supabase
      .from('chat_messages')
      .select(
        'id, conversation_id, sender_type, original_text, original_lang, translated_text, translated_lang, was_translated, created_at'
      )
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!active || error || !data) return
        setMessages(data as ChatMessageItem[])
      })

    const channel = supabase
      .channel(`visitor-chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (!active) return
          const incoming = payload.new as ChatMessageItem
          setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]))
        }
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [isOpen, conversationId, supabase])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen])

  const notifyTyping = () => {
    if (!conversationId) return
    const now = Date.now()
    if (now - lastTypingSentRef.current < 2000) return
    lastTypingSentRef.current = now

    fetch('/api/chat/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId,
        senderType: 'visitor',
        visitorToken,
        isTyping: true,
      }),
    }).catch(() => {})
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanText = draft.trim()
    if (!cleanText || sending || !visitorToken) return

    setSending(true)
    setErrorMsg(null)

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerUserId,
          conversationId,
          visitorToken,
          visitorName: visitorName.trim() || undefined,
          visitorEmail: visitorEmail.trim() || undefined,
          senderType: 'visitor',
          text: cleanText,
          visitorLanguage: visitorLang,
          ownerLanguage,
          autoTranslate,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrorMsg(data?.error || t.chatVisitorSendError)
        setSending(false)
        return
      }

      const resolvedConvId: string | undefined = data?.conversationId || data?.message?.conversation_id
      if (resolvedConvId && resolvedConvId !== conversationId) {
        setConversationId(resolvedConvId)
        if (typeof window !== 'undefined') {
          localStorage.setItem(`youbit_chat_conv_${ownerUserId}`, resolvedConvId)
        }
      }

      if (data?.message) {
        const inserted = data.message as ChatMessageItem
        setMessages((prev) => (prev.some((m) => m.id === inserted.id) ? prev : [...prev, inserted]))
      }

      setDraft('')
    } catch {
      setErrorMsg(t.chatVisitorSendError)
    } finally {
      setSending(false)
    }
  }

  const toggleOriginal = (msgId: string) => {
    setShowOriginalByMsgId((prev) => ({ ...prev, [msgId]: !prev[msgId] }))
  }

  return (
    <div className="pt-1">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full py-3 px-4 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 border border-blue-500/40 shadow-sm transition-all cursor-pointer"
        >
          <MessageCircle className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{t.chatOpenVisitorButton}</span>
        </button>
      ) : (
        <div className="rounded-2xl bg-slate-900/95 border border-slate-700/80 p-3.5 text-left space-y-3 shadow-xl">
          <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div>
              <p className="text-xs font-semibold text-white">
                {t.chatVisitorTitle} · {ownerDisplayName || `@${ownerUsername}`}
              </p>
              <p className="text-[11px] text-slate-400">{t.chatVisitorSubtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar chat"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2">
            <label className="text-[11px] text-slate-400 shrink-0">{t.chatVisitorLanguageLabel}</label>
            <select
              value={visitorLang}
              onChange={(e) => setVisitorLang(e.target.value)}
              className="rounded-lg bg-slate-950 border border-slate-700 px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {VISITOR_LANGUAGES.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {!conversationId && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder={t.chatVisitorNamePlaceholder}
                className="rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-[11px] text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
              <input
                type="email"
                value={visitorEmail}
                onChange={(e) => setVisitorEmail(e.target.value)}
                placeholder={t.chatVisitorEmailPlaceholder}
                className="rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-[11px] text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            {messages.length === 0 ? (
              <p className="text-[11px] text-slate-500 text-center py-4">{t.chatVisitorEmptyState}</p>
            ) : (
              messages.map((msg) => {
                const isVisitor = msg.sender_type === 'visitor'
                const preferOriginal = !!showOriginalByMsgId[msg.id]
                const hasTranslation = Boolean(msg.was_translated && msg.translated_text)
                const displayText =
                  !isVisitor && hasTranslation && !preferOriginal
                    ? msg.translated_text!
                    : msg.original_text

                return (
                  <div
                    key={msg.id}
                    className={`rounded-xl px-3 py-2 text-xs space-y-1 ${
                      isVisitor
                        ? 'bg-blue-600/20 border border-blue-500/30 text-slate-100 ml-6'
                        : 'bg-slate-800/90 border border-slate-700/60 text-slate-200 mr-6'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{displayText}</p>
                    {!isVisitor && hasTranslation && (
                      <button
                        type="button"
                        onClick={() => toggleOriginal(msg.id)}
                        className="inline-flex items-center gap-1 text-[10px] text-blue-300 hover:text-blue-200 cursor-pointer"
                      >
                        <Languages className="w-3 h-3" />
                        <span>{preferOriginal ? t.chatViewTranslated : t.chatViewOriginal}</span>
                      </button>
                    )}
                  </div>
                )
              })
            )}
            <div ref={bottomRef} />
          </div>

          {errorMsg && <p className="text-[11px] text-rose-400">{errorMsg}</p>}

          <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value)
                notifyTyping()
              }}
              placeholder={t.chatSendPlaceholder}
              className="flex-1 rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? t.chatVisitorSending : t.chatSendButton}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  )
}