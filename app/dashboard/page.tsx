// app/dashboard/page.tsx
'use client'

import React from 'react'
import Logo from '@/components/Logo'
import PasskeySettings from '@/components/PasskeySettings'

export default function DashboardPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 bg-[#0F172A] text-white pb-24">
      <div className="w-full max-w-md space-y-6 pt-6">
        <div className="flex justify-center mb-2">
          <Logo size="sm" variant="light" />
        </div>

        <div className="bg-[#1E293B] p-6 rounded-2xl shadow-lg border border-slate-800 space-y-4">
          <h1 className="text-xl font-bold text-center text-white">Mi Perfil & Seguridad</h1>
          <p className="text-sm text-slate-400 text-center">
            Gestiona tu identidad digital y dispositivos biométricos de acceso rápido.
          </p>

          <div className="pt-2 border-t border-slate-700">
            <PasskeySettings />
          </div>
        </div>
      </div>
    </main>
  )
}