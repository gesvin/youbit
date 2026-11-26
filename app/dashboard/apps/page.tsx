// app/dashboard/apps/page.tsx
'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Users,
  Languages,
  Sparkles,
  Gamepad2,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Settings2,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { translations, getInitialLanguage } from '@/lib/i18n'
import {
  PLUGIN_CATEGORIES,
  PLUGINS_REGISTRY,
  type PluginDefinition,
  type PluginStatus,
} from '@/lib/plugins'

type ChatVisibility = 'public' | 'link_only' | 'paused'

interface MultilingualChatConfig {
  base_language: string
  visibility: ChatVisibility
  auto_translate: boolean
  [key: string]: unknown
}

interface UserPluginRow {
  plugin_id: string
  status: PluginStatus
  config: Record<string, unknown> | null
  activated_at: string | null
}

// Priorizado para Países Bajos (local + comunidades expat principales) + cobertura amplia
const LANGUAGE_OPTIONS: { code: string; label: string }[] = [
  { code: 'nl', label: 'Nederlands (NL)' },
  { code: 'en', label: 'English (EN)' },
  { code: 'de', label: 'Deutsch (DE)' },
  { code: 'pl', label: 'Polski (PL)' },
  { code: 'tr', label: 'Türkçe (TR)' },
  { code: 'ar', label: 'العربية (AR)' },
  { code: 'es', label: 'Español (ES)' },
  { code: 'fr', label: 'Français (FR)' },
  { code: 'pt', label: 'Português (PT)' },
  { code: 'it', label: 'Italiano (IT)' },
  { code: 'uk', label: 'Українська (UK)' },
  { code: 'ru', label: 'Русский (RU)' },
  { code: 'hi', label: 'हिन्दी (HI)' },
  { code: 'zh', label: '中文 (ZH)' },
  { code: 'ro', label: 'Română (RO)' },
  { code: 'bg', label: 'Български (BG)' },
  { code: 'el', label: 'Ελληνικά (EL)' },
  { code: 'sv', label: 'Svenska (SV)' },
  { code: 'no', label: 'Norsk (NO)' },
  { code: 'da', label: 'Dansk (DA)' },
  { code: 'fi', label: 'Suomi (FI)' },
  { code: 'ja', label: '日本語 (JA)' },
  { code: 'ko', label: '한국어 (KO)' },
  { code: 'id', label: 'Bahasa Indonesia (ID)' },
  { code: 'th', label: 'ไทย (TH)' },
  { code: 'vi', label: 'Tiếng Việt (VI)' },
]

const PLUGIN_COPY: Record<
  string,
  {
    es: { name: string; description: string }
    en: { name: string; description: string }
  }
> = {
  bridges: {
    es: {
      name: 'Puentes',
      description:
        'Conecta contactos de tu agenda de manera descentralizada con consentimiento independiente.',
    },
    en: {
      name: 'Bridges',
      description:
        'Connect contacts from your network in a decentralized way with independent consent.',
    },
  },
  multilingual_chat: {
    es: {
      name: 'Chat Multilingüe',
      description:
        'Conversa en tu idioma con traducción en tiempo real y acceso al mensaje original.',
    },
    en: {
      name: 'Multilingual Chat',
      description:
        'Chat in your own language with real-time translation and access to the original message.',
    },
  },
}

function renderPluginIcon(iconName: PluginDefinition['iconName']) {
  switch (iconName) {
    case 'Users':
      return <Users className="w-5 h-5 text-blue-400" />
    case 'Languages':
      return <Languages className="w-5 h-5 text-blue-400" />
    case 'Gamepad2':
      return <Gamepad2 className="w-5 h-5 text-blue-400" />
    case 'Sparkles':
    default:
      return <Sparkles className="w-5 h-5 text-blue-400" />
  }
}

export default function AppsPage() {
  const supabase = createClient()
  const [lang, setLang] = useState<'es' | 'en'>('es')
  const [userId, setUserId] = useState<string | null>(null)
  const [userPlugins, setUserPlugins] = useState<Record<string, UserPluginRow>>(
    {}
  )
  const [loadingPlugins, setLoadingPlugins] = useState(true)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [feedbackType, setFeedbackType] = useState<'success' | 'error'>(
    'success'
  )

  // Modal de activación y configuración mínima de Chat Multilingüe
  const [isChatConfigOpen, setIsChatConfigOpen] = useState(false)
  const [baseLanguage, setBaseLanguage] = useState<string>('nl')
  const [visibility, setVisibility] = useState<ChatVisibility>('public')
  const [autoTranslate, setAutoTranslate] = useState<boolean>(true)
  const [savingConfig, setSavingConfig] = useState(false)

  useEffect(() => {
    const initialLang = getInitialLanguage()
    setLang(initialLang)
  }, [])

  const loadUserPlugins = useCallback(async () => {
    setLoadingPlugins(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setUserId(null)
      setUserPlugins({})
      setLoadingPlugins(false)
      return
    }

    setUserId(user.id)

    const { data, error } = await supabase
      .from('user_plugins')
      .select('plugin_id, status, config, activated_at')
      .eq('user_id', user.id)

    if (!error && data) {
      const map: Record<string, UserPluginRow> = {}
      for (const row of data as UserPluginRow[]) {
        map[row.plugin_id] = row
      }
      setUserPlugins(map)
    }
    setLoadingPlugins(false)
  }, [supabase])

  useEffect(() => {
    loadUserPlugins()
  }, [loadUserPlugins])

  const t = translations[lang]

  const chatRow = userPlugins['multilingual_chat']
  const isChatActive = chatRow?.status === 'active'

  const openChatConfigModal = () => {
    const existingConfig = (chatRow?.config ?? {}) as Partial<MultilingualChatConfig>
    setBaseLanguage(
      typeof existingConfig.base_language === 'string'
        ? existingConfig.base_language
        : 'nl'
    )
    setVisibility(
      existingConfig.visibility === 'link_only' ||
        existingConfig.visibility === 'paused' ||
        existingConfig.visibility === 'public'
        ? existingConfig.visibility
        : 'public'
    )
    setAutoTranslate(
      typeof existingConfig.auto_translate === 'boolean'
        ? existingConfig.auto_translate
        : true
    )
    setFeedbackMessage(null)
    setIsChatConfigOpen(true)
  }

  const handleSaveChatConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    setSavingConfig(true)
    setFeedbackMessage(null)

    const mergedConfig: MultilingualChatConfig = {
      ...(chatRow?.config ?? {}),
      base_language: baseLanguage,
      visibility,
      auto_translate: autoTranslate,
    }

    const { error } = await supabase.from('user_plugins').upsert(
      {
        user_id: userId,
        plugin_id: 'multilingual_chat',
        status: 'active',
        config: mergedConfig,
        activated_at: chatRow?.activated_at ?? new Date().toISOString(),
      },
      { onConflict: 'user_id,plugin_id' }
    )

    setSavingConfig(false)

    if (error) {
      setFeedbackType('error')
      setFeedbackMessage(t.chatConfigErrorMessage)
      return
    }

    setUserPlugins((prev) => ({
      ...prev,
      multilingual_chat: {
        plugin_id: 'multilingual_chat',
        status: 'active',
        config: mergedConfig,
        activated_at: chatRow?.activated_at ?? new Date().toISOString(),
      },
    }))

    setFeedbackType('success')
    setFeedbackMessage(t.chatConfigSavedMessage)
    setIsChatConfigOpen(false)
  }

  const activePlugins = PLUGINS_REGISTRY.filter((p) => {
    if (p.id === 'bridges') return true
    if (p.id === 'multilingual_chat') return isChatActive
    return p.defaultActive
  })

  const availablePlugins = PLUGINS_REGISTRY.filter((p) => {
    if (p.id === 'bridges') return false
    if (p.id === 'multilingual_chat') return !isChatActive
    return !p.defaultActive
  })

  const nonEmptyCategories = PLUGIN_CATEGORIES.map((category) => ({
    ...category,
    items: availablePlugins.filter((p) => p.category === category.id),
  })).filter((category) => category.items.length > 0)

  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    {}
  )

  useEffect(() => {
    if (nonEmptyCategories.length === 0) return

    const expandAllByDefault = availablePlugins.length <= 3
    const initialState: Record<string, boolean> = {}

    nonEmptyCategories.forEach((cat, index) => {
      initialState[cat.id] = expandAllByDefault ? true : index === 0
    })

    setOpenCategories(initialState)
  }, [availablePlugins.length, nonEmptyCategories.length])

  const toggleCategory = (categoryId: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }))
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 md:p-6 bg-[#0F172A] text-white pb-24">
      <div className="w-full max-w-2xl space-y-6 pt-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-white">{t.appsPageTitle}</h1>
          <p className="text-sm text-slate-400">{t.appsPageSubtitle}</p>
        </header>

        {feedbackMessage && (
          <div
            className={`rounded-2xl px-4 py-3 text-xs border ${
              feedbackType === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {feedbackMessage}
          </div>
        )}

        {/* Sección de plugins activos */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {t.appsActiveSection}
          </h2>

          {loadingPlugins ? (
            <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-5 text-xs text-slate-400">
              {t.checkingSession}
            </div>
          ) : activePlugins.length === 0 ? (
            <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-5 text-sm text-slate-400">
              {lang === 'es'
                ? 'Aún no tienes aplicaciones activas.'
                : 'You have no active apps yet.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {activePlugins.map((plugin) => {
                const copy = PLUGIN_COPY[plugin.id]?.[lang]
                const isChatPlugin = plugin.id === 'multilingual_chat'
                const currentVis =
                  (chatRow?.config?.visibility as ChatVisibility | undefined) ??
                  'public'
                const currentBaseLang =
                  (chatRow?.config?.base_language as string | undefined) ?? 'nl'

                return (
                  <div
                    key={plugin.id}
                    className="bg-[#1E293B] border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-md"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center shrink-0">
                        {renderPluginIcon(plugin.iconName)}
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-white">
                            {copy?.name ?? plugin.id}
                          </h3>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            {t.appsActiveBadge}
                          </span>
                          {plugin.isFree && (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                              {t.appsFreeBadge}
                            </span>
                          )}
                          {isChatPlugin && (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 uppercase">
                              {currentBaseLang} ·{' '}
                              {currentVis === 'public'
                                ? lang === 'es'
                                  ? 'Público'
                                  : 'Public'
                                : currentVis === 'link_only'
                                ? lang === 'es'
                                  ? 'Enlace/QR'
                                  : 'Link/QR'
                                : lang === 'es'
                                ? 'Pausado'
                                : 'Paused'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2">
                          {copy?.description ?? ''}
                        </p>
                      </div>
                    </div>

                    {plugin.href ? (
                      <Link
                        href={plugin.href}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
                      >
                        <span>{t.appsOpenButton}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : isChatPlugin ? (
                      <button
                        type="button"
                        onClick={openChatConfigModal}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
                      >
                        <Settings2 className="w-3.5 h-3.5 text-blue-400" />
                        <span>{t.chatConfigureButton}</span>
                      </button>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Sección de plugins disponibles clasificados por categoría */}
        <section className="space-y-4 pt-2 border-t border-slate-800/80">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {t.appsAvailableSection}
          </h2>

          {nonEmptyCategories.length === 0 ? (
            <div className="bg-[#1E293B]/60 border border-slate-800/70 rounded-2xl p-4 text-xs text-slate-400">
              {lang === 'es'
                ? 'No hay más aplicaciones disponibles por ahora.'
                : 'No additional apps available right now.'}
            </div>
          ) : (
            <div className="space-y-3">
              {nonEmptyCategories.map((category) => {
                const isOpen = !!openCategories[category.id]

                return (
                  <div
                    key={category.id}
                    className="bg-[#1E293B]/50 border border-slate-800/80 rounded-2xl overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggleCategory(category.id)}
                      aria-expanded={isOpen}
                      className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-blue-400">
                          {t[category.labelKey]}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                          {category.items.length}
                        </span>
                      </div>

                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="p-3 pt-1 space-y-2.5 border-t border-slate-800/60">
                        {category.items.map((plugin) => {
                          const copy = PLUGIN_COPY[plugin.id]?.[lang]
                          const isChatPlugin = plugin.id === 'multilingual_chat'
                          const isPendingConfig =
                            chatRow?.status === 'pending_config'

                          return (
                            <div
                              key={plugin.id}
                              className="bg-[#1E293B] border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-md"
                            >
                              <div className="flex items-start gap-3.5 min-w-0">
                                <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center shrink-0">
                                  {renderPluginIcon(plugin.iconName)}
                                </div>
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-sm font-semibold text-white">
                                      {copy?.name ?? plugin.id}
                                    </h4>
                                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                      {isPendingConfig
                                        ? t.chatStatusPendingConfig
                                        : t.appsAvailableBadge}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-400">
                                    {copy?.description ?? ''}
                                  </p>
                                </div>
                              </div>

                              {isChatPlugin && (
                                <button
                                  type="button"
                                  onClick={openChatConfigModal}
                                  className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors cursor-pointer"
                                >
                                  <span>{t.chatActivateAndConfigureButton}</span>
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* Modal de Activación y Configuración Mínima de Chat Multilingüe */}
      {isChatConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#1E293B] border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  {t.chatConfigModalTitle}
                </h3>
                <p className="text-xs text-slate-400">
                  {t.chatConfigModalSubtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsChatConfigOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label={t.close}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveChatConfig} className="space-y-4">
              {/* 1. Idioma base */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  {t.chatBaseLanguageLabel}
                </label>
                <select
                  value={baseLanguage}
                  onChange={(e) => setBaseLanguage(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Visibilidad */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  {t.chatVisibilityLabel}
                </label>
                <select
                  value={visibility}
                  onChange={(e) =>
                    setVisibility(e.target.value as ChatVisibility)
                  }
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="public">{t.chatVisibilityPublic}</option>
                  <option value="link_only">{t.chatVisibilityLinkOnly}</option>
                  <option value="paused">{t.chatVisibilityPaused}</option>
                </select>
              </div>

              {/* Traducción automática */}
              <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-900/80 border border-slate-800 px-3.5 py-2.5">
                <span className="text-xs font-medium text-slate-200">
                  {t.chatAutoTranslateLabel}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoTranslate}
                  onClick={() => setAutoTranslate((prev) => !prev)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    autoTranslate ? 'bg-blue-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`bg-white w-4 h-4 rounded-full shadow-xs transition-transform ${
                      autoTranslate ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChatConfigOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  {t.close}
                </button>
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {savingConfig
                    ? t.chatSavingConfigButton
                    : t.chatSaveConfigButton}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}