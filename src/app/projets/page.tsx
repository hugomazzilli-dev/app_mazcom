'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useProjects, Project } from '@/hooks/useProjects'
import ProjetModal from '@/components/ProjetModal'
import { supabase } from '@/lib/supabase'
import { useIsMobile } from '@/hooks/useIsMobile'

const TYPES: Record<string, { label: string; color: string; bg: string }> = {
  drone:     { label: 'Drone',           color: '#60a5fa', bg: '#0d1520' },
  corporate: { label: 'Corporate',       color: '#a78bfa', bg: '#150d20' },
  interview: { label: 'Interview',       color: '#c084fc', bg: '#1a1530' },
  chantier:  { label: 'Vidéo chantier', color: '#f97316', bg: '#1a1210' },
  rs:        { label: 'Réseaux sociaux', color: '#fb923c', bg: '#1a1008' },
  immo:      { label: 'Immobilier',      color: '#818cf8', bg: '#120d1a' },
  montage:   { label: 'Montage',         color: '#34d399', bg: '#0d1a15' },
}

const PRIO: Record<string, string> = {
  urgent: '#f87171', haute: '#fb923c', normale: '#888', faible: '#444',
}

const COLS = [
  { id: 'nouveau',    label: 'Nouveau' },
  { id: 'prep',       label: 'Préparation' },
  { id: 'tournage',   label: 'Tournage prévu' },
  { id: 'realise',    label: 'Tournage réalisé' },
  { id: 'montage',    label: 'Montage' },
  { id: 'validation', label: 'Validation' },
  { id: 'livre',      label: 'Livré' },
  { id: 'facture',    label: 'Facturé' },
]

const CHECKLIST = [
  'Devis envoyé', 'Acompte reçu', 'Matériel préparé', 'Batterie drone chargée',
  'Autorisations drone', 'Tournage effectué', 'Rushs sauvegardés', 'Montage commencé',
  'Version envoyée client', 'Validation client', 'Facture envoyée', 'Paiement reçu',
]

function parseDeadline(dateStr: string): { jour: number; mois: number; annee: number } {
  const now = new Date()
  if (!dateStr) return { jour: 1, mois: now.getMonth() + 1, annee: now.getFullYear() }
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/')
    const jour  = parseInt(parts[0]) || 1
    const mois  = parseInt(parts[1]) || 1
    let annee   = parseInt(parts[2]) || now.getFullYear()
    if (annee < 100) annee += 2000
    return { jour, mois, annee }
  }
  const MOIS_FR: Record<string, number> = {
    jan: 1, janv: 1, janvier: 1, fév: 2, fevr: 2, février: 2,
    mar: 3, mars: 3, avr: 4, avril: 4, mai: 5, jun: 6, juin: 6,
    jul: 7, juil: 7, juillet: 7, aoû: 8, aout: 8, août: 8,
    sep: 9, sept: 9, septembre: 9, oct: 10, octobre: 10,
    nov: 11, novembre: 11, déc: 12, dec: 12, décembre: 12,
  }
  const parts = dateStr.toLowerCase().trim().split(/[\s/]+/)
  const jour   = parseInt(parts[0]) || 1
  const mois   = MOIS_FR[parts[1]] || parseInt(parts[1]) || 1
  let annee    = parseInt(parts[2]) || now.getFullYear()
  if (annee < 100) annee += 2000
  return { jour, mois, annee }
}

function ProjetsInner() {
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()
  const { projects, loading, addProject, updateProject, deleteProject, moveProject, toggleCheck } = useProjects()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [view, setView]             = useState<'kanban' | 'liste'>('kanban')
  const [modal, setModal]           = useState<'add' | 'edit' | null>(null)
  const [dragId, setDragId]         = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get('new') === '1') setModal('add')
  }, [])

  const selected = projects.find(p => p.id === selectedId) || null
  const doneSubs = selected ? selected.checks.filter(Boolean).length : 0

  function selectProject(id: string) {
    setSelectedId(id)
    if (isMobile) setShowDetail(true)
  }

  async function handleSave(data: Omit<Project, 'id' | 'created_at'>) {
    if (modal === 'edit' && selected) {
      await updateProject(selected.id, data)
    } else {
      const { data: newP } = await addProject(data)
      if (newP) {
        setSelectedId(newP.id)
        if (isMobile) setShowDetail(true)
        await supabase.from('taches').insert([{
          nom: `Préparer projet — ${data.nom}`, priorite: data.priorite || 'normale',
          statut: 'à faire', projet: data.nom, client: data.client_nom || '',
          deadline: data.date_deadline || '',
          notes: `Tâche créée automatiquement pour le projet "${data.nom}"`,
          subtasks: [{ label: 'Envoyer le devis', done: false }, { label: 'Confirmer la date de tournage', done: false }, { label: 'Préparer le matériel', done: false }],
          done: false,
        }])
        if (data.date_deadline) {
          const { jour, mois, annee } = parseDeadline(data.date_deadline)
          await supabase.from('evenements').insert([{ titre: `Deadline — ${data.nom}`, type: 'deadline', date_jour: jour, date_mois: mois, date_annee: annee, heure: 'Fin de journée', lieu: '', contact: data.client_nom || '', materiel: '', notes: `Deadline du projet "${data.nom}"`, checks: [] }])
        }
        const year = new Date().getFullYear()
        const rand = Math.floor(Math.random() * 900 + 100)
        await supabase.from('devis').insert([{ numero: `D-${year}-${rand}`, client: data.client_nom || '', projet: data.nom, adresse_client: '', date_emission: new Date().toLocaleDateString('fr-FR'), date_echeance: data.date_deadline || '', montant: data.budget || 0, statut: 'draft', lignes: [{ desc: data.nom, soustitems: [], qte: 1, pu: data.budget || 0 }] }])
      }
    }
  }

  async function handleDelete() {
    if (!selected) return
    await deleteProject(selected.id)
    setSelectedId(null); setShowDetail(false)
  }

  async function handleToggleCheck(idx: number) {
    if (!selected) return
    const checks = [...selected.checks]
    checks[idx] = !checks[idx]
    await toggleCheck(selected.id, checks)
  }

  function onDragStart(id: string) { setDragId(id) }
  function onDragOver(e: React.DragEvent) { e.preventDefault() }
  async function onDrop(e: React.DragEvent, colId: string) {
    e.preventDefault(); if (!dragId) return
    await moveProject(dragId, colId); setDragId(null)
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)', fontSize: '14px' }}>Chargement...</div>

  const DetailPanel = () => selected ? (
    <div style={{ width: isMobile ? '100%' : '280px', borderLeft: isMobile ? 'none' : '0.5px solid var(--border)', background: 'var(--bg-tertiary)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '1rem', borderBottom: '0.5px solid var(--border-subtle)', flexShrink: 0 }}>
        {isMobile && <button onClick={() => setShowDetail(false)} style={{ background: 'transparent', border: 'none', color: '#ff6b2b', fontSize: '14px', cursor: 'pointer', marginBottom: '.5rem', padding: 0 }}>← Retour</button>}
        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '8px', background: (TYPES[selected.type] || TYPES.corporate).bg, color: (TYPES[selected.type] || TYPES.corporate).color, display: 'inline-block', marginBottom: '.5rem' }}>{(TYPES[selected.type] || TYPES.corporate).label}</span>
        <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: '3px' }}>{selected.nom}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selected.client_nom || '—'}</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '1rem' }}>
          {[
            { label: 'Budget', value: selected.budget.toLocaleString('fr-FR') + ' €', color: '#4ade80' },
            { label: 'Deadline', value: selected.date_deadline || '—' },
            { label: 'Priorité', value: selected.priorite, color: PRIO[selected.priorite] },
            { label: 'Avancement', value: selected.progression + ' %' },
          ].map((info, i) => (
            <div key={i} style={{ background: 'var(--card-bg)', border: '0.5px solid var(--border-subtle)', borderRadius: '7px', padding: '.5rem .625rem' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>{info.label}</div>
              <div style={{ fontSize: '12px', color: info.color || 'var(--text-secondary)' }}>{info.value}</div>
            </div>
          ))}
        </div>
        <div style={{ height: '4px', background: 'var(--border-subtle)', borderRadius: '2px', marginBottom: '1rem' }}>
          <div style={{ height: '4px', borderRadius: '2px', background: selected.progression === 100 ? '#4ade80' : '#ff6b2b', width: `${selected.progression}%`, transition: 'width .3s' }} />
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 500, marginBottom: '.5rem' }}>Checklist — {doneSubs}/12</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '1rem' }}>
          {CHECKLIST.map((label, idx) => (
            <div key={idx} onClick={() => handleToggleCheck(idx)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '3px', flexShrink: 0, border: '0.5px solid', borderColor: selected.checks[idx] ? '#ff6b2b' : 'var(--border-subtle)', background: selected.checks[idx] ? '#ff6b2b' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#fff' }}>{selected.checks[idx] ? '✓' : ''}</div>
              <span style={{ fontSize: '12px', color: selected.checks[idx] ? 'var(--text-faint)' : 'var(--text-secondary)', textDecoration: selected.checks[idx] ? 'line-through' : 'none' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: '.75rem 1rem', borderTop: '0.5px solid var(--border-subtle)', display: 'flex', gap: '6px', flexShrink: 0 }}>
        <button onClick={() => setModal('edit')} style={{ flex: 1, padding: '7px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', border: '0.5px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-secondary)' }}>Modifier</button>
        <button onClick={handleDelete} style={{ flex: 1, padding: '7px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', border: '0.5px solid #f8717133', background: '#1a0a0a', color: '#f87171' }}>Supprimer</button>
      </div>
    </div>
  ) : null

  return (
    <>
      {modal && <ProjetModal project={modal === 'edit' ? selected : null} onClose={() => setModal(null)} onSave={handleSave} />}

      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

        <div style={{ padding: '1rem 1.25rem', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, background: 'var(--card-bg)' }}>
          {isMobile && showDetail
            ? <button onClick={() => setShowDetail(false)} style={{ background: 'transparent', border: 'none', color: '#ff6b2b', fontSize: '14px', cursor: 'pointer', padding: 0 }}>←</button>
            : <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)', flex: 1 }}>Projets <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>({projects.length})</span></div>
          }
          {(!isMobile || !showDetail) && <>
            {!isMobile && <div style={{ display: 'flex', gap: '4px' }}>
              {(['kanban', 'liste'] as const).map(v => (
                <button key={v} onClick={() => setView(v)} style={{ background: view === v ? '#1a1008' : 'transparent', border: '0.5px solid', borderColor: view === v ? '#ff6b2b55' : 'var(--border-subtle)', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', color: view === v ? '#ff6b2b' : 'var(--text-secondary)', cursor: 'pointer' }}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>}
            <button onClick={() => setModal('add')} style={{ background: '#ff6b2b', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>+ Projet</button>
          </>}
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Vue principale — masquée sur mobile si détail ouvert */}
          {(!isMobile || !showDetail) && (
            <div style={{ flex: 1, overflow: 'auto', padding: '1rem', background: 'var(--bg-primary)' }}>
              {/* Sur mobile : liste simple */}
              {isMobile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {projects.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: '14px', padding: '3rem 0' }}>Aucun projet — créez-en un !</div>}
                  {projects.map(p => {
                    const tp = TYPES[p.type] || TYPES.corporate
                    return (
                      <div key={p.id} onClick={() => selectProject(p.id)} style={{ background: 'var(--card-bg)', border: '0.5px solid var(--border-subtle)', borderRadius: '12px', padding: '.875rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.5rem' }}>
                          <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '8px', background: tp.bg, color: tp.color }}>{tp.label}</span>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: PRIO[p.priorite] || '#888' }} />
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '3px' }}>{p.nom}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '.5rem' }}>{p.client_nom || '—'}</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '12px', color: '#4ade80' }}>{p.budget.toLocaleString('fr-FR')} €</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.date_deadline || '—'}</span>
                        </div>
                        <div style={{ height: '3px', background: 'var(--border-subtle)', borderRadius: '2px', marginTop: '.5rem' }}>
                          <div style={{ height: '3px', borderRadius: '2px', background: p.progression === 100 ? '#4ade80' : '#ff6b2b', width: `${p.progression}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : view === 'kanban' ? (
                <div style={{ display: 'flex', gap: '10px', height: '100%', alignItems: 'flex-start' }}>
                  {COLS.map(col => {
                    const cards = projects.filter(p => p.col === col.id)
                    return (
                      <div key={col.id} onDragOver={onDragOver} onDrop={e => onDrop(e, col.id)}
                        style={{ background: 'var(--bg-tertiary)', border: '0.5px solid var(--border-subtle)', borderRadius: '12px', width: '175px', flexShrink: 0, display: 'flex', flexDirection: 'column', maxHeight: '100%' }}>
                        <div style={{ padding: '.625rem .75rem', borderBottom: '0.5px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.5px', flex: 1 }}>{col.label}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-faint)', background: 'var(--border-subtle)', padding: '1px 6px', borderRadius: '8px' }}>{cards.length}</span>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '.5rem' }}>
                          {cards.map(p => {
                            const tp = TYPES[p.type] || TYPES.corporate
                            return (
                              <div key={p.id} draggable onDragStart={() => onDragStart(p.id)} onClick={() => selectProject(p.id)}
                                style={{ background: p.id === selectedId ? '#1a0f0a' : 'var(--card-bg)', border: '0.5px solid', borderColor: p.id === selectedId ? '#ff6b2b55' : 'var(--border-subtle)', borderRadius: '10px', padding: '.75rem', marginBottom: '6px', cursor: 'grab', userSelect: 'none', opacity: dragId === p.id ? .5 : 1 }}>
                                <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '8px', background: tp.bg, color: tp.color, display: 'inline-block', marginBottom: '.5rem' }}>{tp.label}</span>
                                <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px', lineHeight: 1.4 }}>{p.nom}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.client_nom || '—'}</div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '.5rem' }}>
                                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{p.budget.toLocaleString('fr-FR')} €</span>
                                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: PRIO[p.priorite] || '#888' }} />
                                </div>
                                <div style={{ height: '2px', background: 'var(--border-subtle)', borderRadius: '1px', marginTop: '.5rem' }}>
                                  <div style={{ height: '2px', borderRadius: '1px', background: p.progression === 100 ? '#4ade80' : '#ff6b2b', width: `${p.progression}%` }} />
                                </div>
                              </div>
                            )
                          })}
                          {cards.length === 0 && <div style={{ fontSize: '11px', color: 'var(--text-faint)', textAlign: 'center', padding: '1rem 0' }}>Déposez ici</div>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['Projet','Client','Type','Budget','Deadline','Priorité','Avancement'].map(h => (
                      <th key={h} style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', padding: '6px 10px', textAlign: 'left', borderBottom: '0.5px solid var(--border-subtle)' }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {projects.map(p => {
                      const tp = TYPES[p.type] || TYPES.corporate
                      return (
                        <tr key={p.id} onClick={() => { selectProject(p.id); setView('kanban') }} style={{ cursor: 'pointer' }}>
                          <td style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500, padding: '9px 10px', borderBottom: '0.5px solid var(--border)' }}>{p.nom}</td>
                          <td style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '9px 10px', borderBottom: '0.5px solid var(--border)' }}>{p.client_nom || '—'}</td>
                          <td style={{ padding: '9px 10px', borderBottom: '0.5px solid var(--border)' }}><span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '7px', background: tp.bg, color: tp.color }}>{tp.label}</span></td>
                          <td style={{ fontSize: '13px', color: '#4ade80', padding: '9px 10px', borderBottom: '0.5px solid var(--border)' }}>{p.budget.toLocaleString('fr-FR')} €</td>
                          <td style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '9px 10px', borderBottom: '0.5px solid var(--border)' }}>{p.date_deadline || '—'}</td>
                          <td style={{ fontSize: '13px', color: PRIO[p.priorite] || '#888', padding: '9px 10px', borderBottom: '0.5px solid var(--border)' }}>{p.priorite}</td>
                          <td style={{ padding: '9px 10px', borderBottom: '0.5px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '70px', height: '4px', background: 'var(--border-subtle)', borderRadius: '2px' }}>
                                <div style={{ height: '4px', borderRadius: '2px', background: p.progression === 100 ? '#4ade80' : '#ff6b2b', width: `${p.progression}%` }} />
                              </div>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.progression}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Détail */}
          {(!isMobile || showDetail) && <DetailPanel />}
        </div>
      </div>
    </>
  )
}

export default function Projets() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)', fontSize: '14px' }}>Chargement...</div>}>
      <ProjetsInner />
    </Suspense>
  )
}