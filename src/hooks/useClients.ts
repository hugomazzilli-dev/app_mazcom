import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type Client = {
  id: string
  nom: string
  contact: string
  email: string
  telephone: string
  adresse: string
  secteur: string
  statut: string
  notes: string
  ca_genere: number
  created_at: string
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchClients() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setClients(data)
    setLoading(false)
  }

  async function addClient(client: Omit<Client, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('clients')
      .insert([client])
      .select()
      .single()
    if (!error && data) setClients(prev => [data, ...prev])
    return { data, error }
  }

  async function updateClient(id: string, updates: Partial<Client>) {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) setClients(prev => prev.map(c => c.id === id ? data : c))
    return { data, error }
  }

  async function deleteClient(id: string) {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
    if (!error) setClients(prev => prev.filter(c => c.id !== id))
    return { error }
  }

  useEffect(() => { fetchClients() }, [])

  return { clients, loading, addClient, updateClient, deleteClient, fetchClients }
}