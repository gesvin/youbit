// components/BottomNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, QrCode, Users, Settings } from 'lucide-react'

// components/BottomNav.tsx
const navItems = [
  { name: 'Perfil', href: '/dashboard/profile', icon: User },
  { name: 'Escanear QR', href: '/dashboard/qr', icon: QrCode },
  { name: 'Puentes', href: '/dashboard/bridges', icon: Users },
  { name: 'Ajustes', href: '/dashboard/settings', icon: Settings },
]

export default function BottomNav() {
  const pathname = usePathname()

  // Ocultar la barra en la pantalla de inicio de sesión
  if (pathname === '/login') return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-slate-950/80 backdrop-blur-md border-t border-slate-800/50">
      <nav className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-blue-500 font-semibold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}