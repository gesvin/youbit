// app/dashboard/bridges/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Logo from '@/components/Logo'
import Image from 'next/image'
import { Search, CheckCircle, Users, Sparkles, Send } from 'lucide-react'

interface Contact {
  id: string
  username: string
  full_name: string
  avatar_url: string
  bio: string
}

export default function BridgesPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  
  const [contacts, setContacts] = useState<Contact[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([])
  const [contextNote, setContextNote] = useState('')

  // Cargar contactos de la agenda local (connections + profiles)
  useEffect(() => {
    async function loadAgenda() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('connections')
        .select('id, contact_id, profiles:contact_id(id, username, full_name, avatar_url, bio)')
        .eq('user_id', user.id)

      if (!error && data) {
        const formattedContacts = data
          .map((item: any) => item.profiles)
          .filter((profile: any) => profile && profile.id)
        setContacts(formattedContacts)
      }
      setLoading(false)
    }

    loadAgenda()
  }, [supabase])

  // Filtrar contactos en tiempo real según la búsqueda
  const filteredContacts = contacts.filter(contact =>
    contact.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.username?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Manejar selección de tarjetas
  const toggleContactSelection = (id: string) => {
    setSelectedContactIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  // Crear el puente y los participantes en Supabase
  const handleCreateBridge = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedContactIds.length < 2) return

    setSubmitting(true)
    setMessage('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setMessage('Error: Usuario no autenticado.')
      setSubmitting(false)
      return
    }

    // 1. Insertar el registro principal del puente
    const { data: bridgeData, error: bridgeError } = await supabase
      .from('bridges')
      .insert({
        connector_id: user.id,
        context_note: contextNote.trim() || '¡Creo que deberían conocerse!'
      })
      .select()
      .single()

    if (bridgeError || !bridgeData) {
      setMessage(`Error al crear el puente: ${bridgeError?.message}`)
      setSubmitting(false)
      return
    }

    // 2. Insertar los participantes del puente en estado 'pending'
    const participantsPayload = selectedContactIds.map(contactId => ({
      bridge_id: bridgeData.id,
      user_id: contactId,
      status: 'pending',
      thanked: false
    }))

    const { error: participantsError } = await supabase
      .from('bridge_participants')
      .insert(participantsPayload)

    if (participantsError) {
      setMessage(`Error al registrar participantes: ${participantsError.message}`)
    } else {
      setMessage('¡Puente creado con éxito! Se han enviado las solicitudes de consentimiento.')
      setSelectedContactIds([])
      setContextNote('')
    }

    setSubmitting(false)
  }

  const isReadyToBridge = selectedContactIds.length >= 2

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 md:p-6 bg-[#0F172A] text-white pb-24">
      <div className="w-full max-w-2xl space-y-6 pt-4">
        
        {/* Cabecera */}
        <div className="flex flex-col items-center space-y-2">
          <Logo size="sm" variant="light" />
          <h1 className="text-2xl font-bold text-center">Creador de Puentes</h1>
          <p className="text-xs text-slate-400 text-center max-w-md">
            Conecta contactos de tu agenda de manera descentralizada con consentimiento independiente.
          </p>
        </div>

        {/* Tarjeta Principal del Formulario */}
        <div className="bg-[#1E293B] p-6 rounded-2xl shadow-lg border border-slate-800 space-y-6">
          
          {/* Contador Visual de Selección */}
          <div className="flex items-center justify-between p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium text-slate-200">Contactos seleccionados</span>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${isReadyToBridge ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
              {selectedContactIds.length} {selectedContactIds.length === 1 ? 'contacto' : 'contactos'} {isReadyToBridge ? '✓ (Mínimo cumplido)' : '(Mínimo 2)'}
            </div>
          </div>

          {/* Buscador de Contactos */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              1. Selecciona al menos 2 contactos de tu agenda
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o usuario..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Grid de Tarjetas Seleccionables */}
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {loading ? (
              <p className="text-xs text-center text-slate-500 py-6">Cargando agenda local...</p>
            ) : filteredContacts.length === 0 ? (
              <p className="text-xs text-center text-slate-500 py-6">No se encontraron contactos en tu agenda.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredContacts.map(contact => {
                  const isSelected = selectedContactIds.includes(contact.id)
                  return (
                    <div
                      key={contact.id}
                      onClick={() => toggleContactSelection(contact.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected 
                          ? 'bg-blue-600/15 border-blue-500 shadow-md' 
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                          {contact.avatar_url ? (
                            <Image src={contact.avatar_url} alt={contact.full_name || 'Avatar'} width={40} height={40} className="w-full h-full object-cover" unoptimized />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">Sin foto</div>
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-white truncate">{contact.full_name || `@${contact.username}`}</p>
                          <p className="text-[11px] text-blue-400 truncate">@{contact.username}</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-700 bg-slate-800'}`}>
                        {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Sección Nota de Contexto (Se habilita al cumplir el mínimo) */}
          <form onSubmit={handleCreateBridge} className="space-y-4 pt-4 border-t border-slate-800">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                2. Redacta una nota de contexto para el puente
              </label>
              <textarea
                value={contextNote}
                onChange={(e) => setContextNote(e.target.value)}
                disabled={!isReadyToBridge}
                rows={3}
                placeholder={isReadyToBridge ? "Ej. Hola, quiero presentarles porque ambos desarrollan proyectos en Web3..." : "Selecciona al menos 2 contactos para redactar la nota..."}
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Botón de Acción Final */}
            <button
              type="submit"
              disabled={!isReadyToBridge || submitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Creando Puente...' : 'Lanzar Propuesta de Puente'}
            </button>
          </form>

          {/* Mensajes de feedback */}
          {message && (
            <p className={`text-xs text-center p-3 rounded-xl border ${message.includes('éxito') ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60' : 'bg-slate-900 text-slate-300 border-slate-700'}`}>
              {message}
            </p>
          )}

        </div>
      </div>
    </main>
  )
}