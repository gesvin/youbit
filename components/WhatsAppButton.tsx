// components/WhatsAppButton.tsx
'use client'
import { MessageCircle } from 'lucide-react'

interface WhatsAppButtonProps {
  phoneNumber: string
}

export default function WhatsAppButton({ phoneNumber }: WhatsAppButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    
    // Evaluar User-Agent para detectar entornos de Escritorio (Windows, Mac, Linux)
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
    const isDesktop = /windows|win32|win64|macintosh|macintel|linux/i.test(userAgent)

    if (isDesktop) {
      // Redirección segura a WhatsApp Web para evitar conflictos con app de escritorio o permisos
      window.open(`https://web.whatsapp.com/send?phone=${cleanPhone}`, '_blank', 'noopener,noreferrer')
    } else {
      // Dispositivo móvil utiliza el esquema directo wa.me
      window.open(`https://wa.me/${cleanPhone}`, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <button 
      onClick={handleClick}
      className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
    >
      <MessageCircle className="w-4 h-4" />
      <span>Contactar por WhatsApp</span>
    </button>
  )
}