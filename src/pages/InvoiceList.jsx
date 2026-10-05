import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { useInvoices } from '@/hooks/useInvoices'
import { usePDF } from '@/hooks/usePDF'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { formatCurrency, formatDateShort } from '@/lib/formatters'
import { isProProfile } from '@/lib/plan'

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'draft', label: 'Borrador' },
  { value: 'sent', label: 'Enviada' },
  { value: 'paid', label: 'Cobrada' },
  { value: 'overdue', label: 'Vencida' },
  { value: 'cancelled', label: 'Anulada' },
]

const STATUS_STYLE = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700' },
  sent: { bg: 'bg-blue-100', text: 'text-blue-700' },
  paid: { bg: 'bg-green-100', text: 'text-green-700' },
  overdue: { bg: 'bg-red-100', text: 'text-red-700' },
  cancelled: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Borrador', style: STATUS_STYLE.draft },
  { value: 'sent', label: 'Enviada', style: STATUS_STYLE.sent },
  { value: 'paid', label: 'Cobrada', style: STATUS_STYLE.paid },
  { value: 'overdue', label: 'Vencida', style: STATUS_STYLE.overdue },
  { value: 'cancelled', label: 'Anulada', style: STATUS_STYLE.cancelled },
]

function StatusCell({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const current = STATUS_STYLE[value] || STATUS_STYLE.draft

  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setMenuPos({ top: rect.bottom + 4, left: Math.max(8, rect.left) })
    }
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1 cursor-pointer ${current.bg} ${current.text}`}
      >
        {STATUS_OPTIONS.find((o) => o.value === value)?.label || value}
        <svg className="h-3 w-3 opacity-50" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      {open && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="fixed z-50 w-max min-w-[80px] bg-white rounded-lg shadow-lg border border-gray-200 py-1"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`w-full text-left px-3 py-1.5 text-xs font-medium ${opt.style.bg} ${opt.style.text} ${
                  opt.value === value ? 'ring-1 ring-inset ring-gray-300' : ''
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </>
  )
}

export function InvoiceList() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const isPro = isProProfile(profile)
  const addToast = useUIStore((s) => s.addToast)
  const { invoices, loading, loadInvoices, updateStatus, deleteInvoice } = useInvoices()
  const { generateInvoicePDF, generating } = usePDF()
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    loadInvoices()
  }, [loadInvoices])

  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter && inv.status !== statusFilter) return false
    return true
  })

  const handleStatusChange = async (id, newStatus) => {
    const result = await updateStatus(id, newStatus)
    if (result.success) {
      addToast('Estado actualizado', 'success')
    }
  }

  const handleDownloadPDF = async (inv) => {
    try {
      const blob = await generateInvoicePDF(
        {
          sender: inv.sender_snapshot || profile || {},
          client: inv.client_snapshot || inv.clients || {},
          lines: inv.invoice_lines || [],
          totals: {
            subtotal: inv.subtotal,
            totalVat: inv.total_vat,
            totalIrpf: inv.total_irpf,
            total: inv.total,
          },
          meta: {
            invoiceNumber: inv.invoice_number,
            issueDate: inv.issue_date,
            dueDate: inv.due_date,
            notes: inv.notes,
            paymentMethod: inv.payment_method,
          },
        },
        { primaryColor: profile?.primary_color || '#1d4ed8' }
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${inv.invoice_number.replace(/[/\s]/g, '-')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      addToast('Error al generar el PDF', 'error')
    }
  }

  const handleDelete = async (invoice) => {
    if (!window.confirm(`¿Eliminar la factura ${invoice.invoice_number}?`)) return
    const result = await deleteInvoice(invoice.id)
    if (result.success) {
      addToast('Factura eliminada', 'success')
    }
  }

  const thisMonthInvoices = invoices.filter((inv) => {
    if (!inv.created_at) return false
    const invDate = new Date(inv.created_at)
    const now = new Date()
    return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear()
  }).length

  return (
    <div className="space-y-6">
      <CardHeader
        title="Facturas"
        subtitle={
          !isPro
            ? `${thisMonthInvoices}/5 facturas este mes`
            : `${invoices.length} facturas`
        }
        action={
          <Link to="/invoices/new">
            <Button>
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Nueva factura
            </Button>
          </Link>
        }
      />

      {/* Monthly limit warning */}
      {!isPro && thisMonthInvoices >= 5 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg px-4 py-3">
          Has alcanzado el límite de 5 facturas este mes.{' '}
          <Link to="/settings" className="font-medium underline">
            Actualiza a Pro
          </Link>{' '}
          para facturas ilimitadas.
        </div>
      )}

      {/* Filters */}
      <Card padded={false}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-3 max-w-xs">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={statusOptions}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-6 w-6 text-primary-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-2">
              {invoices.length === 0 ? 'No tienes facturas todavía' : 'No hay facturas con ese filtro'}
            </p>
            {invoices.length === 0 && (
              <Link to="/invoices/new">
                <Button className="mt-2">Crear primera factura</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Nº Factura</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Cliente</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Fecha</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Vencimiento</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Total</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">Estado</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{inv.invoice_number}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {inv.client_snapshot?.name || inv.clients?.name || '—'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{formatDateShort(inv.issue_date)}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {inv.due_date ? formatDateShort(inv.due_date) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(inv.total)}</td>
                    <td className="py-3 px-4 text-center">
                      <StatusCell
                        value={inv.status}
                        onChange={(newStatus) => handleStatusChange(inv.id, newStatus)}
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadPDF(inv)}
                          disabled={generating}
                          title="Descargar PDF"
                        >
                          PDF
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/invoices/edit/${inv.id}`)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(inv)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
