import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export function useProducts() {
  const user = useAuthStore((s) => s.user)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchProducts = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  const createProduct = useCallback(async (productData) => {
    if (!user) return { success: false, error: 'No user logged in' }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .insert({ user_id: user.id, ...productData })
        .select()
        .single()

      if (error) throw error
      setProducts((prev) => [data, ...prev])
      return { success: true, product: data }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [user])

  const updateProduct = useCallback(async (id, productData) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .update({ ...productData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setProducts((prev) => prev.map((p) => (p.id === id ? data : p)))
      return { success: true, product: data }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteProduct = useCallback(async (id) => {
    try {
      setLoading(true)
      // Soft delete: marcar como inactivo
      const { error } = await supabase
        .from('products')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      setProducts((prev) => prev.filter((p) => p.id !== id))
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  }
}
