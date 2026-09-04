// IVA rates for Spain
export const VAT_RATES = [
  { value: 21, label: '21% — General' },
  { value: 10, label: '10% — Reducido' },
  { value: 4, label: '4% — Superreducido' },
  { value: 0, label: '0% — Exento' },
]

// IRPF retention rates for Spain
export const IRPF_RATES = [
  { value: 15, label: '15% — Estándar' },
  { value: 7, label: '7% — Nuevos autónomos (3 primeros años)' },
  { value: 0, label: '0% — Sin retención' },
]

// Recargo de equivalencia (for retailers)
export const EQUIVALENCE_SURCHARGE = {
  21: 5.2,
  10: 1.4,
  4: 0.5,
}

// Invoice statuses
export const INVOICE_STATUS = {
  draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-700' },
  sent: { label: 'Enviada', color: 'bg-blue-100 text-blue-700' },
  paid: { label: 'Cobrada', color: 'bg-green-100 text-green-700' },
  overdue: { label: 'Vencida', color: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Anulada', color: 'bg-yellow-100 text-yellow-700' },
}

// Invoice types
export const INVOICE_TYPES = {
  standard: 'Factura ordinaria',
  rectificativa: 'Factura rectificativa',
}

// Payment methods
export const PAYMENT_METHODS = [
  { value: 'transferencia', label: 'Transferencia bancaria' },
  { value: 'bizum', label: 'Bizum' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta de crédito/débito' },
]

// Invoice number formats
export const INVOICE_FORMATS = [
  { value: 'PREFIX-YYYY-NNN', label: 'FACT-2026-001' },
  { value: 'YYYY/NNN', label: '2026/001' },
  { value: 'NNN', label: '001' },
  { value: 'PREFIX-YY-NNN', label: 'FACT-26-001' },
]

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
  free: { label: 'Gratuito', limitInvoices: 5, limitClients: 10 },
  pro: { label: 'Pro', limitInvoices: Infinity, limitClients: Infinity },
}

// Default values
export const DEFAULTS = {
  vatRate: 21,
  irpfRate: 0,
  country: 'España',
  currency: 'EUR',
  locale: 'es-ES',
  invoiceFormat: 'PREFIX-YYYY-NNN',
}

// Free tier limits
export const FREE_TIER = {
  maxInvoicesPerMonth: 5,
  maxClients: 10,
}
