'use client'

import { useState } from 'react'
import { useTaches, Tache } from '@/hooks/useTaches'
import TacheModal from '@/components/TacheModal'
import { useIsMobile } from '@/hooks/useIsMobile'

const PRIO_CFG: Record<string, { label: string; color: string; bg: string }> = {
  urgent:  { label: 'Urgent',  color: '#f87171', bg: '#1a0a0a' },
  haute:   { label: 'Haute',   color: '#fb923c', bg: '#1a1008' },
  normale: { label: 'Normale', color: '#888',    bg: '#1e1e22' },
  faible:  { label: 'Faible',  color: '#444',    bg: '#161618' },
}

export default function Taches() {
  const { taches, loading, addTache, updateTache, deleteTache, toggleDone, updateSubtasks } = useTaches()
  const isMobile = useIsMobile()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [filter, setFilter] = useState('toutes')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)

  const selected = taches.find(t => t.id === selectedId) || null

  async function handleSave(data: Omit<Tache, 'id' | 'created_at'>) {
    if (modal === 'edit' && selected) { await updateTache(selected.id, data) }
    else { const { data: n } = await addTache(data); if (n) { setSelectedId(n.id); if (isMobile) setShowDetail(true) } }
  }

  async function handleToggleSub(idx: number) {
    if (!selected) return
    const subtasks = selected.subtasks.map((s, i) => i === idx ? { ...s, done: !s.done } : s)
    await updateSubtasks(selected.id, subtasks)
  }

  async function handleDelete() {
    if (!selected) return
    await deleteTache(selected.id)
    setSelectedId(null); setShowDetail(false)
  }

  function selectTache(id: string) {
    setSelectedId(id)
    if (isMobile) setShowDetail(true)
  }

  const filtered = taches.filter(t => {
    const mq = !search || t.nom.toLowerCase().includes(search.toLowerCase())
    const mf = filter === 'toutes' || (filter === 'actives' && !t.done) || (filter === 'urgent' && t.priorite === 'urgent') || (filter === 'terminées' && t.done)
    return mq && mf
  })
  const active = filtered.filter(t => !t.done)
  const done   = filtered.filter(t => t.done)

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)', fontSize: '14px' }}>Chargement...</div>

  return (
    <>
      {modal && <TacheModal tache={modal === 'edit' ? selected : null} onClose={() => setModal(null)} onSave={handleSave} />}

      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

        <div style={{ padding: '1rem 1.25rem', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, background: 'var(--card-bg)' }}>
          <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)', flex: 1 }}>
            Tâches <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>({taches.filter(t => !t.done).length})</span>
          </div>
          <button onClick={() => setModal('add')} style={{ background: '#ff6b2b', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>+ Tâche</button>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Liste */}
          {(!isMobile || !showDetail) && (
            <div style={{ width: isMobile ? '100%' : '260px', borderRight: isMobile ? 'none' : '0.5px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              <div style={{ padding: '.875rem 1rem', borderBottom: '0.5px solid var(--border-subtle)' }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ background: 'var(--input-bg)', border: '0.5px solid var(--border-subtle)', borderRadius: '8px', padding: '6px 10px', fontSize: '13px', color: 'var(--text-primary)', width: '100%', outline: 'none', marginBottom: '.5rem' }} />
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {['toutes','actives','urgent','terminées'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', cursor: 'pointer', border: '0.5px solid', borderColor: filter === f ? '#ff6b2b44' : 'var(--border-subtle)', background: filter === f ? '#1a1008' : 'transparent', color: filter === f ? '#ff6b2b' : 'var(--text-muted)' }}>{f}</button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '.5rem', background: 'var(--bg-primary)' }}>
                {active.length === 0 && done.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-faint)', fontSize: '13px' }}>Aucune tâche</div>}
                {active.length > 0 && <div style={{ fontSize: '10px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', padding: '.375rem .5rem .2rem', fontWeight: 500 }}>À faire ({active.length})</div>}
                {[...active, ...done].map(t => {
                  const pc = PRIO_CFG[t.priorite] || PRIO_CFG.normale
                  return (
                    <div key={t.id} onClick={() => selectTache(t.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '.5rem .625rem', borderRadius: '8px', cursor: 'pointer', marginBottom: '2px', background: t.id === selectedId && !isMobile ? '#1a1008' : 'transparent', opacity: t.done ? .45 : 1 }}>
                      <div onClick={e => { e.stopPropagation(); toggleDone(t.id, !t.done) }} style={{ width: '16px', height: '16px', borderRadius: '50%', border: '0.5px solid', borderColor: t.done ? '#ff6b2b' : 'var(--border)', background: t.done ? '#ff6b2b' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#fff', flexShrink: 0, cursor: 'pointer' }}>{t.done ? '✓' : ''}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: t.done ? 'line-through' : 'none' }}>{t.nom}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>{t.deadline || '—'}</div>
                      </div>
                      <div style={{ width: '3px', height: '28px', borderRadius: '2px', background: pc.color, flexShrink: 0 }} />
                      {isMobile && <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>›</span>}
                    </div>
                  )
                })}
                {done.length > 0 && <div style={{ fontSize: '10px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', padding: '.75rem .5rem .2rem', fontWeight: 500 }}>Terminées ({done.length})</div>}
              </div>
            </div>
          )}

          {/* Détail */}
          {(!isMobile || showDetail) && (
            <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', background: 'var(--bg-primary)' }}>
              {isMobile && showDetail && (
                <button onClick={() => setShowDetail(false)} style={{ background: 'transparent', border: 'none', color: '#ff6b2b', fontSize: '14px', cursor: 'pointer', marginBottom: '1rem', padding: 0 }}>← Retour</button>
              )}
              {!selected ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' }}>
                  <div style={{ fontSize: '14px', color: 'var(--text-faint)' }}>Sélectionnez une tâche</div>
                  <button onClick={() => setModal('add')} style={{ background: '#ff6b2b', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>+ Nouvelle tâche</button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', gap: '10px', flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ fontSize: '10px', padding: '2px 9px', borderRadius: '10px', background: (PRIO_CFG[selected.priorite] || PRIO_CFG.normale).bg, color: (PRIO_CFG[selected.priorite] || PRIO_CFG.normale).color, display: 'inline-block', fontWeight: 500, marginBottom: '.375rem' }}>{(PRIO_CFG[selected.priorite] || PRIO_CFG.normale).label}</span>
                      <div style={{ fontSize: '17px', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4 }}>{selected.nom}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{selected.deadline || '—'}{selected.client ? ' · ' + selected.client : ''}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button onClick={() => setModal('edit')} style={{ background: 'var(--card-bg)', border: '0.5px solid var(--border-subtle)', borderRadius: '8px', padding: '5px 10px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>Modifier</button>
                      <button onClick={() => toggleDone(selected.id, !selected.done)} style={{ background: selected.done ? '#0d1f0d' : 'var(--card-bg)', border: '0.5px solid', borderColor: selected.done ? '#4ade8044' : 'var(--border-subtle)', borderRadius: '8px', padding: '5px 10px', fontSize: '12px', color: selected.done ? '#4ade80' : 'var(--text-secondary)', cursor: 'pointer' }}>{selected.done ? 'Rouvrir' : 'Terminer'}</button>
                      <button onClick={handleDelete} style={{ background: '#1a0a0a', border: '0.5px solid #f8717133', borderRadius: '8px', padding: '5px 10px', fontSize: '12px', color: '#f87171', cursor: 'pointer' }}>Suppr.</button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', gap: '7px', marginBottom: '1rem' }}>
                    {[
                      { label: 'Priorité', value: (PRIO_CFG[selected.priorite] || PRIO_CFG.normale).label, color: (PRIO_CFG[selected.priorite] || PRIO_CFG.normale).color },
                      { label: 'Statut', value: selected.statut },
                      { label: 'Deadline', value: selected.deadline || '—' },
                      { label: 'Client', value: selected.client || '—' },
                    ].map((c, i) => (
                      <div key={i} style={{ background: 'var(--card-bg)', border: '0.5px solid var(--border-subtle)', borderRadius: '8px', padding: '.5rem .75rem' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px' }}>{c.label}</div>
                        <div style={{ fontSize: '13px', color: c.color || 'var(--text-secondary)' }}>{c.value}</div>
                      </div>
                    ))}
                  </div>
                  {selected.notes && <div style={{ background: 'var(--card-bg)', border: '0.5px solid var(--border-subtle)', borderRadius: '8px', padding: '.75rem', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>{selected.notes}</div>}
                  <div style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 500, marginBottom: '.5rem' }}>Sous-tâches — {selected.subtasks.filter(s => s.done).length}/{selected.subtasks.length}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {selected.subtasks.map((s, i) => (
                      <div key={i} onClick={() => handleToggleSub(i)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '.375rem .5rem', borderRadius: '6px', cursor: 'pointer' }}>
                        <div style={{ width: '13px', height: '13px', borderRadius: '3px', border: '0.5px solid', borderColor: s.done ? '#ff6b2b' : 'var(--border)', background: s.done ? '#ff6b2b' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#fff', flexShrink: 0 }}>{s.done ? '✓' : ''}</div>
                        <span style={{ fontSize: '12px', color: s.done ? 'var(--text-faint)' : 'var(--text-secondary)', textDecoration: s.done ? 'line-through' : 'none' }}>{s.label}</span>
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