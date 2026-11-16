// components/AvatarSelector.tsx
'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'

interface AvatarSelectorProps {
  currentAvatarUrl?: string
  username: string
  onAvatarChange: (base64Webp: string) => void
}

export default function AvatarSelector({ currentAvatarUrl, username, onAvatarChange }: AvatarSelectorProps) {
  const [avatarPreview, setAvatarPreview] = useState(currentAvatarUrl || '')
  const [showModal, setShowModal] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (currentAvatarUrl) {
      setAvatarPreview(currentAvatarUrl)
    }
  }, [currentAvatarUrl])

  const handleGenerateVectorial = () => {
    const seed = username || 'youbit-user'
    const vectorUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`
    setAvatarPreview(vectorUrl)
    onAvatarChange(vectorUrl)
    setShowModal(false)
    setCameraError('')
  }

  const processImageToWebp = (fileOrUrl: File | string) => {
    const img = document.createElement('img')
    img.crossOrigin = 'anonymous'
    
    if (typeof fileOrUrl === 'string') {
      img.src = fileOrUrl
      img.onload = () => drawToCanvas(img)
    } else {
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target?.result as string
      }
      img.onload = () => drawToCanvas(img)
      reader.readAsDataURL(fileOrUrl)
    }
  }

  const drawToCanvas = (img: HTMLImageElement) => {
    const canvas = document.createElement('canvas')
    const size = 256
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      let sourceWidth = img.width
      let sourceHeight = img.height
      let sourceX = 0
      let sourceY = 0

      if (sourceWidth > sourceHeight) {
        sourceX = (sourceWidth - sourceHeight) / 2
        sourceWidth = sourceHeight
      } else {
        sourceY = (sourceHeight - sourceWidth) / 2
        sourceHeight = sourceWidth
      }

      ctx.clearRect(0, 0, size, size)
      ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, size, size)

      const webpData = canvas.toDataURL('image/webp', 0.90)
      setAvatarPreview(webpData)
      onAvatarChange(webpData)
      setShowModal(false)
      stopCamera()
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processImageToWebp(file)
    }
  }

  const startCamera = async () => {
    setCameraError('')

    // Verificar permisos mediante la API del navegador antes de llamar a getUserMedia para evitar el issue en consola
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName })
        if (permissionStatus.state === 'denied') {
          setCameraError('El acceso a la cámara está bloqueado en tu navegador. Habilítalo en el icono de ajustes de la barra de direcciones.')
          return
        }
      } catch (e) {
        // Ignorar si el navegador no soporta la query específica de cámara
      }
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Tu navegador no soporta el acceso a la cámara.')
      return
    }

    setShowCamera(true)
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      })

      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream
      }
    } catch (err: any) {
      setShowCamera(false)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Permiso de cámara denegado. Por favor, actívalo en los ajustes de tu navegador.')
      } else {
        setCameraError('No se pudo inicializar la cámara en este entorno.')
      }
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setShowCamera(false)
  }

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current
      const canvas = document.createElement('canvas')
      const size = 256
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      
      if (ctx && video.videoWidth > 0) {
        const minDim = Math.min(video.videoWidth, video.videoHeight)
        const startX = (video.videoWidth - minDim) / 2
        const startY = (video.videoHeight - minDim) / 2
        
        ctx.drawImage(video, startX, startY, minDim, minDim, 0, 0, size, size)
        const webpData = canvas.toDataURL('image/webp', 0.90)
        setAvatarPreview(webpData)
        onAvatarChange(webpData)
        stopCamera()
        setShowModal(false)
      }
    }
  }

  return (
    <div className="flex flex-col items-center space-y-3">
      <div 
        onClick={() => { setShowModal(true); setCameraError(''); }}
        className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-blue-500 cursor-pointer group bg-slate-900 flex items-center justify-center shadow-md"
      >
        {avatarPreview ? (
          <Image 
            src={avatarPreview} 
            alt="Avatar" 
            width={256} 
            height={256} 
            className="w-full h-full object-cover" 
            unoptimized 
          />
        ) : (
          <span className="text-xs text-slate-400">Sin foto</span>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
          Cambiar
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-slate-800 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl text-white">
            <h3 className="text-lg font-bold text-center">Seleccionar Avatar</h3>
            
            {cameraError && (
              <p className="text-xs text-red-400 bg-red-950/50 p-2.5 rounded-lg border border-red-800 text-center">
                {cameraError}
              </p>
            )}

            {!showCamera ? (
              <div className="space-y-3">
                <label className="block w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-center rounded-xl cursor-pointer text-sm font-medium transition-colors border border-slate-700">
                  📁 Cargar imagen desde dispositivo
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>

                <button 
                  type="button"
                  onClick={startCamera}
                  className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors border border-slate-700"
                >
                  📷 Tomar foto con la cámara
                </button>

                <button 
                  type="button"
                  onClick={handleGenerateVectorial}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-medium transition-colors shadow-md"
                >
                  ✨ Generar avatar vectorial
                </button>
              </div>
            ) : (
              <div className="space-y-3 flex flex-col items-center">
                <video ref={videoRef} autoPlay playsInline className="w-full h-48 rounded-xl object-cover bg-black" />
                <div className="flex gap-2 w-full">
                  <button type="button" onClick={capturePhoto} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-medium">Capturar</button>
                  <button type="button" onClick={stopCamera} className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm font-medium">Cancelar</button>
                </div>
              </div>
            )}

            <button 
              type="button"
              onClick={() => { stopCamera(); setShowModal(false); setCameraError(''); }} 
              className="w-full py-2 text-slate-400 hover:text-white text-xs"
            >
              Cerrar ventana
            </button>
          </div>
        </div>
      )}
    </div>
  )
}