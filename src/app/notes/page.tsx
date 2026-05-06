'use client'

import { useState } from 'react'

type Note = {
  id: number; titre: string; contenu: string; cat: string; date: string; pinned: boolean
}

const CATS: Record<string, { label: string; color: string; bg: string }> = {
  idee:    { label: 'Idée vidéo',     color: '#a78bfa', bg: '#150d20' },
  script:  { label: 'Script',         color: '#60a5fa', bg: '#0d1520' },
  hook:    { label: 'Hook RS',        color: '#fb923c', bg: '#1a1008' },
  business:{ label: 'Business',       color: '#4ade80', bg: '#0d1f0d' },
  rapide:  { label: 'Note rapide',    color: '#888',    bg: '#1e1e22' },
}

const initialNotes: Note[] = [
  { id: 1, titre: 'Idée série "Chantier en coulisses"',       cat: 'idee',     date: '1 mai 2026',   pinned: true,  contenu: `Série de 6 épisodes courts (60s) montrant les coulisses d'un chantier BTP.\n\nFormat :\n- Épisode 1 : Les fondations\n- Épisode 2 : La structure\n- Épisode 3 : Le gros oeuvre\n\nCible : PME BTP pour LinkedIn et Instagram.\nBudget estimé : 3 000 € la série.` },
  { id: 2, titre: 'Hook "Avant / Après rénovation"',           cat: 'hook',     date: '30 avr. 2026', pinned: true,  contenu: `"Ce chantier semblait impossible. 6 mois plus tard..."\n\n3 secondes pour accrocher, transition choc avant/après.\n\nFonctionne très bien pour les artisans et les agences immo.` },
  { id: 3, titre: 'Script interview Nathalie Costa',           cat: 'script',   date: '29 avr. 2026', pinned: false, contenu: `Questions pour l'interview SolidBuild :\n\n1. Présentez-vous et votre rôle chez SolidBuild\n2. Quels sont vos grands projets cette année ?\n3. Comment gérez-vous les défis du secteur BTP ?\n4. Qu'est-ce qui vous rend fier de votre entreprise ?\n5. Message à vos futurs clients ?` },
  { id: 4, titre: 'Idée : offre "Pack Réseaux Sociaux"',      cat: 'business', date: '28 avr. 2026', pinned: false, contenu: `Nouvelle offre à créer :\n\nPack RS mensuel :\n- 8 vidéos courtes (30s)\n- 4 photos professionnelles\n- 2 stories animées\n\nPrix : 800 €/mois\nCible : artisans et PME locales\n\nÀ tester avec Maison+ en premier.` },
  { id: 5, titre: 'Hook "Drone au lever du soleil"',           cat: 'hook',     date: '27 avr. 2026', pinned: false, contenu: `"5h30 du matin. Le chantier dort encore. Nous, on tourne."\n\nPuissant pour les tournages drone early morning.\nCrée une ambiance cinématographique immédiate.` },
  { id: 6, titre: 'Mémo : tarifs 2026',                        cat: 'rapide',   date: '25 avr. 2026', pinned: false, contenu: `Demi-journée tournage : 600 €\nJournée tournage : 1 000 €\nDrone demi-journée : 700 €\nMontage vidéo 1 min : 300 €\nMontage vidéo 3 min : 600 €\nInterview corporate : 750 €\nPack RS mensuel : 800 €` },
  { id: 7, titre: 'Idée collab avec photographe',              cat: 'idee',     date: '20 avr. 2026', pinned: false, contenu: `Partenariat avec un photographe local pour proposer des offres combinées photo + vidéo.\n\nAvantages :\n- Offre plus complète pour les clients\n- Partage des frais de déplacement\n- Cross-promotion\n\nContacter Léa Martin (Instagram : @leamartinphoto)` },
]

export default function Notes() {
  const [notes, setNotes]       = useState<Note[]>(initialNotes)
  const [selectedId, setSelectedId] = useState(1)
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('toutes')
  const [editing, setEditing]   = useState(false)
  const [editContent, setEditContent] = useState('')

  const selected = notes.find(n => n.id === selectedId)!

  const filtered = notes.filter(n => {
    const mq = !search || n.titre.toLowerCase().includes(search.toLowerCase()) || n.contenu.toLowerCase().includes(search.toLowerCase())
    const mf = filter === 'toutes' || n.cat === filter
    return mq && mf
  })

  const pinned   = filtered.filter(n => n.pinned)
  const unpinned = filtered.filter(n => !n.pinned)

  function addNote() {
    const newNote: Note = {
      id: Date.now(), titre: 'Nouvelle note', contenu: '', cat: 'rapide',
      date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      pinned: false,
    }
    setNotes(prev => [newNote, ...prev])
    setSelectedId(newNote.id)
    setEditing(true)
    setEditContent('')
  }

  function togglePin(id: number) {
    setNotes(prev => prev.map(n => n.id !== id ? n : { ...n, pinned: !n.pinned }))
  }

  function deleteNote(id: number) {
    setNotes(prev => prev.filter(n => n.id !== id))
    setSelectedId(notes.find(n => n.id !== id)?.id || 0)
  }

  function saveEdit() {
    setNotes(prev => prev.map(n => n.id !== selectedId ? n : { ...n, contenu: editContent }))
    setEditing(false)
  }

  const NoteRow = ({ n }: { n: Note }) => {
    const ct = CATS[n.cat]
    return (
      <div onClick={() => { setSelectedId(n.id); setEditing(false) }} style={{ padding: '.625rem .75rem', borderRadius: '8px', cursor: 'pointer', marginBottom: '2px', background: n.id === selectedId ? '#1a1008' : 'transparent', border: '0.5px solid', borderColor: n.id === selectedId ? '#ff6b2b22' : 'transparent' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
          <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '8px', background: ct.bg, color: ct.color }}>{ct.label}</span>
          {n.pinned && <span style={{ fontSize: '10px', color: '#ff6b2b' }}>📌</span>}
        </div>
        <div style={{ fontSize: '13px', color: '#ddd', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.titre}</div>
        <div style={{ fontSize: '11px', color: '#555', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.contenu.split('\n')[0]}</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* Top bar */}
      <div style={{ padding: '1rem 1.25rem', borderBottom: '0.5px solid #222', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div style={{ fontSize: '16px', fontWeight: 500, color: '#fff', flex: 1 }}>Notes & Idées</div>
        <button onClick={addNote} style={{ background: '#ff6b2b', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>+ Nouvelle note</button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Liste */}
        <div style={{ width: '260px', borderRight: '0.5px solid #222', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '.875rem 1rem', borderBottom: '0.5px solid #1e1e22' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ background: '#161618', border: '0.5px solid #2a2a2e', borderRadius: '8px', padding: '6px 10px', fontSize: '13px', color: '#ccc', width: '100%', outline: 'none', marginBottom: '.5rem' }} />
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {['toutes', 'idee', 'script', 'hook', 'business', 'rapide'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', cursor: 'pointer', border: '0.5px solid', borderColor: filter === f ? '#ff6b2b44' : '#2a2a2e', background: filter === f ? '#1a1008' : 'transparent', color: filter === f ? '#ff6b2b' : '#555' }}>
                  {f === 'toutes' ? 'Toutes' : CATS[f]?.label || f}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '.5rem' }}>
            {pinned.length > 0 && (
              <>
                <div style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '.5px', padding: '.375rem .5rem .2rem', fontWeight: 500 }}>Épinglées ({pinned.length})</div>
                {pinned.map(n => <NoteRow key={n.id} n={n} />)}
              </>
            )}
            {unpinned.length > 0 && (
              <>
                <div style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '.5px', padding: '.75rem .5rem .2rem', fontWeight: 500 }}>Notes ({unpinned.length})</div>
                {unpinned.map(n => <NoteRow key={n.id} n={n} />)}
              </>
            )}
          </div>
        </div>

        {/* Détail */}
        {selected && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '0.5px solid #1e1e22', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              <span style={{ fontSize: '11px', padding: '2px 9px', borderRadius: '10px', background: CATS[selected.cat].bg, color: CATS[selected.cat].color }}>{CATS[selected.cat].label}</span>
              <div style={{ fontSize: '13px', color: '#555', flex: 1 }}>{selected.date}</div>
              <button onClick={() => togglePin(selected.id)} style={{ background: selected.pinned ? '#1a1008' : 'transparent', border: '0.5px solid', borderColor: selected.pinned ? '#ff6b2b44' : '#2a2a2e', borderRadius: '7px', padding: '4px 10px', fontSize: '12px', color: selected.pinned ? '#ff6b2b' : '#888', cursor: 'pointer' }}>
                {selected.pinned ? '📌 Épinglée' : 'Épingler'}
              </button>
              {!editing
                ? <button onClick={() => { setEditing(true); setEditContent(selected.contenu) }} style={{ background: '#161618', border: '0.5px solid #2a2a2e', borderRadius: '7px', padding: '4px 10px', fontSize: '12px', color: '#888', cursor: 'pointer' }}>Modifier</button>
                : <button onClick={saveEdit} style={{ background: '#ff6b2b', border: 'none', borderRadius: '7px', padding: '4px 10px', fontSize: '12px', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>Sauvegarder</button>
              }
              <button onClick={() => deleteNote(selected.id)} style={{ background: '#1a0a0a', border: '0.5px solid #f8717133', borderRadius: '7px', padding: '4px 10px', fontSize: '12px', color: '#f87171', cursor: 'pointer' }}>Supprimer</button>
            </div>

            <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
              <div style={{ fontSize: '20px', fontWeight: 500, color: '#fff', marginBottom: '1rem' }}>{selected.titre}</div>
              {editing
                ? <textarea value={editContent} onChange={e => setEditContent(e.target.value)} style={{ width: '100%', minHeight: '400px', background: '#161618', border: '0.5px solid #2a2a2e', borderRadius: '8px', padding: '1rem', fontSize: '14px', color: '#ccc', lineHeight: 1.7, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
                : <div style={{ fontSize: '14px', color: '#888', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{selected.contenu}</div>
              }
            </div>
          </div>
        )}
      </div>
    </div>
  )
}