import { NextResponse } from 'next/server'
import { generateRegistrationOptions } from '@simplewebauthn/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    // Verificar que el usuario tenga sesión activa
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const rpName = 'Youbit'
    const rpID = process.env.NEXT_PUBLIC_RP_ID || 'localhost'
    const origin = process.env.NEXT_PUBLIC_ORIGIN || 'http://localhost:3000'

    // Generar opciones de registro para WebAuthn
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: new TextEncoder().encode(user.id),
      userName: user.email || user.id,
      // Opcional: evitar registrar credenciales duplicadas si ya existen
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform', // Para usar biometría del dispositivo (TouchID/Windows Hello)
      },
    })

    // Guardar el challenge temporalmente (en sesión o en memoria/cookie segura para verificarlo en el paso siguiente)
    // Para simplificar esta fase, podemos retornarlo al cliente o almacenarlo. 
    // Lo ideal es guardarlo asociado al usuario.

    return NextResponse.json(options)
  } catch (error: any) {
    console.error('Error generando opciones de registro:', error)
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 })
  }
}