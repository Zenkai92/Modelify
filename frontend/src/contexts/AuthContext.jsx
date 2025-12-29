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
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fonction pour enrichir l'utilisateur avec les données de la table Users
    const enrichUserWithProfile = async (sessionUser) => {
      if (!sessionUser) return null;
      
      try {
        const { data: profile, error } = await supabase
          .from('Users')
          .select('role')
          .eq('id', sessionUser.id)
          .single();
          
        if (profile && !error) {
          // On met à jour les métadonnées locales pour que l'UI reflète le rôle de la BDD
          // sans modifier les métadonnées Auth de Supabase de façon persistante ici
          return {
            ...sessionUser,
            user_metadata: {
              ...sessionUser.user_metadata,
              role: profile.role
            }
          };
        }
      } catch (err) {
        console.error("Erreur lors de la récupération du profil:", err);
      }
      
      return sessionUser;
    };

    // Récupérer la session actuelle
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      
      if (session?.user) {
        enrichUserWithProfile(session.user).then(enrichedUser => {
          if (enrichedUser) setUser(enrichedUser)
        })
      }
    }

    getSession()

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        
        if (session?.user) {
          enrichUserWithProfile(session.user).then(enrichedUser => {
            if (enrichedUser) setUser(enrichedUser)
          })
        }
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
        
        console.log('📝 Données profil à envoyer au backend:', profileData)
        
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(profileData),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.detail || 'Erreur lors de la création du profil')
          }

          const result = await response.json()
          console.log('✅ Profil créé avec succès via API:', result)
        } catch (apiError) {
          console.error('❌ Erreur API création profil:', apiError)
          // On ne bloque pas l'inscription si la création du profil échoue, 
          // mais idéalement il faudrait gérer ça (rollback ou retry)
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
    session,
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