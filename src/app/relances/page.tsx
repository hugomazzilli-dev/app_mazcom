'use client'

import { useState } from 'react'
import { useRelances, Relance, HistItem } from '@/hooks/useRelances'
import RelanceModal from '@/components/RelanceModal'

const CATS: Record<string, { label: string; color: string; bg: string }> = {
  facture: { label: 'Facture impayée',    color: '#f87171', bg: '#1a0a0a' },
  devis:   { label: 'Devis sans réponse', color: '#fb923c', bg: '#1a1008' },
  client:  { label: 'Client inactif',     color: '#a78bfa', bg: '#150d20' },
  suivi:   { label: 'Suivi livraison',    color: '#4ade80', bg: '#0d1f0d' },
}

function urgencyColor(j: number, done: boolean) {
  if (done)    return '#333'
  if (j >= 14) return '#f87171'
  if (j >= 7)  return '#fb923c'
  if (j >= 3)  return '#fbbf24'
  return '#4ade80'
}

function urgencyLabel(j: number) {
  if (j >= 14) return 'Critique'
  if (j >= 7)  return 'Urgente'
  if (j >= 3)  return 'À surveiller'
  return 'Récente'
}

const PIPELINE = [
  { label: 'Prospects chauds', color: '#fb923c', pct: 60 },
  { label: 'Devis ouverts',    color: '#fbbf24', pct: 40 },
  { label: 'Factures dues',    color: '#f87171', pct: 70 },
  { label: 'Taux conversion',  color: '#4ade80', pct: 68 },
]

export default function Relances() {
  const { relances, loading, addRelance, updateRelance, deleteRelance, toggleDone, addHistorique } = useRelances()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter]         = useState('toutes')
  const [search, setSearch]         = useState('')
  const [modal, setModal]           = useState<'add' | 'edit' | null>(null)
  const [addingNote, setAddingNote] = useState(false)
  const [noteText, setNoteText]     = useState('')

  const selected = relances.find(r => r.id === selectedId) || null

  async function handleSave(data: Omit<Relance, 'id' | 'created_at'>) {
    if (modal === 'edit' && selected) {
      await updateRelance(selected.id, data)
    } else {
      const { data: newR } = await addRelance(data)
      if (newR) setSelectedId(newR.id)
    }
  }

  async function handleDelete() {
    if (!selected) return
    await deleteRelance(selected.id)
    setSelectedId(null)
  }

  async function handleAddNote() {
    if (!selected || !noteText.trim()) return
    const item: HistItem = {
      icon: '📝',
      label: noteText.trim(),
      date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      c: '#60a5fa',
    }
    await addHistorique(selected.id, item, selected.historique)
    setNoteText('')
    setAddingNote(false)
  }

  const filtered = relances.filter(r => {
    const mq = !search || r.nom.toLowerCase().includes(search.toLowerCase()) || r.client.toLowerCase().includes(search.toLowerCase())
    const mf = filter === 'toutes'
      || (filter === 'faites'  && r.done)
      || (filter === 'actives' && !r.done)
      || (filter === r.cat)
    return mq && mf
  })

  const active = filtered.filter(r => !r.done)
  const done   = filtered.filter(r => r.done)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#555', fontSize: '14px' }}>
      Chargement des relances...
    </div>
  )

  // Stats pipeline depuis les vraies données
  const pipeline = [
    { label: 'Factures dues',      value: relances.filter(r => r.cat === 'facture' && !r.done).length, val: relances.filter(r => r.cat === 'facture' && !r.done).reduce((s, r) => s + r.montant, 0), color: '#f87171', pct: 70 },
    { label: 'Devis sans réponse', value: relances.filter(r => r.cat === 'devis'   && !r.done).length, val: relances.filter(r => r.cat === 'devis'   && !r.done).reduce((s, r) => s + r.montant, 0), color: '#fb923c', pct: 40 },
    { label: 'Clients inactifs',   value: relances.filter(r => r.cat === 'client'  && !r.done).length, val: 0, color: '#a78bfa', pct: 30 },
    { label: 'Relances faites',    value: relances.filter(r => r.done).length,                         val: 0, color: '#4ade80', pct: relances.length > 0 ? Math.round(relances.filter(r => r.done).length / relances.length * 100) : 0 },
  ]

  return (
    <>
      {modal && (
        <RelanceModal
          relance={modal === 'edit' ? selected : null}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '0.5px solid #222', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{ fontSize: '16px', fontWeight: 500, color: '#fff', flex: 1 }}>
            Relances <span style={{ fontSize: '13px', color: '#555', fontWeight: 400 }}>({relances.filter(r => !r.done).length} actives)</span>
          </div>
          <button onClick={() => setModal('add')} style={{ background: '#ff6b2b', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>+ Nouvelle relance</button>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Liste gauche */}
          <div style={{ width: '280px', borderRight: '0.5px solid #222', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ padding: '.875rem 1rem', borderBottom: '0.5px solid #1e1e22' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ background: '#161618', border: '0.5px solid #2a2a2e', borderRadius: '8px', padding: '6px 10px', fontSize: '13px', color: '#ccc', width: '100%', outline: 'none', marginBottom: '.5rem' }} />
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {['toutes', 'actives', 'facture', 'devis', 'client', 'faites'].map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', cursor: 'pointer', border: '0.5px solid', borderColor: filter === f ? '#ff6b2b44' : '#2a2a2e', background: filter === f ? '#1a1008' : 'transparent', color: filter === f ? '#ff6b2b' : '#555' }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '.5rem' }}>
              {active.length === 0 && done.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#444', fontSize: '13px' }}>
                  Aucune relance — créez-en une !
                </div>
              )}
              {active.length > 0 && <div style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '.5px', padding: '.375rem .5rem .2rem', fontWeight: 500 }}>À faire ({active.length})</div>}
              {[...active, ...done].map(r => {
                const uc = urgencyColor(r.jours, r.done)
                const ct = CATS[r.cat] || CATS.devis
                return (
                  <div key={r.id} onClick={() => setSelectedId(r.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '.5rem .625rem', borderRadius: '8px', cursor: 'pointer', marginBottom: '2px', background: r.id === selectedId ? '#1a1008' : 'transparent', border: '0.5px solid', borderColor: r.id === selectedId ? '#ff6b2b22' : 'transparent', opacity: r.done ? .4 : 1 }}>
                    <div style={{ width: '3px', height: '34px', borderRadius: '2px', background: uc, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', color: '#ddd', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: r.done ? 'line-through' : 'none' }}>{r.nom}</div>
                      <div style={{ fontSize: '10px', color: '#555', marginTop: '1px' }}>{ct.label} · {r.client || '—'}</div>
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 500, color: uc, flexShrink: 0 }}>J+{r.jours}</div>
                  </div>
                )
              })}
              {done.length > 0 && <div style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '.5px', padding: '.75rem .5rem .2rem', fontWeight: 500 }}>Faites ({done.length})</div>}
            </div>
          </div>

          {/* Détail droite */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>

            {/* Pipeline stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '1.25rem' }}>
              {pipeline.map((p, i) => (
                <div key={i} style={{ background: '#161618', border: '0.5px solid #1e1e22', borderRadius: '10px', padding: '.75rem' }}>
                  <div style={{ fontSize: '10px', color: '#555', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 500, marginBottom: '.375rem' }}>{p.label}</div>
                  <div style={{ fontSize: '22px', fontWeight: 500, color: p.color, marginBottom: '2px' }}>{p.value}</div>
                  <div style={{ fontSize: '11px', color: '#555' }}>{p.val > 0 ? p.val.toLocaleString('fr-FR') + ' €' : '—'}</div>
                  <div style={{ height: '3px', background: p.color + '33', borderRadius: '2px', marginTop: '.5rem' }}>
                    <div style={{ height: '3px', background: p.color, borderRadius: '2px', width: `${p.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {!selected ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', gap: '12px' }}>
                <div style={{ fontSize: '14px', color: '#444' }}>Sélectionnez une relance ou créez-en une</div>
                <button onClick={() => setModal('add')} style={{ background: '#ff6b2b', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>+ Nouvelle relance</button>
              </div>
            ) : (
              <>
                {/* Alerte critique */}
                {selected.jours >= 14 && !selected.done && (
                  <div style={{ background: '#1a0a0a', border: '0.5px solid #f8717133', borderRadius: '10px', padding: '.75rem 1rem', marginBottom: '1rem', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#f87171', flexShrink: 0, marginTop: '4px' }} />
                    <div style={{ fontSize: '12.5px', color: '#cc7777', lineHeight: 1.6 }}>
                      Relance critique — J+{selected.jours} sans réponse. Recommandé : appel téléphonique direct.
                    </div>
                  </div>
                )}

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '10px', padding: '2px 9px', borderRadius: '10px', background: (CATS[selected.cat] || CATS.devis).bg, color: (CATS[selected.cat] || CATS.devis).color, display: 'inline-block', fontWeight: 500, marginBottom: '.375rem' }}>
                      {(CATS[selected.cat] || CATS.devis).label}
                    </span>
                    <div style={{ fontSize: '18px', fontWeight: 500, color: '#fff', lineHeight: 1.4, marginBottom: '.25rem' }}>{selected.nom}</div>
                    <div style={{ fontSize: '12px', color: '#555' }}>{selected.contact || '—'} · {selected.client || '—'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flexShrink: 0 }}>
                    <button onClick={() => setModal('edit')} style={{ background: '#161618', border: '0.5px solid #2a2a2e', borderRadius: '8px', padding: '5px 11px', fontSize: '12px', color: '#888', cursor: 'pointer' }}>Modifier</button>
                    <button onClick={() => toggleDone(selected.id, !selected.done)} style={{ background: selected.done ? '#0d1f0d' : '#161618', border: '0.5px solid', borderColor: selected.done ? '#4ade8044' : '#2a2a2e', borderRadius: '8px', padding: '5px 11px', fontSize: '12px', color: selected.done ? '#4ade80' : '#888', cursor: 'pointer' }}>
                      {selected.done ? 'Rouvrir' : 'Marquer faite'}
                    </button>
                    <button onClick={handleDelete} style={{ background: '#1a0a0a', border: '0.5px solid #f8717133', borderRadius: '8px', padding: '5px 11px', fontSize: '12px', color: '#f87171', cursor: 'pointer' }}>Supprimer</button>
                  </div>
                </div>

                {/* Infos */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '7px', marginBottom: '1rem' }}>
                  {[
                    { label: 'Jours sans réponse', value: `J+${selected.jours}`, color: urgencyColor(selected.jours, selected.done) },
                    { label: 'Urgence',             value: urgencyLabel(selected.jours), color: urgencyColor(selected.jours, selected.done) },
                    { label: 'Montant en jeu',      value: selected.montant > 0 ? selected.montant.toLocaleString('fr-FR') + ' €' : '—' },
                  ].map((c, i) => (
                    <div key={i} style={{ background: '#161618', border: '0.5px solid #1e1e22', borderRadius: '8px', padding: '.5rem .75rem' }}>
                      <div style={{ fontSize: '10px', color: '#555', marginBottom: '3px' }}>{c.label}</div>
                      <div style={{ fontSize: '13px', color: c.color || '#ccc' }}>{c.value}</div>
                    </div>
                  ))}
                </div>

                {/* Message type */}
                {selected.message && (
                  <>
                    <div style={{ fontSize: '11px', color: '#444', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 500, marginBottom: '.5rem' }}>Message type</div>
                    <div style={{ background: '#161618', border: '0.5px solid #1e1e22', borderRadius: '8px', padding: '.75rem', fontSize: '12px', color: '#888', lineHeight: 1.7, whiteSpace: 'pre-line', marginBottom: '1rem' }}>
                      {selected.message}
                    </div>
                  </>
                )}

                {/* Historique */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.5rem' }}>
                  <div style={{ fontSize: '11px', color: '#444', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 500 }}>Historique</div>
                  <button onClick={() => setAddingNote(!addingNote)} style={{ fontSize: '11px', color: '#ff6b2b', background: 'transparent', border: 'none', cursor: 'pointer' }}>+ Ajouter une note</button>
                </div>

                {addingNote && (
                  <div style={{ background: '#161618', border: '0.5px solid #2a2a2e', borderRadius: '8px', padding: '.75rem', marginBottom: '.75rem', display: 'flex', gap: '8px' }}>
                    <input
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                      placeholder="Décrivez l'interaction..."
                      style={{ background: '#111', border: '0.5px solid #2a2a2e', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', color: '#ccc', flex: 1, outline: 'none' }}
                    />
                    <button onClick={handleAddNote} style={{ background: '#ff6b2b', border: 'none', borderRadius: '6px', padding: '0 12px', fontSize: '12px', color: '#fff', cursor: 'pointer' }}>OK</button>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {selected.historique.length === 0 && (
                    <div style={{ fontSize: '12px', color: '#444', padding: '.25rem 0' }}>Aucune interaction enregistrée.</div>
                  )}
                  {selected.historique.map((h, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', padding: '.4rem 0' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px', flexShrink: 0 }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: h.c + '22', color: h.c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>{h.icon}</div>
                        {i < selected.historique.length - 1 && <div style={{ flex: 1, width: '1px', background: '#1e1e22', marginTop: '3px' }} />}
                      </div>
                      <div style={{ flex: 1, paddingBottom: '.4rem' }}>
                        <div style={{ fontSize: '12px', color: '#bbb' }}>{h.label}</div>
                        <div style={{ fontSize: '10px', color: '#444', marginTop: '1px' }}>{h.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}