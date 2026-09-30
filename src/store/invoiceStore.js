import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export const useInvoiceStore = create((set, get) => ({
  invoices: [],
  currentInvoice: null,
  loading: false,
  error: null,
  filters: {
    status: '',
    clientId: '',
    dateFrom: '',
    dateTo: '',
  },

  /**
   * Fetch all invoices for current user
   */
  fetchInvoices: async (userId) => {
    try {
      set({ loading: true, error: null })
      let query = supabase
        .from('invoices')
        .select('*, clients(name, nif_cif), invoice_lines(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      const filters = get().filters
      if (filters.status) query = query.eq('status', filters.status)
      if (filters.clientId) query = query.eq('client_id', filters.clientId)
      if (filters.dateFrom) query = query.gte('issue_date', filters.dateFrom)
      if (filters.dateTo) query = query.lte('issue_date', filters.dateTo)

      const { data, error } = await query
      if (error) throw error
      set({ invoices: data || [] })
    } catch (error) {
      console.error('Fetch invoices error:', error)
      set({ error: error.message })
    } finally {
      set({ loading: false })
    }
  },

  /**
   * Fetch a single invoice by ID
   */
  fetchInvoice: async (id) => {
    try {
      set({ loading: true, error: null })
      const { data, error } = await supabase
        .from('invoices')
        .select('*, clients(*), invoice_lines(*)')
        .eq('id', id)
        .single()

      if (error) throw error
      set({ currentInvoice: data })
      return data
    } catch (error) {
      set({ error: error.message })
      return null
    } finally {
      set({ loading: false })
    }
  },

  /**
   * Create a new invoice
   */
  createInvoice: async (invoiceData, lines) => {
    try {
      set({ loading: true, error: null })

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single()

      if (invoiceError) throw invoiceError

      // Insert invoice lines
      if (lines && lines.length > 0) {
        const linesWithInvoiceId = lines.map((line, index) => ({
          invoice_id: invoice.id,
          position: index + 1,
          ...line,
        }))

        const { error: linesError } = await supabase
          .from('invoice_lines')
          .insert(linesWithInvoiceId)

        if (linesError) throw linesError
      }

      return { success: true, invoice }
    } catch (error) {
      set({ error: error.message })
      return { success: false, error: error.message }
    } finally {
      set({ loading: false })
    }
  },

  /**
   * Update an existing invoice
   */
  updateInvoice: async (id, invoiceData, lines) => {
    try {
      set({ loading: true, error: null })

      const { error: invoiceError } = await supabase
        .from('invoices')
        .update(invoiceData)
        .eq('id', id)

      if (invoiceError) throw invoiceError

      // Replace lines: delete old, insert new
      const { error: deleteError } = await supabase
        .from('invoice_lines')
        .delete()
        .eq('invoice_id', id)

      if (deleteError) throw deleteError

      if (lines && lines.length > 0) {
        const linesWithInvoiceId = lines.map((line, index) => ({
          invoice_id: id,
          position: index + 1,
          ...line,
        }))

        const { error: linesError } = await supabase
          .from('invoice_lines')
          .insert(linesWithInvoiceId)

        if (linesError) throw linesError
      }

      return { success: true }
    } catch (error) {
      set({ error: error.message })
      return { success: false, error: error.message }
    } finally {
      set({ loading: false })
    }
  },

  /**
   * Update invoice status
   */
  updateStatus: async (id, status) => {
    try {
      const updates = { status }
      if (status === 'paid') updates.paid_at = new Date().toISOString()
      if (status === 'sent') updates.sent_at = new Date().toISOString()

      const { error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      // Update local state
      set((state) => ({
        invoices: state.invoices.map((inv) =>
          inv.id === id ? { ...inv, status } : inv
        ),
        currentInvoice:
          state.currentInvoice?.id === id
            ? { ...state.currentInvoice, status }
            : state.currentInvoice,
      }))

      return { success: true }
    } catch (error) {
      set({ error: error.message })
      return { success: false, error: error.message }
    }
  },

  /**
   * Delete an invoice
   */
  deleteInvoice: async (id) => {
    try {
      set({ loading: true, error: null })
      const { error } = await supabase.from('invoices').delete().eq('id', id)
      if (error) throw error

      set((state) => ({
        invoices: state.invoices.filter((inv) => inv.id !== id),
      }))
      return { success: true }
    } catch (error) {
      set({ error: error.message })
      return { success: false, error: error.message }
    } finally {
      set({ loading: false })
    }
  },

  /**
   * Set filters
   */
  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }))
  },

  /**
   * Generate next invoice number
   */
  getNextInvoiceNumber: (profile) => {
    if (!profile) return 'FACT-001'
    const prefix = profile.invoice_prefix || 'FACT'
    const format = profile.invoice_format || 'PREFIX-YYYY-NNN'
    const year = new Date().getFullYear()
    const nextNum = String(profile.next_invoice_number || 1).padStart(3, '0')

    return format
      .replace('PREFIX', prefix)
      .replace('YYYY', String(year))
      .replace('YY', String(year).slice(-2))
      .replace('NNN', nextNum)
  },

  clearError: () => set({ error: null }),
  clearCurrentInvoice: () => set({ currentInvoice: null }),
}))
