import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,
  needsEmailConfirmation: false,

  /**
   * Initialize auth state from Supabase session
   */
  initialize: async () => {
    try {
      set({ loading: true })

      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        set({ user: session.user })
        await get().fetchProfile()
      } else {
        // Check if there's a pending unconfirmed user
        const { data: { user } } = await supabase.auth.getUser()
        if (user && !user.email_confirmed_at) {
          // User exists but email not confirmed — don't redirect to login
          set({ user })
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ error: error.message })
    } finally {
      set({ loading: false })
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        set({ user: session.user, needsEmailConfirmation: false })
        await get().fetchProfile()
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, profile: null })
      } else if (event === 'USER_UPDATED') {
        // Email confirmed or user updated
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email_confirmed_at) {
          set({ user, needsEmailConfirmation: false })
          await get().fetchProfile()
        }
      }
    })
  },

  /**
   * Login with email and password
   */
  signIn: async (email, password) => {
    try {
      set({ loading: true, error: null, needsEmailConfirmation: false })
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          set({ error: 'Debes confirmar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.', needsEmailConfirmation: true })
          return { success: false, error: 'Email not confirmed' }
        }
        throw error
      }
      set({ user: data.user })
      await get().fetchProfile()
      return { success: true }
    } catch (error) {
      set({ error: error.message })
      return { success: false, error: error.message }
    } finally {
      set({ loading: false })
    }
  },

  /**
   * Register with email and password
   */
  signUp: async (email, password, fullName) => {
    try {
      set({ loading: true, error: null, needsEmailConfirmation: false })
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      })
      if (error) throw error

      // El perfil lo crea el trigger handle_new_user() sobre auth.users
      // (SECURITY DEFINER). No lo insertamos desde el cliente porque la tabla
      // profiles no tiene política RLS de INSERT por diseño.

      // If session is null → email confirmation is ON
      if (!data.session) {
        set({
          user: data.user,
          needsEmailConfirmation: true,
          error: 'Te hemos enviado un email de confirmación. Revisa tu bandeja de entrada (y la carpeta de spam).',
        })
        return { success: true, needsConfirmation: true }
      }

      set({ user: data.user })
      return { success: true }
    } catch (error) {
      set({ error: error.message })
      return { success: false, error: error.message }
    } finally {
      set({ loading: false })
    }
  },

  /**
   * Sign in with Google
   */
  signInWithGoogle: async () => {
    try {
      set({ error: null })
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error) {
      set({ error: error.message })
    }
  },

  /**
   * Sign out
   */
  signOut: async () => {
    try {
      set({ loading: true })
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      set({ user: null, profile: null, needsEmailConfirmation: false })
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      set({ loading: false })
    }
  },

  /**
   * Resend confirmation email
   */
  resendConfirmation: async (email) => {
    try {
      set({ loading: true, error: null })
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      })
      if (error) throw error
      set({ error: 'Email de confirmación reenviado. Revisa tu bandeja de entrada.' })
      return { success: true }
    } catch (error) {
      set({ error: error.message })
      return { success: false, error: error.message }
    } finally {
      set({ loading: false })
    }
  },

  /**
   * Request a password reset email
   */
  resetPassword: async (email) => {
    try {
      set({ loading: true, error: null })
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset`,
      })
      if (error) throw error
      return { success: true }
    } catch (error) {
      set({ error: error.message })
      return { success: false, error: error.message }
    } finally {
      set({ loading: false })
    }
  },

  /**
   * Update the password of the authenticated user
   */
  updatePassword: async (newPassword) => {
    try {
      set({ loading: true, error: null })
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      return { success: true }
    } catch (error) {
      set({ error: error.message })
      return { success: false, error: error.message }
    } finally {
      set({ loading: false })
    }
  },

  /**
   * Update the email of the authenticated user (requires confirmation)
   */
  updateEmail: async (newEmail) => {
    try {
      set({ loading: true, error: null })
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      if (error) throw error
      return { success: true }
    } catch (error) {
      set({ error: error.message })
      return { success: false, error: error.message }
    } finally {
      set({ loading: false })
    }
  },

  /**
   * Fetch user profile from Supabase
   */
  fetchProfile: async () => {
    try {
      const user = get().user
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        // Profile might not exist yet (trigger delay), retry once
        if (error.code === 'PGRST116') {
          await new Promise(r => setTimeout(r, 1500))
          const { data: retryData, error: retryError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          if (!retryError) set({ profile: retryData })
        }
        return
      }
      set({ profile: data })
    } catch (error) {
      console.error('Fetch profile error:', error)
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (updates) => {
    try {
      set({ loading: true, error: null })
      const user = get().user
      if (!user) throw new Error('No user logged in')

      // Limpiar strings vacíos a null (la BD rechaza '' en campos DATE, DECIMAL)
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).map(([key, value]) => [
          key,
          value === '' ? null : value,
        ])
      )

      const { data, error } = await supabase
        .from('profiles')
        .update({ ...cleanUpdates, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      set({ profile: data })
      return { success: true }
    } catch (error) {
      set({ error: error.message })
      return { success: false, error: error.message }
    } finally {
      set({ loading: false })
    }
  },

  /**
   * Check if user is on Pro tier
   */
  isPro: () => {
    const profile = get().profile
    return profile?.subscription_tier === 'pro'
  },

  clearError: () => set({ error: null, needsEmailConfirmation: false }),
}))
