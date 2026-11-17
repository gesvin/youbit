// app/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Si la URL contiene tokens de Supabase (Magic Link / OAuth),
    // permitimos que el cliente los procese antes de redirigir[cite: 18].
    if (window.location.hash && window.location.hash.includes('access_token')) {
      const timer = setTimeout(() => {
        router.replace('/dashboard')
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      router.replace('/dashboard')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
      Cargando Youbit...
    </div>
  )
}