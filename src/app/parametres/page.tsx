'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/contexts/AppContext'

type Params = {
  id: string
  nom: string
  agence: string
  email: string
  telephone: string
  adresse: string
  siret: string
  tva: string
  taux_tva: string
  notif_relances: boolean
  notif_tournages: boolean
  notif_resume: boolean
  theme: string
}

const inputStyle = (isDark: boolean) => ({
  background: isDark ? '#161618' : '#f5f5f7',
  border: `0.5px solid ${isDark ? '#2a2a2e' : '#e5e5e7'}`,
  borderRadius: '8px', padding: '8px 12px', fontSize: '13px',
  color: isDark ? '#ccc' : '#1a1a1a', width: '100%', outline: 'none',
})

const labelStyle = (isDark: boolean) => ({
  fontSize: '12px', color: isDark ? '#555' : '#999',
  marginBottom: '5px', display: 'block',
})

export default function Parametres() {
  const { theme, toggleTheme } = useApp()
  const isDark = theme === 'dark'

  const [params, setParams] = useState<Params | null>(null)
  const [form, setForm]     = useState({
    nom: '', agence: '', email: '', telephone: '',
    adresse: '', siret: '', tva: '', taux_tva: '20',
    notif_relances: true, notif_tournages: true, notif_resume: true,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase.from('parametres').select('*').single()
      if (data) {
        setParams(data)
        setForm({
          nom:            data.nom            || '',
          agence:         data.agence         || '',
          email:          data.email          || '',
          telephone:      data.telephone      || '',
          adresse:        data.adresse        || '',
          siret:          data.siret          || '',
          tva:            data.tva            || '',
          taux_tva:       data.taux_tva       || '20',
          notif_relances: data.notif_relances ?? true,
          notif_tournages:data.notif_tournages?? true,
          notif_resume:   data.notif_resume   ?? true,
        })
      }
    }
    fetch()
  }, [])

  function set(key: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function save() {
    if (!params) return
    setSaving(true)
    await supabase.from('parametres').update(form).eq('id', params.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const cardStyle = {
    background: isDark ? '#161618' : '#fff',
    border: `0.5px solid ${isDark ? '#1e1e22' : '#e5e5e7'}`,
    borderRadius: '12px', padding: '1rem', marginTop: '10px',
  }

  const sectionTitle = {
    fontSize: '11px', color: isDark ? '#444' : '#999',
    textTransform: 'uppercase' as const, letterSpacing: '.5px',
    fontWeight: 500 as const, marginBottom: '.75rem',
  }

  function Toggle({ k }: { k: 'notif_relances' | 'notif_tournages' | 'notif_resume' }) {
    const on = form[k]
    return (
      <div onClick={() => set(k, !on)} style={{ width: '36px', height: '20px', borderRadius: '10px', background: on ? '#ff6b2b' : isDark ? '#2a2a2e' : '#ddd', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: '3px', left: on ? '18px' : '3px', width: '14px', height: '14px', borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
      </div>
    )
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '640px', color: isDark ? '#e8e8e8' : '#1a1a1a' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 500 }}>Paramètres</div>
          <div style={{ fontSize: '13px', color: isDark ? '#555' : '#999', marginTop: '2px' }}>Informations de votre agence</div>
        </div>
        <button onClick={save} disabled={saving} style={{
          background: saved ? (isDark ? '#0d1f0d' : '#f0fff4') : '#ff6b2b',
          border: saved ? `0.5px solid #4ade8044` : 'none',
          borderRadius: '8px', padding: '7px 18px', fontSize: '13px',
          color: saved ? '#4ade80' : '#fff', cursor: 'pointer', fontWeight: 500,
          transition: 'all .2s', opacity: saving ? .7 : 1,
        }}>
          {saving ? 'Sauvegarde...' : saved ? '✓ Sauvegardé' : 'Sauvegarder'}
        </button>
      </div>

      {/* Avatar */}
      <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ff6b2b22', color: '#ff6b2b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 500, flexShrink: 0 }}>
          {form.nom ? form.nom.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : 'HM'}
        </div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 500 }}>{form.nom || 'Hugo Mazzilli'}</div>
          <div style={{ fontSize: '12px', color: isDark ? '#555' : '#999', marginTop: '2px' }}>{form.agence || 'MAZCOM'} · Fondateur</div>
        </div>
      </div>

      {/* Infos perso */}
      <div style={cardStyle}>
        <div style={sectionTitle}>Informations personnelles</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
          {[
            { label: 'Nom complet', k: 'nom' },
            { label: 'Agence',      k: 'agence' },
            { label: 'Email',       k: 'email' },
            { label: 'Téléphone',   k: 'telephone' },
          ].map(f => (
            <div key={f.k}>
              <label style={labelStyle(isDark)}>{f.label}</label>
              <input style={inputStyle(isDark)} value={(form as any)[f.k]} onChange={e => set(f.k, e.target.value)} />
            </div>
          ))}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle(isDark)}>Adresse</label>
            <input style={inputStyle(isDark)} value={form.adresse} onChange={e => set('adresse', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Infos légales */}
      <div style={cardStyle}>
        <div style={sectionTitle}>Informations légales</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
          {[
            { label: 'SIRET',        k: 'siret' },
            { label: 'N° TVA',       k: 'tva' },
            { label: 'Taux TVA (%)', k: 'taux_tva' },
          ].map(f => (
            <div key={f.k}>
              <label style={labelStyle(isDark)}>{f.label}</label>
              <input style={inputStyle(isDark)} value={(form as any)[f.k]} onChange={e => set(f.k, e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      {/* Apparence */}
      <div style={cardStyle}>
        <div style={sectionTitle}>Apparence</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '13px' }}>Thème {isDark ? 'sombre' : 'clair'}</div>
            <div style={{ fontSize: '11px', color: isDark ? '#555' : '#999', marginTop: '2px' }}>Basculer entre le mode sombre et le mode clair</div>
          </div>
          <button onClick={toggleTheme} style={{
            background: isDark ? '#161618' : '#f5f5f7',
            border: `0.5px solid ${isDark ? '#2a2a2e' : '#e5e5e7'}`,
            borderRadius: '8px', padding: '7px 14px', fontSize: '13px',
            color: isDark ? '#ccc' : '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            {isDark ? '☀️ Passer en clair' : '🌙 Passer en sombre'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div style={cardStyle}>
        <div style={sectionTitle}>Notifications</div>
        {[
          { label: 'Relances automatiques',  sub: "Alertes quand un devis n'est pas relancé", k: 'notif_relances' as const },
          { label: 'Rappels de tournage',     sub: 'Notification 24h avant chaque tournage',   k: 'notif_tournages' as const },
          { label: 'Résumé hebdomadaire',     sub: "Résumé de l'activité chaque lundi matin",  k: 'notif_resume' as const },
        ].map((pref, i) => (
          <div key={pref.k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 2 ? `0.5px solid ${isDark ? '#1e1e22' : '#e5e5e7'}` : 'none' }}>
            <div>
              <div style={{ fontSize: '13px' }}>{pref.label}</div>
              <div style={{ fontSize: '11px', color: isDark ? '#555' : '#999', marginTop: '2px' }}>{pref.sub}</div>
            </div>
            <Toggle k={pref.k} />
          </div>
        ))}
      </div>

      {/* Danger zone */}
      <div style={{ background: isDark ? '#1a0a0a' : '#fff5f5', border: `0.5px solid ${isDark ? '#f8717122' : '#fecaca'}`, borderRadius: '12px', padding: '1rem', marginTop: '10px' }}>
        <div style={{ fontSize: '11px', color: '#f87171', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 500, marginBottom: '.75rem' }}>Zone dangereuse</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '13px' }}>Réinitialiser toutes les données</div>
            <div style={{ fontSize: '11px', color: isDark ? '#555' : '#999', marginTop: '2px' }}>Cette action est irréversible</div>
          </div>
          <button style={{ background: 'transparent', border: '0.5px solid #f8717144', borderRadius: '7px', padding: '5px 12px', fontSize: '12px', color: '#f87171', cursor: 'pointer' }}>Réinitialiser</button>
        </div>
      </div>

    </div>
  )
}