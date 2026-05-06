'use client'

import { useState } from 'react'
import { useEvenements, Evenement } from '@/hooks/useEvenements'
import EvenementModal from '@/components/EvenementModal'
import { useIsMobile } from '@/hooks/useIsMobile'

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
  const isMobile = useIsMobile()
  const today = new Date()
  const [viewYear, setViewYear]     = useState(today.getFullYear())
  const [viewMonth, setViewMonth]   = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState(today.getDate())
  const [modal, setModal]           = useState<'add' | 'edit' | null>(null)
  const [editEv, setEditEv]         = useState<Evenement | null>(null)
  const [showPanel, setShowPanel]   = useState(false)

  function changeMonth(dir: number) {
    let m = viewMonth + dir, y = viewYear
    if (m > 11) { m = 0; y++ }
    if (m < 0)  { m = 11; y-- }
    setViewMonth(m); setViewYear(y)
  }

  function getDayEvents(d: number, m: number, y: number) {
    return evenements.filter(e => e.date_jour === d && e.date_mois === m + 1 && e.date_annee === y)
  }

  async function handleSave(data: Omit<Evenement, 'id' | 'created_at'>) {
    if (modal === 'edit' && editEv) { await updateEvenement(editEv.id, data) }
    else { await addEvenement(data) }
  }

  async function handleToggleCheck(ev: Evenement, idx: number) {
    const checks = ev.checks.map((c, i) => i === idx ? { ...c, done: !c.done } : c)
    await toggleCheck(ev.id, checks)
  }

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay()
  const offset      = firstDay === 0 ? 6 : firstDay - 1
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const daysInPrev  = new Date(viewYear, viewMonth, 0).getDate()
  const total       = Math.ceil((offset + daysInMonth) / 7) * 7
  const dayEvents   = getDayEvents(selectedDay, viewMonth, viewYear)

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)', fontSize: '14px' }}>Chargement...</div>

  const DayPanel = () => (
    <div style={{ width: isMobile ? '100%' : '290px', borderLeft: isMobile ? 'none' : '0.5px solid var(--border)', background: 'var(--bg-tertiary)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
      <div style={{ padding: '1rem', borderBottom: '0.5px solid var(--border-subtle)', flexShrink: 0 }}>
        {isMobile && <button onClick={() => setShowPanel(false)} style={{ background: 'transparent', border: 'none', color: '#ff6b2b', fontSize: '14px', cursor: 'pointer', marginBottom: '.5rem', padding: 0 }}>← Calendrier</button>}
        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
          {new Date(viewYear, viewMonth, selectedDay).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{dayEvents.length ? `${dayEvents.length} événement${dayEvents.length > 1 ? 's' : ''}` : 'Aucun événement'}</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {dayEvents.length === 0 && (
          <div style={{ fontSize: '13px', color: 'var(--text-faint)', marginBottom: '1rem' }}>
            Aucun événement.
            <br /><span onClick={() => setModal('add')} style={{ color: '#ff6b2b', cursor: 'pointer', fontSize: '12px' }}>+ Ajouter</span>
          </div>
        )}
        {dayEvents.map(ev => {
          const tp = TYPES[ev.type] || TYPES.autre
          return (
            <div key={ev.id} style={{ background: 'var(--card-bg)', border: '0.5px solid var(--border-subtle)', borderRadius: '10px', padding: '.75rem', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '.375rem' }}>
                <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '6px', background: tp.bg, color: tp.color }}>{tp.label}</span>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button onClick={() => { setEditEv(ev); setModal('edit') }} style={{ background: 'transparent', border: 'none', color: 'var(--text-faint)', fontSize: '11px', cursor: 'pointer' }}>✏️</button>
                  <button onClick={() => deleteEvenement(ev.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-faint)', fontSize: '11px', cursor: 'pointer' }}>🗑️</button>
                </div>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500, marginBottom: '3px' }}>{ev.titre}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                {ev.heure    && <div>⏰ {ev.heure}</div>}
                {ev.lieu     && <div>📍 {ev.lieu}</div>}
                {ev.contact  && <div>👤 {ev.contact}</div>}
              </div>
              {ev.checks.length > 0 && (
                <div style={{ marginTop: '.5rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {ev.checks.map((c, ci) => (
                    <div key={ci} onClick={() => handleToggleCheck(ev, ci)} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '3px', border: '0.5px solid', borderColor: c.done ? '#ff6b2b' : 'var(--border)', background: c.done ? '#ff6b2b' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#fff', flexShrink: 0 }}>{c.done ? '✓' : ''}</div>
                      <span style={{ fontSize: '11px', color: c.done ? 'var(--text-faint)' : 'var(--text-secondary)', textDecoration: c.done ? 'line-through' : 'none' }}>{c.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
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

        <div style={{ padding: '1rem 1.25rem', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, background: 'var(--card-bg)', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)', flex: 1 }}>Planning</div>
          <button onClick={() => changeMonth(-1)} style={{ background: 'transparent', border: '0.5px solid var(--border-subtle)', borderRadius: '6px', padding: '4px 10px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>‹</button>
          <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500, minWidth: isMobile ? 'auto' : '140px', textAlign: 'center' }}>{MONTHS_FR[viewMonth].substring(0, isMobile ? 3 : 99)} {viewYear}</div>
          <button onClick={() => changeMonth(1)}  style={{ background: 'transparent', border: '0.5px solid var(--border-subtle)', borderRadius: '6px', padding: '4px 10px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>›</button>
          {!isMobile && <button onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); setSelectedDay(today.getDate()) }} style={{ background: 'transparent', border: '0.5px solid var(--border-subtle)', borderRadius: '8px', padding: '5px 12px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>Auj.</button>}
          <button onClick={() => { setModal('add'); setEditEv(null) }} style={{ background: '#ff6b2b', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>+ Événement</button>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Calendrier — caché sur mobile si panel ouvert */}
          {(!isMobile || !showPanel) && (
            <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-primary)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
                {DAYS_FR.map((d, i) => (
                  <div key={d} style={{ fontSize: '10px', color: i >= 5 ? '#f87171' : 'var(--text-faint)', textAlign: 'center', padding: '4px 0', textTransform: 'uppercase', letterSpacing: '.5px' }}>{d}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', flex: 1 }}>
                {Array.from({ length: total }, (_, i) => {
                  let d: number, m = viewMonth, y = viewYear, isOther = false
                  if (i < offset) { d = daysInPrev - (offset - 1 - i); m = viewMonth - 1 < 0 ? 11 : viewMonth - 1; y = viewMonth === 0 ? viewYear - 1 : viewYear; isOther = true }
                  else if (i >= offset + daysInMonth) { d = i - offset - daysInMonth + 1; m = viewMonth + 1 > 11 ? 0 : viewMonth + 1; y = viewMonth === 11 ? viewYear + 1 : viewYear; isOther = true }
                  else { d = i - offset + 1 }
                  const isToday = d === today.getDate() && m === today.getMonth() && y === today.getFullYear()
                  const isSel   = d === selectedDay && m === viewMonth && y === viewYear && !isOther
                  const evs     = getDayEvents(d, m, y)
                  return (
                    <div key={i} onClick={() => { if (!isOther) { setSelectedDay(d); if (isMobile) setShowPanel(true) } }} style={{ background: isSel ? '#1a1008' : 'var(--bg-tertiary)', border: '0.5px solid', borderColor: isSel ? '#ff6b2b' : isToday ? '#ff6b2b55' : 'var(--border-subtle)', borderRadius: '8px', padding: isMobile ? '4px' : '6px', minHeight: isMobile ? '45px' : '70px', cursor: isOther ? 'default' : 'pointer', opacity: isOther ? .35 : 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ fontSize: isMobile ? '11px' : '12px', color: isToday ? '#ff6b2b' : 'var(--text-muted)', fontWeight: isToday ? 500 : 400 }}>{d}</div>
                      {!isMobile && evs.slice(0, 2).map((ev, ei) => {
                        const tp = TYPES[ev.type] || TYPES.autre
                        return <div key={ei} style={{ fontSize: '10px', padding: '1px 4px', borderRadius: '3px', background: tp.bg, color: tp.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.titre}</div>
                      })}
                      {evs.length > 0 && isMobile && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff6b2b', marginTop: '2px' }} />}
                      {evs.length > 2 && !isMobile && <div style={{ fontSize: '9px', color: 'var(--text-faint)' }}>+{evs.length - 2}</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Panel jour */}
          {(!isMobile || showPanel) && <DayPanel />}
        </div>
      </div>
    </>
  )
}