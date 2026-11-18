// app/dashboard/settings/page.tsx
'use client'
import React, { useState, useEffect } from 'react'
import Logo from '@/components/Logo'
import { translations, getInitialLanguage } from '@/lib/i18n'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const [lang, setLang] = useState<'es' | 'en'>('es')
  const [loadingLogout, setLoadingLogout] = useState(false)

  useEffect(() => {
    setLang(getInitialLanguage())
  }, [])

  const t = translations[lang]

  const handleSignOut = async () => {
    try {
      setLoadingLogout(true)
      const supabase = createClient() // <--- Instanciamos el cliente aquí
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      setLoadingLogout(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 bg-[#0F172A] text-white pb-24">
      <div className="w-full max-w-md space-y-6 pt-6">
        <div className="flex justify-center">
          <Logo size="sm" variant="light" />
        </div>
        
        <div className="bg-[#1E293B] p-6 rounded-2xl shadow-lg border border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-white">{t.settingsTitle}</h2>
          
          <div className="space-y-3 text-sm text-slate-300">
            <div className="flex justify-between items-center py-2 border-b border-slate-700">
              <span>{t.languageLabel}</span>
              <span className="text-blue-400 font-semibold uppercase">{lang} / {lang === 'es' ? 'en' : 'es'}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-slate-700">
              <span>{t.offlineModeLabel}</span>
              <span className="text-emerald-400 font-semibold">{t.offlineStatus}</span>
            </div>
          </div>

          {/* Botón de Cerrar Sesión */}
          <div className="pt-4">
            <button
              onClick={handleSignOut}
              disabled={loadingLogout}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all duration-200 disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              <span>{loadingLogout ? t.logoutSubmitting : t.logoutButton}</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}