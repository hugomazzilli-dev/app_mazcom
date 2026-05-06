'use client'

import { useState, useEffect } from 'react'
import { useClients, Client } from '@/hooks/useClients'
import ClientModal from '@/components/ClientModal'
import { supabase } from '@/lib/supabase'
import { useIsMobile } from '@/hooks/useIsMobile'

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  actif:      { label: 'Client actif',   color: '#4ade80', bg: '#0d1f0d' },
  prospect:   { label: 'Prospect',       color: '#60a5fa', bg: '#0d1520' },
  relance:    { label: 'À relancer',     color: '#fb923c', bg: '#1a1008' },
  devis:      { label: 'Devis envoyé',   color: '#fbbf24', bg: '#15100d' },
  partenaire: { label: 'Partenaire',     color: '#a78bfa', bg: '#150d20' },
}
const COLORS = ['#1D9E75','#378ADD','#ff6b2b','#a78bfa','#fbbf24','#f87171','#4ade80','#60a5fa']
function initials(name: string) { return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() }

export default function Clients() {
  const { clients, loading, addClient, updateClient, deleteClient } = useClients()
  const isMobile = useIsMobile()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('tous')
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [caByClient, setCaByClient] = useState<Record<string, number>>({})

  useEffect(() => {
    async function fetchCA() {
      const { data } = await supabase.from('factures').select('client, montant, statut').eq('statut', 'paid')
      if (!data) return
      const ca: Record<string, number> = {}
      data.forEach((f: any) => { if (f.client) ca[f.client] = (ca[f.client] || 0) + f.montant })
      setCaByClient(ca)
    }
    fetchCA()
  }, [clients])

  const selected = clients.find(c => c.id === selectedId) || null
  const filtered = clients.filter(c => {
    const mq = !search || c.nom.toLowerCase().includes(search.toLowerCase())
    const mf = filter === 'tous' || c.statut === filter
    return mq && mf
  })

  async function handleSave(data: Omit<Client, 'id' | 'created_at'>) {
    if (modal === 'edit' && selected) { await updateClient(selected.id, data) }
    else { const { data: n } = await addClient(data); if (n) { setSelectedId(n.id); if (isMobile) setShowDetail(true) } }
  }

  async function handleDelete() {
    if (!selected) return
    setDeleting(true)
    await deleteClient(selected.id)
    setSelectedId(null); setShowDetail(false); setDeleting(false)
  }

  function selectClient(id: string) {
    setSelectedId(id)
    if (isMobile) setShowDetail(true)
  }

  const filters = [
    { key: 'tous', label: 'Tous' }, { key: 'actif', label: 'Actifs' },
    { key: 'prospect', label: 'Prospects' }, { key: 'relance', label: 'Relance' },
  ]

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)', fontSize: '14px' }}>Chargement...</div>

  const DetailView = () => {
    if (!selected) return null
    const s = STATUS[selected.statut] || STATUS.prospect
    const col = COLORS[clients.indexOf(selected) % COLORS.length]
    const ca = caByClient[selected.nom] || 0
    return (
      <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', background: 'var(--bg-primary)' }}>
        {isMobile && (
          <button onClick={() => setShowDetail(false)} style={{ background: 'transparent', border: 'none', color: '#ff6b2b', fontSize: '14px', cursor: 'pointer', marginBottom: '1rem', padding: 0 }}>← Retour</button>
        )}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: col + '22', color: col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 500 }}>{initials(selected.nom)}</div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text-primary)' }}>{selected.nom}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{selected.secteur || '—'}</div>
              <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: 500, marginTop: '5px', display: 'inline-block', background: s.bg, color: s.color }}>{s.label}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => setModal('edit')} style={{ background: 'var(--card-bg)', border: '0.5px solid var(--border-subtle)', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>Modifier</button>
            <button onClick={handleDelete} disabled={deleting} style={{ background: '#1a0a0a', border: '0.5px solid #f8717133', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', color: '#f87171', cursor: 'pointer' }}>{deleting ? '...' : 'Suppr.'}</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '8px' }}>
          {[
            { label: 'Contact', value: selected.contact || '—' },
            { label: 'Téléphone', value: selected.telephone || '—' },
            { label: 'Email', value: selected.email || '—' },
            { label: 'Adresse', value: selected.adresse || '—' },
            { label: 'CA généré', value: ca > 0 ? ca.toLocaleString('fr-FR') + ' €' : '—', green: ca > 0 },
          ].map((info, i) => (
            <div key={i} style={{ background: 'var(--card-bg)', border: '0.5px solid var(--border-subtle)', borderRadius: '8px', padding: '.625rem .75rem' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>{info.label}</div>
              <div style={{ fontSize: '13px', color: (info as any).green ? '#4ade80' : 'var(--text-secondary)' }}>{info.value}</div>
            </div>
          ))}
        </div>
        {selected.notes && (
          <div style={{ background: 'var(--card-bg)', border: '0.5px solid var(--border-subtle)', borderRadius: '8px', padding: '.75rem', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '8px' }}>{selected.notes}</div>
        )}
      </div>
    )
  }

  return (
    <>
      {modal && <ClientModal client={modal === 'edit' ? selected : null} onClose={() => setModal(null)} onSave={handleSave} />}

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

        {/* Liste — cachée sur mobile si détail ouvert */}
        {(!isMobile || !showDetail) && (
          <div style={{ width: isMobile ? '100%' : '260px', borderRight: isMobile ? 'none' : '0.5px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ padding: '1rem', borderBottom: '0.5px solid var(--border)', background: 'var(--card-bg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
                <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>Clients <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>({clients.length})</span></div>
                <button onClick={() => setModal('add')} style={{ background: '#ff6b2b', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>+ Nouveau</button>
              </div>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ background: 'var(--input-bg)', border: '0.5px solid var(--border-subtle)', borderRadius: '8px', padding: '7px 10px', fontSize: '13px', color: 'var(--text-primary)', width: '100%', outline: 'none', marginBottom: '.5rem' }} />
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {filters.map(f => (
                  <button key={f.key} onClick={() => setFilter(f.key)} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', cursor: 'pointer', border: '0.5px solid', borderColor: filter === f.key ? '#ff6b2b55' : 'var(--border-subtle)', background: filter === f.key ? '#1a1008' : 'transparent', color: filter === f.key ? '#ff6b2b' : 'var(--text-muted)' }}>{f.label}</button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '.5rem', background: 'var(--bg-primary)' }}>
              {filtered.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-faint)', fontSize: '13px' }}>Aucun client</div>}
              {filtered.map((c, i) => {
                const st = STATUS[c.statut] || STATUS.prospect
                const clr = COLORS[i % COLORS.length]
                const ca = caByClient[c.nom] || 0
                return (
                  <div key={c.id} onClick={() => selectClient(c.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '.625rem .75rem', borderRadius: '8px', cursor: 'pointer', marginBottom: '2px', background: c.id === selectedId && !isMobile ? '#1a1008' : 'transparent', border: '0.5px solid', borderColor: c.id === selectedId && !isMobile ? '#ff6b2b33' : 'transparent' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: clr + '22', color: clr, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 500, flexShrink: 0 }}>{initials(c.nom)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nom}</div>
                      <div style={{ fontSize: '11px', color: ca > 0 ? '#4ade80' : 'var(--text-muted)', marginTop: '1px' }}>{ca > 0 ? ca.toLocaleString('fr-FR') + ' €' : c.secteur || '—'}</div>
                    </div>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: st.color, flexShrink: 0 }} />
                    {isMobile && <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>›</span>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Détail */}
        {(!isMobile || showDetail) && (
          selected ? <DetailView /> : (
            !isMobile && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', background: 'var(--bg-primary)' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-faint)' }}>Sélectionnez un client</div>
                <button onClick={() => setModal('add')} style={{ background: '#ff6b2b', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>+ Nouveau client</button>
              </div>
            )
          )
        )}
      </div>
    </>
  )
}