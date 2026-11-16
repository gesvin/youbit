// lib/i18n.ts
'use client'

export const translations = {
  es: {
    loginTitle: 'Iniciar Sesión',
    loginSubtitle: 'Para acceder a tu panel de Youbit, introduce tu correo electrónico. Te enviaremos un enlace mágico de acceso instantáneo. Sin contraseñas.',
    emailLabel: 'Correo electrónico',
    emailPlaceholder: 'tu@correo.com',
    sendButton: 'Enviar Magic Link',
    sendingButton: 'Enviando...',
    passkeyButton: 'Usa tu Passkey (Biometría)',
    orText: 'o',
    navProfile: 'Perfil',
    navScan: 'Escanear QR',
    navBridges: 'Puentes',
    navSettings: 'Ajustes',
    successMessage: '¡Enlace enviado! Revisa tu bandeja de entrada.',
    
    // Textos para tarjeta pública y acciones
    saveContact: 'Guardar Contacto (.vcf)',
    showQr: 'Mostrar Código QR',
    qrModalTitle: 'Escanea mi tarjeta',
    qrModalSubtitle: 'Apunta con la cámara de tu móvil para acceder a mi perfil',
    close: 'Cerrar',
    reportCard: 'Reportar esta tarjeta',
    reportModalTitle: 'Reportar perfil',
    reportModalSubtitle: 'Selecciona el motivo del reporte para que el equipo de moderación lo revise.',
    reportReasonInappropriate: 'Contenido inapropiado u ofensivo',
    reportReasonSpam: 'Spam o información falsa',
    reportReasonImpersonation: 'Suplantación de identidad',
    reportDetailsPlaceholder: 'Detalles adicionales (opcional)...',
    reportSubmit: 'Enviar reporte',
    reportSubmitting: 'Enviando...',
    reportSuccess: '¡Reporte enviado con éxito! Gracias por tu colaboración.',
    createYourCardFooter: '¿Quieres tu propia tarjeta digital?',
    createYourCardCTA: 'Crea tu Tarjeta Gratis',

    // Nuevos textos para el Escáner QR por Cámara (RF-06)
    scannerPageTitle: 'Escáner QR & Tarjeta',
    scannerPageSubtitle: 'Apunta con la cámara para escanear contactos o muestra tu código QR inteligente offline-first.',
    scannerBoxText: 'Escanea tarjetas de otros usuarios al instante',
    scannerButtonOpen: 'Abrir Cámara para Escanear',
    scannerModalTitle: 'Escanear Tarjeta QR',
    scannerModalSubtitle: 'Apunta la cámara hacia el código QR de Youbit',
    scannerErrorCamera: 'No se pudo acceder a la cámara. Verifica los permisos.',
    scannerSuccess: '¡Perfil detectado! Redirigiendo...'
  },
  en: {
    loginTitle: 'Sign In',
    loginSubtitle: 'To access your Youbit dashboard, enter your email address. We will send you an instant magical access link. No passwords.',
    emailLabel: 'Email address',
    emailPlaceholder: 'you@email.com',
    sendButton: 'Send Magic Link',
    sendingButton: 'Sending...',
    passkeyButton: 'Use your Passkey (Biometrics)',
    orText: 'OR',
    navProfile: 'Profile',
    navScan: 'Scan QR',
    navBridges: 'Bridges',
    navSettings: 'Settings',
    successMessage: 'Link sent! Check your inbox.',
    
    // Textos para tarjeta pública y acciones
    saveContact: 'Save Contact (.vcf)',
    showQr: 'Show QR Code',
    qrModalTitle: 'Scan my card',
    qrModalSubtitle: 'Point your mobile camera to access my profile',
    close: 'Close',
    reportCard: 'Report this card',
    reportModalTitle: 'Report profile',
    reportModalSubtitle: 'Select the reason for reporting so the moderation team can review it.',
    reportReasonInappropriate: 'Inappropriate or offensive content',
    reportReasonSpam: 'Spam or false information',
    reportReasonImpersonation: 'Identity impersonation',
    reportDetailsPlaceholder: 'Additional details (optional)...',
    reportSubmit: 'Submit report',
    reportSubmitting: 'Submitting...',
    reportSuccess: 'Report sent successfully! Thank you for your feedback.',
    createYourCardFooter: 'Want your own digital business card?',
    createYourCardCTA: 'Create Your Free Card',

    // Nuevos textos para el Escáner QR por Cámara (RF-06)
    scannerPageTitle: 'QR Scanner & Card',
    scannerPageSubtitle: 'Point your camera to scan contacts or display your offline-first smart QR code.',
    scannerBoxText: 'Scan other users cards instantly',
    scannerButtonOpen: 'Open Camera to Scan',
    scannerModalTitle: 'Scan QR Card',
    scannerModalSubtitle: 'Point your camera at the Youbit QR code',
    scannerErrorCamera: 'Could not access the camera. Please check permissions.',
    scannerSuccess: 'Profile detected! Redirecting...'
  }
}

export function getInitialLanguage(): 'es' | 'en' {
  if (typeof window === 'undefined') return 'es'
  const saved = localStorage.getItem('youbit_lang') as 'es' | 'en'
  if (saved && (saved === 'es' || saved === 'en')) return saved
  const browserLang = navigator.language || (navigator as any).userLanguage || 'es'
  return browserLang.toLowerCase().startsWith('en') ? 'en' : 'es'
}