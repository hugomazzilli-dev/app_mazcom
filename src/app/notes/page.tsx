'use client'

import { useState } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'

type Note = { id: number; titre: string; contenu: string; cat: string; date: string; pinned: boolean }

const CATS: Record<string, { label: string; color: string; bg: string }> = {
  idee:    { label: 'Idée vidéo',  color: '#a78bfa', bg: '#150d20' },
  script:  { label: 'Script',      color: '#60a5fa', bg: '#0d1520' },
  hook:    { label: 'Hook RS',     color: '#fb923c', bg: '#1a1008' },
  business:{ label: 'Business',    color: '#4ade80', bg: '#0d1f0d' },
  rapide:  { label: 'Note rapide', color: '#888',    bg: '#1e1e22' },
}

const initialNotes: Note[] = [
  { id: 1, titre: 'Idée série "Chantier en coulisses"', cat: 'idee', date: '1 mai 2026', pinned: true, contenu: `Série de 6 épisodes courts (60s) montrant les coulisses d'un chantier BTP.\nCible : PME BTP pour LinkedIn et Instagram.\nBudget estimé : 3 000 € la série.` },
  { id: 2, titre: 'Hook "Avant / Après rénovation"',    cat: 'hook', date: '30 avr. 2026', pinned: true, contenu: `"Ce chantier semblait impossible. 6 mois plus tard..."\n3 secondes pour accrocher, transition choc avant/après.` },
  { id: 3, titre: 'Mémo : tarifs 2026', cat: 'rapide', date: '25 avr. 2026', pinned: false, contenu: `Demi-journée tournage : 600 €\nJournée tournage : 1 000 €\nDrone demi-journée : 700 €\nMontage vidéo 1 min : 300 €` },
]

export default function Notes() {
  const isMobile = useIsMobile()
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [selectedId, setSelectedId] = useState(1)
  const [showDetail, setShowDetail] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('toutes')
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState('')

  const selected = notes.find(n => n.id === selectedId)!
  const filtered = notes.filter(n => {
    const mq = !search || n.titre.toLowerCase().includes(search.toLowerCase())
    const mf = filter === 'toutes' || n.cat === filter
    return mq && mf
  })
  const pinned   = filtered.filter(n => n.pinned)
  const unpinned = filtered.filter(n => !n.pinned)

  function addNote() {
    const n: Note = { id: Date.now(), titre: 'Nouvelle note', contenu: '', cat: 'rapide', date: new Date().toLocaleDateString('fr-FR'), pinned: false }
    setNotes(prev => [n, ...prev])
    setSelectedId(n.id); setEditing(true); setEditContent('')
    if (isMobile) setShowDetail(true)
  }

  function selectNote(id: number) {
    setSelectedId(id); setEditing(false)
    if (isMobile) setShowDetail(true)
  }

  function saveEdit() {
    setNotes(prev => prev.map(n => n.id !== selectedId ? n : { ...n, contenu: editContent }))
    setEditing(false)
  }

  function togglePin(id: number) { setNotes(prev => prev.map(n => n.id !== id ? n : { ...n, pinned: !n.pinned })) }
  function deleteNote(id: number) { setNotes(prev => prev.filter(n => n.id !== id)); if (isMobile) setShowDetail(false) }

  const NoteRow = ({ n }: { n: Note }) => {
    const ct = CATS[n.cat]
    return (
      <div onClick={() => selectNote(n.id)} style={{ padding: '.625rem .75rem', borderRadius: '8px', cursor: 'pointer', marginBottom: '2px', background: n.id === selectedId && !isMobile ? '#1a1008' : 'transparent', border: '0.5px solid', borderColor: n.id === selectedId && !isMobile ? '#ff6b2b22' : 'transparent' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
          <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '8px', background: ct.bg, color: ct.color }}>{ct.label}</span>
          {n.pinned && <span style={{ fontSize: '10px', color: '#ff6b2b' }}>📌</span>}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.titre}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.contenu.split('\n')[0]}</div>
        {isMobile && <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text-faint)', marginTop: '2px' }}>›</div>}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, background: 'var(--card-bg)' }}>
        <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)', flex: 1 }}>Notes & Idées</div>
        <button onClick={addNote} style={{ background: '#ff6b2b', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>+ Note</button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Liste */}
        {(!isMobile || !showDetail) && (
          <div style={{ width: isMobile ? '100%' : '260px', borderRight: isMobile ? 'none' : '0.5px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ padding: '.875rem 1rem', borderBottom: '0.5px solid var(--border-subtle)', background: 'var(--bg-primary)' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ background: 'var(--input-bg)', border: '0.5px solid var(--border-subtle)', borderRadius: '8px', padding: '6px 10px', fontSize: '13px', color: 'var(--text-primary)', width: '100%', outline: 'none', marginBottom: '.5rem' }} />
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {['toutes','idee','script','hook','business','rapide'].map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', cursor: 'pointer', border: '0.5px solid', borderColor: filter === f ? '#ff6b2b44' : 'var(--border-subtle)', background: filter === f ? '#1a1008' : 'transparent', color: filter === f ? '#ff6b2b' : 'var(--text-muted)' }}>
                    {f === 'toutes' ? 'Toutes' : CATS[f]?.label || f}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '.5rem', background: 'var(--bg-primary)' }}>
              {pinned.length > 0 && <>
                <div style={{ fontSize: '10px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', padding: '.375rem .5rem .2rem', fontWeight: 500 }}>Épinglées</div>
                {pinned.map(n => <NoteRow key={n.id} n={n} />)}
              </>}
              {unpinned.length > 0 && <>
                <div style={{ fontSize: '10px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.5px', padding: '.75rem .5rem .2rem', fontWeight: 500 }}>Notes</div>
                {unpinned.map(n => <NoteRow key={n.id} n={n} />)}
              </>}
            </div>
          </div>
        )}

        {/* Détail */}
        {(!isMobile || showDetail) && selected && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '0.5px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, flexWrap: 'wrap', background: 'var(--card-bg)' }}>
              {isMobile && <button onClick={() => setShowDetail(false)} style={{ background: 'transparent', border: 'none', color: '#ff6b2b', fontSize: '14px', cursor: 'pointer', padding: 0, marginRight: '4px' }}>←</button>}
              <span style={{ fontSize: '11px', padding: '2px 9px', borderRadius: '10px', background: CATS[selected.cat].bg, color: CATS[selected.cat].color }}>{CATS[selected.cat].label}</span>
              <div style={{ fontSize: '12px', color: 'var(--text-faint)', flex: 1 }}>{selected.date}</div>
              <button onClick={() => togglePin(selected.id)} style={{ background: selected.pinned ? '#1a1008' : 'transparent', border: '0.5px solid', borderColor: selected.pinned ? '#ff6b2b44' : 'var(--border-subtle)', borderRadius: '7px', padding: '4px 8px', fontSize: '11px', color: selected.pinned ? '#ff6b2b' : 'var(--text-muted)', cursor: 'pointer' }}>📌</button>
              {!editing
                ? <button onClick={() => { setEditing(true); setEditContent(selected.contenu) }} style={{ background: 'var(--card-bg)', border: '0.5px solid var(--border-subtle)', borderRadius: '7px', padding: '4px 8px', fontSize: '11px', color: 'var(--text-secondary)', cursor: 'pointer' }}>Modifier</button>
                : <button onClick={saveEdit} style={{ background: '#ff6b2b', border: 'none', borderRadius: '7px', padding: '4px 8px', fontSize: '11px', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>Sauvegarder</button>}
              <button onClick={() => deleteNote(selected.id)} style={{ background: '#1a0a0a', border: '0.5px solid #f8717133', borderRadius: '7px', padding: '4px 8px', fontSize: '11px', color: '#f87171', cursor: 'pointer' }}>Suppr.</button>
            </div>
            <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', background: 'var(--bg-primary)' }}>
              <div style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '1rem' }}>{selected.titre}</div>
              {editing
                ? <textarea value={editContent} onChange={e => setEditContent(e.target.value)} style={{ width: '100%', minHeight: '300px', background: 'var(--card-bg)', border: '0.5px solid var(--border-subtle)', borderRadius: '8px', padding: '1rem', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
                : <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{selected.contenu}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}