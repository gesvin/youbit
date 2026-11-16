// app/dashboard/qr/page.tsx
'use client'

import { useState } from 'react'
import Logo from '@/components/Logo'
import QRScannerModal from '@/components/QRScannerModal'
import { Camera, QrCode } from 'lucide-react'

export default function QRScannerPage() {
  const [isScannerOpen, setIsScannerOpen] = useState(false)

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 bg-[#0F172A] text-white pb-24">
      <div className="w-full max-w-md space-y-6 pt-6">
        
        <div className="flex justify-center">
          <Logo />
        </div>

        <div className="bg-[#1E293B] p-6 rounded-3xl shadow-lg border border-slate-800 text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white">Escáner QR & Tarjeta</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Apunta con la cámara para escanear contactos o muestra tu código QR inteligente offline-first.
            </p>
          </div>

          <div className="w-full h-48 bg-slate-900 rounded-2xl border border-dashed border-slate-700 flex flex-col items-center justify-center gap-3 p-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-400">Escanea tarjetas de otros usuarios al instante</p>
          </div>

          <button
            onClick={() => setIsScannerOpen(true)}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>Abrir Cámara para Escanear</span>
          </button>
        </div>

      </div>

      {/* Modal del Escáner QR */}
      <QRScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
      />
    </main>
  )
}