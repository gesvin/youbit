// app/login/page.tsx
'use client'
import { useState, useEffect, Suspense } from 'react'
import Logo from '@/components/Logo'
import { signInWithMagicLink } from '@/lib/auth'
import { translations, getInitialLanguage } from '@/lib/i18n'
import { Globe } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

function LoginFormContent() {
  const [lang, setLang] = useState<'es' | 'en'>('es')
  const [email, setEmail] = useState('Enter you email')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const initial = getInitialLanguage()
    setLang(initial)
  }, [])

  const toggleLanguage = () => {
    const nextLang = lang === 'es' ? 'en' : 'es'
    setLang(nextLang)
    localStorage.setItem('youbit_lang', nextLang)
  }

  const t = translations[lang]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    const res = await signInWithMagicLink(email)
    if (!res.success) {
      setMessage(res.error || 'Ocurrió un error.')
    } else {
      setMessage(t.successMessage)
    }
    setLoading(false)
  }

  const searchParams = useSearchParams()
  const reason = searchParams.get('reason')

  return (
    <>
      <button
        onClick={toggleLanguage}
        className="absolute top-6 right-6 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-800 transition shadow-sm"
      >
        <Globe className="w-3.5 h-3.5 text-blue-400" />
        <span className="uppercase">{lang}</span>
      </button>

      <div className="mb-6 mt-4">
        <Logo variant="light" size="lg" />
      </div>

      <div className="w-full max-w-[380px] bg-white rounded-[28px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] space-y-5">
        <div className="text-center space-y-1.5">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t.loginTitle}</h1>
          <p className="text-[11px] text-slate-500 leading-relaxed px-1">
            {t.loginSubtitle}
          </p>
        </div>

        {reason === 'timeout' && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-600 text-[11px] rounded-xl text-center font-medium">
            Tu sesión ha expirado por inactividad por seguridad.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-600 px-0.5">
              {t.emailLabel}
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={t.emailPlaceholder}
                className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl transition shadow-md shadow-blue-500/25 disabled:opacity-50"
          >
            {loading ? t.sendingButton : t.sendButton}
          </button>
        </form>

        {message && (
          <p className="text-[11px] text-center p-2.5 rounded-xl bg-slate-50 text-slate-700 font-medium border border-slate-100">
            {message}
          </p>
        )}

        <div className="relative flex items-center justify-center my-1">
          <div className="border-t border-slate-100 w-full" />
          <span className="bg-white px-2.5 text-[10px] text-slate-400 font-semibold uppercase tracking-wider absolute">
            {t.orText}
          </span>
        </div>

        <button
          type="button"
          className="w-full py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-sm"
        >
          <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.041.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 004 11c0 2.473.345 4.866.99 7.132" />
          </svg>
          {t.passkeyButton}
        </button>
      </div>
    </>
  )
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative">
      <Suspense fallback={<div className="text-white text-xs">Cargando...</div>}>
        <LoginFormContent />
      </Suspense>
    </main>
  )
}