'use client'

import { useState, useEffect, useRef } from 'react'
import { Document, Ligne } from '@/hooks/useFinances'
import { supabase } from '@/lib/supabase'

type Props = {
  type: 'factures' | 'devis'
  doc?: Document | null
  onClose: () => void
  onSave: (data: Omit<Document, 'id' | 'created_at'>) => Promise<void>
}

const inputStyle = {
  background: '#111', border: '0.5px solid #2a2a2e', borderRadius: '8px',
  padding: '8px 12px', fontSize: '13px', color: '#ccc', width: '100%', outline: 'none',
}
const labelStyle = { fontSize: '12px', color: '#555', marginBottom: '5px', display: 'block' }

const STATUTS_FACTURE = [
  { value: 'pending', label: 'En attente' },
  { value: 'paid',    label: 'Payée' },
  { value: 'late',    label: 'En retard' },
]
const STATUTS_DEVIS = [
  { value: 'draft',   label: 'Brouillon' },
  { value: 'pending', label: 'Envoyé' },
  { value: 'paid',    label: 'Accepté' },
]

export default function FinanceModal({ type, doc, onClose, onSave }: Props) {
  const [form, setForm] = useState({
    numero: '', client: '', projet: '', adresse_client: '',
    date_emission: '', date_echeance: '',
    montant: 0, statut: type === 'devis' ? 'draft' : 'pending',
    lignes: [] as Ligne[],
  })
  const [saving, setSaving]         = useState(false)
  const [clients, setClients]       = useState<any[]>([])
  const [projets, setProjets]       = useState<string[]>([])
  const [clientSugg, setClientSugg] = useState<string[]>([])
  const [projetSugg, setProjetSugg] = useState<string[]>([])
  const [showClient, setShowClient] = useState(false)
  const [showProjet, setShowProjet] = useState(false)
  const clientRef                    = useRef<HTMLDivElement>(null)
  const projetRef                    = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetch() {
      const [{ data: c }, { data: p }] = await Promise.all([
        supabase.from('clients').select('*').order('nom'),
        supabase.from('projets').select('nom').order('nom'),
      ])
      if (c) setClients(c)
      if (p) setProjets(p.map((x: any) => x.nom))
    }
    fetch()
    if (!doc) {
      const prefix = type === 'factures' ? 'F' : 'D'
      const year   = new Date().getFullYear()
      const rand   = Math.floor(Math.random() * 900 + 100)
      setForm(prev => ({ ...prev, numero: `${prefix}-${year}-${rand}` }))
    }
  }, [])

  useEffect(() => {
    if (doc) setForm({
      numero:         doc.numero,
      client:         doc.client,
      projet:         doc.projet,
      adresse_client: doc.adresse_client || '',
      date_emission:  doc.date_emission,
      date_echeance:  doc.date_echeance,
      montant:        doc.montant,
      statut:         doc.statut,
      lignes:         doc.lignes,
    })
  }, [doc])

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

  async function selectClient(name: string) {
    set('client', name)
    setShowClient(false)
    const found = clients.find(c => c.nom === name)
    if (found) {
      const adresse = [found.contact, found.adresse].filter(Boolean).join('\n')
      set('adresse_client', adresse)
    }
  }

  function handleClientInput(val: string) {
    set('client', val)
    const f = clients.filter(c => c.nom.toLowerCase().includes(val.toLowerCase()))
    setClientSugg(f.map(c => c.nom))
    setShowClient(f.length > 0 && val.length > 0)
  }

  function handleProjetInput(val: string) {
    set('projet', val)
    const f = projets.filter(p => p.toLowerCase().includes(val.toLowerCase()))
    setProjetSugg(f)
    setShowProjet(f.length > 0 && val.length > 0)
  }

  function addLigne() {
    set('lignes', [...form.lignes, { desc: '', soustitems: [], qte: 1, pu: 0 }])
  }

  function updateLigne(i: number, key: keyof Ligne, value: any) {
    const lignes = form.lignes.map((l, idx) => idx !== i ? l : { ...l, [key]: value })
    const montant = lignes.reduce((s, l) => s + l.qte * l.pu, 0)
    setForm(prev => ({ ...prev, lignes, montant }))
  }

  function removeLigne(i: number) {
    const lignes = form.lignes.filter((_, idx) => idx !== i)
    const montant = lignes.reduce((s, l) => s + l.qte * l.pu, 0)
    setForm(prev => ({ ...prev, lignes, montant }))
  }

  function addSousItem(ligneIdx: number) {
    const lignes = form.lignes.map((l, i) =>
      i !== ligneIdx ? l : { ...l, soustitems: [...(l.soustitems || []), ''] }
    )
    set('lignes', lignes)
  }

  function updateSousItem(ligneIdx: number, itemIdx: number, val: string) {
    const lignes = form.lignes.map((l, i) =>
      i !== ligneIdx ? l : {
        ...l, soustitems: (l.soustitems || []).map((s, j) => j === itemIdx ? val : s)
      }
    )
    set('lignes', lignes)
  }

  function removeSousItem(ligneIdx: number, itemIdx: number) {
    const lignes = form.lignes.map((l, i) =>
      i !== ligneIdx ? l : {
        ...l, soustitems: (l.soustitems || []).filter((_, j) => j !== itemIdx)
      }
    )
    set('lignes', lignes)
  }

  async function handleSave() {
    if (!form.numero.trim()) return
    setSaving(true)
    await onSave(form as any)
    setSaving(false)
    onClose()
  }

  const Suggestions = ({ items, onSelect }: { items: string[]; onSelect: (v: string) => void }) => (
    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1e1e22', border: '0.5px solid #2a2a2e', borderRadius: '8px', zIndex: 100, marginTop: '4px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
      {items.map(name => (
        <div key={name} onMouseDown={() => onSelect(name)}
          style={{ padding: '9px 12px', fontSize: '13px', color: '#ccc', cursor: 'pointer', borderBottom: '0.5px solid #2a2a2e' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#2a2a2e')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          {name}
        </div>
      ))}
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#161618', border: '0.5px solid #2a2a2e', borderRadius: '16px', padding: '1.5rem', width: '620px', maxHeight: '90vh', overflowY: 'auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '16px', fontWeight: 500, color: '#fff' }}>
            {doc ? 'Modifier' : 'Nouveau'} {type === 'factures' ? 'une facture' : 'un devis'}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#555', fontSize: '20px', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', marginBottom: '10px' }}>

          <div>
            <label style={labelStyle}>Numéro</label>
            <input style={inputStyle} value={form.numero} onChange={e => set('numero', e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Statut</label>
            <select style={inputStyle} value={form.statut} onChange={e => set('statut', e.target.value)}>
              {(type === 'factures' ? STATUTS_FACTURE : STATUTS_DEVIS).map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div style={{ position: 'relative' }} ref={clientRef}>
            <label style={labelStyle}>Client</label>
            <input style={inputStyle} value={form.client} onChange={e => handleClientInput(e.target.value)} placeholder="Rechercher..." autoComplete="off" />
            {showClient && <Suggestions items={clientSugg} onSelect={selectClient} />}
          </div>

          <div style={{ position: 'relative' }} ref={projetRef}>
            <label style={labelStyle}>Projet / Objet</label>
            <input style={inputStyle} value={form.projet} onChange={e => handleProjetInput(e.target.value)} placeholder="Rechercher ou saisir..." autoComplete="off" />
            {showProjet && <Suggestions items={projetSugg} onSelect={v => { set('projet', v); setShowProjet(false) }} />}
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Adresse complète du client</label>
            <textarea value={form.adresse_client} onChange={e => set('adresse_client', e.target.value)} rows={3}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
              placeholder={`Nom du contact\nAdresse\nVille`} />
          </div>

          <div>
            <label style={labelStyle}>Date d'émission</label>
            <input style={inputStyle} value={form.date_emission} onChange={e => set('date_emission', e.target.value)} placeholder="Ex: 01/04/2026" />
          </div>
          <div>
            <label style={labelStyle}>Date d'échéance</label>
            <input style={inputStyle} value={form.date_echeance} onChange={e => set('date_echeance', e.target.value)} placeholder="Ex: 01/05/2026" />
          </div>

        </div>

        {/* Lignes */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.5rem' }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Prestations</label>
            <button onClick={addLigne} style={{ background: 'transparent', border: '0.5px solid #2a2a2e', borderRadius: '6px', padding: '3px 10px', fontSize: '12px', color: '#888', cursor: 'pointer' }}>+ Prestation</button>
          </div>

          {form.lignes.length === 0 && (
            <div style={{ fontSize: '12px', color: '#444', padding: '.5rem 0' }}>Cliquez sur "+ Prestation" pour ajouter une ligne.</div>
          )}

          {form.lignes.map((l, i) => (
            <div key={i} style={{ background: '#111', border: '0.5px solid #2a2a2e', borderRadius: '10px', padding: '.875rem', marginBottom: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 30px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                <input value={l.desc} onChange={e => updateLigne(i, 'desc', e.target.value)} placeholder="Titre de la prestation" style={inputStyle} />
                <input type="number" value={l.pu} onChange={e => updateLigne(i, 'pu', parseInt(e.target.value) || 0)} placeholder="Prix €" style={{ ...inputStyle, textAlign: 'right' }} />
                <button onClick={() => removeLigne(i)} style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>×</button>
              </div>
              <div style={{ marginLeft: '8px' }}>
                {(l.soustitems || []).map((s, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                    <span style={{ color: '#555', fontSize: '12px', flexShrink: 0 }}>•</span>
                    <input value={s} onChange={e => updateSousItem(i, j, e.target.value)} placeholder="Détail..." style={{ ...inputStyle, fontSize: '12px', padding: '5px 10px', flex: 1 }} />
                    <button onClick={() => removeSousItem(i, j)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '14px' }}>×</button>
                  </div>
                ))}
                <button onClick={() => addSousItem(i)} style={{ background: 'transparent', border: '0.5px dashed #2a2a2e', borderRadius: '6px', padding: '3px 10px', fontSize: '11px', color: '#444', cursor: 'pointer', marginTop: '2px' }}>
                  + Ajouter un détail
                </button>
              </div>
            </div>
          ))}

          {form.lignes.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '.75rem', paddingTop: '.75rem', borderTop: '0.5px solid #1e1e22' }}>
              <span style={{ fontSize: '13px', color: '#555' }}>Total</span>
              <span style={{ fontSize: '15px', fontWeight: 500, color: '#4ade80' }}>
                {form.montant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
              </span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: 'transparent', border: '0.5px solid #2a2a2e', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', color: '#888', cursor: 'pointer' }}>Annuler</button>
          <button onClick={handleSave} disabled={saving} style={{ background: '#ff6b2b', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', color: '#fff', cursor: 'pointer', fontWeight: 500, opacity: saving ? .7 : 1 }}>
            {saving ? 'Enregistrement...' : doc ? 'Modifier' : type === 'factures' ? 'Créer la facture' : 'Créer le devis'}
          </button>
        </div>
      </div>
    </div>
  )
}