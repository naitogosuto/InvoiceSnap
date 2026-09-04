import { useEffect, useState } from 'react'
import { useProducts } from '@/hooks/useProducts'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { useUIStore } from '@/store/uiStore'
import { formatCurrency } from '@/lib/formatters'
import { VAT_RATES } from '@/lib/constants'

const UNIT_TYPES = [
  { value: 'hora', label: 'Hora' },
  { value: 'unidad', label: 'Unidad' },
  { value: 'proyecto', label: 'Proyecto' },
  { value: 'mes', label: 'Mes' },
  { value: 'dia', label: 'Día' },
]

const emptyProduct = {
  name: '',
  description: '',
  unit_price: '',
  unit_type: 'unidad',
  vat_rate: 21,
}

export function Products() {
  const { products, loading, fetchProducts, createProduct, updateProduct, deleteProduct } =
    useProducts()
  const addToast = useUIStore((s) => s.addToast)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...emptyProduct })

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...emptyProduct })
    setModalOpen(true)
  }

  const openEdit = (product) => {
    setEditingId(product.id)
    setForm({
      name: product.name,
      description: product.description || '',
      unit_price: product.unit_price,
      unit_type: product.unit_type,
      vat_rate: product.vat_rate,
    })
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      addToast('El nombre del producto es obligatorio', 'error')
      return
    }

    setSaving(true)

    const data = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      unit_price: parseFloat(form.unit_price) || 0,
      unit_type: form.unit_type,
      vat_rate: parseFloat(form.vat_rate) || 21,
    }

    let result
    if (editingId) {
      result = await updateProduct(editingId, data)
    } else {
      result = await createProduct(data)
    }

    setSaving(false)

    if (result.success) {
      addToast(editingId ? 'Producto actualizado' : 'Producto creado', 'success')
      setModalOpen(false)
    } else {
      addToast(result.error || 'Error al guardar', 'error')
    }
  }

  const handleDelete = async (product) => {
    if (!window.confirm(`¿Eliminar "${product.name}"?`)) return
    const result = await deleteProduct(product.id)
    if (result.success) {
      addToast('Producto eliminado', 'success')
    }
  }

  return (
    <div className="space-y-6">
      <CardHeader
        title="Productos / Servicios"
        subtitle={`${products.length} productos`}
        action={
          <Button onClick={openCreate}>
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Nuevo producto
          </Button>
        }
      />

      <Card padded={false}>
        {loading && products.length === 0 ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-6 w-6 text-primary-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-6 w-6 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382z" />
                <path d="M4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
              </svg>
            </div>
            <p className="text-gray-500 mb-2">No tienes productos todavía</p>
            <p className="text-sm text-gray-400 mb-4">
              Crea productos para añadirlos rápidamente a tus facturas
            </p>
            <Button onClick={openCreate}>Crear primer producto</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Nombre</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Descripción</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Precio</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">Tipo</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">IVA</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{product.name}</td>
                    <td className="py-3 px-4 text-gray-500 max-w-[200px] truncate">
                      {product.description || '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {formatCurrency(product.unit_price)}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-600 capitalize">
                      {product.unit_type}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {product.vat_rate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(product)}>
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(product)}
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

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar producto' : 'Nuevo producto'}
        size="sm"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Nombre"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ej: Consultoría web"
            required
            autoFocus
          />
          <Input
            label="Descripción (opcional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Ej: Desarrollo de sitio web corporativo"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Precio unitario"
              type="number"
              step="0.01"
              min="0"
              value={form.unit_price}
              onChange={(e) => setForm((f) => ({ ...f, unit_price: e.target.value }))}
              placeholder="0.00"
              required
            />
            <Select
              label="Tipo"
              value={form.unit_type}
              onChange={(e) => setForm((f) => ({ ...f, unit_type: e.target.value }))}
              options={UNIT_TYPES}
            />
          </div>
          <Select
            label="IVA"
            value={form.vat_rate}
            onChange={(e) => setForm((f) => ({ ...f, vat_rate: Number(e.target.value) }))}
            options={VAT_RATES}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              {editingId ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
