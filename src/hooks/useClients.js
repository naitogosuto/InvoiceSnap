import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { FREE_TIER } from '@/lib/constants'

export function useClients() {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchClients = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setClients(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  const createClient = useCallback(async (clientData) => {
    if (!user) return { success: false, error: 'No user logged in' }

    // Check free tier limit
    const isPro = profile?.subscription_tier === 'pro'
    if (!isPro && clients.length >= FREE_TIER.maxClients) {
      return {
        success: false,
        error: `Límite alcanzado: máximo ${FREE_TIER.maxClients} clientes en el plan gratuito. Actualiza a Pro para clientes ilimitados.`,
      }
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clients')
        .insert({ user_id: user.id, ...clientData })
        .select()
        .single()

      if (error) throw error
      setClients((prev) => [data, ...prev])
      return { success: true, client: data }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [user, profile, clients])

  const updateClient = useCallback(async (id, clientData) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clients')
        .update({ ...clientData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setClients((prev) => prev.map((c) => (c.id === id ? data : c)))
      return { success: true, client: data }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteClient = useCallback(async (id) => {
    try {
      setLoading(true)
      const { error } = await supabase.from('clients').delete().eq('id', id)
      if (error) throw error
      setClients((prev) => prev.filter((c) => c.id !== id))
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    clients,
    loading,
    error,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
  }
}
