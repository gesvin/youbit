'use client'

import { useState } from 'react'
import { registerPasskey } from '@/lib/passkeys-client'

export default function PasskeySettings() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleRegisterPasskey = async () => {
    setLoading(true)
    setMessage('')

    const result = await registerPasskey()

    if (result.success) {
      setMessage('¡Passkey registrada exitosamente!')
    } else {
      // Filtrar y traducir mensajes de error técnicos para el usuario final
      const rawError = result.error || ''
      
      if (rawError.includes('rate limit')) {
        setMessage('Hemos enviado demasiadas solicitudes en poco tiempo. Por favor, espera un minuto e intenta de nuevo.')
      } else if (rawError.includes('No autorizado')) {
        setMessage('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.')
      } else {
        setMessage('No se pudo registrar la Passkey. Inténtalo de nuevo más tarde.')
      }
    }

    setLoading(false)
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-md">
      <h2 className="text-lg font-bold text-gray-900 mb-2">Seguridad Biométrica (Passkeys)</h2>
      <p className="text-sm text-gray-500 mb-4">
        Vincula tu huella dactilar, reconocimiento facial o llave de seguridad para iniciar sesión sin contraseñas.
      </p>

      <button
        onClick={handleRegisterPasskey}
        disabled={loading}
        className="w-full py-2.5 px-4 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? 'Registrando...' : 'Registrar nueva Passkey'}
      </button>

      {message && (
        <p className="mt-4 text-sm text-center text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
          {message}
        </p>
      )}
    </div>
  )
}