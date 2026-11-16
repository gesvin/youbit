// app/dashboard/settings/page.tsx
'use client'

import React from 'react'
import Logo from '@/components/Logo'

export default function SettingsPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 bg-[#0F172A] text-white pb-24">
      <div className="w-full max-w-md space-y-6 pt-6">
        <div className="flex justify-center">
          <Logo size="sm" variant="light" />
        </div>
        <div className="bg-[#1E293B] p-6 rounded-2xl shadow-lg border border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-white">Ajustes de la PWA</h2>
          <div className="space-y-3 text-sm text-slate-300">
            <div className="flex justify-between items-center py-2 border-b border-slate-700">
              <span>Idioma (i18n)</span>
              <span className="text-blue-400 font-semibold">ES / EN</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-700">
              <span>Modo Offline</span>
              <span className="text-emerald-400 font-semibold">Activo</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}