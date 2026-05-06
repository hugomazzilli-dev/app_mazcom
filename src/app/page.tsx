'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useIsMobile } from '@/hooks/useIsMobile'

type Stats = {
  ca_mois: number; ca_prev: number; projets_en_cours: number; projets_montage: number
  devis_attente: number; factures_impayees: number; factures_retard: number
  clients_total: number; taches_urgentes: number; relances_actives: number
}
type Projet = { id: string; nom: string; client_nom: string; type: string; col: string; budget: number }
type Alerte = { icon: string; label: string; days: string; color: string; bg: string }
type Agenda = { id: string; titre: string; type: string; heure: string; lieu: string; date_jour: number; date_mois: number; date_annee: number }
type TacheIA = { priorite: 'haute' | 'normale'; label: string; detail: string; action: string; lien: string }

const COLS_LABELS: Record<string, string> = {
  nouveau: 'Nouveau', prep: 'Préparation', tournage: 'Tournage prévu',
  realise: 'Réalisé', montage: 'Montage', validation: 'Validation',
  livre: 'Livré', facture: 'Facturé',
}
const TYPES: Record<string, { color: string }> = {
  drone: { color: '#60a5fa' }, corporate: { color: '#a78bfa' },
  interview: { color: '#c084fc' }, chantier: { color: '#f97316' },
  rs: { color: '#fb923c' }, immo: { color: '#818cf8' }, montage: { color: '#34d399' },
}
const PIPELINE_COLS = ['nouveau','prep','tournage','realise','montage','validation','livre','facture']
const AGENDA_TYPES: Record<string, { color: string; bg: string; label: string }> = {
  drone: { color: '#60a5fa', bg: '#0d1520', label: 'Drone' },
  corporate: { color: '#a78bfa', bg: '#150d20', label: 'Corporate' },
  deadline: { color: '#fb923c', bg: '#1a1008', label: 'Deadline' },
  livraison: { color: '#4ade80', bg: '#0d1f0d', label: 'Livraison' },
  relance: { color: '#f87171', bg: '#1a0a0a', label: 'Relance' },
  rdv: { color: '#fbbf24', bg: '#15100d', label: 'RDV' },
  tournage: { color: '#60a5fa', bg: '#0d1520', label: 'Tournage' },
  autre: { color: '#888', bg: '#1e1e22', label: 'Autre' },
}

export default function Dashboard() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [stats, setStats] = useState<Stats | null>(null)
  const [projets, setProjets] = useState<Projet[]>([])
  const [alertes, setAlertes] = useState<Alerte[]>([])
  const [agenda, setAgenda] = useState<Agenda[]>([])
  const [tachesIA, setTachesIA] = useState<TacheIA[]>([])
  const [iaLoading, setIaLoading] = useState(false)
  const [rapport, setRapport] = useState('')
  const [showRapport, setShowRapport] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAll() {
      const today = new Date()
      const moisDebut = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
      const [
        { data: projetsData }, { data: facturesData }, { data: devisData },
        { data: tachesData }, { data: relancesData }, { data: clientsData }, { data: evenementsData },
      ] = await Promise.all([
        supabase.from('projets').select('*'),
        supabase.from('factures').select('*'),
        supabase.from('devis').select('*'),
        supabase.from('taches').select('*'),
        supabase.from('relances').select('*'),
        supabase.from('clients').select('id'),
        supabase.from('evenements').select('*').order('date_annee').order('date_mois').order('date_jour'),
      ])
      const factures = facturesData || []
      const devis = devisData || []
      const projetsEnCours = projetsData?.filter(p => !['livre','facture'].includes(p.col)) || []
      const caMois = factures.filter(f => f.statut === 'paid' && new Date(f.created_at) >= new Date(moisDebut)).reduce((s: number, f: any) => s + f.montant, 0)
      const caPrev = factures.filter(f => f.statut === 'paid').reduce((s: number, f: any) => s + f.montant, 0)
      const facturesImpayees = factures.filter(f => f.statut !== 'paid')
      const facturesRetard = factures.filter(f => f.statut === 'late')
      const devisAttente = devis.filter(d => d.statut === 'pending' || d.statut === 'draft')
      const tachesUrgentes = tachesData?.filter(t => t.priorite === 'urgent' && !t.done) || []
      const relancesActives = relancesData?.filter(r => !r.done) || []
      const s: Stats = {
        ca_mois: caMois, ca_prev: caPrev,
        projets_en_cours: projetsEnCours.length,
        projets_montage: projetsData?.filter(p => p.col === 'montage').length || 0,
        devis_attente: devisAttente.length,
        factures_impayees: facturesImpayees.reduce((s: number, f: any) => s + f.montant, 0),
        factures_retard: facturesRetard.length,
        clients_total: clientsData?.length || 0,
        taches_urgentes: tachesUrgentes.length,
        relances_actives: relancesActives.length,
      }
      setStats(s)
      setProjets(projetsData || [])
      const al: Alerte[] = []
      relancesActives.filter((r: any) => r.jours >= 14).slice(0, 2).forEach((r: any) => {
        al.push({ icon: '!', label: `${r.client} — J+${r.jours} sans réponse`, days: `J+${r.jours}`, color: '#f87171', bg: '#1a0a0a' })
      })
      facturesRetard.slice(0, 2).forEach((f: any) => {
        al.push({ icon: '€', label: `Facture ${f.client} — ${f.montant.toLocaleString('fr-FR')} €`, days: 'Retard', color: '#f87171', bg: '#1a0a0a' })
      })
      tachesUrgentes.slice(0, 2).forEach((t: any) => {
        al.push({ icon: '↑', label: t.nom, days: t.deadline || 'Urgent', color: '#fb923c', bg: '#1a1008' })
      })
      setAlertes(al)
      setAgenda(evenementsData?.filter((e: any) => new Date(e.date_annee, e.date_mois - 1, e.date_jour) >= today).slice(0, 4) || [])
      genererTachesIA(s, projetsData || [], facturesImpayees, devisAttente, tachesUrgentes, relancesActives)
      setLoading(false)
    }
    fetchAll()
  }, [])

  async function genererTachesIA(s: Stats, projets: any[], facturesImpayees: any[], devisAttente: any[], tachesUrgentes: any[], relancesActives: any[]) {
    setIaLoading(true)
    try {
      const contexte = `Tu es l'assistant de MAZCOM. Génère exactement 4 suggestions de tâches prioritaires. CA ce mois: ${s.ca_mois}€, projets: ${s.projets_en_cours}, factures impayées: ${facturesImpayees.length} (${s.factures_impayees}€), devis en attente: ${devisAttente.length}, relances: ${relancesActives.length}. Format JSON uniquement: [{"priorite":"haute|normale","label":"titre","detail":"1 phrase","action":"bouton","lien":"/page"}]`
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [{ role: 'user', content: contexte }] }),
      })
      const data = await response.json()
      const text = data.content?.map((c: any) => c.text || '').join('') || ''
      setTachesIA(JSON.parse(text.replace(/```json|```/g, '').trim()))
    } catch {
      setTachesIA([
        { priorite: 'haute', label: 'Relancer les devis', detail: `${s.devis_attente} devis sans réponse`, action: 'Voir relances', lien: '/relances' },
        { priorite: 'haute', label: 'Factures impayées', detail: `${s.factures_impayees.toLocaleString('fr-FR')} € à encaisser`, action: 'Voir finances', lien: '/finances' },
        { priorite: 'normale', label: 'Planning', detail: 'Vérifier les deadlines', action: 'Voir planning', lien: '/planning' },
        { priorite: 'normale', label: 'Projets en montage', detail: `${s.projets_montage} projet(s)`, action: 'Voir projets', lien: '/projets' },
      ])
    }
    setIaLoading(false)
  }

  async function genererRapport() {
    setShowRapport(true); setRapport('')
    try {
      const [{ data: f }, { data: d }, { data: p }, { data: r }] = await Promise.all([
        supabase.from('factures').select('*'), supabase.from('devis').select('*'),
        supabase.from('projets').select('*'), supabase.from('relances').select('*').eq('done', false),
      ])
      const contexte = `Génère un rapport hebdomadaire MAZCOM (max 200 mots). CA: ${f?.filter(x => x.statut === 'paid').reduce((s: number, x: any) => s + x.montant, 0)}€, impayées: ${f?.filter(x => x.statut !== 'paid').length}, devis: ${d?.filter(x => x.statut !== 'paid').length}, projets actifs: ${p?.filter(x => !['livre','facture'].includes(x.col)).length}, relances: ${r?.length}. Points positifs, attention, 3 actions prioritaires.`
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [{ role: 'user', content: contexte }] }),
      })
      const data = await response.json()
      setRapport(data.content?.map((c: any) => c.text || '').join('') || '')
    } catch { setRapport('Impossible de générer le rapport.') }
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)', fontSize: '14px' }}>Chargement...</div>

  const kpis = [
    { label: 'CA encaissé', value: (stats?.ca_mois || 0).toLocaleString('fr-FR') + ' €', color: '#ff6b2b', sub: `Total : ${(stats?.ca_prev || 0).toLocaleString('fr-FR')} €`, subColor: '#4ade80' },
    { label: 'Projets', value: String(stats?.projets_en_cours || 0), color: 'var(--text-primary)', sub: `${stats?.projets_montage || 0} en montage`, subColor: 'var(--text-muted)' },
    { label: 'Devis', value: String(stats?.devis_attente || 0), color: '#fb923c', sub: `${stats?.relances_actives || 0} relances`, subColor: '#fb923c' },
    { label: 'Impayées', value: (stats?.factures_impayees || 0).toLocaleString('fr-FR') + ' €', color: stats?.factures_impayees ? '#f87171' : '#4ade80', sub: `${stats?.factures_retard || 0} en retard`, subColor: stats?.factures_retard ? '#f87171' : 'var(--text-muted)' },
  ]

  const p = isMobile ? '1rem' : '1.5rem'

  return (
    <div style={{ padding: p, overflowY: 'auto', minHeight: '100vh', background: 'var(--bg-primary)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem', gap: '10px' }}>
        <div>
          <div style={{ fontSize: isMobile ? '17px' : '20px', fontWeight: 500, color: 'var(--text-primary)' }}>Bonjour, MAZCOM 👋</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: isMobile ? 'short' : 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button onClick={genererRapport} style={{ background: 'transparent', border: '0.5px solid #a78bfa44', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', color: '#a78bfa', cursor: 'pointer' }}>✨ Rapport</button>
          {!isMobile && <>
            <button onClick={() => router.push('/projets?new=1')} style={{ background: 'transparent', border: '0.5px solid var(--border)', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>+ Projet</button>
            <button onClick={() => router.push('/finances?new=devis')} style={{ background: '#ff6b2b', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>+ Devis</button>
          </>}
          {isMobile && (
            <button onClick={() => router.push('/finances?new=devis')} style={{ background: '#ff6b2b', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>+ Devis</button>
          )}
        </div>
      </div>

      {/* Modal rapport */}
      {showRapport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--card-bg)', border: '0.5px solid #a78bfa44', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '560px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>✨ Rapport IA</div>
              <button onClick={() => setShowRapport(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>
            {!rapport ? <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' }}>Génération en cours...</div>
              : <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{rapport}</div>}
          </div>
        </div>
      )}

      {/* Alertes */}
      {alertes.length > 0 && (
        <div onClick={() => router.push('/relances')} style={{ background: '#1a1008', border: '0.5px solid #ff6b2b44', borderRadius: '10px', padding: '10px 14px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ff6b2b', flexShrink: 0 }} />
          <div style={{ fontSize: '12px', color: '#cc8866', flex: 1 }}>{alertes.length} alerte{alertes.length > 1 ? 's' : ''} en attente</div>
          <div style={{ fontSize: '11px', color: '#ff6b2b' }}>→</div>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '8px', marginBottom: '1rem' }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ background: 'var(--card-bg)', border: '0.5px solid var(--border-subtle)', borderRadius: '12px', padding: '.875rem' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '.4px' }}>{k.label}</div>
            <div style={{ fontSize: isMobile ? '17px' : '20px', fontWeight: 500, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: '10px', color: k.subColor, marginTop: '3px' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Pipeline — masqué sur mobile */}
      {!isMobile && (
        <>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 500, marginBottom: '.625rem' }}>Pipeline projets</div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '4px' }}>
            {PIPELINE_COLS.map(colId => {
              const cards = projets.filter(p => p.col === colId)
              return (
                <div key={colId} style={{ background: 'var(--bg-tertiary)', border: '0.5px solid var(--border-subtle)', borderRadius: '10px', minWidth: '120px', flex: 1, padding: '.625rem' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.4px', fontWeight: 500, marginBottom: '.375rem' }}>{COLS_LABELS[colId]}</div>
                  <div style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text-primary)' }}>{cards.length}</div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Tâches IA + Alertes + Agenda */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '10px' }}>

        {/* Tâches IA */}
        <div style={{ background: 'var(--card-bg)', border: '0.5px solid #a78bfa33', borderRadius: '12px', padding: '1rem' }}>
          <div style={{ fontSize: '11px', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 500, marginBottom: '.875rem' }}>✨ Tâches suggérées</div>
          {iaLoading ? <div style={{ fontSize: '12px', color: 'var(--text-faint)', textAlign: 'center', padding: '1rem 0' }}>Analyse en cours...</div> :
            tachesIA.map((t, i) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: i < tachesIA.length - 1 ? '0.5px solid var(--border-subtle)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: t.priorite === 'haute' ? '#f87171' : '#fb923c', flexShrink: 0 }} />
                  <div style={{ fontSize: '12.5px', color: 'var(--text-primary)', fontWeight: 500 }}>{t.label}</div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px', marginLeft: '12px' }}>{t.detail}</div>
                <button onClick={() => router.push(t.lien)} style={{ marginLeft: '12px', fontSize: '11px', background: '#a78bfa22', border: '0.5px solid #a78bfa44', borderRadius: '6px', padding: '3px 8px', color: '#a78bfa', cursor: 'pointer' }}>{t.action} →</button>
              </div>
            ))
          }
        </div>

        {/* Alertes */}
        <div style={{ background: 'var(--card-bg)', border: '0.5px solid var(--border-subtle)', borderRadius: '12px', padding: '1rem' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 500, marginBottom: '.875rem' }}>Alertes</div>
          {alertes.length === 0 && <div style={{ fontSize: '13px', color: '#4ade80' }}>✓ Tout est en ordre !</div>}
          {alertes.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '7px 0', borderBottom: i < alertes.length - 1 ? '0.5px solid var(--border-subtle)' : 'none' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: a.bg, color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', flexShrink: 0 }}>{a.icon}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', flex: 1, lineHeight: 1.5 }}>{a.label}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-faint)', flexShrink: 0 }}>{a.days}</div>
            </div>
          ))}
        </div>

        {/* Agenda */}
        <div style={{ background: 'var(--card-bg)', border: '0.5px solid var(--border-subtle)', borderRadius: '12px', padding: '1rem' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 500, marginBottom: '.875rem' }}>Agenda</div>
          {agenda.length === 0 && <div style={{ fontSize: '13px', color: 'var(--text-faint)' }}>Aucun événement.</div>}
          {agenda.map((a, i) => {
            const tp = AGENDA_TYPES[a.type] || AGENDA_TYPES.autre
            return (
              <div key={a.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '7px 0', borderBottom: i < agenda.length - 1 ? '0.5px solid var(--border-subtle)' : 'none' }}>
                <div style={{ width: '30px', textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1 }}>{a.date_jour}</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'][a.date_mois - 1]}</div>
                </div>
                <div style={{ width: '2px', background: 'var(--border)', borderRadius: '1px', alignSelf: 'stretch', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.titre}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>{a.heure}{a.lieu ? ' · ' + a.lieu : ''}</div>
                </div>
                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '8px', background: tp.bg, color: tp.color, flexShrink: 0 }}>{tp.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}