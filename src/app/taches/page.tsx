'use client'

import { useState } from 'react'
import { useTaches, Tache } from '@/hooks/useTaches'
import TacheModal from '@/components/TacheModal'

const PRIO_CFG: Record<string, { label: string; color: string; bg: string }> = {
  urgent:  { label: 'Urgent',  color: '#f87171', bg: '#1a0a0a' },
  haute:   { label: 'Haute',   color: '#fb923c', bg: '#1a1008' },
  normale: { label: 'Normale', color: '#888',    bg: '#1e1e22' },
  faible:  { label: 'Faible',  color: '#444',    bg: '#161618' },
}

const STATUTS = ['à faire', 'en cours', 'en attente', 'terminé']

export default function Taches() {
  const { taches, loading, addTache, updateTache, deleteTache, toggleDone, updateSubtasks } = useTaches()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [view, setView]             = useState<'liste' | 'kanban'>('liste')
  const [filter, setFilter]         = useState('toutes')
  const [search, setSearch]         = useState('')
  const [modal, setModal]           = useState<'add' | 'edit' | null>(null)

  const selected = taches.find(t => t.id === selectedId) || null

  async function handleSave(data: Omit<Tache, 'id' | 'created_at'>) {
    if (modal === 'edit' && selected) {
      await updateTache(selected.id, data)
    } else {
      const { data: newT } = await addTache(data)
      if (newT) setSelectedId(newT.id)
    }
  }

  async function handleToggleSub(idx: number) {
    if (!selected) return
    const subtasks = selected.subtasks.map((s, i) =>
      i === idx ? { ...s, done: !s.done } : s
    )
    await updateSubtasks(selected.id, subtasks)
  }

  async function handleDelete() {
    if (!selected) return
    await deleteTache(selected.id)
    setSelectedId(null)
  }

  const filtered = taches.filter(t => {
    const mq = !search || t.nom.toLowerCase().includes(search.toLowerCase())
    const mf = filter === 'toutes'
      || (filter === 'actives'   && !t.done)
      || (filter === 'urgent'    && t.priorite === 'urgent')
      || (filter === 'terminées' && t.done)
    return mq && mf
  })

  const active = filtered.filter(t => !t.done)
  const done   = filtered.filter(t => t.done)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#555', fontSize: '14px' }}>
      Chargement des tâches...
    </div>
  )

  return (
    <>
      {modal && (
        <TacheModal
          tache={modal === 'edit' ? selected : null}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '0.5px solid #222', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{ fontSize: '16px', fontWeight: 500, color: '#fff', flex: 1 }}>
            Tâches <span style={{ fontSize: '13px', color: '#555', fontWeight: 400 }}>({taches.filter(t => !t.done).length} actives)</span>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['liste', 'kanban'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{ background: view === v ? '#1a1008' : 'transparent', border: '0.5px solid', borderColor: view === v ? '#ff6b2b55' : '#2a2a2e', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', color: view === v ? '#ff6b2b' : '#666', cursor: 'pointer' }}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={() => setModal('add')} style={{ background: '#ff6b2b', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>+ Nouvelle tâche</button>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {view === 'liste' ? (
            <>
              {/* Liste gauche */}
              <div style={{ width: '260px', borderRight: '0.5px solid #222', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <div style={{ padding: '.875rem 1rem', borderBottom: '0.5px solid #1e1e22' }}>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ background: '#161618', border: '0.5px solid #2a2a2e', borderRadius: '8px', padding: '6px 10px', fontSize: '13px', color: '#ccc', width: '100%', outline: 'none', marginBottom: '.5rem' }} />
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {['toutes', 'actives', 'urgent', 'terminées'].map(f => (
                      <button key={f} onClick={() => setFilter(f)} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', cursor: 'pointer', border: '0.5px solid', borderColor: filter === f ? '#ff6b2b44' : '#2a2a2e', background: filter === f ? '#1a1008' : 'transparent', color: filter === f ? '#ff6b2b' : '#555' }}>{f}</button>
                    ))}
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '.5rem' }}>
                  {active.length === 0 && done.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#444', fontSize: '13px' }}>Aucune tâche</div>
                  )}
                  {active.length > 0 && <div style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '.5px', padding: '.375rem .5rem .2rem', fontWeight: 500 }}>À faire ({active.length})</div>}
                  {[...active, ...done].map(t => {
                    const pc = PRIO_CFG[t.priorite] || PRIO_CFG.normale
                    return (
                      <div key={t.id} onClick={() => setSelectedId(t.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '.5rem .625rem', borderRadius: '8px', cursor: 'pointer', marginBottom: '2px', background: t.id === selectedId ? '#1a1008' : 'transparent', border: '0.5px solid', borderColor: t.id === selectedId ? '#ff6b2b22' : 'transparent', opacity: t.done ? .45 : 1 }}>
                        <div onClick={e => { e.stopPropagation(); toggleDone(t.id, !t.done) }} style={{ width: '16px', height: '16px', borderRadius: '50%', border: '0.5px solid', borderColor: t.done ? '#ff6b2b' : '#333', background: t.done ? '#ff6b2b' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#fff', flexShrink: 0, cursor: 'pointer' }}>
                          {t.done ? '✓' : ''}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', color: '#ddd', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: t.done ? 'line-through' : 'none' }}>{t.nom}</div>
                          <div style={{ fontSize: '10px', color: '#555', marginTop: '1px' }}>{t.deadline || '—'}{t.client ? ' · ' + t.client : ''}</div>
                        </div>
                        <div style={{ width: '3px', height: '28px', borderRadius: '2px', background: pc.color, flexShrink: 0 }} />
                      </div>
                    )
                  })}
                  {done.length > 0 && <div style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '.5px', padding: '.75rem .5rem .2rem', fontWeight: 500 }}>Terminées ({done.length})</div>}
                </div>
              </div>

              {/* Détail droite */}
              <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto' }}>
                {!selected ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' }}>
                    <div style={{ fontSize: '14px', color: '#444' }}>Sélectionnez une tâche ou créez-en une</div>
                    <button onClick={() => setModal('add')} style={{ background: '#ff6b2b', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>+ Nouvelle tâche</button>
                  </div>
                ) : (
                  <>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '10px', padding: '2px 9px', borderRadius: '10px', background: (PRIO_CFG[selected.priorite] || PRIO_CFG.normale).bg, color: (PRIO_CFG[selected.priorite] || PRIO_CFG.normale).color, display: 'inline-block', fontWeight: 500, marginBottom: '.375rem' }}>
                          {(PRIO_CFG[selected.priorite] || PRIO_CFG.normale).label}
                        </span>
                        <div style={{ fontSize: '18px', fontWeight: 500, color: '#fff', lineHeight: 1.4, marginBottom: '.25rem' }}>{selected.nom}</div>
                        <div style={{ fontSize: '12px', color: '#555' }}>
                          {selected.deadline || '—'}{selected.client ? ' · ' + selected.client : ''}{selected.projet ? ' · ' + selected.projet : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <button onClick={() => setModal('edit')} style={{ background: '#161618', border: '0.5px solid #2a2a2e', borderRadius: '8px', padding: '5px 11px', fontSize: '12px', color: '#888', cursor: 'pointer' }}>Modifier</button>
                        <button onClick={() => toggleDone(selected.id, !selected.done)} style={{ background: selected.done ? '#0d1f0d' : '#161618', border: '0.5px solid', borderColor: selected.done ? '#4ade8044' : '#2a2a2e', borderRadius: '8px', padding: '5px 11px', fontSize: '12px', color: selected.done ? '#4ade80' : '#888', cursor: 'pointer' }}>
                          {selected.done ? 'Rouvrir' : 'Terminer'}
                        </button>
                        <button onClick={handleDelete} style={{ background: '#1a0a0a', border: '0.5px solid #f8717133', borderRadius: '8px', padding: '5px 11px', fontSize: '12px', color: '#f87171', cursor: 'pointer' }}>Supprimer</button>
                      </div>
                    </div>

                    {/* Infos */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px', marginBottom: '1rem' }}>
                      {[
                        { label: 'Priorité', value: (PRIO_CFG[selected.priorite] || PRIO_CFG.normale).label, color: (PRIO_CFG[selected.priorite] || PRIO_CFG.normale).color },
                        { label: 'Statut',   value: selected.statut },
                        { label: 'Deadline', value: selected.deadline || '—' },
                        { label: 'Client',   value: selected.client  || '—' },
                      ].map((c, i) => (
                        <div key={i} style={{ background: '#161618', border: '0.5px solid #1e1e22', borderRadius: '8px', padding: '.5rem .75rem' }}>
                          <div style={{ fontSize: '10px', color: '#555', marginBottom: '3px' }}>{c.label}</div>
                          <div style={{ fontSize: '13px', color: c.color || '#ccc' }}>{c.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Notes */}
                    {selected.notes && (
                      <>
                        <div style={{ fontSize: '11px', color: '#444', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 500, marginBottom: '.5rem' }}>Notes</div>
                        <div style={{ background: '#161618', border: '0.5px solid #1e1e22', borderRadius: '8px', padding: '.75rem', fontSize: '13px', color: '#888', lineHeight: 1.6, marginBottom: '1rem' }}>{selected.notes}</div>
                      </>
                    )}

                    {/* Sous-tâches */}
                    <div style={{ fontSize: '11px', color: '#444', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 500, marginBottom: '.5rem' }}>
                      Sous-tâches — {selected.subtasks.filter(s => s.done).length}/{selected.subtasks.length}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {selected.subtasks.length === 0 && (
                        <div style={{ fontSize: '12px', color: '#444', padding: '.25rem 0' }}>Aucune sous-tâche — modifiez la tâche pour en ajouter.</div>
                      )}
                      {selected.subtasks.map((s, i) => (
                        <div key={i} onClick={() => handleToggleSub(i)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '.375rem .5rem', borderRadius: '6px', cursor: 'pointer' }}>
                          <div style={{ width: '13px', height: '13px', borderRadius: '3px', border: '0.5px solid', borderColor: s.done ? '#ff6b2b' : '#333', background: s.done ? '#ff6b2b' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#fff', flexShrink: 0 }}>{s.done ? '✓' : ''}</div>
                          <span style={{ fontSize: '12px', color: s.done ? '#444' : '#888', textDecoration: s.done ? 'line-through' : 'none' }}>{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            /* Vue Kanban */
            <div style={{ flex: 1, padding: '1rem', overflowX: 'auto', overflowY: 'hidden' }}>
              <div style={{ display: 'flex', gap: '10px', height: '100%' }}>
                {STATUTS.map(st => {
                  const cols = taches.filter(t => t.statut === st)
                  return (
                    <div key={st} style={{ background: '#111113', border: '0.5px solid #1e1e22', borderRadius: '12px', width: '200px', flexShrink: 0, display: 'flex', flexDirection: 'column', maxHeight: '100%' }}>
                      <div style={{ padding: '.625rem .75rem', borderBottom: '0.5px solid #1e1e22', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#777', textTransform: 'uppercase', letterSpacing: '.5px', flex: 1 }}>{st}</span>
                        <span style={{ fontSize: '11px', color: '#444', background: '#1e1e22', padding: '1px 6px', borderRadius: '8px' }}>{cols.length}</span>
                      </div>
                      <div style={{ flex: 1, overflowY: 'auto', padding: '.5rem' }}>
                        {cols.map(t => {
                          const pc = PRIO_CFG[t.priorite] || PRIO_CFG.normale
                          return (
                            <div key={t.id} onClick={() => { setSelectedId(t.id); setView('liste') }} style={{ background: '#161618', border: '0.5px solid #222', borderRadius: '8px', padding: '.625rem .75rem', marginBottom: '5px', cursor: 'pointer' }}>
                              <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '4px', lineHeight: 1.4 }}>{t.nom}</div>
                              <div style={{ fontSize: '10px', color: '#444', marginBottom: '.375rem' }}>{t.client || '—'}</div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '8px', background: pc.bg, color: pc.color }}>{pc.label}</span>
                                <span style={{ fontSize: '10px', color: '#444' }}>{t.deadline || '—'}</span>
                              </div>
                            </div>
                          )
                        })}
                        {cols.length === 0 && <div style={{ fontSize: '11px', color: '#333', textAlign: 'center', padding: '1rem 0' }}>Vide</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}