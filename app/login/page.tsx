// app/login/page.tsx
'use client'
import { useState, useEffect, Suspense } from 'react'
import Logo from '@/components/Logo'
import { signInWithMagicLink, signInWithGoogle } from '@/lib/auth'
import { translations, getInitialLanguage } from '@/lib/i18n'
import { Globe } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

function LoginFormContent() {
  const [lang, setLang] = useState<'es' | 'en'>('es')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason')
  const [checkingSession, setCheckingSession] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function initAuthAndLang() {
      const initial = getInitialLanguage()
      setLang(initial)

      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.replace('/dashboard')
      } else {
        setCheckingSession(false)
      }
    }
    initAuthAndLang()
  }, [router, supabase])

  const toggleLanguage = () => {
    const nextLang = lang === 'es' ? 'en' : 'es'
    setLang(nextLang)
    localStorage.setItem('youbit_lang', nextLang)
  }

  const t = translations[lang]

  if (checkingSession) {
    return (
      <div className="text-slate-400 text-xs text-center">
        {t.checkingSession}
      </div>
    )
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
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

  const handleGoogleLogin = async () => {
    const res = await signInWithGoogle()
    if (!res.success && res.error) {
      setMessage(res.error)
    }
  }

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

        {/* Botón de Google OAuth como acceso principal de 1 clic */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-medium text-xs rounded-xl flex items-center justify-center gap-2.5 transition shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.2v3.15C3.18 21.31 7.24 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.2C.44 8.16 0 9.92 0 11.75s.44 3.59 1.2 5.14l4.07-2.65z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.24 0 3.18 2.69 1.2 6.61l4.07 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
            />
          </svg>
          {t.googleButton}
        </button>

        <div className="relative flex items-center justify-center my-1">
          <div className="border-t border-slate-100 w-full" />
          <span className="bg-white px-2.5 text-[10px] text-slate-400 font-semibold uppercase tracking-wider absolute">
            {t.orText}
          </span>
        </div>

        {/* Formulario de Correo */}
        <form onSubmit={handleEmailSubmit} className="space-y-4">
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