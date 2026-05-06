'use client'

import { useState, useEffect, useRef } from 'react'
import { Tache, Subtask } from '@/hooks/useTaches'
import { supabase } from '@/lib/supabase'

type Props = {
  tache?: Tache | null
  onClose: () => void
  onSave: (data: Omit<Tache, 'id' | 'created_at'>) => Promise<void>
}

const PRIORITES = ['urgent', 'haute', 'normale', 'faible']
const STATUTS   = ['à faire', 'en cours', 'en attente', 'terminé']

const inputStyle = {
  background: '#111', border: '0.5px solid #2a2a2e', borderRadius: '8px',
  padding: '8px 12px', fontSize: '13px', color: '#ccc', width: '100%', outline: 'none',
}
const labelStyle = { fontSize: '12px', color: '#555', marginBottom: '5px', display: 'block' }

export default function TacheModal({ tache, onClose, onSave }: Props) {
  const [form, setForm] = useState({
    nom: '', priorite: 'normale', statut: 'à faire',
    projet: '', client: '', deadline: '', notes: '',
    subtasks: [] as Subtask[], done: false,
  })
  const [saving, setSaving]           = useState(false)
  const [clients, setClients]         = useState<string[]>([])
  const [projets, setProjets]         = useState<string[]>([])
  const [clientSugg, setClientSugg]   = useState<string[]>([])
  const [projetSugg, setProjetSugg]   = useState<string[]>([])
  const [showClient, setShowClient]   = useState(false)
  const [showProjet, setShowProjet]   = useState(false)
  const [newSub, setNewSub]           = useState('')
  const clientRef                      = useRef<HTMLDivElement>(null)
  const projetRef                      = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetch() {
      const [{ data: c }, { data: p }] = await Promise.all([
        supabase.from('clients').select('nom').order('nom'),
        supabase.from('projets').select('nom').order('nom'),
      ])
      if (c) setClients(c.map((x: any) => x.nom))
      if (p) setProjets(p.map((x: any) => x.nom))
    }
    fetch()
  }, [])

  useEffect(() => {
    if (tache) setForm({
      nom: tache.nom, priorite: tache.priorite, statut: tache.statut,
      projet: tache.projet, client: tache.client, deadline: tache.deadline,
      notes: tache.notes, subtasks: tache.subtasks, done: tache.done,
    })
  }, [tache])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) setShowClient(false)
      if (projetRef.current && !projetRef.current.contains(e.target as Node)) setShowProjet(false)
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

  function handleProjetInput(val: string) {
    set('projet', val)
    const f = projets.filter(p => p.toLowerCase().includes(val.toLowerCase()))
    setProjetSugg(f); setShowProjet(f.length > 0 && val.length > 0)
  }

  function addSubtask() {
    if (!newSub.trim()) return
    set('subtasks', [...form.subtasks, { label: newSub.trim(), done: false }])
    setNewSub('')
  }

  function removeSubtask(i: number) {
    set('subtasks', form.subtasks.filter((_, idx) => idx !== i))
  }

  async function handleSave() {
    if (!form.nom.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  const Suggestions = ({ items, onSelect }: { items: string[]; onSelect: (v: string) => void }) => (
    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1e1e22', border: '0.5px solid #2a2a2e', borderRadius: '8px', zIndex: 100, marginTop: '4px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
      {items.map(name => (
        <div key={name} onMouseDown={() => onSelect(name)} style={{ padding: '9px 12px', fontSize: '13px', color: '#ccc', cursor: 'pointer', borderBottom: '0.5px solid #2a2a2e' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#2a2a2e')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          {name}
        </div>
      ))}
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#161618', border: '0.5px solid #2a2a2e', borderRadius: '16px', padding: '1.5rem', width: '520px', maxHeight: '85vh', overflowY: 'auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '16px', fontWeight: 500, color: '#fff' }}>{tache ? 'Modifier la tâche' : 'Nouvelle tâche'}</div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#555', fontSize: '20px', cursor: 'pointer' }}>×</button>
        </div>

        {/* Nom */}
        <div style={{ marginBottom: '10px' }}>
          <label style={labelStyle}>Nom de la tâche *</label>
          <input style={inputStyle} value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="Ex: Relancer devis Batim Pro" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>

          {/* Client */}
          <div style={{ position: 'relative' }} ref={clientRef}>
            <label style={labelStyle}>Client</label>
            <input style={inputStyle} value={form.client} onChange={e => handleClientInput(e.target.value)} placeholder="Rechercher..." autoComplete="off" />
            {showClient && <Suggestions items={clientSugg} onSelect={v => { set('client', v); setShowClient(false) }} />}
          </div>

          {/* Projet */}
          <div style={{ position: 'relative' }} ref={projetRef}>
            <label style={labelStyle}>Projet</label>
            <input style={inputStyle} value={form.projet} onChange={e => handleProjetInput(e.target.value)} placeholder="Rechercher..." autoComplete="off" />
            {showProjet && <Suggestions items={projetSugg} onSelect={v => { set('projet', v); setShowProjet(false) }} />}
          </div>

          {/* Priorité */}
          <div>
            <label style={labelStyle}>Priorité</label>
            <select style={inputStyle} value={form.priorite} onChange={e => set('priorite', e.target.value)}>
              {PRIORITES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Statut */}
          <div>
            <label style={labelStyle}>Statut</label>
            <select style={inputStyle} value={form.statut} onChange={e => set('statut', e.target.value)}>
              {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Deadline */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Deadline</label>
            <input style={inputStyle} value={form.deadline} onChange={e => set('deadline', e.target.value)} placeholder="Ex: 8 mai 2026" />
          </div>

        </div>

        {/* Notes */}
        <div style={{ margin: '10px 0' }}>
          <label style={labelStyle}>Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} placeholder="Informations complémentaires..." />
        </div>

        {/* Sous-tâches */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={labelStyle}>Sous-tâches</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '6px' }}>
            {form.subtasks.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#111', borderRadius: '6px', padding: '6px 10px' }}>
                <span style={{ flex: 1, fontSize: '12px', color: '#aaa' }}>{s.label}</span>
                <button onClick={() => removeSubtask(i)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}>×</button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              value={newSub}
              onChange={e => setNewSub(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSubtask()}
              placeholder="Ajouter une sous-tâche..."
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={addSubtask} style={{ background: '#ff6b2b', border: 'none', borderRadius: '8px', padding: '0 14px', fontSize: '13px', color: '#fff', cursor: 'pointer' }}>+</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: 'transparent', border: '0.5px solid #2a2a2e', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', color: '#888', cursor: 'pointer' }}>Annuler</button>
          <button onClick={handleSave} disabled={saving} style={{ background: '#ff6b2b', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', color: '#fff', cursor: 'pointer', fontWeight: 500, opacity: saving ? .7 : 1 }}>
            {saving ? 'Enregistrement...' : tache ? 'Modifier' : 'Créer la tâche'}
          </button>
        </div>

      </div>
    </div>
  )
}