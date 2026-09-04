/**
 * Redondeo bancario (round half up) a 2 decimales
 * Cumple con el criterio de Hacienda para declaraciones tributarias
 */
export function round2(n) {
  return Math.round(n * 100) / 100
}

/**
 * Calcula los totales de una factura con desglose de IVA e IRPF
 *
 * @param {Array} lines - Líneas de la factura
 * @param {Object} options
 * @param {boolean} options.isNewAutonomo - Si el emisor es nuevo autónomo (IRPF 7%)
 * @param {number} options.defaultIrpfRate - Tasa de IRPF por defecto (15 o 7)
 * @returns {Object} Totales calculados
 */
export function calculateInvoiceTotals(lines, options = {}) {
  if (!lines || lines.length === 0) {
    return {
      subtotal: 0,
      totalVat: 0,
      totalIrpf: 0,
      total: 0,
      vatGroups: {},
      irpfGroups: {},
    }
  }

  const defaultIrpfRate = options.defaultIrpfRate ?? 15
  const vatGroups = {}
  const irpfGroups = {}

  for (const line of lines) {
    const quantity = parseFloat(line.quantity) || 0
    const unitPrice = parseFloat(line.unitPrice) || 0
    const vatRate = parseFloat(line.vatRate) ?? 0
    const irpfRate = line.irpfRate !== undefined ? parseFloat(line.irpfRate) : defaultIrpfRate

    const lineSubtotal = round2(quantity * unitPrice)
    const vatAmount = round2(lineSubtotal * (vatRate / 100))
    const irpfAmount = round2(lineSubtotal * (irpfRate / 100))

    // Desglose de IVA
    if (!vatGroups[vatRate]) {
      vatGroups[vatRate] = { base: 0, vat: 0, rate: vatRate }
    }
    vatGroups[vatRate].base = round2(vatGroups[vatRate].base + lineSubtotal)
    vatGroups[vatRate].vat = round2(vatGroups[vatRate].vat + vatAmount)

    // Desglose de IRPF
    if (irpfRate > 0) {
      if (!irpfGroups[irpfRate]) {
        irpfGroups[irpfRate] = { base: 0, irpf: 0, rate: irpfRate }
      }
      irpfGroups[irpfRate].base = round2(irpfGroups[irpfRate].base + lineSubtotal)
      irpfGroups[irpfRate].irpf = round2(irpfGroups[irpfRate].irpf + irpfAmount)
    }
  }

  const subtotal = round2(lines.reduce((sum, l) => {
    return sum + round2((parseFloat(l.quantity) || 0) * (parseFloat(l.unitPrice) || 0))
  }, 0))

  const totalVat = round2(Object.values(vatGroups).reduce((sum, g) => sum + g.vat, 0))
  const totalIrpf = round2(Object.values(irpfGroups).reduce((sum, g) => sum + g.irpf, 0))
  const total = round2(subtotal + totalVat - totalIrpf)

  return {
    subtotal,
    totalVat,
    totalIrpf,
    total,
    vatGroups: Object.values(vatGroups),
    irpfGroups: Object.values(irpfGroups),
  }
}

/**
 * Calcula el importe de una línea individual
 */
export function calculateLineTotals(quantity, unitPrice, vatRate, irpfRate) {
  const qty = parseFloat(quantity) || 0
  const price = parseFloat(unitPrice) || 0
  const vat = parseFloat(vatRate) || 0
  const irpf = parseFloat(irpfRate) || 0

  const subtotal = round2(qty * price)
  const vatAmount = round2(subtotal * (vat / 100))
  const irpfAmount = round2(subtotal * (irpf / 100))

  return {
    subtotal,
    vatAmount,
    irpfAmount,
    total: round2(subtotal + vatAmount - irpfAmount),
  }
}
