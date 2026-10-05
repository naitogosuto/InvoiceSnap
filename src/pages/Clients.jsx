import { useEffect, useState } from 'react'
import { useClients } from '@/hooks/useClients'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { FREE_TIER } from '@/lib/constants'
import { isProProfile } from '@/lib/plan'

const defaultClient = {
  name: '',
  nif_cif: '',
  address: '',
  city: '',
  postal_code: '',
  province: '',
  email: '',
  phone: '',
}

export function Clients() {
  const { clients, loading, fetchClients, createClient, updateClient, deleteClient } = useClients()
  const profile = useAuthStore((s) => s.profile)
  const addToast = useUIStore((s) => s.addToast)
  const [formOpen, setFormOpen] = useState(false)
  const [editClient, setEditClient] = useState(null)
  const [formData, setFormData] = useState(defaultClient)
  const [saving, setSaving] = useState(false)

  const isPro = isProProfile(profile)
  const atClientLimit = !isPro && clients.length >= FREE_TIER.maxClients

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const openCreate = () => {
    if (atClientLimit) {
      addToast('Límite alcanzado: máximo 10 clientes en el plan gratuito. Actualiza a Pro.', 'warning')
      return
    }
    setEditClient(null)
    setFormData(defaultClient)
    setFormOpen(true)
  }

  const openEdit = (client) => {
    setEditClient(client)
    setFormData(client)
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.nif_cif.trim()) {
      addToast('Nombre y NIF/CIF son obligatorios', 'error')
      return
    }

    setSaving(true)
    let result
    if (editClient) {
      result = await updateClient(editClient.id, formData)
    } else {
      result = await createClient(formData)
    }

    setSaving(false)

    if (result.success) {
      setFormOpen(false)
      addToast(editClient ? 'Cliente actualizado' : 'Cliente creado', 'success')
    } else {
      addToast(result.error || 'Error al guardar', 'error')
    }
  }

  const handleDelete = async (client) => {
    if (!window.confirm(`¿Eliminar a ${client.name}? Esta acción no se puede deshacer.`)) return
    const result = await deleteClient(client.id)
    if (result.success) {
      addToast('Cliente eliminado', 'success')
    } else {
      addToast(result.error || 'Error al eliminar', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <CardHeader
        title="Clientes"
        subtitle={isPro ? 'Sin límite' : `${clients.length}/${FREE_TIER.maxClients} clientes`}
        action={
          <Button onClick={openCreate} disabled={atClientLimit}>
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Nuevo cliente
          </Button>
        }
      />

      <Card>
        {loading ? (
          <div className="flex justify-center py-8">
            <svg className="animate-spin h-6 w-6 text-primary-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-2">No tienes clientes guardados</p>
            <p className="text-sm text-gray-400 mb-4">Añade tu primer cliente para agilizar la creación de facturas</p>
            <Button onClick={openCreate}>Añadir cliente</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Nombre</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">NIF/CIF</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Email</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Ciudad</th>
                  <th className="text-right py-3 px-3 font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-3 font-medium text-gray-900">{client.name}</td>
                    <td className="py-3 px-3 text-gray-600">{client.nif_cif}</td>
                    <td className="py-3 px-3 text-gray-600">{client.email || '—'}</td>
                    <td className="py-3 px-3 text-gray-600">{client.city || '—'}</td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(client)}>
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(client)} className="text-red-600 hover:text-red-700">
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

      {/* Client Form Modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editClient ? 'Editar cliente' : 'Nuevo cliente'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre/Razón social" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            <Input label="NIF/CIF" value={formData.nif_cif} onChange={(e) => setFormData({ ...formData, nif_cif: e.target.value })} required hint="DNI, NIE o CIF" />
          </div>
          <Input label="Dirección" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Ciudad" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
            <Input label="CP" value={formData.postal_code} onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })} />
            <Input label="Provincia" value={formData.province} onChange={(e) => setFormData({ ...formData, province: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            <Input label="Teléfono" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>{editClient ? 'Guardar cambios' : 'Crear cliente'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
