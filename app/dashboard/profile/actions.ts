'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function updateProfile(formData: {
  username: string
  full_name?: string
  bio?: string
  phone_whatsapp?: string
  email?: string
  country_code?: string
  avatar_url?: string
  show_whatsapp?: boolean
  social_links?: Record<string, string>
  [key: string]: unknown
}) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  // 1. Verificar autenticación en el servidor
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Usuario no autenticado' }
  }

  // 2. Guardar en Supabase asegurando el ID del usuario autenticado
  const payload = {
    ...formData,
    id: user.id,
  }

  const { error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })

  if (error) {
    return { success: false, error: error.message }
  }

  // 3. Invalidar la caché de la ruta pública específica en Next.js
  if (payload.username) {
    revalidatePath(`/u/${payload.username}`)
  }

  return { success: true }
}
