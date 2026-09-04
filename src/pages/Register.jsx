import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

export function Register() {
  const navigate = useNavigate()
  const { signUp, resendConfirmation, loading, error, clearError } = useAuthStore()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState('')
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [resending, setResending] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    clearError()

    if (!fullName || !email || !password) {
      setFormError('Por favor, completa todos los campos')
      return
    }

    if (password !== confirmPassword) {
      setFormError('Las contraseñas no coinciden')
      return
    }

    if (password.length < 6) {
      setFormError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    const result = await signUp(email, password, fullName)
    if (result.success) {
      if (result.needsConfirmation) {
        // Email confirmation required — show confirmation screen
        setRegisteredEmail(email)
      } else {
        navigate('/dashboard')
      }
    }
  }

  const handleResend = async () => {
    setResending(true)
    await resendConfirmation(registeredEmail)
    setResending(false)
  }

  // --- Registro exitoso, necesita confirmación ---
  if (registeredEmail) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <svg className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm7 5a1 1 0 00-2 0v1H8a1 1 0 000 2h1v1a1 1 0 002 0v-1h1a1 1 0 100-2h-1V9z" />
                </svg>
              </div>
              <span className="font-bold text-2xl text-gray-900">InvoiceSnap</span>
            </Link>
          </div>

          <Card>
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Revisa tu email</h1>
              <p className="text-sm text-gray-600 mb-4">
                Te hemos enviado un email de confirmación a{' '}
                <span className="font-medium text-gray-900">{registeredEmail}</span>
              </p>

              <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg px-4 py-3 mb-6 text-left">
                <p className="font-medium mb-1">📩 ¿No lo encuentras?</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Revisa la carpeta de <strong>spam</strong> o correo no deseado</li>
                  <li>Si usas Gmail, revisa la carpeta de <strong>Promociones</strong></li>
                  <li>Añade <code className="text-xs bg-blue-100 px-1 rounded">no-reply@supabase.co</code> a tus contactos</li>
                </ul>
              </div>

              <Button onClick={handleResend} loading={resending} variant="secondary" className="w-full mb-3">
                Reenviar email de confirmación
              </Button>

              <Link
                to="/login"
                className="block text-center text-sm text-primary-600 font-medium hover:text-primary-700"
              >
                Ir a iniciar sesión
              </Link>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // --- Formulario de registro ---
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <svg className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm7 5a1 1 0 00-2 0v1H8a1 1 0 000 2h1v1a1 1 0 002 0v-1h1a1 1 0 100-2h-1V9z" />
              </svg>
            </div>
            <span className="font-bold text-2xl text-gray-900">InvoiceSnap</span>
          </Link>
        </div>

        <Card>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Crear cuenta</h1>
          <p className="text-sm text-gray-500 mb-6">Empieza a facturar en 30 segundos</p>

          {(error || formError) && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {formError || error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nombre completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ana García López"
              required
            />

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              autoComplete="email"
            />

            <Input
              label="Contraseña"
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
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la contraseña"
              required
              autoComplete="new-password"
            />

            <p className="text-xs text-gray-500">
              Al registrarte, aceptas nuestros{' '}
              <a href="#" className="text-primary-600 hover:text-primary-700">
                Términos de servicio
              </a>{' '}
              y{' '}
              <a href="#" className="text-primary-600 hover:text-primary-700">
                Política de privacidad
              </a>
            </p>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Crear cuenta gratis
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">
              Iniciar sesión
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
