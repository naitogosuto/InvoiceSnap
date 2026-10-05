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

// Precios permitidos para suscripción (configurados como secrets de la Edge Function).
const ALLOWED_PRICES = [
  Deno.env.get('STRIPE_PRICE_ID_MONTHLY') ?? '',
  Deno.env.get('STRIPE_PRICE_ID_YEARLY') ?? '',
].filter(Boolean)

// Rate limiting best-effort por IP (sliding window en memoria).
// Nota: cada aislado de Edge Function tiene su propio Map, por lo que esto protege
// contra ráfagas simples pero NO es un límite global. Para un límite distribuido
// usa Cloudflare WAF / rate limiting rules o un almacén compartido (KV/Durable Object).
const RATE_LIMIT = 10
const RATE_WINDOW_MS = 60_000
const rateHits = new Map<string, number[]>()

function clientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const hits = (rateHits.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS)
  if (hits.length >= RATE_LIMIT) {
    rateHits.set(key, hits)
    return true
  }
  hits.push(now)
  rateHits.set(key, hits)
  return false
}

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

  // Rate limiting
  if (isRateLimited(clientIp(req))) {
    return new Response(JSON.stringify({ error: 'Demasiadas solicitudes. Inténtalo más tarde.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 429,
    })
  }

  try {
    // Obtener variables de entorno
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') ?? ''

    // Inicializar cliente de Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Extraer parámetros del cuerpo de la petición
    const { priceId, successUrl, cancelUrl, idempotencyKey } = await req.json()
    if (!priceId || !successUrl || !cancelUrl) {
      throw new Error('Faltan parámetros requeridos: priceId, successUrl o cancelUrl')
    }

    // Validar que el precio pertenece a los planes permitidos
    if (ALLOWED_PRICES.length === 0 || !ALLOWED_PRICES.includes(priceId)) {
      throw new Error('Precio no válido')
    }

    // Validar las URLs de redirección (evitar open redirect)
    if (!isAllowedRedirectUrl(successUrl) || !isAllowedRedirectUrl(cancelUrl)) {
      throw new Error('URL de redirección no permitida')
    }

    // Inicializar cliente de Supabase con los headers de la solicitud para verificar el usuario
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No autorizado')
    }
    const supabase = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Obtener el usuario autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('No autorizado')
    }

    // Inicializar cliente de Supabase con service_role para operaciones administrativas (evitar RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Buscar el perfil del usuario para obtener stripe_customer_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError) {
      throw new Error('Error al obtener el perfil del usuario')
    }

    let customerId = profile?.stripe_customer_id

    // Si el usuario no tiene un cliente en Stripe, lo creamos.
    // Idempotency key estable por usuario evita crear customers duplicados en reintentos/concurrencia.
    if (!customerId) {
      const customer = await stripe.customers.create(
        {
          email: user.email,
          metadata: {
            supabase_user_id: user.id,
          },
        },
        { idempotencyKey: `cust_${user.id}` }
      )
      customerId = customer.id

      // Guardar el nuevo stripe_customer_id en la base de datos
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)

      if (updateError) {
        throw new Error('Error al actualizar el perfil del usuario con el ID de Stripe')
      }
    }

    // Crear la sesión de Checkout de Stripe.
    // Si el cliente envía una idempotency key, evitamos sesiones duplicadas ante doble envío.
    const session = await stripe.checkout.sessions.create(
      {
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
      },
      idempotencyKey ? { idempotencyKey } : undefined
    )

    // Devolver la URL de la sesión
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    // Manejo de errores
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
