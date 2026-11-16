import { startRegistration } from '@simplewebauthn/browser'

export async function registerPasskey() {
  try {
    // 1. Solicitar opciones de registro al servidor
    const resp = await fetch('/api/auth/passkey/register-options', {
      method: 'POST',
    })
    const opts = await resp.json()

    if (!resp.ok) {
      throw new Error(opts.error || 'Error al obtener opciones de registro')
    }

    // 2. Invocar la passkey en el navegador (Touch ID, Windows Hello, etc.)
    const attResp = await startRegistration(opts)

    // 3. Enviar la respuesta al servidor para verificarla y guardarla
    const verificationResp = await fetch('/api/auth/passkey/register-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credential: attResp,
        expectedChallenge: opts.challenge,
      }),
    })

    const verificationResult = await verificationResp.json()

    if (!verificationResp.ok) {
      throw new Error(verificationResult.error || 'Error al verificar la passkey')
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error en el registro de passkey:', error)
    return { success: false, error: error.message }
  }
}