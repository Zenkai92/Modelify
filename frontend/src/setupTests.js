import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock global du client Supabase : les tests unitaires ne doivent jamais
// dépendre des variables d'environnement (VITE_SUPABASE_URL) ni du réseau.
// Sans ce mock, tout test important AuthContext ferait planter la suite en CI
// car createClient() est appelé au chargement du module lib/supabase.
vi.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      }),
      signUp: vi.fn().mockResolvedValue({ data: null, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: null, error: null }),
      signInWithOAuth: vi.fn().mockResolvedValue({ data: null, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ data: null, error: null })
    }
  }
}))
