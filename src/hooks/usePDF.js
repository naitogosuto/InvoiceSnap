import { useState, useCallback } from 'react'
import { jsPDF } from 'jspdf'
import { applyPlugin } from 'jspdf-autotable'
import { formatCurrency, formatDateShort } from '@/lib/formatters'

// Registrar el plugin autotable en jsPDF
applyPlugin(jsPDF)

/**
 * Convierte un color hex (#2563eb) a array RGB [37, 99, 235]
 */
function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return [29, 78, 216]
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return [29, 78, 216]
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ]
}

/**
 * Hook para generar PDFs de facturas con el nuevo diseño visual elegante (Basado en plantilla de referencia)
 */
export function usePDF() {
  const [generating, setGenerating] = useState(false)

  const generateInvoicePDF = useCallback(async (invoice, options = {}) => {
    setGenerating(true)
    try {
      const { sender, client, lines, totals, meta } = invoice
      const primaryHex = options.primaryColor || '#1d4ed8'
      const [pr, pg, pb] = hexToRgb(primaryHex)

      const doc = new jsPDF({ unit: 'mm', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth() // 210mm
      const margin = 15
      const contentWidth = pageWidth - 2 * margin // 180mm

      // ==========================================
      // 1. ENCABEZADO: EMISOR (Izquierda) + CAJA FACTURA/FECHA (Derecha)
      // ==========================================
      
      // Emisor: Nombre de Empresa / Autónomo (Grande en Azul)
      const senderName = (sender?.business_name || sender?.full_name || 'EMISOR').toUpperCase()
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(15)
      doc.setTextColor(pr, pg, pb)
      doc.text(senderName, margin, 18)

      // Datos Emisor (NIF, Dirección, CP, Población)
      doc.setFontSize(8.5)
      doc.setTextColor(30, 41, 59)
      
      let senderY = 24
      if (sender?.nif) {
        doc.setFont('helvetica', 'bold')
        doc.text('NIF:', margin, senderY)
        doc.setFont('helvetica', 'normal')
        doc.text(sender.nif, margin + 12, senderY)
        senderY += 4.5
      }

      if (sender?.address) {
        doc.setFont('helvetica', 'normal')
        doc.text(sender.address, margin, senderY)
        senderY += 4.5
      }

      const cleanSenderCp = sender?.postal_code ? sender.postal_code.replace(/^cp:?\s*/i, '').trim() : ''
      const senderLocality = [
        cleanSenderCp ? `CP:${cleanSenderCp}` : null,
        sender?.city,
        sender?.province,
      ].filter(Boolean).join(' ')

      if (senderLocality) {
        doc.text(senderLocality, margin, senderY)
        senderY += 4.5
      }

      // Caja Metadatos (N.º DE FACTURA y FECHA) a la derecha
      const metaBoxWidth = 65
      const metaBoxX = pageWidth - margin - metaBoxWidth
      const metaHeaderY = 14

      // Cabecera azul de la caja de factura/fecha
      doc.setFillColor(pr, pg, pb)
      doc.rect(metaBoxX, metaHeaderY, metaBoxWidth, 6, 'F')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(255, 255, 255)
      doc.text('N.º DE FACTURA', metaBoxX + 16, metaHeaderY + 4.2, { align: 'center' })
      doc.text('FECHA', metaBoxX + 48, metaHeaderY + 4.2, { align: 'center' })

      // Cuerpo blanco de la caja con borde
      doc.setFillColor(255, 255, 255)
      doc.setDrawColor(148, 163, 184)
      doc.setLineWidth(0.2)
      doc.rect(metaBoxX, metaHeaderY + 6, metaBoxWidth, 7, 'DF')
      doc.line(metaBoxX + 32.5, metaHeaderY + 6, metaBoxX + 32.5, metaHeaderY + 13)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(30, 41, 59)
      doc.text(String(meta?.invoiceNumber || ''), metaBoxX + 16, metaHeaderY + 11, { align: 'center' })
      doc.text(meta?.issueDate ? formatDateShort(meta.issueDate) : '—', metaBoxX + 48, metaHeaderY + 11, { align: 'center' })

      // ==========================================
      // 2. SECCIÓN FACTURAR A (CLIENTE)
      // ==========================================
      const clientSectionY = Math.max(senderY + 3, 39)

      // Barra Azul Horizontal
      doc.setFillColor(pr, pg, pb)
      doc.rect(margin, clientSectionY, contentWidth, 6, 'F')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(255, 255, 255)
      doc.text('FACTURAR A', margin + 3, clientSectionY + 4.2)

      // Datos Cliente
      let clientDetailsY = clientSectionY + 10.5
      doc.setFontSize(8.5)
      doc.setTextColor(30, 41, 59)

      const clientName = client?.business_name || client?.name || '—'
      doc.setFont('helvetica', 'bold')
      doc.text('Nombre:', margin, clientDetailsY)
      doc.setFont('helvetica', 'normal')
      doc.text(clientName, margin + 16, clientDetailsY)
      clientDetailsY += 4.5

      if (client?.nif_cif) {
        doc.setFont('helvetica', 'bold')
        doc.text('NIF:', margin, clientDetailsY)
        doc.setFont('helvetica', 'normal')
        doc.text(client.nif_cif, margin + 16, clientDetailsY)
        clientDetailsY += 4.5
      }

      if (client?.address) {
        doc.setFont('helvetica', 'bold')
        doc.text('Direccion:', margin, clientDetailsY)
        doc.setFont('helvetica', 'normal')
        doc.text(client.address, margin + 16, clientDetailsY)
        clientDetailsY += 4.5
      }

      if (client?.province) {
        doc.setFont('helvetica', 'bold')
        doc.text('Provincia:', margin, clientDetailsY)
        doc.setFont('helvetica', 'normal')
        doc.text(client.province, margin + 16, clientDetailsY)
        clientDetailsY += 4.5
      }

      if (client?.postal_code || client?.city) {
        const cleanClientCp = client?.postal_code ? client.postal_code.replace(/^cp:?\s*/i, '').trim() : ''
        const cpLoc = [cleanClientCp, client?.city].filter(Boolean).join(' ')
        doc.setFont('helvetica', 'bold')
        doc.text('CP:', margin, clientDetailsY)
        doc.setFont('helvetica', 'normal')
        doc.text(cpLoc, margin + 16, clientDetailsY)
        clientDetailsY += 4.5
      }

      // ==========================================
      // 3. TABLA DE CONCEPTOS (ESTILO REJILLA DE REFERENCIA)
      // ==========================================
      const tableStart = Math.max(clientDetailsY + 4, 68)
      const tableBody = (lines || []).map((line) => [
        line.description || '—',
        String(line.quantity ?? 1),
        line.unit_price ? formatCurrency(line.unit_price) : ' - ',
        formatCurrency((line.quantity ?? 0) * (line.unit_price ?? 0)),
      ])

      doc.autoTable({
        startY: tableStart,
        head: [['DESCRIPCIÓN', 'CANT.', 'PRECIO UNITARIO', 'IMPORTE']],
        body: tableBody,
        theme: 'grid',
        headStyles: {
          fillColor: [pr, pg, pb],
          textColor: 255,
          fontSize: 8.5,
          fontStyle: 'bold',
          halign: 'center',
        },
        bodyStyles: {
          fontSize: 8.5,
          textColor: [30, 41, 59],
          lineColor: [148, 163, 184],
          lineWidth: 0.2,
          cellPadding: 2.5,
        },
        columnStyles: {
          0: { cellWidth: 'auto', halign: 'left' },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 38, halign: 'right' },
          3: { cellWidth: 32, halign: 'right' },
        },
        margin: { left: margin, right: margin },
      })

      // ==========================================
      // 4. PIE Y CUADRO DE TOTALES DESTACADO
      // ==========================================
      let finalY = doc.lastAutoTable.finalY + 8

      // Si no hay suficiente espacio para los totales y pie, añadir página
      if (finalY > 220) {
        doc.addPage()
        finalY = 20
      }

      // Izquierda: Nota de Agradecimiento y Datos Bancarios
      doc.setFont('helvetica', 'bolditalic')
      doc.setFontSize(10)
      doc.setTextColor(pr, pg, pb)
      doc.text('Gracias por su confianza', margin, finalY + 5)

      let bankY = finalY + 12
      const iban = sender?.bank_iban || sender?.iban || meta?.iban || sender?.bank_account

      if (iban) {
        if (sender?.bank_name) {
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(9)
          doc.setTextColor(30, 41, 59)
          doc.text(sender.bank_name, margin, bankY)
          bankY += 4.5
        }

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7.5)
        doc.setTextColor(30, 41, 59)
        doc.text('NUMERO DE CUENTA', margin, bankY)
        bankY += 4.5

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.text(iban, margin, bankY)
        bankY += 4.5
      }

      if (meta?.notes) {
        bankY += 2
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(107, 114, 128)
        doc.text('NOTAS / OBSERVACIONES:', margin, bankY)
        bankY += 4
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        const notesLines = doc.splitTextToSize(meta.notes, 85)
        doc.text(notesLines, margin, bankY)
      }

      // Derecha: Cuadro sombreado de Totales (Azul Claro #dbeafe)
      const totalsWidth = 72
      const totalsX = pageWidth - margin - totalsWidth
      const totalsY = finalY

      // Preparar lista de desglose de totales
      const totalItems = [
        { label: 'SUBTOTAL', value: formatCurrency(totals?.subtotal ?? 0), isTotal: false },
      ]

      if (totals?.vatGroups && totals.vatGroups.length > 0) {
        totals.vatGroups.forEach((g) => {
          totalItems.push({
            label: `IVA ${g.rate}%`,
            value: formatCurrency(g.vat),
            isTotal: false,
          })
        })
      } else {
        totalItems.push({
          label: 'IVA',
          value: formatCurrency(totals?.totalVat ?? 0),
          isTotal: false,
        })
      }

      if (totals?.irpfGroups && totals.irpfGroups.length > 0) {
        totals.irpfGroups.forEach((g) => {
          totalItems.push({
            label: `IRPF (-${g.rate}%)`,
            value: `-${formatCurrency(g.irpf)}`,
            isTotal: false,
          })
        })
      } else if (totals?.totalIrpf > 0) {
        totalItems.push({
          label: 'IRPF',
          value: `-${formatCurrency(totals.totalIrpf)}`,
          isTotal: false,
        })
      }

      totalItems.push({
        label: 'TOTAL',
        value: `${formatCurrency(totals?.total ?? 0)}`,
        isTotal: true,
      })

      const boxHeight = totalItems.length * 6.5 + 4

      // Dibujar caja con fondo Azul Claro (#dbeafe = RGB 219, 234, 254)
      doc.setFillColor(219, 234, 254)
      doc.rect(totalsX, totalsY, totalsWidth, boxHeight, 'F')

      // Dibujar filas de totales dentro de la caja
      let currentItemY = totalsY + 6
      totalItems.forEach((item) => {
        if (item.isTotal) {
          // Línea separadora previa al TOTAL
          doc.setDrawColor(pr, pg, pb)
          doc.setLineWidth(0.4)
          doc.line(totalsX + 4, currentItemY - 3.5, totalsX + totalsWidth - 4, currentItemY - 3.5)

          doc.setFont('helvetica', 'bold')
          doc.setFontSize(11)
          doc.setTextColor(pr, pg, pb)
          doc.text(item.label, totalsX + 4, currentItemY + 1)
          doc.text(item.value, totalsX + totalsWidth - 4, currentItemY + 1, { align: 'right' })
        } else {
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(8.5)
          doc.setTextColor(30, 41, 59)
          doc.text(item.label, totalsX + 4, currentItemY)
          doc.setFont('helvetica', 'normal')
          doc.text(item.value, totalsX + totalsWidth - 4, currentItemY, { align: 'right' })
        }
        currentItemY += 6.5
      })

      return doc.output('blob')
    } catch (error) {
      console.error('PDF generation error:', error)
      throw new Error(
        error.message || 'Error al generar el PDF. Revisa la consola para más detalles.',
      )
    } finally {
      setGenerating(false)
    }
  }, [])

  return { generateInvoicePDF, generating }
}

