import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'

// Orígenes permitidos en desarrollo local.
const DEV_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]

// Orígenes de producción permitidos (separados por coma en la variable ALLOWED_ORIGIN).
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGIN') ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false
  return DEV_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes(origin)
}

function isAllowedRedirectUrl(url: string): boolean {
  try {
    return isAllowedOrigin(new URL(url).origin)
  } catch {
    return false
  }
}

function corsHeadersFor(origin: string | null): Record<string, string> {
  if (!isAllowedOrigin(origin)) {
    return {}
  }
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin')
  const corsHeaders = corsHeadersFor(origin)

  // Manejo de la solicitud pre-flight (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') ?? ''

    // Inicializar cliente de Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Extraer la URL de retorno
    const { returnUrl } = await req.json()
    if (!returnUrl) {
      throw new Error('Falta el parámetro returnUrl')
    }

    // Validar la URL de retorno (evitar open redirect)
    if (!isAllowedRedirectUrl(returnUrl)) {
      throw new Error('URL de retorno no permitida')
    }

    // Autenticar al usuario utilizando el token JWT proporcionado
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No autorizado')
    }
    const supabase = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('No autorizado')
    }

    // Utilizar service_role para acceder a profiles eludiendo las políticas RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Obtener el stripe_customer_id del usuario
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.stripe_customer_id) {
      throw new Error('No se encontró el ID de cliente de Stripe para este usuario')
    }

    // Crear la sesión del Portal de Facturación (Billing Portal Session)
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl,
    })

    // Devolver la URL del portal
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
