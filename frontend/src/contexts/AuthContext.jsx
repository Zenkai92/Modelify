import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Récupérer la session actuelle
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  const signUp = async (email, password, userData) => {
    console.log('🚀 Début inscription avec userData:', userData)
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData // firstName, lastName, etc.
      }
    })

    console.log('✅ Auth signup result:', { data, error })

    // Si l'inscription auth réussit, créer le profil avec le même UUID
    if (data.user && !error) {
      console.log('👤 Création du profil pour user ID:', data.user.id)
      
      // Attendre un peu pour que l'auth soit bien établie
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      try {
        const profileData = {
          id: data.user.id,
          email: email,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          role: userData.role || 'particulier',
          companyName: userData.companyName || '',
          streetAddress: userData.streetAddress || '',
          city: userData.city || '',
          postalCode: userData.postalCode || '',
          createdAt: new Date().toISOString(), // createdAt pas createAt
          updateAt: new Date().toISOString()
        }
        
        console.log('📝 Données profil à insérer:', profileData)
        
        // D'abord tester une sélection pour voir la structure
        const { data: testSelect, error: selectError } = await supabase
          .from('Users')
          .select('*')
          .limit(1)
        
        console.log('🔍 Structure table Users:', testSelect, selectError)
        
        // Utiliser un client admin pour l'insertion (contourne RLS)
        const { data: insertData, error: profileError } = await supabase
          .from('Users')
          .insert([profileData])
          .select()
        
        console.log('💾 Résultat insertion profil:', { insertData, profileError })
        
        if (profileError) {
          console.error('❌ Erreur création profil:', profileError)
        } else {
          console.log('✅ Profil créé avec succès:', insertData)
        }
      } catch (profileError) {
        console.error('❌ Exception création profil:', profileError)
      }
    }

    return { data, error }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}