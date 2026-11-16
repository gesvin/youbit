// app/dashboard/layout.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import './globals.css' // O la ruta de estilos que corresponda

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const supabase = createClient() //

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // Si no hay sesión activa, redirige inmediatamente al login
        router.replace('/login')
      } else {
        setIsAuthenticated(true)
      }
    }

    checkSession()
  }, [router, supabase])

  // Mientras valida la sesión, muestra una pantalla de carga para evitar parpadeos
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
        Verificando acceso a Youbit...
      </div>
    )
  }

  return (
    <div className="bg-slate-950 text-slate-100 antialiased selection:bg-blue-500 selection:text-white">
      <div className="pb-20">
        {children}
      </div>
      <BottomNav />
    </div>
  )
}