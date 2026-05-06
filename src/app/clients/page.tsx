'use client'

import { useState, useEffect } from 'react'
import { useClients, Client } from '@/hooks/useClients'
import ClientModal from '@/components/ClientModal'
import { supabase } from '@/lib/supabase'

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  actif:      { label: 'Client actif',    color: '#4ade80', bg: '#0d1f0d' },
  prospect:   { label: 'Prospect',        color: '#60a5fa', bg: '#0d1520' },
  relance:    { label: 'À relancer',      color: '#fb923c', bg: '#1a1008' },
  devis:      { label: 'Devis envoyé',    color: '#fbbf24', bg: '#15100d' },
  dormant:    { label: 'Client dormant',  color: '#888',    bg: '#1a1a1a' },
  partenaire: { label: 'Partenaire',      color: '#a78bfa', bg: '#150d20' },
}

const COLORS = ['#1D9E75','#378ADD','#ff6b2b','#a78bfa','#fbbf24','#f87171','#4ade80','#60a5fa']

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
}

export default function Clients() {
  const { clients, loading, addClient, updateClient, deleteClient } = useClients()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch]         = useState('')
  const [filter, setFilter]         = useState('tous')
  const [modal, setModal]           = useState<'add' | 'edit' | null>(null)
  const [deleting, setDeleting]     = useState(false)
  const [caByClient, setCaByClient] = useState<Record<string, number>>({})

  // Charger le CA réel depuis les factures payées
  useEffect(() => {
    async function fetchCA() {
      const { data } = await supabase
        .from('factures')
        .select('client, montant, statut')
        .eq('statut', 'paid')
      if (!data) return
      const ca: Record<string, number> = {}
      data.forEach((f: any) => {
        if (f.client) ca[f.client] = (ca[f.client] || 0) + f.montant
      })
      setCaByClient(ca)
    }
    fetchCA()
  }, [clients])

  const selected = clients.find(c => c.id === selectedId) || clients[0] || null

  const filtered = clients.filter(c => {
    const mq = !search || c.nom.toLowerCase().includes(search.toLowerCase()) || c.secteur.toLowerCase().includes(search.toLowerCase())
    const mf = filter === 'tous' || c.statut === filter
    return mq && mf
  })

  async function handleSave(data: Omit<Client, 'id' | 'created_at'>) {
    if (modal === 'edit' && selected) {
      await updateClient(selected.id, data)
    } else {
      const { data: newClient } = await addClient(data)
      if (newClient) setSelectedId(newClient.id)
    }
  }

  async function handleDelete() {
    if (!selected) return
    setDeleting(true)
    await deleteClient(selected.id)
    setSelectedId(null)
    setDeleting(false)
  }

  const filters = [
    { key: 'tous',     label: 'Tous' },
    { key: 'actif',    label: 'Actifs' },
    { key: 'devis', label: 'Devis' },
    { key: 'relance',  label: 'À relancer' },
    { key: 'dormant',  label: 'Dormant' },
  ]

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)', fontSize: '14px' }}>
      Chargement des clients...
    </div>
  )

  return (
    <>
      {modal && (
        <ClientModal
          client={modal === 'edit' ? selected : null}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

        {/* Liste */}
        <div style={{ width: '260px', borderRight: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '1rem', borderBottom: '0.5px solid var(--border)', background: 'var(--card-bg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
              <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>
                Clients <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 400 }}>({clients.length})</span>
              </div>
              <button onClick={() => setModal('add')} style={{ background: '#ff6b2b', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>+ Nouveau</button>
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
              style={{ background: 'var(--input-bg)', border: '0.5px solid var(--border-subtle)', borderRadius: '8px', padding: '7px 10px', fontSize: '13px', color: 'var(--text-primary)', width: '100%', outline: 'none', marginBottom: '.5rem' }} />
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {filters.map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', cursor: 'pointer', border: '0.5px solid', borderColor: filter === f.key ? '#ff6b2b55' : 'var(--border-subtle)', background: filter === f.key ? '#1a1008' : 'transparent', color: filter === f.key ? '#ff6b2b' : 'var(--text-muted)' }}>{f.label}</button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '.5rem', background: 'var(--bg-primary)' }}>
            {filtered.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-faint)', fontSize: '13px' }}>
                {search ? 'Aucun résultat' : 'Aucun client — créez-en un !'}
              </div>
            )}
            {filtered.map((c, i) => {
              const st  = STATUS[c.statut] || STATUS.prospect
              const clr = COLORS[i % COLORS.length]
              const ca  = caByClient[c.nom] || 0
              return (
                <div key={c.id} onClick={() => setSelectedId(c.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '.625rem .75rem', borderRadius: '8px', cursor: 'pointer', marginBottom: '2px', background: c.id === selectedId ? '#1a1008' : 'transparent', border: '0.5px solid', borderColor: c.id === selectedId ? '#ff6b2b33' : 'transparent' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: clr + '22', color: clr, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 500, flexShrink: 0 }}>
                    {initials(c.nom)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nom}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                      {ca > 0 ? <span style={{ color: '#4ade80' }}>{ca.toLocaleString('fr-FR')} €</span> : c.secteur || '—'}
                    </div>
                  </div>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: st.color, flexShrink: 0 }} />
                </div>
              )
            })}
          </div>
        </div>

        {/* Détail */}
        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', background: 'var(--bg-primary)' }}>
          {!selected ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' }}>
              <div style={{ fontSize: '14px', color: 'var(--text-faint)' }}>Sélectionnez un client ou créez-en un</div>
              <button onClick={() => setModal('add')} style={{ background: '#ff6b2b', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>+ Nouveau client</button>
            </div>
          ) : (() => {
            const s   = STATUS[selected.statut] || STATUS.prospect
            const col = COLORS[clients.indexOf(selected) % COLORS.length]
            const ca  = caByClient[selected.nom] || 0

            // Factures liées à ce client
            return (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: col + '22', color: col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 500 }}>
                      {initials(selected.nom)}
                    </div>
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: 500, color: 'var(--text-primary)' }}>{selected.nom}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '3px' }}>{selected.secteur || '—'} · {selected.contact || '—'}</div>
                      <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: 500, marginTop: '6px', display: 'inline-block', background: s.bg, color: s.color }}>{s.label}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '7px' }}>
                    <button onClick={() => setModal('edit')} style={{ background: 'var(--card-bg)', border: '0.5px solid var(--border-subtle)', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>Modifier</button>
                    <button onClick={handleDelete} disabled={deleting} style={{ background: '#1a0a0a', border: '0.5px solid #f8717133', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', color: '#f87171', cursor: 'pointer', opacity: deleting ? .6 : 1 }}>
                      {deleting ? '...' : 'Supprimer'}
                    </button>
                  </div>
                </div>

                {/* Infos */}
                <div style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 500, marginBottom: '.625rem' }}>Informations</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '1.25rem' }}>
                  {[
                    { label: 'Contact',   value: selected.contact   || '—' },
                    { label: 'Secteur',   value: selected.secteur   || '—' },
                    { label: 'Téléphone', value: selected.telephone || '—' },
                    { label: 'Email',     value: selected.email     || '—' },
                    { label: 'Adresse',   value: selected.adresse   || '—' },
                    { label: 'CA généré (factures payées)', value: ca > 0 ? ca.toLocaleString('fr-FR') + ' €' : '—', green: ca > 0 },
                  ].map((info, i) => (
                    <div key={i} style={{ background: 'var(--card-bg)', border: '0.5px solid var(--border-subtle)', borderRadius: '8px', padding: '.625rem .75rem' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>{info.label}</div>
                      <div style={{ fontSize: '13px', color: (info as any).green ? '#4ade80' : 'var(--text-secondary)' }}>{info.value}</div>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                {selected.notes && (
                  <>
                    <div style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 500, marginBottom: '.5rem' }}>Notes</div>
                    <div style={{ background: 'var(--card-bg)', border: '0.5px solid var(--border-subtle)', borderRadius: '8px', padding: '.75rem', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>{selected.notes}</div>
                  </>
                )}

                {/* Date création */}
                <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '1rem' }}>
                  Client créé le {new Date(selected.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </>
            )
          })()}
        </div>
      </div>
    </>
  )
}