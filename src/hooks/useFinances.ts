import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type Ligne = { desc: string; soustitems: string[]; qte: number; pu: number }

export type Document = {
  id: string
  created_at: string
  numero: string
  client: string
  projet: string
  adresse_client: string
  date_emission: string
  date_echeance: string
  montant: number
  statut: string
  lignes: Ligne[]
}

export function useFinances() {
  const [factures, setFactures] = useState<Document[]>([])
  const [devis, setDevis]       = useState<Document[]>([])
  const [loading, setLoading]   = useState(true)

  async function fetchAll() {
    const [{ data: f }, { data: d }] = await Promise.all([
      supabase.from('factures').select('*').order('created_at', { ascending: false }),
      supabase.from('devis').select('*').order('created_at', { ascending: false }),
    ])
    if (f) setFactures(f)
    if (d) setDevis(d)
    setLoading(false)
  }

  async function addDoc(table: 'factures' | 'devis', doc: Omit<Document, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from(table)
      .insert([doc])
      .select()
      .single()
    if (!error && data) {
      if (table === 'factures') setFactures(prev => [data, ...prev])
      else setDevis(prev => [data, ...prev])
    }
    if (error) console.error('addDoc error:', error)
    return { data, error }
  }

  async function updateDoc(table: 'factures' | 'devis', id: string, updates: Partial<Document>) {
    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) {
      if (table === 'factures') setFactures(prev => prev.map(f => f.id === id ? data : f))
      else setDevis(prev => prev.map(d => d.id === id ? data : d))
    }
    if (error) console.error('updateDoc error:', error)
    return { data, error }
  }

  async function deleteDoc(table: 'factures' | 'devis', id: string) {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (!error) {
      if (table === 'factures') setFactures(prev => prev.filter(f => f.id !== id))
      else setDevis(prev => prev.filter(d => d.id !== id))
    }
    if (error) console.error('deleteDoc error:', error)
    return { error }
  }

  useEffect(() => { fetchAll() }, [])

  return { factures, devis, loading, addDoc, updateDoc, deleteDoc }
}