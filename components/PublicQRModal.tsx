'use client'

import { useState } from 'react'
import { QrCode, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

interface PublicQRModalProps {
  username: string
  fullName?: string
}

export default function PublicQRModal({ username, fullName }: PublicQRModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const profileUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/u/${username}` 
    : `https://youbit.app/u/${username}`

  return (
    <>
      {/* Botón flotante/activador para abrir el modal */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 bg-slate-900/90 hover:bg-slate-800 text-blue-400 rounded-xl border border-slate-700/60 shadow-sm transition-all flex items-center justify-center"
        title="Mostrar Código QR"
      >
        <QrCode className="w-5 h-5" />
      </button>

      {/* Modal flotante de alto contraste */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-5 text-center shadow-2xl relative">
            
            {/* Botón de cierre */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 pt-2">
              <h3 className="text-lg font-bold text-white tracking-tight">
                {fullName || `@${username}`}
              </h3>
              <p className="text-xs text-slate-400">Escanea para abrir la tarjeta digital</p>
            </div>

            {/* Contenedor del QR con marco blanco de alto contraste forzado */}
            <div className="flex justify-center py-2">
              <div className="p-4 bg-white rounded-2xl shadow-inner border-4 border-slate-800 flex items-center justify-center">
                <QRCodeSVG
                  value={profileUrl}
                  size={200}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                  level="H"
                  includeMargin={false}
                />
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-all"
            >
              Cerrar
            </button>

          </div>
        </div>
      )}
    </>
  )
}