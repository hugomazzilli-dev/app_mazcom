'use client'

import { useState } from 'react'
import { useFinances, Document } from '@/hooks/useFinances'
import FinanceModal from '@/components/FinanceModal'
import { generatePDF } from '@/lib/generatePDF'
import { supabase } from '@/lib/supabase'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

const CA_PREV = [3000,3800,3500,4800,7500,6000,7000,8000,6500,7000,8500,9000]
const MOIS    = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

function fmt(n: number) { return n.toLocaleString('fr-FR') + ' €' }
function statusLabel(s: string) { return s === 'paid' ? 'Payée' : s === 'late' ? 'En retard' : s === 'pending' ? 'En attente' : 'Brouillon' }
function statusColor(s: string) { return s === 'paid' ? '#4ade80' : s === 'late' ? '#f87171' : s === 'pending' ? '#fb923c' : '#555' }
function statusBg(s: string)    { return s === 'paid' ? '#0d1f0d' : s === 'late' ? '#1a0a0a' : s === 'pending' ? '#1a1008' : '#1e1e22' }

export default function Finances() {
  const { factures, devis, loading, addDoc, updateDoc, deleteDoc } = useFinances()
  const [tab, setTab]               = useState<'dashboard' | 'factures' | 'devis'>('dashboard')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modal, setModal]           = useState<'add' | 'edit' | null>(null)
  const [downloading, setDownloading] = useState(false)
  const searchParams = useSearchParams()
useEffect(() => {
  if (searchParams.get('new') === 'devis') {
    setTab('devis')
    setModal('add')
  }
}, [])

  const list     = tab === 'factures' ? factures : devis
  const selected = list.find(d => d.id === selectedId) || null
  const tableKey = tab === 'factures' ? 'factures' : 'devis'

  const totalCA      = factures.filter(f => f.statut === 'paid').reduce((s, f) => s + f.montant, 0)
  const impayees     = factures.filter(f => f.statut !== 'paid').reduce((s, f) => s + f.montant, 0)
  const devisOuverts = devis.filter(d => d.statut === 'pending' || d.statut === 'draft').reduce((s, d) => s + d.montant, 0)

  const caMois = Array(12).fill(0)
  factures.filter(f => f.statut === 'paid').forEach(f => {
    const d = new Date(f.created_at)
    caMois[d.getMonth()] += f.montant
  })
  const maxCA = Math.max(...caMois, ...CA_PREV, 1)

  async function handleSave(data: Omit<Document, 'id' | 'created_at'>) {
    if (modal === 'edit' && selected) {
      await updateDoc(tableKey as 'factures' | 'devis', selected.id, data)
    } else {
      const { data: newDoc } = await addDoc(tableKey as 'factures' | 'devis', data)
      if (newDoc) setSelectedId(newDoc.id)
    }
  }

  async function handleDelete() {
    if (!selected) return
    await deleteDoc(tableKey as 'factures' | 'devis', selected.id)
    setSelectedId(null)
  }

  async function marquerPayee(id: string) {
    await updateDoc('factures', id, { statut: 'paid' })
  }

  async function envoyerDevis(id: string) {
    await updateDoc('devis', id, { statut: 'pending' })
    const doc = devis.find(d => d.id === id)
    if (doc) {
      await supabase.from('relances').insert([{
        nom:        `Devis ${doc.numero} — ${doc.client}${doc.montant ? ' — ' + doc.montant.toLocaleString('fr-FR') + ' €' : ''}`,
        cat:        'devis',
        client:     doc.client,
        contact:    '',
        montant:    doc.montant,
        jours:      0,
        done:       false,
        historique: [{ icon: '📄', label: 'Devis envoyé', date: new Date().toLocaleDateString('fr-FR'), c: '#fb923c' }],
        message:    `Bonjour,\n\nJe reviens vers vous concernant le devis ${doc.numero} d'un montant de ${doc.montant.toLocaleString('fr-FR')} €.\n\nAvez-vous eu l'occasion de l'examiner ?\n\nCordialement,\nMAZCOM`,
      }])
    }
  }

  async function convertirDevisEnFacture(doc: Document) {
    const { data: newFacture, error } = await addDoc('factures', {
      numero:         doc.numero.replace('D-', 'F-'),
      client:         doc.client,
      projet:         doc.projet,
      adresse_client: doc.adresse_client || '',
      date_emission:  new Date().toLocaleDateString('fr-FR'),
      date_echeance:  doc.date_echeance,
      montant:        doc.montant,
      statut:         'pending',
      lignes:         doc.lignes,
    })
    if (!error && newFacture) {
      await updateDoc('devis', doc.id, { statut: 'paid' })
      setTab('factures')
      setSelectedId(newFacture.id)
    }
  }

  async function handleDownloadPDF(doc: Document) {
    setDownloading(true)
    const { data: params } = await supabase.from('parametres').select('*').single()
    if (!params) { alert('Remplissez vos paramètres avant de générer un PDF.'); setDownloading(false); return }
    await generatePDF(doc, params, tab === 'factures' ? 'facture' : 'devis')
    setDownloading(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)', fontSize: '14px' }}>
      Chargement des finances...
    </div>
  )

  return (
    <>
      {modal && tab !== 'dashboard' && (
        <FinanceModal
          type={tableKey as 'factures' | 'devis'}
          doc={modal === 'edit' ? selected : null}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, background: 'var(--card-bg)' }}>
          <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)', flex: 1 }}>Finances</div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['dashboard', 'factures', 'devis'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setSelectedId(null) }} style={{ background: tab === t ? '#1a1008' : 'transparent', border: '0.5px solid', borderColor: tab === t ? '#ff6b2b55' : 'var(--border-subtle)', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', color: tab === t ? '#ff6b2b' : 'var(--text-secondary)', cursor: 'pointer' }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          {tab !== 'dashboard' && (
            <button onClick={() => setModal('add')} style={{ background: '#ff6b2b', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>
              {tab === 'devis' ? '+ Nouveau devis' : '+ Nouvelle facture'}
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', background: 'var(--bg-primary)' }}>

          {/* DASHBOARD */}
          {tab === 'dashboard' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '1.25rem' }}>
                {[
                  { label: 'CA encaissé',      value: fmt(totalCA),      color: '#ff6b2b', sub: `${factures.filter(f => f.statut === 'paid').length} factures payées`, subColor: '#4ade80' },
                  { label: 'Factures totales', value: String(factures.length), color: 'var(--text-primary)', sub: `${devis.length} devis`, subColor: 'var(--text-muted)' },
                  { label: 'Impayées',         value: fmt(impayees),     color: '#f87171', sub: `${factures.filter(f => f.statut !== 'paid').length} factures`, subColor: '#f87171' },
                  { label: 'Devis en attente', value: fmt(devisOuverts), color: '#fb923c', sub: `${devis.filter(d => d.statut === 'pending').length} envoyés`, subColor: 'var(--text-muted)' },
                ].map((k, i) => (
                  <div key={i} style={{ background: 'var(--card-bg)', border: '0.5px solid var(--border-subtle)', borderRadius: '12px', padding: '.875rem 1rem' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '.4px' }}>{k.label}</div>
                    <div style={{ fontSize: '22px', fontWeight: 500, color: k.color }}>{k.value}</div>
                    <div style={{ fontSize: '11px', color: k.subColor, marginTop: '3px' }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'var(--card-bg)', border: '0.5px solid var(--border-subtle)', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 500, marginBottom: '.875rem' }}>Évolution CA — {new Date().getFullYear()}</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '130px' }}>
                  {MOIS.map((m, i) => {
                    const hVal  = Math.round(caMois[i] / maxCA * 110)
                    const hPrev = Math.round(CA_PREV[i] / maxCA * 110)
                    return (
                      <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '100%', height: '110px', display: 'flex', gap: '2px', alignItems: 'flex-end' }}>
                          <div style={{ flex: 1, background: 'var(--border-subtle)', borderRadius: '3px 3px 0 0', height: `${hPrev}px` }} />
                          <div style={{ flex: 1, background: caMois[i] > 0 ? '#ff6b2b' : 'transparent', borderRadius: '3px 3px 0 0', height: `${hVal}px` }} />
                        </div>
                        <div style={{ fontSize: '9px', color: 'var(--text-faint)' }}>{m}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div style={{ background: 'var(--card-bg)', border: '0.5px solid var(--border-subtle)', borderRadius: '12px', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.875rem' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 500 }}>Dernières factures</div>
                  <button onClick={() => setTab('factures')} style={{ fontSize: '11px', color: '#ff6b2b', background: 'transparent', border: 'none', cursor: 'pointer' }}>Voir tout →</button>
                </div>
                {factures.length === 0 && <div style={{ fontSize: '13px', color: 'var(--text-faint)' }}>Aucune facture.</div>}
                {factures.slice(0, 5).map(f => (
                  <div key={f.id} onClick={() => { setTab('factures'); setSelectedId(f.id) }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '.5rem .625rem', background: 'var(--bg-tertiary)', border: '0.5px solid var(--border-subtle)', borderRadius: '8px', cursor: 'pointer', marginBottom: '5px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-faint)', width: '90px', flexShrink: 0 }}>{f.numero}</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', flex: 1 }}>{f.client}</span>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: statusColor(f.statut), width: '70px', textAlign: 'right' }}>{fmt(f.montant)}</span>
                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: statusBg(f.statut), color: statusColor(f.statut), width: '75px', textAlign: 'center' }}>{statusLabel(f.statut)}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* FACTURES / DEVIS */}
          {(tab === 'factures' || tab === 'devis') && (
            <>
              {selected && (
                <div style={{ background: 'var(--bg-tertiary)', border: '0.5px solid var(--border-subtle)', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '.875rem' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>{selected.numero}</div>
                      <div style={{ fontSize: '17px', fontWeight: 500, color: 'var(--text-primary)' }}>{selected.client || '—'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{selected.projet || '—'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button onClick={() => handleDownloadPDF(selected)} disabled={downloading} style={{ background: '#0d1520', border: '0.5px solid #60a5fa44', borderRadius: '7px', padding: '4px 10px', fontSize: '11px', color: '#60a5fa', cursor: 'pointer', opacity: downloading ? .6 : 1 }}>
                        {downloading ? '...' : '⬇️ PDF'}
                      </button>
                      <button onClick={() => setModal('edit')} style={{ background: 'var(--card-bg)', border: '0.5px solid var(--border-subtle)', borderRadius: '7px', padding: '4px 10px', fontSize: '11px', color: 'var(--text-secondary)', cursor: 'pointer' }}>Modifier</button>
                      <button onClick={handleDelete} style={{ background: '#1a0a0a', border: '0.5px solid #f8717133', borderRadius: '7px', padding: '4px 10px', fontSize: '11px', color: '#f87171', cursor: 'pointer' }}>Supprimer</button>
                      {tab === 'factures' && selected.statut !== 'paid' && (
                        <button onClick={() => marquerPayee(selected.id)} style={{ background: '#0d1f0d', border: '0.5px solid #4ade8044', borderRadius: '7px', padding: '4px 10px', fontSize: '11px', color: '#4ade80', cursor: 'pointer' }}>✓ Marquer payée</button>
                      )}
                      {tab === 'devis' && selected.statut === 'draft' && (
                        <button onClick={() => envoyerDevis(selected.id)} style={{ background: '#ff6b2b', border: 'none', borderRadius: '7px', padding: '4px 10px', fontSize: '11px', color: '#fff', cursor: 'pointer' }}>📤 Envoyer</button>
                      )}
                      {tab === 'devis' && selected.statut === 'pending' && (
                        <button onClick={() => convertirDevisEnFacture(selected)} style={{ background: '#4ade80', border: 'none', borderRadius: '7px', padding: '4px 10px', fontSize: '11px', color: '#000', cursor: 'pointer', fontWeight: 500 }}>→ Convertir en facture</button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '7px', marginBottom: '.875rem' }}>
                    {[
                      { label: 'Émission',  value: selected.date_emission  || '—' },
                      { label: 'Échéance',  value: selected.date_echeance  || '—' },
                      { label: 'Statut',    value: statusLabel(selected.statut), color: statusColor(selected.statut) },
                      { label: 'Total HT',  value: fmt(selected.montant), color: '#4ade80' },
                    ].map((c, i) => (
                      <div key={i} style={{ background: 'var(--card-bg)', border: '0.5px solid var(--border-subtle)', borderRadius: '7px', padding: '.5rem .625rem' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>{c.label}</div>
                        <div style={{ fontSize: '13px', color: c.color || 'var(--text-secondary)' }}>{c.value}</div>
                      </div>
                    ))}
                  </div>

                  {selected.lignes.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>{['Prestation','Qté','PU','Total'].map(h => (
                          <th key={h} style={{ fontSize: '10px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.4px', padding: '4px 8px', textAlign: 'left', borderBottom: '0.5px solid var(--border-subtle)' }}>{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {selected.lignes.map((l, i) => (
                          <tr key={i}>
                            <td style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '6px 8px', borderBottom: '0.5px solid var(--border)' }}>{l.desc}</td>
                            <td style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '6px 8px', borderBottom: '0.5px solid var(--border)' }}>{l.qte}</td>
                            <td style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '6px 8px', borderBottom: '0.5px solid var(--border)' }}>{fmt(l.pu)}</td>
                            <td style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500, padding: '6px 8px', borderBottom: '0.5px solid var(--border)' }}>{fmt(l.qte * l.pu)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '20px', marginTop: '.625rem', paddingTop: '.5rem', borderTop: '0.5px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total HT</span>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#4ade80' }}>{fmt(selected.montant)}</span>
                  </div>
                </div>
              )}

              <div style={{ background: 'var(--card-bg)', border: '0.5px solid var(--border-subtle)', borderRadius: '12px', padding: '1rem' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 500, marginBottom: '.875rem' }}>
                  {tab === 'factures' ? 'Factures' : 'Devis'} ({list.length})
                </div>
                {list.length === 0 && (
                  <div style={{ fontSize: '13px', color: 'var(--text-faint)', padding: '.5rem 0' }}>
                    Aucun {tab === 'factures' ? 'facture' : 'devis'}.
                  </div>
                )}
                {list.map(d => (
                  <div key={d.id} onClick={() => setSelectedId(d.id === selectedId ? null : d.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '.5rem .625rem', background: d.id === selectedId ? '#1a0f0a' : 'var(--bg-tertiary)', border: '0.5px solid', borderColor: d.id === selectedId ? '#ff6b2b44' : 'var(--border-subtle)', borderRadius: '8px', cursor: 'pointer', marginBottom: '5px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-faint)', width: '90px', flexShrink: 0 }}>{d.numero}</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', flex: 1 }}>{d.client || '—'}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-faint)', width: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.projet || '—'}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '65px', textAlign: 'right' }}>{d.date_emission || '—'}</span>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: statusColor(d.statut), width: '70px', textAlign: 'right' }}>{fmt(d.montant)}</span>
                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: statusBg(d.statut), color: statusColor(d.statut), width: '75px', textAlign: 'center' }}>{statusLabel(d.statut)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}