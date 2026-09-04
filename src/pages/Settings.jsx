import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useUIStore } from '@/store/uiStore'
import { VAT_RATES, IRPF_RATES, INVOICE_FORMATS } from '@/lib/constants'
import { getTaxIDValidationError } from '@/lib/formatters'

export function Settings() {
  const profile = useAuthStore((s) => s.profile)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const addToast = useUIStore((s) => s.addToast)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    business_name: '',
    nif: '',
    address: '',
    city: '',
    postal_code: '',
    province: '',
    email: '',
    phone: '',
    iae_code: '',
    invoice_prefix: 'FACT',
    invoice_format: 'PREFIX-YYYY-NNN',
    default_vat_rate: 21,
    default_irpf_rate: 0,
    is_new_autonomo: false,
    autonomo_start_date: '',
    bank_iban: '',
    payment_notes: '',
  })
  const [nifError, setNifError] = useState('')

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        business_name: profile.business_name || '',
        nif: profile.nif || '',
        address: profile.address || '',
        city: profile.city || '',
        postal_code: profile.postal_code || '',
        province: profile.province || '',
        email: profile.email || '',
        phone: profile.phone || '',
        iae_code: profile.iae_code || '',
        invoice_prefix: profile.invoice_prefix || 'FACT',
        invoice_format: profile.invoice_format || 'PREFIX-YYYY-NNN',
        default_vat_rate: profile.default_vat_rate || 21,
        default_irpf_rate: profile.default_irpf_rate || 15,
        is_new_autonomo: profile.is_new_autonomo || false,
        autonomo_start_date: profile.autonomo_start_date || '',
        bank_iban: profile.bank_iban || '',
        payment_notes: profile.payment_notes || '',
      })
    }
  }, [profile])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (field === 'nif') {
      const error = getTaxIDValidationError(value)
      setNifError(error || '')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate NIF if provided
    if (form.nif && getTaxIDValidationError(form.nif)) {
      addToast('El NIF/CIF no es válido', 'error')
      return
    }

    setSaving(true)

    const updates = {
      ...form,
    }

    const result = await updateProfile(updates)

    setSaving(false)

    if (result.success) {
      addToast('Configuración guardada', 'success')
    } else {
      addToast(result.error || 'Error al guardar', 'error')
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <CardHeader title="Ajustes" subtitle="Configura tu perfil fiscal y preferencias" />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos del emisor</h3>
          <p className="text-sm text-gray-500 mb-4">
            Estos datos aparecerán en todas tus facturas. Deben coincidir con los de Hacienda.
          </p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nombre completo"
                value={form.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                placeholder="Como aparece en tu DNI"
              />
              <Input
                label="Nombre comercial (opcional)"
                value={form.business_name}
                onChange={(e) => handleChange('business_name', e.target.value)}
                placeholder="Si facturas con nombre comercial"
              />
            </div>
            <Input
              label="NIF / CIF"
              value={form.nif}
              onChange={(e) => handleChange('nif', e.target.value.toUpperCase())}
              error={nifError}
              placeholder="12345678A"
              hint="DNI, NIE o CIF con letra"
            />
            <Input
              label="Dirección"
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Calle, número, piso"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Ciudad"
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
              />
              <Input
                label="Código Postal"
                value={form.postal_code}
                onChange={(e) => handleChange('postal_code', e.target.value)}
              />
              <Input
                label="Provincia"
                value={form.province}
                onChange={(e) => handleChange('province', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
              <Input
                label="Teléfono"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>
            <Input
              label="Epígrafe IAE"
              value={form.iae_code}
              onChange={(e) => handleChange('iae_code', e.target.value)}
              hint="Ej: 491, 751 — el código de tu actividad en Hacienda"
            />
          </div>
        </Card>

        {/* Fiscal config */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración fiscal</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="IVA por defecto"
                value={form.default_vat_rate}
                onChange={(e) => handleChange('default_vat_rate', Number(e.target.value))}
                options={VAT_RATES}
              />
              <Select
                label="IRPF por defecto"
                value={form.default_irpf_rate}
                onChange={(e) => handleChange('default_irpf_rate', Number(e.target.value))}
                options={IRPF_RATES}
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="new-autonomo"
                checked={form.is_new_autonomo}
                onChange={(e) => handleChange('is_new_autonomo', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="new-autonomo" className="text-sm text-gray-700">
                Soy nuevo autónomo (IRPF al 7% durante los primeros 3 años)
              </label>
            </div>
            {form.is_new_autonomo && (
              <Input
                label="Fecha de alta en Hacienda"
                type="date"
                value={form.autonomo_start_date}
                onChange={(e) => handleChange('autonomo_start_date', e.target.value)}
                hint="Usaremos esta fecha para calcular cuándo vuelves al IRPF del 15%"
              />
            )}
          </div>
        </Card>

        {/* Numbering */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Numeración de facturas</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Prefijo"
                value={form.invoice_prefix}
                onChange={(e) => handleChange('invoice_prefix', e.target.value.toUpperCase())}
                placeholder="FACT"
                hint="Ej: FACT, INV, 2026-"
              />
              <Select
                label="Formato"
                value={form.invoice_format}
                onChange={(e) => handleChange('invoice_format', e.target.value)}
                options={INVOICE_FORMATS}
              />
            </div>
            <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              Vista previa:{' '}
              <span className="font-mono font-medium text-gray-700">
                {form.invoice_format
                  .replace('PREFIX', form.invoice_prefix || 'FACT')
                  .replace('YYYY', String(new Date().getFullYear()))
                  .replace('YY', String(new Date().getFullYear()).slice(-2))
                  .replace('NNN', '001')}
              </span>
            </p>
          </div>
        </Card>

        {/* Payment info */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos de pago</h3>
          <p className="text-sm text-gray-500 mb-4">
            Esta información aparecerá en tus facturas para que tus clientes sepan cómo pagarte.
          </p>
          <div className="space-y-4">
            <Input
              label="IBAN"
              value={form.bank_iban}
              onChange={(e) => handleChange('bank_iban', e.target.value.toUpperCase())}
              placeholder="ES12 3456 7890 1234 5678 9012"
              hint="Tu número de cuenta bancaria"
            />
            <Input
              label="Notas de pago (opcional)"
              value={form.payment_notes}
              onChange={(e) => handleChange('payment_notes', e.target.value)}
              placeholder="Ej: Pago a 30 días, transferencia bancaria..."
            />
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="submit" loading={saving} size="lg">
            Guardar configuración
          </Button>
        </div>
      </form>
    </div>
  )
}
