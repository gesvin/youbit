// app/dashboard/apps/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users,
  Languages,
  Sparkles,
  Gamepad2,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react'
import { translations, getInitialLanguage } from '@/lib/i18n'
import {
  PLUGIN_CATEGORIES,
  PLUGINS_REGISTRY,
  type PluginDefinition,
} from '@/lib/plugins'

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
  const [lang, setLang] = useState<'es' | 'en'>('es')

  useEffect(() => {
    setLang(getInitialLanguage())
  }, [])

  const t = translations[lang]

  const activePlugins = PLUGINS_REGISTRY.filter((p) => p.defaultActive)
  const availablePlugins = PLUGINS_REGISTRY.filter((p) => !p.defaultActive)

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 md:p-6 bg-[#0F172A] text-white pb-24">
      <div className="w-full max-w-2xl space-y-6 pt-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-white">{t.appsPageTitle}</h1>
          <p className="text-sm text-slate-400">{t.appsPageSubtitle}</p>
        </header>

        {/* Sección de plugins activos */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {t.appsActiveSection}
          </h2>

          {activePlugins.length === 0 ? (
            <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-5 text-sm text-slate-400">
              {lang === 'es'
                ? 'Aún no tienes aplicaciones activas.'
                : 'You have no active apps yet.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {activePlugins.map((plugin) => {
                const copy = PLUGIN_COPY[plugin.id]?.[lang]
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
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2">
                          {copy?.description ?? ''}
                        </p>
                      </div>
                    </div>

                    {plugin.href && (
                      <Link
                        href={plugin.href}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
                      >
                        <span>{t.appsOpenButton}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
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

          <div className="space-y-5">
            {PLUGIN_CATEGORIES.map((category) => {
              const itemsInCategory = availablePlugins.filter(
                (p) => p.category === category.id
              )

              return (
                <div key={category.id} className="space-y-2.5">
                  <h3 className="text-xs font-medium text-blue-400">
                    {t[category.labelKey]}
                  </h3>

                  {itemsInCategory.length === 0 ? (
                    <div className="bg-[#1E293B]/60 border border-slate-800/70 rounded-2xl p-4 text-xs text-slate-500">
                      {lang === 'es'
                        ? 'Próximamente nuevas aplicaciones en esta categoría.'
                        : 'New apps coming soon in this category.'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {itemsInCategory.map((plugin) => {
                        const copy = PLUGIN_COPY[plugin.id]?.[lang]
                        return (
                          <div
                            key={plugin.id}
                            className="bg-[#1E293B] border border-slate-800 rounded-2xl p-4 flex items-start justify-between gap-4 shadow-md"
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
                                    {t.appsAvailableBadge}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400">
                                  {copy?.description ?? ''}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}