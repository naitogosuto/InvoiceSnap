import { createClient } from '@supabase/supabase-js'

// Fallback para entornos sin variables de entorno configuradas.
// La anon key es pública por diseño de Supabase (segura en cliente).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yjttgiqkhaoupqfafduz.supabase.co'
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdHRnaXFraGFvdXBxZmFmZHV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NjE4NDgsImV4cCI6MjA5ODEzNzg0OH0.rPsDtabR8vreUxn9x8qgc6KZsL2fLjFyhaYy0FTrVL0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

