import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'

Deno.serve(async (req) => {
  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') ?? ''
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    // Inicializar el cliente de Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Obtener la firma de Stripe desde las cabeceras
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      throw new Error('Falta la cabecera stripe-signature')
    }

    // Leer el cuerpo de la petición como texto plano para la validación de la firma
    const body = await req.text()
    
    let event
    try {
      // Verificar la firma del webhook con el secreto
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error(`Error al verificar la firma del webhook: ${err.message}`)
      return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    // Inicializar el cliente de Supabase con service_role
    // Esto es necesario para eludir RLS y el trigger 'prevent_subscription_tampering'
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Manejar los diferentes tipos de eventos de Stripe
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        // Obtener detalles de la suscripción para conocer la fecha de finalización
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        
        // Actualizar el perfil del usuario
        // Convertimos el timestamp de Stripe (segundos) a ISO 8601
        const endsAt = new Date(subscription.current_period_end * 1000).toISOString()
        
        await supabaseAdmin
          .from('profiles')
          .update({ 
            subscription_tier: 'pro',
            subscription_ends_at: endsAt
          })
          .eq('stripe_customer_id', customerId)
        break
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const customerId = subscription.customer as string
        
        // Determinar el nivel y la fecha de finalización
        const tier = subscription.status === 'active' ? 'pro' : 'free'
        const endsAt = subscription.status === 'active' 
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null

        await supabaseAdmin
          .from('profiles')
          .update({ 
            subscription_tier: tier,
            subscription_ends_at: endsAt
          })
          .eq('stripe_customer_id', customerId)
        break
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const customerId = subscription.customer as string

        // Restablecer el perfil a nivel gratuito
        await supabaseAdmin
          .from('profiles')
          .update({ 
            subscription_tier: 'free',
            subscription_ends_at: null
          })
          .eq('stripe_customer_id', customerId)
        break
      }
    }

    // Responder con éxito a Stripe
    return new Response(JSON.stringify({ received: true }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error(`Error no controlado: ${error.message}`)
    return new Response('Error interno del servidor', { status: 500 })
  }
})
