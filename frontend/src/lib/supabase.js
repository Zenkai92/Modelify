import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dbkycforcsrmilxadbkz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRia3ljZm9yY3NybWlseGFkYmt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTc2ODUsImV4cCI6MjA3NDQ5MzY4NX0.0jQCdSA1jhApTT9fKrftyL3j9o1cYyigBJIH48vXFxk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)