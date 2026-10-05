import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

export function ResetPassword() {
  const navigate = useNavigate()
  const updatePassword = useAuthStore((s) => s.updatePassword)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [checking, setChecking] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) setHasSession(true)
      setChecking(false)
    }
    check()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    if (password.length < 6) {
      setFormError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (password !== confirm) {
      setFormError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    const result = await updatePassword(password)
    setLoading(false)

    if (result.success) {
      navigate('/dashboard', { replace: true })
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-primary-600 mx-auto" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-500 mt-2">Comprobando enlace...</p>
        </div>
      </div>
    )
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <div className="text-center py-4">
              <h1 className="text-xl font-bold text-gray-900 mb-2">Enlace inválido o expirado</h1>
              <p className="text-sm text-gray-600 mb-4">
                El enlace de recuperación no es válido o ya ha caducado. Solicita uno nuevo.
              </p>
              <Link
                to="/login"
                className="block text-center text-sm text-primary-600 font-medium hover:text-primary-700"
              >
                Volver a iniciar sesión
              </Link>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Nueva contraseña</h1>
          <p className="text-sm text-gray-500 mb-6">Elige una nueva contraseña para tu cuenta</p>

          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nueva contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              autoComplete="new-password"
            />
            <Input
              label="Confirmar contraseña"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repite la contraseña"
              required
              autoComplete="new-password"
            />
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Guardar contraseña
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
