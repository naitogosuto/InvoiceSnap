import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useInvoiceStore } from '@/store/invoiceStore'
import { useClients } from '@/hooks/useClients'
import { useProducts } from '@/hooks/useProducts'
import { usePDF } from '@/hooks/usePDF'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useUIStore } from '@/store/uiStore'
import { VAT_RATES, IRPF_RATES, PAYMENT_METHODS, DEFAULTS, FREE_TIER } from '@/lib/constants'
import { calculateInvoiceTotals } from '@/lib/fiscal/totals'
import { formatCurrency } from '@/lib/formatters'
import { isProProfile } from '@/lib/plan'
import { InvoiceSheetPreview } from '@/components/invoice/InvoiceSheetPreview'

const emptyLine = {
  description: '',
  quantity: 1,
  unitPrice: '',
  vatRate: DEFAULTS.vatRate,
  irpfRate: DEFAULTS.irpfRate,
}

function ProductSelector({ products, onSelect }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })

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
        className="mt-1.5 p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
        title="Seleccionar producto"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382z" />
          <path d="M4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
        </svg>
      </button>
      {open && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="fixed z-50 w-max min-w-[180px] bg-white rounded-lg shadow-lg border border-gray-200 py-1"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            {products.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-400">Sin productos</div>
            ) : (
              products.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onSelect(p)
                    setOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-900">{p.name}</span>
                  <span className="text-gray-500 ml-2">{formatCurrency(p.unit_price)}</span>
                  {p.unit_type && (
                    <span className="text-gray-400 ml-1">/{p.unit_type}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </>,
        document.body
      )}
    </>
  )
}

export function InvoiceCreate() {
  const navigate = useNavigate()
  const { id } = useParams()
  const profile = useAuthStore((s) => s.profile)
  const addToast = useUIStore((s) => s.addToast)
  const { clients, fetchClients } = useClients()
  const { products, fetchProducts } = useProducts()
  const invoiceStore = useInvoiceStore()
  const { getNextInvoiceNumber, fetchInvoice } = invoiceStore
  const { generateInvoicePDF, generating } = usePDF()

  const isEditing = !!id

  // Form state
  const [clientId, setClientId] = useState('')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [lines, setLines] = useState([{ ...emptyLine }])
  const [status, setStatus] = useState('draft')
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('transferencia')
  const [saving, setSaving] = useState(false)
  const [invoiceNumber, setInvoiceNumber] = useState('')

  // Get next invoice number
  useEffect(() => {
    if (profile) {
      setInvoiceNumber(getNextInvoiceNumber(profile))
    }
  }, [profile, getNextInvoiceNumber])

  // Load clients & products
  useEffect(() => {
    fetchClients()
    fetchProducts()
  }, [fetchClients, fetchProducts])

  // Load invoice if editing
  useEffect(() => {
    if (id) {
      fetchInvoice(id).then((invoice) => {
        if (!invoice) return
        setClientId(invoice.client_id || '')
        setIssueDate(invoice.issue_date || '')
        setDueDate(invoice.due_date || '')
        setStatus(invoice.status || 'draft')
        setNotes(invoice.notes || '')
        setPaymentMethod(invoice.payment_method || 'transferencia')
        setInvoiceNumber(invoice.invoice_number || '')
        if (invoice.invoice_lines?.length > 0) {
          setLines(
            invoice.invoice_lines.map((l) => ({
              description: l.description || '',
              quantity: l.quantity || 1,
              unitPrice: l.unit_price || '',
              vatRate: l.vat_rate || DEFAULTS.vatRate,
              irpfRate: l.irpf_rate || DEFAULTS.irpfRate,
            }))
          )
        }
      })
    }
  }, [id, fetchInvoice])

  // Calculate totals
  const totals = calculateInvoiceTotals(lines, {
    defaultIrpfRate: profile?.is_new_autonomo ? 7 : DEFAULTS.irpfRate,
  })

  // Line management
  const addLine = () => {
    setLines([...lines, { ...emptyLine }])
  }

  const removeLine = (index) => {
    if (lines.length <= 1) return
    setLines(lines.filter((_, i) => i !== index))
  }

  const updateLine = (index, field, value) => {
    setLines(
      lines.map((line, i) =>
        i === index ? { ...line, [field]: value } : line
      )
    )
  }

  // Selected client for preview
  const selectedClient = clients.find((c) => c.id === clientId)

  // Handle save + PDF download
  const handleSave = async (action = 'save') => {
    if (!clientId) {
      addToast('Selecciona un cliente', 'error')
      return
    }

    if (!issueDate) {
      addToast('La fecha de emisión es obligatoria', 'error')
      return
    }

    const validLines = lines.filter((l) => l.description.trim())
    if (validLines.length === 0) {
      addToast('La factura debe tener al menos una línea de concepto', 'error')
      return
    }

    // Check Free plan monthly invoice limit when creating new invoice
    if (!isEditing && !isProProfile(profile)) {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const thisMonthInvoices = invoiceStore.invoices.filter(
        (inv) => new Date(inv.created_at || inv.issue_date) >= startOfMonth
      )
      if (thisMonthInvoices.length >= FREE_TIER.maxInvoicesPerMonth) {
        addToast(
          `Has alcanzado el límite mensual de ${FREE_TIER.maxInvoicesPerMonth} facturas del plan gratuito`,
          'error'
        )
        return
      }
    }

    setSaving(true)

    const invoiceData = {
      user_id: profile?.id,
      client_id: clientId,
      invoice_number: invoiceNumber,
      issue_date: issueDate,
      due_date: dueDate || null,
      status: status,
      type: 'standard',
      subtotal: totals.subtotal,
      total_vat: totals.totalVat,
      total_irpf: totals.totalIrpf,
      total: totals.total,
      notes: notes || null,
      payment_method: paymentMethod,
      // Snapshots for immutability
      sender_snapshot: profile
        ? {
            full_name: profile.full_name,
            business_name: profile.business_name,
            nif: profile.nif,
            address: profile.address,
            city: profile.city,
            postal_code: profile.postal_code,
            province: profile.province,
            email: profile.email,
            bank_iban: profile.bank_iban,
            bank_name: profile.bank_name,
          }
        : null,
      client_snapshot: selectedClient
        ? {
            name: selectedClient.name,
            business_name: selectedClient.business_name,
            nif_cif: selectedClient.nif_cif,
            address: selectedClient.address,
            city: selectedClient.city,
            postal_code: selectedClient.postal_code,
            province: selectedClient.province,
            email: selectedClient.email,
          }
        : null,
    }

    const linesData = validLines.map((line) => ({
      description: line.description,
      quantity: parseFloat(line.quantity) || 1,
      unit_price: parseFloat(line.unitPrice) || 0,
      vat_rate: parseFloat(line.vatRate) || 0,
      irpf_rate: parseFloat(line.irpfRate) || 0,
    }))

    let result
    if (isEditing) {
      result = await invoiceStore.updateInvoice(id, invoiceData, linesData)
    } else {
      result = await invoiceStore.createInvoice(invoiceData, linesData)
    }

    setSaving(false)

    if (!result.success) {
      addToast(result.error || 'Error al guardar la factura', 'error')
      return
    }

    addToast(isEditing ? 'Factura actualizada' : 'Factura creada', 'success')

    // Update invoice number on profile
    if (!isEditing && profile) {
      useAuthStore.getState().updateProfile({
        next_invoice_number: (profile.next_invoice_number || 1) + 1,
      })
    }

    if (action === 'save') {
      navigate('/invoices')
    } else if (action === 'download') {
      // Generate PDF
      try {
        const blob = await generateInvoicePDF(
          {
            sender: profile || {},
            client: selectedClient || {},
            lines: linesData,
            totals,
            meta: {
              invoiceNumber,
              issueDate,
              dueDate,
              notes,
              paymentMethod,
            },
          },
          {
            primaryColor: profile?.primary_color || '#2563eb',
          }
        )

        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${invoiceNumber.replace(/[/\s]/g, '-')}.pdf`
        a.click()
        URL.revokeObjectURL(url)
      } catch (err) {
        console.error('PDF generation error:', err)
        addToast('Error al generar el PDF', 'error')
      }

      navigate('/invoices')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar factura' : 'Nueva factura'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isEditing ? 'Modifica los datos de la factura' : 'Rellena los datos y genera tu factura en segundos'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/invoices')}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={() => handleSave('save')} loading={saving}>
            Guardar
          </Button>
          <Button onClick={() => handleSave('download')} loading={saving || generating}>
            {generating ? (
              'Generando PDF...'
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Guardar y descargar
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client & Dates */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos de la factura</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Cliente"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Seleccionar cliente..."
                  options={clients.map((c) => ({ value: c.id, label: `${c.name} — ${c.nif_cif}` }))}
                  required
                />
                <Input
                  label="Nº Factura"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  hint="Automático, pero editable"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Fecha de emisión"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  required
                />
                <Input
                  label="Fecha de vencimiento"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <Select
                label="Forma de pago"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                options={PAYMENT_METHODS}
              />
            </div>
          </Card>

          {/* Lines */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Conceptos</h3>
              <Button variant="secondary" size="sm" onClick={addLine}>
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Añadir línea
              </Button>
            </div>

            <div className="space-y-3">
              {lines.map((line, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0 flex items-start gap-1">
                    <div className="flex-1">
                      <Input
                        value={line.description}
                        onChange={(e) => updateLine(index, 'description', e.target.value)}
                        placeholder="Descripción del concepto"
                      />
                    </div>
                    <ProductSelector
                      products={products}
                      onSelect={(p) => {
                        updateLine(index, 'description', p.name)
                        updateLine(index, 'unitPrice', p.unit_price)
                        updateLine(index, 'vatRate', p.vat_rate)
                      }}
                    />
                  </div>
                  <div className="w-16 flex-shrink-0">
                    <Input
                      type="number"
                      value={line.quantity}
                      onChange={(e) => updateLine(index, 'quantity', e.target.value)}
                      placeholder="Ud."
                      min="0"
                      step="1"
                    />
                  </div>
                  <div className="w-24 flex-shrink-0">
                    <Input
                      type="number"
                      value={line.unitPrice}
                      onChange={(e) => updateLine(index, 'unitPrice', e.target.value)}
                      placeholder="Precio"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="w-20 flex-shrink-0">
                    <Select
                      value={line.vatRate}
                      onChange={(e) => updateLine(index, 'vatRate', e.target.value)}
                      options={VAT_RATES}
                    />
                  </div>
                  <div className="w-20 flex-shrink-0">
                    <Select
                      value={line.irpfRate}
                      onChange={(e) => updateLine(index, 'irpfRate', e.target.value)}
                      options={IRPF_RATES}
                    />
                  </div>
                  <button
                    onClick={() => removeLine(index)}
                    disabled={lines.length <= 1}
                    className="mt-1.5 p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div className="mt-4">
              <Input
                label="Notas (opcional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Condiciones de pago, datos bancarios, etc."
              />
            </div>
          </Card>
        </div>

        {/* Right: Totals & Sheet Preview */}
        <div className="space-y-6">
          {/* Totals Card */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Totales</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Base imponible</span>
                <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
              </div>

              {totals.vatGroups?.map((g) => (
                <div key={g.rate} className="flex justify-between py-1">
                  <span className="text-gray-500">IVA ({g.rate}%)</span>
                  <span className="font-medium text-blue-600">{formatCurrency(g.vat)}</span>
                </div>
              ))}

              {totals.irpfGroups?.map((g) => (
                <div key={g.rate} className="flex justify-between py-1">
                  <span className="text-gray-500">IRPF (-{g.rate}%)</span>
                  <span className="font-medium text-red-600">-{formatCurrency(g.irpf)}</span>
                </div>
              ))}

              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between py-1 text-lg font-bold">
                  <span>TOTAL</span>
                  <span className="text-primary-600">{formatCurrency(totals.total)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Real-time Invoice Sheet Preview Card */}
          <Card className="bg-gray-100/50 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Vista previa de plantilla A4</h3>
              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded font-medium">
                Diseño Impresión
              </span>
            </div>
            <div className="transform scale-[0.65] origin-top-left -mr-[50%] -mb-[35%] pointer-events-none">
              <InvoiceSheetPreview
                sender={profile || {}}
                client={selectedClient || {}}
                lines={lines}
                totals={totals}
                meta={{
                  invoiceNumber,
                  issueDate,
                  dueDate,
                  notes,
                  paymentMethod,
                }}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

