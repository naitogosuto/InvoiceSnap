/**
 * Format a number as EUR currency
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

/**
 * Format a date string to Spanish locale
 */
export function formatDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString + 'T12:00:00').toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format a date string to short format (dd/mm/yyyy)
 */
export function formatDateShort(dateString) {
  if (!dateString) return ''
  return new Date(dateString + 'T12:00:00').toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/**
 * Format a NIF/NIE/CIF with Spanish formatting
 */
export function formatNIF(nif) {
  if (!nif) return ''
  const cleaned = nif.replace(/\s/g, '').toUpperCase()
  return cleaned
}

/**
 * Validate Spanish NIF (DNI)
 */
export function isValidDNI(value) {
  const dniLetters = 'TRWAGMYFPDXBNJZSQVHLCKE'
  const number = parseInt(value.slice(0, 8), 10)
  const letter = value.slice(8).toUpperCase()
  return dniLetters[number % 23] === letter
}

/**
 * Validate Spanish CIF
 */
export function isValidCIF(value) {
  const cifReg = /^[ABCDEFGHJKLMNPQRSUVW]\d{7}[0-9A-J]$/
  if (!cifReg.test(value)) return false
  const digits = value.slice(1, 8)
  const control = value.slice(8).toUpperCase()
  const evenSum = [...digits]
    .filter((_, i) => (i + 1) % 2 === 0)
    .reduce((sum, d) => sum + parseInt(d, 10), 0)
  const oddSum = [...digits]
    .filter((_, i) => (i + 1) % 2 !== 0)
    .reduce((sum, d) => {
      const n = parseInt(d, 10) * 2
      return sum + (n > 9 ? n - 9 : n)
    }, 0)
  const total = evenSum + oddSum
  const unit = total % 10
  const expectedDigit = unit === 0 ? 0 : 10 - unit
  const expectedLetter = String.fromCharCode(64 + expectedDigit)
  return control === String(expectedDigit) || control === expectedLetter
}

/**
 * Validate Spanish NIE
 */
export function isValidNIE(value) {
  const niePrefixes = { X: '0', Y: '1', Z: '2' }
  const letter = value[0].toUpperCase()
  if (!(letter in niePrefixes)) return false
  const normalized = niePrefixes[letter] + value.slice(1)
  return isValidDNI(normalized)
}

/**
 * Detect and validate any Spanish tax ID (NIF/NIE/CIF)
 */
export function isValidSpanishTaxID(value) {
  if (!value || typeof value !== 'string') return false
  const cleaned = value.replace(/[\s-]/g, '').toUpperCase()

  if (/^\d{8}[A-Z]$/.test(cleaned)) return isValidDNI(cleaned)
  if (/^[XYZ]\d{7}[A-Z]$/.test(cleaned)) return isValidNIE(cleaned)
  if (/^[ABCDEFGHJKLMNPQRSUVW]\d{7}[0-9A-J]$/.test(cleaned)) return isValidCIF(cleaned)

  return false
}

/**
 * Format NIF with Spanish validation message
 */
export function getTaxIDValidationError(value) {
  if (!value || !value.trim()) return 'El NIF/CIF es obligatorio'
  const cleaned = value.replace(/[\s-]/g, '').toUpperCase()
  if (cleaned.length < 9) return 'El NIF/CIF debe tener 9 caracteres'
  if (!isValidSpanishTaxID(cleaned)) return 'El NIF/CIF no es válido'
  return null
}
