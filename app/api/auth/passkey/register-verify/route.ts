import { NextResponse } from 'next/server'
import { verifyRegistrationResponse } from '@simplewebauthn/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { credential, expectedChallenge } = await request.json()

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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const rpID = process.env.NEXT_PUBLIC_RP_ID || 'localhost'
    const expectedOrigin = process.env.NEXT_PUBLIC_ORIGIN || 'http://localhost:3000'

    // Verificar la respuesta del registro con WebAuthn
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
    })

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: 'Falló la verificación de la Passkey' }, { status: 400 })
    }

    const { registrationInfo } = verification
    const { id: credentialID, publicKey: credentialPublicKey, counter } = registrationInfo.credential

    // Guardar la credencial en la tabla user_passkeys siguiendo tu esquema de BD
    const { error: dbError } = await supabase.from('user_passkeys').insert({
      user_id: user.id,
      credential_id: Buffer.from(credentialID).toString('base64'),
      public_key: Buffer.from(credentialPublicKey).toString('base64'),
      counter: Number(counter),
      ddevice_type: 'singleDevice',
    })

    if (dbError) {
      console.error('Error al guardar en base de datos:', dbError)
      return NextResponse.json({ error: 'Error al guardar la credencial' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error en verificación de registro:', error)
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 })
  }
}