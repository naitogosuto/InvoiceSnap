import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useUIStore } from '@/store/uiStore'
import { VAT_RATES, IRPF_RATES, INVOICE_FORMATS } from '@/lib/constants'
import { getTaxIDValidationError } from '@/lib/formatters'
import { redirectToCheckout, redirectToCustomerPortal, STRIPE_PRICES } from '@/lib/stripe'

export function Settings() {
  const profile = useAuthStore((s) => s.profile)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const updatePassword = useAuthStore((s) => s.updatePassword)
  const updateEmail = useAuthStore((s) => s.updateEmail)
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
  const [billingInterval, setBillingInterval] = useState('monthly')
  const [billingLoading, setBillingLoading] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [securityLoading, setSecurityLoading] = useState(false)
  const isPro = profile?.subscription_tier === 'pro'

  // Detectar parámetros de retorno de Stripe Checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('session') === 'success') {
      addToast('¡Suscripción activada! Bienvenido a InvoiceSnap Pro 🎉', 'success')
      // Limpiar URL
      window.history.replaceState({}, '', '/settings')
    } else if (params.get('session') === 'cancel') {
      addToast('Suscripción cancelada. Puedes intentarlo cuando quieras.', 'info')
      window.history.replaceState({}, '', '/settings')
    }
  }, [addToast])

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

  const handleCheckout = async () => {
    const priceId = billingInterval === 'yearly' ? STRIPE_PRICES.yearly : STRIPE_PRICES.monthly
    if (!priceId) {
      addToast('Error: Los precios de Stripe no están configurados', 'error')
      return
    }
    setBillingLoading(true)
    try {
      await redirectToCheckout(priceId)
    } catch (err) {
      addToast(err.message || 'Error al iniciar el pago', 'error')
    } finally {
      setBillingLoading(false)
    }
  }

  const handlePortal = async () => {
    setBillingLoading(true)
    try {
      await redirectToCustomerPortal()
    } catch (err) {
      addToast(err.message || 'Error al abrir el portal', 'error')
    } finally {
      setBillingLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (field === 'nif') {
      const error = getTaxIDValidationError(value)
      setNifError(error || '')
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      addToast('La contraseña debe tener al menos 6 caracteres', 'error')
      return
    }
    if (newPassword !== confirmPassword) {
      addToast('Las contraseñas no coinciden', 'error')
      return
    }
    setSecurityLoading(true)
    const result = await updatePassword(newPassword)
    setSecurityLoading(false)
    if (result.success) {
      setNewPassword('')
      setConfirmPassword('')
      addToast('Contraseña actualizada', 'success')
    } else {
      addToast(result.error || 'Error al actualizar la contraseña', 'error')
    }
  }

  const handleChangeEmail = async (e) => {
    e.preventDefault()
    if (!newEmail) return
    setSecurityLoading(true)
    const result = await updateEmail(newEmail)
    setSecurityLoading(false)
    if (result.success) {
      addToast('Te hemos enviado un email de confirmación a la nueva dirección', 'success')
    } else {
      addToast(result.error || 'Error al actualizar el email', 'error')
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

      {/* Plan y Suscripción */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Plan y suscripción</h3>
          {isPro ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Pro activo
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
              Plan Gratuito
            </span>
          )}
        </div>

        {isPro ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Disfrutas de todas las funciones de InvoiceSnap: facturas ilimitadas, clientes ilimitados, plantillas premium y más.
            </p>
            {profile?.subscription_ends_at && (
              <p className="text-xs text-gray-500">
                Tu suscripción se renueva el{' '}
                <span className="font-medium text-gray-700">
                  {new Date(profile.subscription_ends_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </p>
            )}
            <Button variant="secondary" onClick={handlePortal} loading={billingLoading}>
              Gestionar suscripción
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Estás en el plan gratuito: 5 facturas/mes, 10 clientes. Actualiza a Pro para desbloquear todo.
            </p>

            {/* Toggle mensual/anual */}
            <div className="flex items-center justify-center gap-3 p-1 bg-gray-100 rounded-lg w-fit">
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  billingInterval === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setBillingInterval('monthly')}
              >
                Mensual
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  billingInterval === 'yearly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setBillingInterval('yearly')}
              >
                Anual
                <span className="ml-1 text-xs text-green-600 font-semibold">-29%</span>
              </button>
            </div>

            {/* Precio */}
            <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-6 border border-primary-100">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900">
                  {billingInterval === 'monthly' ? '7 €' : '60 €'}
                </span>
                <span className="text-sm text-gray-500">
                  /{billingInterval === 'monthly' ? 'mes' : 'año'}
                </span>
              </div>
              {billingInterval === 'yearly' && (
                <p className="text-xs text-green-600 mt-1">Ahorras 24 € al año (5 €/mes)</p>
              )}
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                {['Facturas ilimitadas', 'Clientes ilimitados', 'Plantillas premium', 'Logo y colores personalizados', 'Exportar CSV/Excel'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-green-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <Button onClick={handleCheckout} loading={billingLoading} size="lg" className="w-full">
              Actualizar a Pro →
            </Button>
          </div>
        )}
      </Card>

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

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Seguridad</h3>
        <div className="space-y-6">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <p className="text-sm font-medium text-gray-700">Cambiar contraseña</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nueva contraseña"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
              />
              <Input
                label="Confirmar contraseña"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                autoComplete="new-password"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" loading={securityLoading}>Actualizar contraseña</Button>
            </div>
          </form>

          <div className="border-t border-gray-200 pt-6">
            <form onSubmit={handleChangeEmail} className="space-y-4">
              <p className="text-sm font-medium text-gray-700">Cambiar email</p>
              <Input
                label="Nuevo email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="nuevo@email.com"
                autoComplete="email"
              />
              <div className="flex justify-end">
                <Button type="submit" loading={securityLoading}>Actualizar email</Button>
              </div>
            </form>
          </div>
        </div>
      </Card>
    </div>
  )
}
