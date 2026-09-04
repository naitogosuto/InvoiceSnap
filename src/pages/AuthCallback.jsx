import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    const handleCallback = async () => {
      // Supabase ya procesa la URL con #access_token automáticamente
      // Solo obtenemos la sesión para confirmar que todo fue bien
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        setError(error.message)
        setTimeout(() => navigate('/login'), 3000)
        return
      }

      if (session?.user) {
        navigate('/dashboard', { replace: true })
      } else {
        setError('No se pudo iniciar sesión con Google. Intenta de nuevo.')
        setTimeout(() => navigate('/login'), 3000)
      }
    }

    handleCallback()
  }, [navigate])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6 text-red-600" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <p className="text-red-600 font-medium">{error}</p>
          <p className="text-sm text-gray-500 mt-2">Redirigiendo al inicio de sesión...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <svg className="animate-spin h-8 w-8 text-primary-600 mx-auto" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-sm text-gray-500 mt-2">Completando inicio de sesión...</p>
      </div>
    </div>
  )
}
