// components/AutoLogoutListener.tsx
'use client'
import { useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const INACTIVITY_TIMEOUT = 15 * 60 * 1000 // 15 minutos en milisegundos

export default function AutoLogoutListener() {
  const supabase = createClient()
  const router = useRouter()

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
    // Limpiar almacenamiento local por seguridad
    localStorage.clear()
    // Forzar recarga completa y redirección al login
    window.location.href = '/login?reason=timeout'
  }, [supabase])

  useEffect(() => {
    let timer: NodeJS.Timeout

    const resetTimer = () => {
      clearTimeout(timer)
      timer = setTimeout(handleLogout, INACTIVITY_TIMEOUT)
    }

    // Eventos que marcan actividad del usuario
    const events = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click']

    events.forEach((event) => {
      window.addEventListener(event, resetTimer)
    })

    // Inicializar el temporizador al montar
    resetTimer()

    return () => {
      clearTimeout(timer)
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer)
      })
    }
  }, [handleLogout])

  return null
}