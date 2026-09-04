import React from 'react'
import { formatCurrency, formatDateShort } from '@/lib/formatters'

/**
 * Componente visual de vista previa de Factura en estilo Folio A4
 * Coincide exactamente con el layout de la plantilla de referencia visual.
 */
export function InvoiceSheetPreview({ sender, client, lines = [], totals, meta = {} }) {
  const primaryColor = sender?.primary_color || '#1d4ed8'

  const senderName = sender?.business_name || sender?.full_name || 'REFORMAS Y FACHADAS A. RODRIGUEZ'
  const clientName = client?.business_name || client?.name || '—'
  const iban = sender?.bank_iban || sender?.iban || meta?.iban || sender?.bank_account

  return (
    <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6 md:p-8 max-w-4xl mx-auto text-gray-800 text-sm font-sans select-none">
      {/* 1. ENCABEZADO: Emisor a la izq, Metadatos a la der */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold uppercase tracking-wide" style={{ color: primaryColor }}>
            {senderName}
          </h2>
          <div className="mt-2 space-y-0.5 text-xs text-gray-700 font-medium">
            {sender?.nif && (
              <p><span className="font-bold">NIF:</span> {sender.nif}</p>
            )}
            {sender?.address && <p>{sender.address}</p>}
            {(sender?.postal_code || sender?.city || sender?.province) && (
              <p>
                {[
                  sender?.postal_code ? `CP:${sender.postal_code.replace(/^cp:?\s*/i, '').trim()}` : null,
                  sender?.city,
                  sender?.province,
                ]
                  .filter(Boolean)
                  .join(' ')}
              </p>
            )}
          </div>
        </div>

        {/* Caja de Metadatos (Factura & Fecha) */}
        <div className="w-full sm:w-60 border border-gray-300 rounded overflow-hidden text-center">
          <div
            className="text-white text-xs font-bold py-1.5 px-2 grid grid-cols-2 gap-1 uppercase"
            style={{ backgroundColor: primaryColor }}
          >
            <div>N.º DE FACTURA</div>
            <div>FECHA</div>
          </div>
          <div className="bg-white text-xs font-bold text-gray-900 py-2 px-2 grid grid-cols-2 divide-x divide-gray-300">
            <div>{meta?.invoiceNumber || '—'}</div>
            <div>{meta?.issueDate ? formatDateShort(meta.issueDate) : '—'}</div>
          </div>
        </div>
      </div>

      {/* 2. SECCIÓN FACTURAR A */}
      <div className="mb-6 rounded overflow-hidden border border-gray-200">
        <div
          className="text-white text-xs font-bold py-1.5 px-3 uppercase tracking-wide"
          style={{ backgroundColor: primaryColor }}
        >
          FACTURAR A
        </div>

        <div className="p-3 bg-gray-50/50 text-xs text-gray-700">
          <div className="space-y-1">
            <p><span className="font-bold">Nombre:</span> {clientName}</p>
            {client?.nif_cif && <p><span className="font-bold">NIF:</span> {client.nif_cif}</p>}
            {client?.address && <p><span className="font-bold">Direccion:</span> {client.address}</p>}
            {client?.province && <p><span className="font-bold">Provincia:</span> {client.province}</p>}
            {(client?.postal_code || client?.city) && (
              <p>
                <span className="font-bold">CP:</span>{' '}
                {[client?.postal_code ? client.postal_code.replace(/^cp:?\s*/i, '').trim() : null, client?.city]
                  .filter(Boolean)
                  .join(' ')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 3. TABLA DE CONCEPTOS (ESTILO REJILLA DE REFERENCIA) */}
      <div className="mb-6 overflow-x-auto rounded border border-gray-300">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="text-white uppercase font-bold text-center" style={{ backgroundColor: primaryColor }}>
              <th className="py-2 px-3 text-left w-auto">DESCRIPCIÓN</th>
              <th className="py-2 px-3 w-16">CANT.</th>
              <th className="py-2 px-3 w-32 text-right">PRECIO UNITARIO</th>
              <th className="py-2 px-3 w-28 text-right">IMPORTE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300 text-gray-800">
            {lines.length === 0 || lines.every((l) => !l.description) ? (
              <tr>
                <td colSpan="4" className="py-4 text-center text-gray-400 italic">
                  No hay conceptos añadidos todavía
                </td>
              </tr>
            ) : (
              lines
                .filter((l) => l.description && l.description.trim())
                .map((line, idx) => {
                  const qty = parseFloat(line.quantity) || 1
                  const price = parseFloat(line.unitPrice ?? line.unit_price) || 0
                  const amount = qty * price

                  return (
                    <tr key={idx} className="divide-x divide-gray-300 hover:bg-gray-50/80">
                      <td className="py-2 px-3 whitespace-pre-line">{line.description}</td>
                      <td className="py-2 px-3 text-center">{qty}</td>
                      <td className="py-2 px-3 text-right font-mono">
                        {price > 0 ? formatCurrency(price) : ' - '}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-medium">
                        {amount > 0 ? formatCurrency(amount) : ' - '}
                      </td>
                    </tr>
                  )
                })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. PIE DE PÁGINA Y CUADRO DE TOTALES SOMBREADO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
        {/* Mensaje & Banco */}
        <div className="space-y-3">
          <p className="text-sm font-bold italic" style={{ color: primaryColor }}>
            Gracias por su confianza
          </p>

          {iban && (
            <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs text-gray-700 space-y-1">
              {sender?.bank_name && <p className="font-bold text-gray-900">{sender.bank_name}</p>}
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                NUMERO DE CUENTA
              </p>
              <p className="font-mono text-gray-800">{iban}</p>
            </div>
          )}

          {meta?.notes && (
            <div className="text-xs text-gray-500">
              <span className="font-bold text-gray-700">Notas:</span> {meta.notes}
            </div>
          )}
        </div>

        {/* Cuadro de Totales sombreado en Azul Claro (#dbeafe) */}
        <div className="bg-blue-100/70 border border-blue-200 rounded p-4 text-xs font-semibold text-gray-800 space-y-2">
          <div className="flex justify-between items-center">
            <span>SUBTOTAL</span>
            <span className="font-mono">{formatCurrency(totals?.subtotal || 0)}</span>
          </div>

          {totals?.vatGroups?.map((g) => (
            <div key={g.rate} className="flex justify-between items-center text-gray-700">
              <span>IVA {g.rate}%</span>
              <span className="font-mono">{formatCurrency(g.vat)}</span>
            </div>
          ))}

          {totals?.irpfGroups?.map((g) => (
            <div key={g.rate} className="flex justify-between items-center text-red-700">
              <span>IRPF (-{g.rate}%)</span>
              <span className="font-mono">-{formatCurrency(g.irpf)}</span>
            </div>
          ))}

          <div className="pt-2 border-t border-blue-400 flex justify-between items-center text-base font-bold" style={{ color: primaryColor }}>
            <span>TOTAL</span>
            <span className="font-mono text-lg">{formatCurrency(totals?.total || 0)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
