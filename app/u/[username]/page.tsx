// app/u/[username]/page.tsx
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Globe, MessageCircle, Mail, Download, ExternalLink } from 'lucide-react'
import WhatsAppButton from '@/components/WhatsAppButton'
import Logo from '@/components/Logo'
import PublicQRModal from '@/components/PublicQRModal'
import ProfileOptionsMenu from '@/components/ProfileOptionsMenu'
import { Sparkles } from 'lucide-react'
import ProfileOfflineSync from '@/components/ProfileOfflineSync'
import FloatingOwnerEditButton from '@/components/FloatingOwnerEditButton'
import VisitorChatWidget from '@/plugins/multilingual-chat/VisitorChatWidget'

// Permitir ruta bloqueante para evitar conflictos con el caché en desarrollo
export const instant = false

// Cliente Supabase del servidor para SSR con caché deshabilitada para datos en tiempo real
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }),
  },
})

interface PageProps {
  params: Promise<{ username: string }>
}

interface PageProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, bio, avatar_url')
    .ilike('username', username)
    .single()

  if (!profile) return { title: 'Perfil no encontrado | Youbit' }

  return {
    title: `${profile.full_name || username} | Youbit Digital Identity`,
    description: profile.bio || `Tarjeta de presentación digital de ${profile.full_name}`,
    openGraph: {
      images: [profile.avatar_url || '']
    }
  }
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params

  // Consultar perfil público basado en el esquema de Supabase
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', username)
    .single()

  if (error || !profile || profile.is_active === false) {
    notFound()
  }

  const { data: chatPluginRow } = await supabase
    .from('user_plugins')
    .select('status, config')
    .eq('user_id', profile.id)
    .eq('plugin_id', 'multilingual_chat')
    .maybeSingle()

  const chatConfig =
    chatPluginRow?.config && typeof chatPluginRow.config === 'object'
      ? (chatPluginRow.config as Record<string, unknown>)
      : {}
  const chatVisibility =
    chatConfig.visibility === 'link_only' ||
    chatConfig.visibility === 'paused' ||
    chatConfig.visibility === 'public'
      ? chatConfig.visibility
      : 'public'
  const isPublicChatEnabled =
    chatPluginRow?.status === 'active' && chatVisibility === 'public'
  const chatBaseLanguage =
    typeof chatConfig.base_language === 'string' ? chatConfig.base_language : 'nl'
  const chatAutoTranslate =
    typeof chatConfig.auto_translate === 'boolean' ? chatConfig.auto_translate : true

  // Generador de contenido vCard (.vcf) en formato string para el Blob
  const vCardData = `BEGIN:VCARD
VERSION:3.0
FN:${profile.full_name || profile.username}
N:${profile.full_name || ''};;;;
EMAIL:${profile.email || ''}
TEL;TYPE=CELL:${profile.phone_whatsapp || ''}
NOTE:${profile.bio || ''}
URL:${profile.social_links?.website || ''}
END:VCARD`

  return (
    <main className="min-h-screen bg-[#0F172A] text-white flex flex-col items-center justify-between p-4 md:p-8 selection:bg-blue-500 selection:text-white">
      {/* Componente que sincroniza los datos del perfil en localStorage en segundo plano */}
      <ProfileOfflineSync username={username} profileData={profile} />

      {/* Contenedor Principal de la Tarjeta */}
      <div className="w-full max-w-md space-y-6 my-auto">
        
        {/* Cabecera con el Logo unificado del sistema */}
        <div className="flex justify-center pt-2">
          <Logo />
        </div>

        {/* Tarjeta Cyber Dark Glassmorphism */}
        <div className="bg-[#1E293B]/90 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-2xl p-6 space-y-6 text-center relative overflow-hidden">
          
          {/* Menú de opciones (Reportar tarjeta) en la esquina superior izquierda */}
          <ProfileOptionsMenu profileId={profile.id} username={profile.username} />

          {/* Botón de QR flotante en la esquina superior derecha */}
          <div className="absolute top-4 right-4 z-10">
            <PublicQRModal username={profile.username} fullName={profile.full_name} />
          </div>

          {/* Avatar en Alta Calidad */}
          <div className="flex justify-center pt-2">
            <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-blue-500/80 shadow-lg bg-slate-900 ring-4 ring-blue-500/10">
              {profile.avatar_url ? (
                <Image 
                  src={profile.avatar_url} 
                  alt={profile.full_name || profile.username} 
                  width={112} 
                  height={112} 
                  className="w-full h-full object-cover" 
                  unoptimized 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 font-medium">Sin foto</div>
              )}
            </div>
          </div>

          {/* Información Personal */}
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {profile.full_name || `@${profile.username}`}
            </h1>
            <p className="text-xs font-medium text-blue-400">@{profile.username}</p>
            {profile.bio && (
              <p className="text-xs text-slate-300 px-2 leading-relaxed pt-1">
                {profile.bio}
              </p>
            )}
          </div>

          {/* Botones de Acción Rápida (WhatsApp Enmascarado y Email) */}
          <div className="space-y-2.5 pt-1">
            
            {/* WhatsApp condicionado por la privacidad (show_whatsapp) */}
            {profile.show_whatsapp && profile.phone_whatsapp && (
                <WhatsAppButton phoneNumber={profile.phone_whatsapp} />
            )}

            {isPublicChatEnabled && (
                <VisitorChatWidget
                  ownerUserId={profile.id}
                  ownerUsername={profile.username}
                  ownerDisplayName={profile.full_name || profile.username}
                  ownerLanguage={chatBaseLanguage}
                  autoTranslate={chatAutoTranslate}
                />
              )}

            {/* Email Profesional */}
            {profile.email && (
              <a 
                href={`mailto:${profile.email}`}
                className="w-full py-3 px-4 bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-medium rounded-xl flex items-center justify-center gap-2 border border-slate-700/60 shadow-sm transition-all"
              >
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="truncate">{profile.email}</span>
              </a>
            )}

            {/* Sitio Web / Portfolio */}
            {profile.social_links?.website && (
              <a 
                href={profile.social_links.website}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-medium rounded-xl flex items-center justify-center gap-2 border border-slate-700/60 shadow-sm transition-all"
              >
                <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="truncate">{profile.social_links.website}</span>
                <ExternalLink className="w-3 h-3 text-slate-500 shrink-0 ml-1" />
              </a>
            )}
          </div>

          {/* Redes Sociales Individuales */}
          <div className="flex flex-wrap justify-center gap-2 pt-3 border-t border-slate-800/80">
            {profile.social_links?.linkedin && (
              <a href={profile.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-blue-400 text-xs font-medium border border-slate-700/50 shadow-sm transition-colors">
                LinkedIn
              </a>
            )}
            {profile.social_links?.instagram && (
              <a href={profile.social_links.instagram} target="_blank" rel="noopener noreferrer" className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-pink-400 text-xs font-medium border border-slate-700/50 shadow-sm transition-colors">
                Instagram
              </a>
            )}
            {profile.social_links?.twitter && (
              <a href={profile.social_links.twitter} target="_blank" rel="noopener noreferrer" className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-sky-400 text-xs font-medium border border-slate-700/50 shadow-sm transition-colors">
                X (Twitter)
              </a>
            )}
          </div>

          {/* Botón de Descarga vCard nativo (Client interaction handleado inline o mediante componente o enlace data URI) */}
          <div className="pt-2">
            <a
              href={`data:text/vcard;charset=utf-8,${encodeURIComponent(vCardData)}`}
              download={`${profile.username || 'contacto'}.vcf`}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-xl flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Guardar Contacto (.vcf)</span>
            </a>
          </div>

          {/* CTA de Conversión Comercial: Crea tu Propia Tarjeta */}
          <div className="pt-4 border-t border-slate-800/80 text-center space-y-2">
            <p className="text-[11px] text-slate-400 font-medium">¿Quieres tu propia tarjeta digital?</p>
            <a
              href="/login"
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-blue-400 hover:text-blue-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 border border-blue-500/30 shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Crea tu Tarjeta Gratis</span>
            </a>
          </div>

        </div>

      </div>

      {/* Sello de Marca Inferior: Powered by Youbit */}
      <footer className="w-full text-center py-6 mt-4">
        <a 
          href="https://youbit.app" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-400 font-medium tracking-wide transition-colors"
        >
          <span>Secure Digital Identity — Powered by</span>
          <span className="text-blue-400 font-semibold">Youbit</span>
        </a>
      </footer>

      {/* Botón flotante inteligente exclusivo para el dueño */}
      <FloatingOwnerEditButton profileId={profile.id} />

    </main>
  )
}