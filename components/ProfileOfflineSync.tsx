'use client'

import { useEffect } from 'react'

interface ProfileData {
  id: string
  username: string
  full_name?: string
  bio?: string
  phone_whatsapp?: string
  email?: string
  avatar_url?: string
  social_links?: any
  show_whatsapp?: boolean
  [key: string]: any
}

interface ProfileOfflineSyncProps {
  username: string
  profileData: ProfileData | null
}

export default function ProfileOfflineSync({ username, profileData }: ProfileOfflineSyncProps) {
  const cacheKey = `youbit_profile_${username.toLowerCase()}`

  useEffect(() => {
    if (profileData) {
      // Guardar datos frescos en localStorage cuando hay conexión exitosa
      try {
        localStorage.setItem(cacheKey, JSON.stringify(profileData))
      } catch (e) {
        console.error('Error al guardar perfil en caché local:', e)
      }
    }
  }, [profileData, cacheKey])

  return null
}