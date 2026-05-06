'use client'

import { useState, useEffect, useRef } from 'react'
import { Project } from '@/hooks/useProjects'
import { supabase } from '@/lib/supabase'

type Props = {
  project?: Project | null
  onClose: () => void
  onSave: (data: Omit<Project, 'id' | 'created_at'>) => Promise<void>
}

const TYPES     = ['drone','corporate','interview','chantier','rs','immo','montage']
const PRIORITES = ['urgent','haute','normale','faible']
const COLS      = ['nouveau','prep','tournage','realise','montage','validation','livre','facture']

const inputStyle = {
  background: '#111', border: '0.5px solid #2a2a2e', borderRadius: '8px',
  padding: '8px 12px', fontSize: '13px', color: '#ccc', width: '100%', outline: 'none',
}
const labelStyle = { fontSize: '12px', color: '#555', marginBottom: '5px', display: 'block' }

export default function ProjetModal({ project, onClose, onSave }: Props) {
  const [form, setForm] = useState({
    nom: '', client_nom: '', type: 'corporate', col: 'nouveau',
    budget: 0, date_deadline: '', priorite: 'normale', progression: 0,
    checks: Array(12).fill(false) as boolean[], notes: '',
  })
  const [saving, setSaving]           = useState(false)
  const [clients, setClients]         = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSugg, setShowSugg]       = useState(false)
  const suggRef                        = useRef<HTMLDivElement>(null)

  // Charger les noms de clients depuis Supabase
  useEffect(() => {
    async function fetchClients() {
      const { data } = await supabase.from('clients').select('nom').order('nom')
      if (data) setClients(data.map((c: { nom: string }) => c.nom))
    }
    fetchClients()
  }, [])

  useEffect(() => {
    if (project) setForm({
      nom: project.nom, client_nom: project.client_nom, type: project.type,
      col: project.col, budget: project.budget, date_deadline: project.date_deadline,
      priorite: project.priorite, progression: project.progression,
      checks: project.checks, notes: project.notes,
    })
  }, [project])

  // Fermer suggestions si clic dehors
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (suggRef.current && !suggRef.current.contains(e.target as Node)) {
        setShowSugg(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function set(key: string, value: string | number | boolean[]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleClientInput(val: string) {
    set('client_nom', val)
    if (val.trim().length === 0) {
      setSuggestions([])
      setShowSugg(false)
      return
    }
    const filtered = clients.filter(c =>
      c.toLowerCase().includes(val.toLowerCase())
    )
    setSuggestions(filtered)
    setShowSugg(filtered.length > 0)
  }

  function selectClient(name: string) {
    set('client_nom', name)
    setSuggestions([])
    setShowSugg(false)
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
          <div style={{ fontSize: '16px', fontWeight: 500, color: '#fff' }}>{project ? 'Modifier le projet' : 'Nouveau projet'}</div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#555', fontSize: '20px', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>

          {/* Nom projet */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Nom du projet *</label>
            <input style={inputStyle} value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="Ex: Vidéo drone chantier" />
          </div>

          {/* Client avec autocomplétion */}
          <div style={{ position: 'relative' }} ref={suggRef}>
            <label style={labelStyle}>Client</label>
            <input
              style={inputStyle}
              value={form.client_nom}
              onChange={e => handleClientInput(e.target.value)}
              onFocus={() => form.client_nom && setShowSugg(suggestions.length > 0)}
              placeholder="Rechercher un client..."
              autoComplete="off"
            />
            {showSugg && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1e1e22', border: '0.5px solid #2a2a2e', borderRadius: '8px', zIndex: 100, marginTop: '4px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                {suggestions.map(name => (
                  <div
                    key={name}
                    onMouseDown={() => selectClient(name)}
                    style={{ padding: '9px 12px', fontSize: '13px', color: '#ccc', cursor: 'pointer', borderBottom: '0.5px solid #2a2a2e' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#2a2a2e')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Budget */}
          <div>
            <label style={labelStyle}>Budget (€)</label>
            <input style={inputStyle} type="number" value={form.budget} onChange={e => set('budget', parseInt(e.target.value) || 0)} />
          </div>

          {/* Type */}
          <div>
            <label style={labelStyle}>Type</label>
            <select style={inputStyle} value={form.type} onChange={e => set('type', e.target.value)}>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Priorité */}
          <div>
            <label style={labelStyle}>Priorité</label>
            <select style={inputStyle} value={form.priorite} onChange={e => set('priorite', e.target.value)}>
              {PRIORITES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Colonne Kanban */}
          <div>
            <label style={labelStyle}>Colonne Kanban</label>
            <select style={inputStyle} value={form.col} onChange={e => set('col', e.target.value)}>
              {COLS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Deadline */}
          <div>
            <label style={labelStyle}>Deadline</label>
            <input style={inputStyle} value={form.date_deadline} onChange={e => set('date_deadline', e.target.value)} placeholder="Ex: 15 mai 2026" />
          </div>

        </div>

        {/* Notes */}
        <div style={{ marginTop: '10px', marginBottom: '1.25rem' }}>
          <label style={labelStyle}>Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} placeholder="Informations complémentaires..." />
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: 'transparent', border: '0.5px solid #2a2a2e', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', color: '#888', cursor: 'pointer' }}>Annuler</button>
          <button onClick={handleSave} disabled={saving} style={{ background: '#ff6b2b', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', color: '#fff', cursor: 'pointer', fontWeight: 500, opacity: saving ? .7 : 1 }}>
            {saving ? 'Enregistrement...' : project ? 'Modifier' : 'Créer le projet'}
          </button>
        </div>

      </div>
    </div>
  )
}