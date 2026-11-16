'use client'

import { useState } from 'react'
import { MoreVertical, Flag, X, Sparkles } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

// Inicializar cliente Supabase de cliente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface ProfileOptionsMenuProps {
  profileId: string
  username: string
  lang?: 'es' | 'en'
}

export default function ProfileOptionsMenu({ profileId, username, lang = 'es' }: ProfileOptionsMenuProps) {
  const [isOpenMenu, setIsOpenMenu] = useState(false)
  const [isOpenReportModal, setIsOpenReportModal] = useState(false)
  const [reason, setReason] = useState('Contenido inapropiado')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Textos bilingües rápidos integrados para el componente
  const t = {
    es: {
      reportCard: 'Reportar esta tarjeta',
      reportModalTitle: 'Reportar perfil',
      reportModalSubtitle: 'Selecciona el motivo del reporte para que el equipo de moderación lo revise.',
      reasons: [
        'Contenido inapropiado u ofensivo',
        'Spam o información falsa',
        'Suplantación de identidad'
      ],
      detailsPlaceholder: 'Detalles adicionales (opcional)...',
      submit: 'Enviar reporte',
      submitting: 'Enviando...',
      success: '¡Reporte enviado con éxito! Gracias por tu colaboración.',
      close: 'Cerrar'
    },
    en: {
      reportCard: 'Report this card',
      reportModalTitle: 'Report profile',
      reportModalSubtitle: 'Select the reason for reporting so the moderation team can review it.',
      reasons: [
        'Inappropriate or offensive content',
        'Spam or false information',
        'Identity impersonation'
      ],
      detailsPlaceholder: 'Additional details (optional)...',
      submit: 'Submit report',
      submitting: 'Submitting...',
      success: 'Report sent successfully! Thank you for your feedback.',
      close: 'Close'
    }
  }[lang]

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const { error } = await supabase.from('profile_reports').insert({
      profile_id: profileId,
      reason,
      details,
      status: 'pending'
    })

    setSubmitting(false)
    if (!error) {
      setSubmitted(true)
    }
  }

  return (
    <>
      {/* Botón de Menú de Opciones (Tres puntos) en esquina superior opuesta al QR */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => setIsOpenMenu(!isOpenMenu)}
          className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700/60 shadow-sm transition-all flex items-center justify-center"
          title="Opciones"
        >
          <MoreVertical className="w-5 h-5" />
        </button>

        {isOpenMenu && (
          <div className="absolute left-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl py-1.5 z-20 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => {
                setIsOpenMenu(false)
                setIsOpenReportModal(true)
              }}
              className="w-full px-4 py-2 text-left text-xs font-medium text-slate-300 hover:bg-slate-800/80 hover:text-red-400 flex items-center gap-2 transition-colors"
            >
              <Flag className="w-4 h-4" />
              <span>{t.reportCard}</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal de Reporte */}
      {isOpenReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 text-left shadow-2xl relative">
            
            <button
              onClick={() => setIsOpenReportModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <button
              onClick={() => {
                setIsOpenReportModal(false)
                setSubmitted(false)
              }}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {submitted ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <Flag className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white tracking-tight">{t.reportModalTitle}</h3>
                  <p className="text-xs text-emerald-400 font-medium leading-relaxed px-2">{t.success}</p>
                </div>
                <button
                  onClick={() => {
                    setSubmitted(false)
                    setIsOpenReportModal(false)
                  }}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-all"
                >
                  {t.close}
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-1 pt-2">
                  <h3 className="text-base font-bold text-white tracking-tight">{t.reportModalTitle}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{t.reportModalSubtitle}</p>
                </div>

                <form onSubmit={handleReportSubmit} className="space-y-3 pt-1">
                  <div className="space-y-1.5">
                    {t.reasons.map((item, idx) => (
                      <label key={idx} className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer p-2 rounded-xl bg-slate-950/40 hover:bg-slate-800/60 transition-colors">
                        <input
                          type="radio"
                          name="reportReason"
                          value={item}
                          checked={reason === item}
                          onChange={(e) => setReason(e.target.value)}
                          className="text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700"
                        />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>

                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder={t.detailsPlaceholder}
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  />

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-xl shadow-md transition-all disabled:opacity-50"
                  >
                    {submitting ? t.submitting : t.submit}
                  </button>
                </form>
              </>
            )}

          </div>
        </div>
      )}
    </>
  )
}