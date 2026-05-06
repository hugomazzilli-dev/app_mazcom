'use client'

import { useState } from 'react'
import { useRelances, Relance, HistItem } from '@/hooks/useRelances'
import RelanceModal from '@/components/RelanceModal'
import { useIsMobile } from '@/hooks/useIsMobile'

const CATS: Record<string, { label: string; color: string; bg: string }> = {
  facture: { label: 'Facture impayée',    color: '#f87171', bg: '#1a0a0a' },
  devis:   { label: 'Devis sans réponse', color: '#fb923c', bg: '#1a1008' },
  client:  { label: 'Client inactif',     color: '#a78bfa', bg: '#150d20' },
  suivi:   { label: 'Suivi livraison',    color: '#4ade80', bg: '#0d1f0d' },
}

function urgencyColor(j: number, done: boolean) {
  if (done) return '#333'
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

export default function Relances() {
  const { relances, loading, addRelance, updateRelance, deleteRelance, toggleDone, addHistorique } = useRelances()
  const isMobile = useIsMobile()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [filter, setFilter] = useState('toutes')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [noteText, setNoteText] = useState('')
  const [addingNote, setAddingNote] = useState(false)

  const selected = relances.find(r => r.id === selectedId) || null

  async function handleSave(data: Omit<Relance, 'id' | 'created_at'>) {
    if (modal === 'edit' && selected) { await updateRelance(selected.id, data) }
    else { const { data: n } = await addRelance(data); if (n) { setSelectedId(n.id); if (isMobile) setShowDetail(true) } }
  }

  async function handleDelete() {
    if (!selected) return
    await deleteRelance(selected.id)
    setSelectedId(null); setShowDetail(false)
  }

  async function handleAddNote() {
    if (!selected || !noteText.trim()) return
    const item: HistItem = { icon: '📝', label: noteText.trim(), date: new Date().toLocaleDateString('fr-FR'), c: '#60a5fa' }
    await addHistorique(selected.id, item, selected.historique)
    setNoteText(''); setAddingNote(false)
  }

  function selectRelance(id: string) {
    setSelectedId(id)
    if (isMobile) setShowDetail(true)
  }

  const filtered = relances.filter(r => {
    const mq = !search || r.nom.toLowerCase().includes(search.toLowerCase())
    const mf = filter === 'toutes' || (filter === 'faites' && r.done) || (filter === 'actives' && !r.done) || filter === r.cat
    return mq && mf
  })
  const active = filtered.filter(r => !r.done)
  const done   = filtered.filter(r => r.done)

  const pipeline = [
    { label: 'Factures', value: relances.filter(r => r.cat === 'facture' && !r.done).length, color: '#f87171' },
    { label: 'Devis',    value: relances.filter(r => r.cat === 'devis' && !r.done).length,   color: '#fb923c' },
    { label: 'Faites',   value: relances.filter(r => r.done).length,                          color: '#4ade80' },
    { label: 'Total',    value: relances.length,                                              color: '#888' },
  ]

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)', fontSize: '14px' }}>Chargement...</div>

  return (
    <>
      {modal && <RelanceModal relance={modal === 'edit' ? selected : null} onClose={() => setModal(null)} onSave={handleSave} />}

      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

        <div style={{ padding: '1rem 1.25rem', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, background: 'var(--card-bg)' }}>
          <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)', flex: 1 }}>Relances <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>({relances.filter(r => !r.done).length})</span></div>
          <button onClick={() => setModal('add')} style={{ background: '#ff6b2b', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>+ Nouvelle</button>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Liste */}
          {(!isMobile || !showDetail) && (
            <div style={{ width: isMobile ? '100%' : '280px', borderRight: isMobile ? 'none' : '0.5px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              {/* Stats mini */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', padding: '.75rem 1rem', borderBottom: '0.5px solid var(--border-subtle)' }}>
                {pipeline.map((p, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: 500, color: p.color }}>{p.value}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-faint)', textTransform: 'uppercase' }}>{p.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '.625rem 1rem', borderBottom: '0.5px solid var(--border-subtle)' }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ background: 'var(--input-bg)', border: '0.5px solid var(--border-subtle)', borderRadius: '8px', padding: '6px 10px', fontSize: '13px', color: 'var(--text-primary)', width: '100%', outline: 'none', marginBottom: '.5rem' }} />
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {['toutes','actives','facture','devis','faites'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', cursor: 'pointer', border: '0.5px solid', borderColor: filter === f ? '#ff6b2b44' : 'var(--border-subtle)', background: filter === f ? '#1a1008' : 'transparent', color: filter === f ? '#ff6b2b' : 'var(--text-muted)' }}>{f}</button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '.5rem', background: 'var(--bg-primary)' }}>
                {active.length === 0 && done.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-faint)', fontSize: '13px' }}>Aucune relance</div>}
                {[...active, ...done].map(r => {
                  const uc = urgencyColor(r.jours, r.done)
                  const ct = CATS[r.cat] || CATS.devis
                  return (
                    <div key={r.id} onClick={() => selectRelance(r.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '.5rem .625rem', borderRadius: '8px', cursor: 'pointer', marginBottom: '2px', background: r.id === selectedId && !isMobile ? '#1a1008' : 'transparent', opacity: r.done ? .4 : 1 }}>
                      <div style={{ width: '3px', height: '34px', borderRadius: '2px', background: uc, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: r.done ? 'line-through' : 'none' }}>{r.nom}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>{ct.label} · {r.client || '—'}</div>
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 500, color: uc, flexShrink: 0 }}>J+{r.jours}</div>
                      {isMobile && <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>›</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Détail */}
          {(!isMobile || showDetail) && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', background: 'var(--bg-primary)' }}>
              {isMobile && showDetail && <button onClick={() => setShowDetail(false)} style={{ background: 'transparent', border: 'none', color: '#ff6b2b', fontSize: '14px', cursor: 'pointer', marginBottom: '1rem', padding: 0 }}>← Retour</button>}
              {!selected ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', gap: '12px' }}>
                  <div style={{ fontSize: '14px', color: 'var(--text-faint)' }}>Sélectionnez une relance</div>
                  <button onClick={() => setModal('add')} style={{ background: '#ff6b2b', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>+ Nouvelle relance</button>
                </div>
              ) : (
                <>
                  {selected.jours >= 14 && !selected.done && (
                    <div style={{ background: '#1a0a0a', border: '0.5px solid #f8717133', borderRadius: '10px', padding: '.75rem 1rem', marginBottom: '1rem', fontSize: '12px', color: '#cc7777' }}>
                      ⚠️ Relance critique — J+{selected.jours} sans réponse
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', gap: '10px', flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ fontSize: '10px', padding: '2px 9px', borderRadius: '10px', background: (CATS[selected.cat] || CATS.devis).bg, color: (CATS[selected.cat] || CATS.devis).color, display: 'inline-block', fontWeight: 500, marginBottom: '.375rem' }}>{(CATS[selected.cat] || CATS.devis).label}</span>
                      <div style={{ fontSize: '17px', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4 }}>{selected.nom}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{selected.client || '—'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button onClick={() => setModal('edit')} style={{ background: 'var(--card-bg)', border: '0.5px solid var(--border-subtle)', borderRadius: '8px', padding: '5px 10px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>Modifier</button>
                      <button onClick={() => toggleDone(selected.id, !selected.done)} style={{ background: selected.done ? '#0d1f0d' : 'var(--card-bg)', border: '0.5px solid', borderColor: selected.done ? '#4ade8044' : 'var(--border-subtle)', borderRadius: '8px', padding: '5px 10px', fontSize: '12px', color: selected.done ? '#4ade80' : 'var(--text-secondary)', cursor: 'pointer' }}>{selected.done ? 'Rouvrir' : '✓ Faite'}</button>
                      <button onClick={handleDelete} style={{ background: '#1a0a0a', border: '0.5px solid #f8717133', borderRadius: '8px', padding: '5px 10px', fontSize: '12px', color: '#f87171', cursor: 'pointer' }}>Suppr.</button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '7px', marginBottom: '1rem' }}>
                    {[
                      { label: 'Jours', value: `J+${selected.jours}`, color: urgencyColor(selected.jours, selected.done) },
                      { label: 'Urgence', value: urgencyLabel(selected.jours), color: urgencyColor(selected.jours, selected.done) },
                      { label: 'Montant', value: selected.montant > 0 ? selected.montant.toLocaleString('fr-FR') + ' €' : '—' },
                    ].map((c, i) => (
                      <div key={i} style={{ background: 'var(--card-bg)', border: '0.5px solid var(--border-subtle)', borderRadius: '8px', padding: '.5rem .75rem' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px' }}>{c.label}</div>
                        <div style={{ fontSize: '13px', color: c.color || 'var(--text-secondary)' }}>{c.value}</div>
                      </div>
                    ))}
                  </div>
                  {selected.message && (
                    <div style={{ background: 'var(--card-bg)', border: '0.5px solid var(--border-subtle)', borderRadius: '8px', padding: '.75rem', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line', marginBottom: '1rem' }}>{selected.message}</div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.5rem' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 500 }}>Historique</div>
                    <button onClick={() => setAddingNote(!addingNote)} style={{ fontSize: '11px', color: '#ff6b2b', background: 'transparent', border: 'none', cursor: 'pointer' }}>+ Note</button>
                  </div>
                  {addingNote && (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '.75rem' }}>
                      <input value={noteText} onChange={e => setNoteText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddNote()} placeholder="Note..." style={{ background: 'var(--input-bg)', border: '0.5px solid var(--border-subtle)', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', color: 'var(--text-primary)', flex: 1, outline: 'none' }} />
                      <button onClick={handleAddNote} style={{ background: '#ff6b2b', border: 'none', borderRadius: '6px', padding: '0 12px', fontSize: '12px', color: '#fff', cursor: 'pointer' }}>OK</button>
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {selected.historique.length === 0 && <div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Aucune interaction.</div>}
                    {selected.historique.map((h, i) => (
                      <div key={i} style={{ display: 'flex', gap: '10px', padding: '.4rem 0' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: h.c + '22', color: h.c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', flexShrink: 0 }}>{h.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{h.label}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '1px' }}>{h.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}