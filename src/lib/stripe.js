import { supabase } from '@/lib/supabase'

export const STRIPE_PRICES = {
  monthly: import.meta.env.VITE_STRIPE_PRICE_ID_MONTHLY || '',
  yearly: import.meta.env.VITE_STRIPE_PRICE_ID_YEARLY || '',
}

/**
 * Inicia el flujo de Checkout de Stripe llamando a la Edge Function
 */
export async function redirectToCheckout(priceId) {
  try {
    const { data: session } = await supabase.auth.getSession()
    if (!session?.session?.access_token) {
      throw new Error('Debes iniciar sesión para suscribirte')
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/settings?session=success`,
          cancelUrl: `${window.location.origin}/settings?session=cancel`,
        }),
      }
    )

    const result = await response.json()

    if (!response.ok || result.error) {
      throw new Error(result.error || 'Error al iniciar el pago con Stripe')
    }

    if (result.url) {
      window.location.href = result.url
    } else {
      throw new Error('No se recibió la URL de checkout')
    }
  } catch (err) {
    console.error('Checkout error:', err)
    throw err
  }
}

/**
 * Redirige al Customer Portal de Stripe para gestionar la suscripción existente
 */
export async function redirectToCustomerPortal() {
  try {
    const { data: session } = await supabase.auth.getSession()
    if (!session?.session?.access_token) {
      throw new Error('Debes iniciar sesión')
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/settings`,
        }),
      }
    )

    const result = await response.json()

    if (!response.ok || result.error) {
      throw new Error(result.error || 'Error al abrir el portal de Stripe')
    }

    if (result.url) {
      window.location.href = result.url
    } else {
      throw new Error('No se recibió la URL del portal')
    }
  } catch (err) {
    console.error('Portal error:', err)
    throw err
  }
}
