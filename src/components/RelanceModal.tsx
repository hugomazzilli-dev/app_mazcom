'use client'

import { useState, useEffect, useRef } from 'react'
import { Relance, HistItem } from '@/hooks/useRelances'
import { supabase } from '@/lib/supabase'


type Props = {
  relance?: Relance | null
  onClose: () => void
  onSave: (data: Omit<Relance, 'id' | 'created_at'>) => Promise<void>
}

const CATS = [
  { value: 'facture', label: 'Facture impayée' },
  { value: 'devis',   label: 'Devis sans réponse' },
  { value: 'client',  label: 'Client inactif' },
  { value: 'suivi',   label: 'Suivi livraison' },
]

const inputStyle = {
  background: '#111', border: '0.5px solid #2a2a2e', borderRadius: '8px',
  padding: '8px 12px', fontSize: '13px', color: '#ccc', width: '100%', outline: 'none',
}
const labelStyle = { fontSize: '12px', color: '#555', marginBottom: '5px', display: 'block' }

export default function RelanceModal({ relance, onClose, onSave }: Props) {
const [form, setForm] = useState<{
  nom: string
  cat: string
  client: string
  contact: string
  montant: number
  jours: number
  done: boolean
  historique: HistItem[]
  message: string
}>({
  nom: '', cat: 'devis', client: '', contact: '',
  montant: 0, jours: 0, done: false, historique: [], message: '',
})
  const [saving, setSaving]         = useState(false)
  const [clients, setClients]       = useState<string[]>([])
  const [clientSugg, setClientSugg] = useState<string[]>([])
  const [showClient, setShowClient] = useState(false)
  const clientRef                    = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase.from('clients').select('nom').order('nom')
      if (data) setClients(data.map((x: any) => x.nom))
    }
    fetch()
  }, [])

  useEffect(() => {
    if (relance) setForm({
      nom:        relance.nom,
      cat:        relance.cat,
      client:     relance.client,
      contact:    relance.contact,
      montant:    relance.montant,
      jours:      relance.jours,
      done:       relance.done,
      historique: relance.historique,
      message:    relance.message,
    })
  }, [relance])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) setShowClient(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function set(key: string, value: any) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleClientInput(val: string) {
    set('client', val)
    const f = clients.filter(c => c.toLowerCase().includes(val.toLowerCase()))
    setClientSugg(f); setShowClient(f.length > 0 && val.length > 0)
  }

  async function handleSave() {
    if (!form.nom.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#161618', border: '0.5px solid #2a2a2e', borderRadius: '16px', padding: '1.5rem', width: '520px', maxHeight: '85vh', overflowY: 'auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '16px', fontWeight: 500, color: '#fff' }}>{relance ? 'Modifier la relance' : 'Nouvelle relance'}</div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#555', fontSize: '20px', cursor: 'pointer' }}>×</button>
        </div>

        {/* Nom */}
        <div style={{ marginBottom: '10px' }}>
          <label style={labelStyle}>Titre de la relance *</label>
          <input style={inputStyle} value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="Ex: Facture Renov Expert — 1 100 €" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>

          {/* Catégorie */}
          <div>
            <label style={labelStyle}>Type</label>
            <select style={inputStyle} value={form.cat} onChange={e => set('cat', e.target.value)}>
              {CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {/* Jours */}
          <div>
            <label style={labelStyle}>Jours sans réponse</label>
            <input style={inputStyle} type="number" value={form.jours} onChange={e => set('jours', parseInt(e.target.value) || 0)} />
          </div>

          {/* Client */}
          <div style={{ position: 'relative' }} ref={clientRef}>
            <label style={labelStyle}>Client</label>
            <input style={inputStyle} value={form.client} onChange={e => handleClientInput(e.target.value)} placeholder="Rechercher..." autoComplete="off" />
            {showClient && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1e1e22', border: '0.5px solid #2a2a2e', borderRadius: '8px', zIndex: 100, marginTop: '4px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                {clientSugg.map(name => (
                  <div key={name} onMouseDown={() => { set('client', name); setShowClient(false) }}
                    style={{ padding: '9px 12px', fontSize: '13px', color: '#ccc', cursor: 'pointer', borderBottom: '0.5px solid #2a2a2e' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#2a2a2e')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    {name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contact */}
          <div>
            <label style={labelStyle}>Contact</label>
            <input style={inputStyle} value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="Ex: Marc Girard" />
          </div>

          {/* Montant */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Montant en jeu (€) — laisser 0 si non applicable</label>
            <input style={inputStyle} type="number" value={form.montant} onChange={e => set('montant', parseInt(e.target.value) || 0)} />
          </div>

        </div>

        {/* Message type */}
        <div style={{ margin: '10px 0 1.25rem' }}>
          <label style={labelStyle}>Message type</label>
          <textarea value={form.message} onChange={e => set('message', e.target.value)} rows={5}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
            placeholder="Rédigez le message à envoyer au client..." />
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: 'transparent', border: '0.5px solid #2a2a2e', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', color: '#888', cursor: 'pointer' }}>Annuler</button>
          <button onClick={handleSave} disabled={saving} style={{ background: '#ff6b2b', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', color: '#fff', cursor: 'pointer', fontWeight: 500, opacity: saving ? .7 : 1 }}>
            {saving ? 'Enregistrement...' : relance ? 'Modifier' : 'Créer la relance'}
          </button>
        </div>
      </div>
    </div>
  )
}