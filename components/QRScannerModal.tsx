'use client'

import { useEffect, useState, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { X, Camera, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface QRScannerModalProps {
  isOpen: boolean
  onClose: () => void
  lang?: 'es' | 'en'
}

export default function QRScannerModal({ isOpen, onClose, lang = 'es' }: QRScannerModalProps) {
  const [scannedResult, setScannedResult] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const hasScanned = useRef(false)
  const isStopping = useRef(false)
  const router = useRouter()

  const t = {
    es: {
      title: 'Escanear Tarjeta QR',
      subtitle: 'Apunta la cámara hacia el código QR de Youbit',
      errorCamera: 'No se pudo acceder a la cámara. Verifica los permisos.',
      close: 'Cerrar',
      success: '¡Perfil detectado! Redirigiendo...'
    },
    en: {
      title: 'Scan QR Card',
      subtitle: 'Point your camera at the Youbit QR code',
      errorCamera: 'Could not access the camera. Please check permissions.',
      close: 'Close',
      success: 'Profile detected! Redirecting...'
    }
  }[lang]

  // Función segura para detener y limpiar el escáner
  const stopAndClearScanner = async () => {
    if (scannerRef.current && !isStopping.current) {
      isStopping.current = true
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop()
        }
        await scannerRef.current.clear()
      } catch (err) {
        // Ignorar errores menores de estado al desmontar
        console.debug('Nota al detener cámara:', err)
      } finally {
        scannerRef.current = null
        isStopping.current = false
      }
    }
  }

  const handleClose = async () => {
    await stopAndClearScanner()
    onClose()
  }

  useEffect(() => {
    if (!isOpen) {
      hasScanned.current = false
      stopAndClearScanner()
      return
    }

    hasScanned.current = false
    isStopping.current = false
    setErrorMsg(null)
    setScannedResult(null)

    const html5QrCode = new Html5Qrcode('reader-container')
    scannerRef.current = html5QrCode

    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          async (decodedText) => {
            if (hasScanned.current) return
            hasScanned.current = true

            setScannedResult(decodedText)
            await stopAndClearScanner()

            try {
              const url = new URL(decodedText)
              router.push(url.pathname)
            } catch {
              if (decodedText.startsWith('/')) {
                router.push(decodedText)
              } else {
                router.push(`/u/${decodedText}`)
              }
            }
          },
          () => {}
        )
      } catch (err) {
        console.error('Error iniciando cámara:', err)
        setErrorMsg(t.errorCamera)
      }
    }

    const timer = setTimeout(() => {
      startScanner()
    }, 150)

    return () => {
      clearTimeout(timer)
      stopAndClearScanner()
    }
  }, [isOpen, router, t.errorCamera])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 text-center shadow-2xl relative">
        
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800/60 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1 pt-2">
          <h3 className="text-base font-bold text-white tracking-tight flex items-center justify-center gap-2">
            <Camera className="w-5 h-5 text-blue-400" />
            <span>{t.title}</span>
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">{t.subtitle}</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 aspect-square flex items-center justify-center">
          <div id="reader-container" className="w-full h-full"></div>
          
          {scannedResult && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 space-y-2 z-20">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-xs font-medium text-emerald-400">{t.success}</p>
            </div>
          )}
        </div>

        {errorMsg && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl">
            {errorMsg}
          </p>
        )}

        <button
          onClick={handleClose}
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-all"
        >
          {t.close}
        </button>

      </div>
    </div>
  )
}