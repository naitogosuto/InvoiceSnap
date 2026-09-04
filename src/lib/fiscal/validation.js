/**
 * Validación fiscal para facturas españolas
 */

export function validateInvoiceLines(lines) {
  const errors = []

  if (!lines || lines.length === 0) {
    errors.push({ field: 'lines', message: 'La factura debe tener al menos una línea de concepto' })
    return errors
  }

  lines.forEach((line, index) => {
    if (!line.description || !line.description.trim()) {
      errors.push({ field: `lines.${index}.description`, message: 'La descripción es obligatoria' })
    }

    const qty = parseFloat(line.quantity)
    if (isNaN(qty) || qty <= 0) {
      errors.push({ field: `lines.${index}.quantity`, message: 'La cantidad debe ser mayor que 0' })
    }

    const price = parseFloat(line.unitPrice)
    if (isNaN(price) || price < 0) {
      errors.push({ field: `lines.${index}.unitPrice`, message: 'El precio unitario debe ser mayor o igual que 0' })
    }
  })

  return errors
}

/**
 * Valida que la fecha de emisión sea válida
 */
export function validateIssueDate(date) {
  if (!date) return 'La fecha de emisión es obligatoria'
  const parsed = new Date(date + 'T12:00:00')
  if (isNaN(parsed.getTime())) return 'La fecha no es válida'
  return null
}

/**
 * Valida el número de factura según formato seleccionado
 */
export function validateInvoiceNumber(number, format) {
  if (!number || !number.trim()) return 'El número de factura es obligatorio'
  if (format && format.includes('NNN')) {
    const match = number.match(/(\d+)$/)
    if (!match) return 'El número de factura debe terminar en dígitos secuenciales'
  }
  return null
}
