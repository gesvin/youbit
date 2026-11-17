// components/FloatingOwnerEditButton.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { Settings } from 'lucide-react'

export default function FloatingOwnerEditButton({ profileId }: { profileId: string }) {
  const [isOwner, setIsOwner] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function checkOwnerSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.id === profileId) {
        setIsOwner(true)
      }
    }
    checkOwnerSession()
  }, [profileId, supabase])

  if (!isOwner) return null

  return (
    <Link
      href="/dashboard"
      className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-3 px-4 rounded-full shadow-2xl flex items-center gap-2 border border-blue-400/30 transition-all transform hover:scale-105"
    >
      <Settings className="w-4 h-4 animate-spin" />
      <span>Editar mi tarjeta</span>
    </Link>
  )
}