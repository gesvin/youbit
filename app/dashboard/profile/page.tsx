// app/dashboard/profile/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import AvatarSelector from '@/components/AvatarSelector'
import Image from 'next/image'
import { Globe, MessageCircle, Link, Mail, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation' // <-- Añadir importación
import { updateProfile } from './actions'

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter() // <-- Instanciar router
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    bio: '',
    phone_whatsapp: '',
    email: '',
    country_code: 'ES',
    avatar_url: '',
    show_whatsapp: true,
    social_links: { linkedin: '', instagram: '', twitter: '', website: '' }
  })

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*') // <-- Corrección: Seleccionar todas las columnas
          .eq('id', user.id)
          .single()

        if (data) {
          setFormData({
            username: data.username || '',
            full_name: data.full_name || '',
            bio: data.bio || '',
            phone_whatsapp: data.phone_whatsapp || '',
            email: data.email || user.email || '',
            country_code: data.country_code || 'ES',
            avatar_url: data.avatar_url || '',
            show_whatsapp: data.show_whatsapp ?? true,
            social_links: data.social_links || { linkedin: '', instagram: '', twitter: '', website: '' }
          })
        } else {
          setFormData(prev => ({ ...prev, email: user.email || '' }))
        }
      }
    }
    loadProfile()
  }, [supabase])

  // Función limpiadora y normalizadora de teléfono (Estándar E.164)
  const normalizePhoneNumber = (phone: string) => {
    if (!phone) return ''
    let cleaned = phone.trim()
    if (cleaned.startsWith('00')) {
      cleaned = '+' + cleaned.slice(2)
    }
    const hasPlus = cleaned.startsWith('+')
    const digitsOnly = cleaned.replace(/\D/g, '')
    return hasPlus ? '+' + digitsOnly : '+' + digitsOnly
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setMessage('Error: Usuario no autenticado.')
      setLoading(false)
      return
    }

    const normalizedPhone = normalizePhoneNumber(formData.phone_whatsapp)
    const payload = {
      ...formData,
      phone_whatsapp: normalizedPhone,
      show_whatsapp: formData.show_whatsapp,
    }

    // Invocamos la Server Action que se encarga de Supabase y de revalidar la ruta pública
    const result = await updateProfile(payload)

    if (!result.success) {
      setMessage(`Error al guardar: ${result.error}`)
    } else {
      setFormData(prev => ({ ...prev, phone_whatsapp: normalizedPhone }))
      setMessage('Perfil actualizado con éxito!')
      router.refresh() // Refresca el dashboard local
    }
    setLoading(false)
  }

  // Función para enmascarar y redirigir inteligentemente a WhatsApp
  const handleWhatsAppClick = (phone: string) => {
    if (!phone) return
    const cleanPhone = phone.replace(/\D/g, '')
    const isDesktop = typeof window !== 'undefined' && !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const whatsappUrl = isDesktop 
      ? `https://web.whatsapp.com/send?phone=${cleanPhone}` 
      : `https://wa.me/${cleanPhone}`
    
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 md:p-6 bg-[#0F172A] text-white pb-24">
      <div className="w-full max-w-4xl space-y-6 pt-4">
        <h1 className="text-2xl font-bold text-center">Configuración de Perfil</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* COLUMNA 1: Formulario (Mantiene max-w adaptado) */}
          <form onSubmit={handleSave} className="bg-[#1E293B] p-6 rounded-2xl shadow-lg border border-slate-800 space-y-4 h-fit">
            <AvatarSelector
              currentAvatarUrl={formData.avatar_url}
              username={formData.username}
              onAvatarChange={(newUrl) => setFormData({ ...formData, avatar_url: newUrl })}
            />

            {/* Botón para ver la Tarjeta Pública en tiempo real */}
            {formData.username && (
              <div>
                <a
                  href={`/u/${formData.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-blue-400 text-xs font-medium rounded-xl flex items-center justify-center gap-2 border border-slate-700/80 shadow-sm transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Ver Tarjeta Pública</span>
                </a>
              </div>
            )}

            <div>
                <label className="text-xs text-slate-400">Nombre Completo</label>
                <input 
                    type="text" 
                    value={formData.full_name} 
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder="Ej. Juan Pérez"
                />
            </div>

            <div>
                <label className="text-xs text-slate-400">Biografía breve</label>
                <textarea 
                    value={formData.bio} 
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                    rows={2}
                    placeholder="Cuéntanos a qué te dedicas..."
                />
            </div>

            <div>
                <label className="text-xs text-slate-400">WhatsApp (Formato internacional automático)</label>
                <input 
                    type="text" 
                    value={formData.phone_whatsapp} 
                    onChange={(e) => setFormData({ ...formData, phone_whatsapp: e.target.value })}
                    onBlur={(e) => setFormData({ ...formData, phone_whatsapp: normalizePhoneNumber(e.target.value) })}
                    className="w-full mt-1 p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder="+34600000000"
                />
            </div>

            <div>
              <label className="text-xs text-slate-400">Correo Electrónico Profesional</label>
              <input 
                type="email" 
                value={formData.email} 
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full mt-1 p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                placeholder="tu@correo.com"
              />
            </div>

            {/* Toggle Moderno: Mostrar/Ocultar WhatsApp en Perfil Público */}
            <div className="flex items-center justify-between p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div className="space-y-0.5">
                <label className="text-xs font-medium text-slate-200">Mostrar WhatsApp en perfil público</label>
                <p className="text-[11px] text-slate-400">Permite que te contacten directamente desde tu tarjeta digital.</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, show_whatsapp: !formData.show_whatsapp })} // <-- Corregido con el operador de negación (!)
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                  formData.show_whatsapp ? 'bg-blue-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    formData.show_whatsapp ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-800">
                <label className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Redes y Sitio Web</label>
    
                <div>
                    <label className="text-xs text-slate-400">Sitio Web / Portfolio</label>
                    <input 
                        type="url" 
                        value={formData.social_links.website} 
                        onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, website: e.target.value } })}
                        className="w-full mt-1 p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                        placeholder="https://tudominio.com"
                    />
                </div>

                <div>
                    <label className="text-xs text-slate-400">LinkedIn URL</label>
                    <input 
                        type="url" 
                        value={formData.social_links.linkedin} 
                        onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, linkedin: e.target.value } })}
                        className="w-full mt-1 p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                        placeholder="https://linkedin.com/in/tu-usuario"
                    />
                </div>

                <div>
                    <label className="text-xs text-slate-400">Instagram URL</label>
                    <input 
                        type="url" 
                        value={formData.social_links.instagram} 
                        onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, instagram: e.target.value } })}
                        className="w-full mt-1 p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                        placeholder="https://instagram.com/tu-usuario"
                    />
                </div>

                <div>
                    <label className="text-xs text-slate-400">X (Twitter) URL</label>
                    <input 
                        type="url" 
                        value={formData.social_links.twitter} 
                        onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, twitter: e.target.value } })}
                        className="w-full mt-1 p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                        placeholder="https://x.com/tu-usuario"
                    />
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50 shadow-md mt-4"
            >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>

            {message && (
                <p className="text-xs text-center text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-700">
                    {message}
                </p>
            )}
        </form>

          {/* COLUMNA 2: Vista Previa Interactiva en Tiempo Real */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Vista Previa Interactiva</h2>
            
            <div className="bg-[#1E293B] border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-5 text-center sticky top-6">
              {/* Avatar Previa */}
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-blue-500 shadow-lg bg-slate-900">
                  {formData.avatar_url ? (
                    <Image src={formData.avatar_url} alt="Preview" width={96} height={96} className="w-full h-full object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">Sin foto</div>
                  )}
                </div>
              </div>

              {/* Textos Informativos */}
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">{formData.full_name || (formData.username ? `@${formData.username}` : 'Tu Nombre')}</h3>
                <p className="text-xs text-blue-400 font-medium">@{formData.username || 'usuario'}</p>
                <p className="text-xs text-slate-300 px-2 line-clamp-3">{formData.bio || 'Tu biografía aparecerá aquí en tiempo real...'}</p>
              </div>

              {/* Botón WhatsApp Limpio con Privacidad, Enmascaramiento y Mitigación de Escritorio */}
              {formData.show_whatsapp && formData.phone_whatsapp && (() => {
                const isDesktop = typeof window !== 'undefined' && !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

                return (
                  <div className="pt-1">
                    <button 
                      type="button"
                      onClick={() => handleWhatsAppClick(formData.phone_whatsapp)}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" /> 
                      <span>WhatsApp</span> {isDesktop && <span className="text-[10px] opacity-75">(Web)</span>}
                    </button>
                  </div>
                )
              })()}

              {/* Email en Vista Previa */}
              {formData.email && (
                <div>
                  <a 
                    href={`mailto:${formData.email}`} 
                    className="w-full py-2.5 px-3 bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs rounded-xl flex items-center justify-center gap-2 border border-slate-700/60 transition-colors shadow-sm truncate"
                  >
                    <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">{formData.email}</span>
                  </a>
                </div>
              )}

              {/* Enlace Web / Portfolio Clickeable */}
              {formData.social_links?.website && (
                <div>
                  <a 
                    href={formData.social_links.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs rounded-xl flex items-center justify-center gap-2 border border-slate-700/60 transition-colors shadow-sm truncate"
                  >
                    <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">{formData.social_links.website}</span>
                  </a>
                </div>
              )}

              {/* Badges de Redes Sociales Individuales */}
              <div className="flex flex-wrap justify-center gap-2 pt-3 border-t border-slate-800/80">
                {formData.social_links?.linkedin && (
                  <a href={formData.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-blue-400 text-xs font-medium border border-slate-700/50 shadow-sm transition-colors flex items-center gap-1.5">
                    LinkedIn
                  </a>
                )}
                {formData.social_links?.instagram && (
                  <a href={formData.social_links.instagram} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-pink-400 text-xs font-medium border border-slate-700/50 shadow-sm transition-colors flex items-center gap-1.5">
                    Instagram
                  </a>
                )}
                {formData.social_links?.twitter && (
                  <a href={formData.social_links.twitter} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-sky-400 text-xs font-medium border border-slate-700/50 shadow-sm transition-colors flex items-center gap-1.5">
                    X (Twitter)
                  </a>
                )}
                {!formData.social_links?.linkedin && !formData.social_links?.instagram && !formData.social_links?.twitter && (
                  <span className="text-[11px] text-slate-500 italic">Redes no vinculadas</span>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}