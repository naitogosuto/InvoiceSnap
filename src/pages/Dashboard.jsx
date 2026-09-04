import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useInvoices } from '@/hooks/useInvoices'
import { useClients } from '@/hooks/useClients'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDateShort } from '@/lib/formatters'
import { FREE_TIER } from '@/lib/constants'

/**
 * Barra de progreso horizontal simple
 */
function ProgressBar({ value, max, color = 'bg-primary-500' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function Dashboard() {
  const profile = useAuthStore((s) => s.profile)
  const isPro = profile?.subscription_tier === 'pro'
  const { invoices, loading, loadInvoices } = useInvoices()
  const { clients, fetchClients } = useClients()

  useEffect(() => {
    loadInvoices()
    fetchClients()
  }, [loadInvoices, fetchClients])

  // Si carga y no hay datos, mostrar skeleton
  if (loading && invoices.length === 0) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl" />
          ))}
        </div>
        <div className="h-48 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  // Stats base
  const stats = {
    total: invoices.length,
    draft: invoices.filter((i) => i.status === 'draft').length,
    sent: invoices.filter((i) => i.status === 'sent').length,
    paid: invoices.filter((i) => i.status === 'paid').length,
    overdue: invoices.filter((i) => i.status === 'overdue').length,
    cancelled: invoices.filter((i) => i.status === 'cancelled').length,
    totalRevenue: invoices
      .filter((i) => i.status === 'paid')
      .reduce((sum, i) => sum + parseFloat(i.total || 0), 0),
    pendingRevenue: invoices
      .filter((i) => i.status === 'sent' || i.status === 'overdue')
      .reduce((sum, i) => sum + parseFloat(i.total || 0), 0),
  }

  // Facturas este mes (para el límite free)
  const thisMonth = new Date().getMonth()
  const thisYear = new Date().getFullYear()
  const thisMonthInvoices = invoices.filter((inv) => {
    if (!inv.created_at) return false
    const d = new Date(inv.created_at)
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear
  })

  // Datos mensuales para el mini gráfico (últimos 6 meses)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const m = (thisMonth - (5 - i) + 12) % 12
    const y = m > thisMonth ? thisYear - 1 : thisYear
    const count = invoices.filter((inv) => {
      if (!inv.created_at) return false
      const d = new Date(inv.created_at)
      return d.getMonth() === m && d.getFullYear() === y
    }).length
    return { month: m, year: y, count }
  })

  // Ingresos mensuales para los últimos 3 meses
  const revenueByMonth = Array.from({ length: 3 }, (_, i) => {
    const m = (thisMonth - (2 - i) + 12) % 12
    const y = m > thisMonth ? thisYear - 1 : thisYear
    const paid = invoices.filter((inv) => {
      if (!inv.issue_date) return false
      const d = new Date(inv.issue_date)
      return d.getMonth() === m && d.getFullYear() === y && inv.status === 'paid'
    })
    const pending = invoices.filter((inv) => {
      if (!inv.issue_date) return false
      const d = new Date(inv.issue_date)
      return d.getMonth() === m && d.getFullYear() === y && (inv.status === 'sent' || inv.status === 'overdue')
    })
    const total = invoices.filter((inv) => {
      if (!inv.issue_date) return false
      const d = new Date(inv.issue_date)
      return d.getMonth() === m && d.getFullYear() === y
    })
    return {
      label: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][m],
      paid: paid.reduce((s, i) => s + parseFloat(i.total || 0), 0),
      pending: pending.reduce((s, i) => s + parseFloat(i.total || 0), 0),
      total: total.reduce((s, i) => s + parseFloat(i.total || 0), 0),
    }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {profile?.full_name ? `Bienvenido, ${profile.full_name.split(' ')[0]}` : 'Panel de control'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isPro
              ? 'Disfrutas de todas las funciones de InvoiceSnap'
              : `Llevas ${thisMonthInvoices.length} de ${FREE_TIER.maxInvoicesPerMonth} facturas este mes`
            }
          </p>
        </div>
        <Link to="/invoices/new">
          <Button>
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Nueva factura
          </Button>
        </Link>
      </div>

      {/* Free tier limit bar */}
      {!isPro && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Facturas este mes</span>
              {thisMonthInvoices.length >= FREE_TIER.maxInvoicesPerMonth && (
                <Badge variant="red" size="sm">Límite alcanzado</Badge>
              )}
            </div>
            <span className="text-sm font-medium text-gray-700">
              {thisMonthInvoices.length} / {FREE_TIER.maxInvoicesPerMonth}
            </span>
          </div>
          <ProgressBar
            value={thisMonthInvoices.length}
            max={FREE_TIER.maxInvoicesPerMonth}
            color={thisMonthInvoices.length >= FREE_TIER.maxInvoicesPerMonth ? 'bg-red-500' : 'bg-primary-500'}
          />
          {thisMonthInvoices.length >= FREE_TIER.maxInvoicesPerMonth && (
            <p className="text-xs text-red-600 mt-2">
              Has alcanzado el límite mensual.{' '}
              <Link to="/settings" className="font-medium underline">Actualiza a Pro</Link> para facturas ilimitadas.
            </p>
          )}
        </Card>
      )}

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500 mt-1">Facturas</p>
          {stats.total > 0 && (
            <div className="flex justify-center gap-3 mt-2 text-[10px] text-gray-400">
              {stats.paid > 0 && <span>{stats.paid} cobradas</span>}
              {stats.overdue > 0 && <span className="text-red-400">{stats.overdue} vencidas</span>}
              {stats.draft > 0 && <span>{stats.draft} borradores</span>}
            </div>
          )}
        </Card>

        <Card className="text-center">
          <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{clients.length}</p>
          <p className="text-sm text-gray-500 mt-1">Clientes</p>
          {!isPro && clients.length > 0 && (
            <p className="text-[10px] text-gray-400 mt-2">
              {FREE_TIER.maxClients - clients.length > 0
                ? `${FREE_TIER.maxClients - clients.length} disponibles`
                : 'límite alcanzado'
              }
            </p>
          )}
        </Card>

        <Card className="text-center">
          <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
          <p className="text-sm text-gray-500 mt-1">Cobrado</p>
        </Card>

        <Card className="text-center">
          <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.pendingRevenue)}</p>
          <p className="text-sm text-gray-500 mt-1">Pendiente</p>
        </Card>
      </div>

      {/* Status distribution + Monthly trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estado de facturas */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Estado de facturas</h3>
          {stats.total === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Crea tu primera factura para ver estadísticas</p>
          ) : (
            <div className="space-y-3">
              {[
                { key: 'paid', label: 'Cobradas', count: stats.paid, color: 'bg-green-500' },
                { key: 'sent', label: 'Enviadas', count: stats.sent, color: 'bg-blue-500' },
                { key: 'overdue', label: 'Vencidas', count: stats.overdue, color: 'bg-red-500' },
                { key: 'draft', label: 'Borradores', count: stats.draft, color: 'bg-gray-400' },
                { key: 'cancelled', label: 'Anuladas', count: stats.cancelled, color: 'bg-yellow-500' },
              ].filter((s) => s.count > 0).map((s) => (
                <div key={s.key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{s.label}</span>
                    <span className="font-medium text-gray-900">{s.count}</span>
                  </div>
                  <ProgressBar value={s.count} max={stats.total} color={s.color} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Tendencia mensual */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Facturas por mes</h3>
          {stats.total === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Crea tu primera factura para ver tendencias</p>
          ) : (
            <div className="space-y-3">
              {monthlyData.map((m, i) => {
                const maxCount = Math.max(...monthlyData.map((x) => x.count), 1)
                const pct = (m.count / maxCount) * 100
                const isCurrent = i === monthlyData.length - 1
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className={`w-10 text-xs font-medium flex-shrink-0 ${isCurrent ? 'text-primary-600' : 'text-gray-400'}`}>
                      {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][m.month]}
                    </span>
                    <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden relative">
                      <div
                        className={`h-full rounded transition-all duration-500 ${isCurrent ? 'bg-primary-500' : 'bg-gray-300'}`}
                        style={{ width: `${Math.max(pct, m.count > 0 ? 5 : 0)}%` }}
                      />
                    </div>
                    <span className={`w-6 text-right text-xs font-medium flex-shrink-0 ${isCurrent ? 'text-primary-600' : 'text-gray-500'}`}>
                      {m.count}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Ingresos por mes */}
      {stats.total > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Ingresos recientes</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {revenueByMonth.map((m, i) => (
              <div key={i} className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 mb-2">{m.label}</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(m.paid)}</p>
                <p className="text-xs text-gray-400">
                  cobrado
                </p>
                {m.pending > 0 && (
                  <>
                    <p className="text-sm font-medium text-yellow-600 mt-1">{formatCurrency(m.pending)}</p>
                    <p className="text-xs text-gray-400">pendiente</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Invoices */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Últimas facturas</h3>
          {invoices.length > 0 && (
            <Link to="/invoices" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Ver todas ({invoices.length})
            </Link>
          )}
        </div>

        {loading && invoices.length === 0 ? (
          <div className="flex justify-center py-8">
            <svg className="animate-spin h-6 w-6 text-primary-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No tienes facturas todavía</p>
            <Link to="/invoices/new">
              <Button>Crear primera factura</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-medium text-gray-500">Nº Factura</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500">Cliente</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500">Fecha</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-500">Total</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-500">Estado</th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 5).map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium text-gray-900">{inv.invoice_number}</td>
                    <td className="py-3 px-2 text-gray-600">
                      {inv.client_snapshot?.name || inv.clients?.name || '—'}
                    </td>
                    <td className="py-3 px-2 text-gray-600">{formatDateShort(inv.issue_date)}</td>
                    <td className="py-3 px-2 text-right font-medium">{formatCurrency(inv.total)}</td>
                    <td className="py-3 px-2 text-center">
                      <Badge
                        variant={
                          inv.status === 'paid' ? 'green' :
                          inv.status === 'overdue' ? 'red' :
                          inv.status === 'sent' ? 'blue' :
                          inv.status === 'cancelled' ? 'yellow' :
                          'gray'
                        }
                      >
                        {inv.status === 'paid' ? 'Cobrada' :
                         inv.status === 'sent' ? 'Enviada' :
                         inv.status === 'overdue' ? 'Vencida' :
                         inv.status === 'draft' ? 'Borrador' :
                         inv.status === 'cancelled' ? 'Anulada' :
                         inv.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
