'use client'

import { useState, useEffect } from 'react'
import { Client } from '@/hooks/useClients'

type Props = {
  client?: Client | null
  onClose: () => void
  onSave: (data: Omit<Client, 'id' | 'created_at'>) => Promise<void>
}

const STATUTS = ['actif', 'relance', 'devis', 'dormant']

const inputStyle = {
  background: '#111',
  border: '0.5px solid #2a2a2e',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '13px',
  color: '#ccc',
  width: '100%',
  outline: 'none',
}

const labelStyle = {
  fontSize: '12px',
  color: '#555',
  marginBottom: '5px',
  display: 'block',
}

export default function ClientModal({ client, onClose, onSave }: Props) {
  const [form, setForm] = useState({
    nom: '', contact: '', email: '', telephone: '',
    adresse: '', secteur: '', statut: 'prospect', notes: '', ca_genere: 0,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (client) {
      setForm({
        nom:       client.nom,
        contact:   client.contact,
        email:     client.email,
        telephone: client.telephone,
        adresse:   client.adresse,
        secteur:   client.secteur,
        statut:    client.statut,
        notes:     client.notes,
        ca_genere: client.ca_genere,
      })
    }
  }, [client])

  function set(key: string, value: string | number) {
    setForm(prev => ({ ...prev, [key]: value }))
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
          <div style={{ fontSize: '16px', fontWeight: 500, color: '#fff' }}>{client ? 'Modifier le client' : 'Nouveau client'}</div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#555', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>

          <div>
            <label style={labelStyle}>Nom entreprise *</label>
            <input style={inputStyle} value={form.nom}       onChange={e => set('nom', e.target.value)} placeholder="Ex: Batim Pro" />
          </div>
          <div>
            <label style={labelStyle}>Contact principal</label>
            <input style={inputStyle} value={form.contact}   onChange={e => set('contact', e.target.value)} placeholder="Ex: Marc Girard" />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input style={inputStyle} value={form.email}     onChange={e => set('email', e.target.value)} placeholder="contact@entreprise.fr" />
          </div>
          <div>
            <label style={labelStyle}>Téléphone</label>
            <input style={inputStyle} value={form.telephone} onChange={e => set('telephone', e.target.value)} placeholder="06 00 00 00 00" />
          </div>
          <div>
            <label style={labelStyle}>Adresse</label>
            <input style={inputStyle} value={form.adresse}   onChange={e => set('adresse', e.target.value)} placeholder="Ville, Code postal" />
          </div>
          <div>
            <label style={labelStyle}>Secteur</label>
            <input style={inputStyle} value={form.secteur}   onChange={e => set('secteur', e.target.value)} placeholder="Ex: BTP, Immobilier..." />
          </div>
          <div>
            <label style={labelStyle}>Statut</label>
            <select style={inputStyle} value={form.statut} onChange={e => set('statut', e.target.value)}>
              {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

        </div>

        <div style={{ marginTop: '10px', marginBottom: '1.25rem' }}>
          <label style={labelStyle}>Notes</label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={4}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            placeholder="Informations complémentaires..."
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: 'transparent', border: '0.5px solid #2a2a2e', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', color: '#888', cursor: 'pointer' }}>
            Annuler
          </button>
          <button onClick={handleSave} disabled={saving} style={{ background: '#ff6b2b', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', color: '#fff', cursor: 'pointer', fontWeight: 500, opacity: saving ? .7 : 1 }}>
            {saving ? 'Enregistrement...' : client ? 'Modifier' : 'Créer le client'}
          </button>
        </div>

      </div>
    </div>
  )
}