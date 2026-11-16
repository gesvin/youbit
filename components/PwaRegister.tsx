'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

export default function PwaRegister() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    // 1. Registro del Service Worker
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => console.log('SW registrado con éxito:', reg.scope))
          .catch((err) => console.error('Error al registrar SW:', err))
      })
    } else if ('serviceWorker' in navigator && process.env.NODE_ENV === 'development') {
      // Registrar también en desarrollo si deseas probar la resiliencia offline en localhost
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    // 2. Control de Estado Online / Offline
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    // Evaluar estado inicial
    if (typeof window !== 'undefined' && !navigator.onLine) {
      setIsOffline(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-amber-500/90 text-slate-950 font-medium text-xs px-3.5 py-2 rounded-xl shadow-lg backdrop-blur-sm flex items-center gap-2 border border-amber-400/40 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Modo sin conexión activo</span>
    </div>
  )
}