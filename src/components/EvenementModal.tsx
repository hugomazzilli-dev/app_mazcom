'use client'

import { useState, useEffect } from 'react'
import { Evenement, CheckItem } from '@/hooks/useEvenements'

type Props = {
  evenement?: Evenement | null
  defaultDate?: { jour: number; mois: number; annee: number }
  onClose: () => void
  onSave: (data: Omit<Evenement, 'id' | 'created_at'>) => Promise<void>
}

const TYPES = [
  { value: 'drone',     label: 'Drone' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'interview', label: 'Interview' },
  { value: 'deadline',  label: 'Deadline' },
  { value: 'livraison', label: 'Livraison' },
  { value: 'relance',   label: 'Relance' },
  { value: 'rdv',       label: 'Rendez-vous' },
  { value: 'autre',     label: 'Autre' },
]

const inputStyle = {
  background: '#111', border: '0.5px solid #2a2a2e', borderRadius: '8px',
  padding: '8px 12px', fontSize: '13px', color: '#ccc', width: '100%', outline: 'none',
}
const labelStyle = { fontSize: '12px', color: '#555', marginBottom: '5px', display: 'block' }

export default function EvenementModal({ evenement, defaultDate, onClose, onSave }: Props) {
  const today = new Date()
  const [form, setForm] = useState({
    titre: '', type: 'tournage', heure: '', lieu: '', contact: '',
    materiel: '', notes: '', checks: [] as CheckItem[],
    date_jour:  defaultDate?.jour  || today.getDate(),
    date_mois:  defaultDate?.mois  || today.getMonth() + 1,
    date_annee: defaultDate?.annee || today.getFullYear(),
  })
  const [saving, setSaving] = useState(false)
  const [newCheck, setNewCheck] = useState('')

  useEffect(() => {
    if (evenement) setForm({
      titre:      evenement.titre,
      type:       evenement.type,
      heure:      evenement.heure,
      lieu:       evenement.lieu,
      contact:    evenement.contact,
      materiel:   evenement.materiel,
      notes:      evenement.notes,
      checks:     evenement.checks,
      date_jour:  evenement.date_jour,
      date_mois:  evenement.date_mois,
      date_annee: evenement.date_annee,
    })
  }, [evenement])

  function set(key: string, value: any) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function addCheck() {
    if (!newCheck.trim()) return
    set('checks', [...form.checks, { label: newCheck.trim(), done: false }])
    setNewCheck('')
  }

  function removeCheck(i: number) {
    set('checks', form.checks.filter((_, idx) => idx !== i))
  }

  async function handleSave() {
    if (!form.titre.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#161618', border: '0.5px solid #2a2a2e', borderRadius: '16px', padding: '1.5rem', width: '540px', maxHeight: '90vh', overflowY: 'auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '16px', fontWeight: 500, color: '#fff' }}>{evenement ? 'Modifier l\'événement' : 'Nouvel événement'}</div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#555', fontSize: '20px', cursor: 'pointer' }}>×</button>
        </div>

        {/* Titre */}
        <div style={{ marginBottom: '10px' }}>
          <label style={labelStyle}>Titre *</label>
          <input style={inputStyle} value={form.titre} onChange={e => set('titre', e.target.value)} placeholder="Ex: Tournage Artisan Roux" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>

          {/* Type */}
          <div>
            <label style={labelStyle}>Type</label>
            <select style={inputStyle} value={form.type} onChange={e => set('type', e.target.value)}>
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Heure */}
          <div>
            <label style={labelStyle}>Heure</label>
            <input style={inputStyle} value={form.heure} onChange={e => set('heure', e.target.value)} placeholder="Ex: 09h00" />
          </div>

          {/* Date */}
          <div>
            <label style={labelStyle}>Jour</label>
            <input style={inputStyle} type="number" min={1} max={31} value={form.date_jour} onChange={e => set('date_jour', parseInt(e.target.value) || 1)} />
          </div>
          <div>
            <label style={labelStyle}>Mois</label>
            <input style={inputStyle} type="number" min={1} max={12} value={form.date_mois} onChange={e => set('date_mois', parseInt(e.target.value) || 1)} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Année</label>
            <input style={inputStyle} type="number" value={form.date_annee} onChange={e => set('date_annee', parseInt(e.target.value) || 2026)} />
          </div>

          {/* Lieu */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Lieu</label>
            <input style={inputStyle} value={form.lieu} onChange={e => set('lieu', e.target.value)} placeholder="Ex: Chantier Lyon Nord" />
          </div>

          {/* Contact */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Contact sur place</label>
            <input style={inputStyle} value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="Ex: Julien Roux — 06 55 44 33 22" />
          </div>

          {/* Matériel */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Matériel nécessaire</label>
            <input style={inputStyle} value={form.materiel} onChange={e => set('materiel', e.target.value)} placeholder="Ex: Drone DJI Air 3, batterie x3" />
          </div>

        </div>

        {/* Notes */}
        <div style={{ margin: '10px 0' }}>
          <label style={labelStyle}>Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            placeholder="Informations complémentaires..." />
        </div>

        {/* Checklist */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={labelStyle}>Checklist préparation</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '6px' }}>
            {form.checks.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#111', borderRadius: '6px', padding: '6px 10px' }}>
                <span style={{ flex: 1, fontSize: '12px', color: '#aaa' }}>{c.label}</span>
                <button onClick={() => removeCheck(i)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '14px' }}>×</button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              value={newCheck}
              onChange={e => setNewCheck(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCheck()}
              placeholder="Ex: Batterie chargée..."
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={addCheck} style={{ background: '#ff6b2b', border: 'none', borderRadius: '8px', padding: '0 14px', fontSize: '13px', color: '#fff', cursor: 'pointer' }}>+</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: 'transparent', border: '0.5px solid #2a2a2e', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', color: '#888', cursor: 'pointer' }}>Annuler</button>
          <button onClick={handleSave} disabled={saving} style={{ background: '#ff6b2b', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', color: '#fff', cursor: 'pointer', fontWeight: 500, opacity: saving ? .7 : 1 }}>
            {saving ? 'Enregistrement...' : evenement ? 'Modifier' : 'Créer l\'événement'}
          </button>
        </div>
      </div>
    </div>
  )
}