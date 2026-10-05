/**
 * Determina si un perfil tiene las capacidades Pro.
 * Un administrador (is_admin) se trata como Pro aunque no tenga suscripción.
 */
export function isProProfile(profile) {
  return profile?.subscription_tier === 'pro' || profile?.is_admin === true
}
