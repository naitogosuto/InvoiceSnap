import { useCallback } from 'react'
import { useInvoiceStore } from '@/store/invoiceStore'
import { useAuthStore } from '@/store/authStore'

export function useInvoices() {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)

  const {
    invoices,
    currentInvoice,
    loading,
    error,
    filters,
    fetchInvoices,
    fetchInvoice,
    createInvoice,
    updateInvoice,
    updateStatus,
    deleteInvoice,
    setFilters,
    getNextInvoiceNumber,
    clearCurrentInvoice,
  } = useInvoiceStore()

  const loadInvoices = useCallback(() => {
    if (user) fetchInvoices(user.id)
  }, [user, fetchInvoices])

  return {
    invoices,
    currentInvoice,
    loading,
    error,
    filters,
    loadInvoices,
    fetchInvoice,
    createInvoice,
    updateInvoice,
    updateStatus,
    deleteInvoice,
    setFilters,
    getNextInvoiceNumber: () => getNextInvoiceNumber(profile),
    clearCurrentInvoice,
  }
}
