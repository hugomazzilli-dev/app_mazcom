'use client'

import { useState } from 'react'
import { useEvenements, Evenement, CheckItem } from '@/hooks/useEvenements'
import EvenementModal from '@/components/EvenementModal'

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const DAYS_FR   = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

const TYPES: Record<string, { color: string; bg: string; label: string }> = {
  drone:     { color: '#60a5fa', bg: '#0d1520', label: 'Drone' },
  corporate: { color: '#a78bfa', bg: '#150d20', label: 'Corporate' },
  interview: { color: '#c084fc', bg: '#1a1530', label: 'Interview' },
  deadline:  { color: '#fb923c', bg: '#1a1008', label: 'Deadline' },
  livraison: { color: '#4ade80', bg: '#0d1f0d', label: 'Livraison' },
  relance:   { color: '#f87171', bg: '#1a0a0a', label: 'Relance' },
  rdv:       { color: '#fbbf24', bg: '#15100d', label: 'RDV' },
  autre:     { color: '#888',    bg: '#1e1e22', label: 'Autre' },
  tournage:  { color: '#60a5fa', bg: '#0d1520', label: 'Tournage' },
}

export default function Planning() {
  const { evenements, loading, addEvenement, updateEvenement, deleteEvenement, toggleCheck } = useEvenements()
  const today = new Date()
  const [viewYear, setViewYear]   = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState(today.getDate())
  const [modal, setModal]         = useState<'add' | 'edit' | null>(null)
  const [editEv, setEditEv]       = useState<Evenement | null>(null)

  function changeMonth(dir: number) {
    let m = viewMonth + dir, y = viewYear
    if (m > 11) { m = 0; y++ }
    if (m < 0)  { m = 11; y-- }
    setViewMonth(m); setViewYear(y)
  }

  function getDayEvents(d: number, m: number, y: number) {
    return evenements.filter(e =>
      e.date_jour === d && e.date_mois === m + 1 && e.date_annee === y
    )
  }

  async function handleSave(data: Omit<Evenement, 'id' | 'created_at'>) {
    if (modal === 'edit' && editEv) {
      await updateEvenement(editEv.id, data)
    } else {
      await addEvenement(data)
    }
  }

  async function handleToggleCheck(ev: Evenement, idx: number) {
    const checks = ev.checks.map((c, i) =>
      i === idx ? { ...c, done: !c.done } : c
    )
    await toggleCheck(ev.id, checks)
  }

  async function handleDelete(id: string) {
    await deleteEvenement(id)
  }

  const firstDay     = new Date(viewYear, viewMonth, 1).getDay()
  const offset       = firstDay === 0 ? 6 : firstDay - 1
  const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate()
  const daysInPrev   = new Date(viewYear, viewMonth, 0).getDate()
  const total        = Math.ceil((offset + daysInMonth) / 7) * 7

  const dayEvents    = getDayEvents(selectedDay, viewMonth, viewYear)

  const upcoming = evenements.filter(e => {
    const evDate  = new Date(e.date_annee, e.date_mois - 1, e.date_jour)
    const selDate = new Date(viewYear, viewMonth, selectedDay)
    return evDate > selDate
  }).slice(0, 5)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#555', fontSize: '14px' }}>
      Chargement du planning...
    </div>
  )

  return (
    <>
      {modal && (
        <EvenementModal
          evenement={modal === 'edit' ? editEv : null}
          defaultDate={{ jour: selectedDay, mois: viewMonth + 1, annee: viewYear }}
          onClose={() => { setModal(null); setEditEv(null) }}
          onSave={handleSave}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '0.5px solid #222', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{ fontSize: '16px', fontWeight: 500, color: '#fff', flex: 1 }}>Planning</div>
          <button onClick={() => changeMonth(-1)} style={{ background: 'transparent', border: '0.5px solid #2a2a2e', borderRadius: '6px', padding: '4px 10px', fontSize: '13px', color: '#888', cursor: 'pointer' }}>‹</button>
          <div style={{ fontSize: '14px', color: '#fff', fontWeight: 500, minWidth: '140px', textAlign: 'center' }}>{MONTHS_FR[viewMonth]} {viewYear}</div>
          <button onClick={() => changeMonth(1)}  style={{ background: 'transparent', border: '0.5px solid #2a2a2e', borderRadius: '6px', padding: '4px 10px', fontSize: '13px', color: '#888', cursor: 'pointer' }}>›</button>
          <button onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); setSelectedDay(today.getDate()) }} style={{ background: 'transparent', border: '0.5px solid #2a2a2e', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', color: '#888', cursor: 'pointer' }}>Aujourd'hui</button>
          <button onClick={() => { setModal('add'); setEditEv(null) }} style={{ background: '#ff6b2b', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>+ Événement</button>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Calendrier */}
          <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Jours semaine */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
              {DAYS_FR.map((d, i) => (
                <div key={d} style={{ fontSize: '11px', color: i >= 5 ? '#f87171' : '#444', textAlign: 'center', padding: '4px 0', textTransform: 'uppercase', letterSpacing: '.5px' }}>{d}</div>
              ))}
            </div>

            {/* Grille */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', flex: 1 }}>
              {Array.from({ length: total }, (_, i) => {
                let d: number, m = viewMonth, y = viewYear, isOther = false
                if (i < offset) {
                  d = daysInPrev - (offset - 1 - i)
                  m = viewMonth - 1 < 0 ? 11 : viewMonth - 1
                  y = viewMonth === 0 ? viewYear - 1 : viewYear
                  isOther = true
                } else if (i >= offset + daysInMonth) {
                  d = i - offset - daysInMonth + 1
                  m = viewMonth + 1 > 11 ? 0 : viewMonth + 1
                  y = viewMonth === 11 ? viewYear + 1 : viewYear
                  isOther = true
                } else {
                  d = i - offset + 1
                }

                const isToday = d === today.getDate() && m === today.getMonth() && y === today.getFullYear()
                const isSel   = d === selectedDay && m === viewMonth && y === viewYear && !isOther
                const evs     = getDayEvents(d, m, y)

                return (
                  <div key={i} onClick={() => !isOther && setSelectedDay(d)} style={{
                    background: isSel ? '#1a1008' : '#111113',
                    border: '0.5px solid', borderColor: isSel ? '#ff6b2b' : isToday ? '#ff6b2b55' : '#1e1e22',
                    borderRadius: '8px', padding: '6px', minHeight: '70px',
                    cursor: isOther ? 'default' : 'pointer', opacity: isOther ? .35 : 1,
                    display: 'flex', flexDirection: 'column', gap: '3px',
                  }}>
                    <div style={{ fontSize: '12px', color: isToday ? '#ff6b2b' : '#555', fontWeight: isToday ? 500 : 400 }}>{d}</div>
                    {evs.slice(0, 2).map((ev, ei) => {
                      const tp = TYPES[ev.type] || TYPES.autre
                      return (
                        <div key={ei} style={{ fontSize: '10px', padding: '2px 5px', borderRadius: '4px', background: tp.bg, color: tp.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.4 }}>
                          {ev.titre}
                        </div>
                      )
                    })}
                    {evs.length > 2 && <div style={{ fontSize: '9px', color: '#555' }}>+{evs.length - 2} autres</div>}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Panneau latéral */}
          <div style={{ width: '290px', borderLeft: '0.5px solid #222', background: '#0d0d0f', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ padding: '1rem', borderBottom: '0.5px solid #1e1e22', flexShrink: 0 }}>
              <div style={{ fontSize: '15px', fontWeight: 500, color: '#fff', marginBottom: '.25rem', textTransform: 'capitalize' }}>
                {new Date(viewYear, viewMonth, selectedDay).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
              <div style={{ fontSize: '12px', color: '#555' }}>
                {dayEvents.length ? `${dayEvents.length} événement${dayEvents.length > 1 ? 's' : ''}` : 'Aucun événement'}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>

              {/* Événements du jour */}
              {dayEvents.length > 0 && (
                <>
                  <div style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 500, marginBottom: '.5rem' }}>Ce jour</div>
                  {dayEvents.map((ev) => {
                    const tp = TYPES[ev.type] || TYPES.autre
                    return (
                      <div key={ev.id} style={{ background: '#161618', border: '0.5px solid #1e1e22', borderRadius: '10px', padding: '.75rem', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '.375rem' }}>
                          <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '6px', background: tp.bg, color: tp.color }}>{tp.label}</span>
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button onClick={() => { setEditEv(ev); setModal('edit') }} style={{ background: 'transparent', border: 'none', color: '#555', fontSize: '11px', cursor: 'pointer' }}>✏️</button>
                            <button onClick={() => handleDelete(ev.id)} style={{ background: 'transparent', border: 'none', color: '#555', fontSize: '11px', cursor: 'pointer' }}>🗑️</button>
                          </div>
                        </div>
                        <div style={{ fontSize: '13px', color: '#ddd', marginBottom: '3px', fontWeight: 500 }}>{ev.titre}</div>
                        <div style={{ fontSize: '11px', color: '#555', lineHeight: 1.7 }}>
                          {ev.heure    && <div>⏰ {ev.heure}</div>}
                          {ev.lieu     && <div>📍 {ev.lieu}</div>}
                          {ev.contact  && <div>👤 {ev.contact}</div>}
                          {ev.materiel && <div>🎒 {ev.materiel}</div>}
                        </div>
                        {ev.checks.length > 0 && (
                          <div style={{ marginTop: '.5rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {ev.checks.map((c, ci) => (
                              <div key={ci} onClick={() => handleToggleCheck(ev, ci)} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '3px', border: '0.5px solid', borderColor: c.done ? '#ff6b2b' : '#333', background: c.done ? '#ff6b2b' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#fff', flexShrink: 0 }}>{c.done ? '✓' : ''}</div>
                                <span style={{ fontSize: '11px', color: c.done ? '#444' : '#777', textDecoration: c.done ? 'line-through' : 'none' }}>{c.label}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </>
              )}

              {dayEvents.length === 0 && (
                <div style={{ fontSize: '13px', color: '#444', marginBottom: '1rem' }}>
                  Aucun événement ce jour.
                  <br />
                  <span onClick={() => setModal('add')} style={{ color: '#ff6b2b', cursor: 'pointer', fontSize: '12px' }}>+ Ajouter un événement</span>
                </div>
              )}

              {/* À venir */}
              {upcoming.length > 0 && (
                <div style={{ marginTop: dayEvents.length > 0 ? '1rem' : 0 }}>
                  <div style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 500, marginBottom: '.5rem' }}>À venir</div>
                  {upcoming.map(ev => {
                    const evDate  = new Date(ev.date_annee, ev.date_mois - 1, ev.date_jour)
                    const selDate = new Date(viewYear, viewMonth, selectedDay)
                    const diff    = Math.round((evDate.getTime() - selDate.getTime()) / 86400000)
                    const tp      = TYPES[ev.type] || TYPES.autre
                    return (
                      <div key={ev.id} style={{ display: 'flex', gap: '8px', padding: '6px 0', borderBottom: '0.5px solid #161618', alignItems: 'flex-start' }}>
                        <div style={{ fontSize: '11px', color: '#555', width: '36px', flexShrink: 0, paddingTop: '2px' }}>J+{diff}</div>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: tp.color, flexShrink: 0, marginTop: '5px' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', color: '#ccc' }}>{ev.titre}</div>
                          <div style={{ fontSize: '11px', color: '#444', marginTop: '1px' }}>{ev.heure}{ev.lieu ? ' · ' + ev.lieu : ''}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Légende */}
            <div style={{ padding: '.75rem 1rem', borderTop: '0.5px solid #1e1e22', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['drone','corporate','deadline','livraison','relance','rdv'].map(t => {
                const tp = TYPES[t]
                return (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#555' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: tp.color }} />
                    {tp.label}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}