import { createClient } from '@/lib/supabase'

const supabase = createClient()

export async function signInWithMagicLink(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    // Usamos console.warn para evitar interrumpir la UX con el overlay de Next.js
    console.warn('Aviso de autenticación:', error.message)

    // Interceptamos errores específicos de Supabase y devolvemos mensajes amigables
    if (error.message.includes('rate limit')) {
      return {
        success: false,
        error: 'Has solicitado demasiados enlaces en poco tiempo. Por favor, espera un minuto e inténtalo de nuevo.',
      }
    }

    return {
      success: false,
      error: 'No se pudo enviar el enlace de acceso. Por favor, verifica tu correo e inténtalo más tarde.',
    }
  }

  return { success: true }
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    console.warn('Aviso de Google OAuth:', error.message)
    return {
      success: false,
      error: 'No se pudo iniciar sesión con Google. Inténtalo de nuevo.',
    }
  }
  return { success: true }
}