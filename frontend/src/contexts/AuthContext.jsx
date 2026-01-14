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
    // Fonction pour enrichir l'utilisateur avec les données de la table Users via API (Architecture Safe)
    const enrichUserWithProfile = async (sessionUser, token) => {
      if (!sessionUser || !token) return sessionUser;
      
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
          
        if (response.ok) {
          const profile = await response.json();
          return {
            ...sessionUser,
            user_metadata: {
              ...sessionUser.user_metadata,
              role: profile.role
            }
          };
        }
      } catch (err) {
        console.error("Erreur lors de la récupération du profil via API:", err);
      }
      
      return sessionUser;
    };

    const updateAuthUser = (baseUser, enrichedResult) => {
      setUser(prev => {
        if (enrichedResult && enrichedResult.user_metadata?.role) {
          return enrichedResult;
        }
        
        // Si on a déjà un utilisateur avec rôle en mémoire, on le garde
        if (prev && baseUser && prev.id === baseUser.id && prev.user_metadata?.role) {
          return {
            ...baseUser,
            user_metadata: {
              ...baseUser.user_metadata,
              role: prev.user_metadata.role
            }
          };
        }
        
        return baseUser;
      });
    };

    // Récupérer la session actuelle
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        
        const currentUser = session?.user ?? null
        let enrichedUser = null;
        
        if (currentUser) {
          // Timeout de sécurité : si la DB est trop lente, on utilise l'utilisateur de base
          // pour ne pas bloquer l'interface ou déconnecter l'utilisateur
          // Augmentation du timeout à 10s pour éviter la perte de rôle sur connexion lente
          enrichedUser = await Promise.race([
            enrichUserWithProfile(currentUser, session?.access_token),
            new Promise(resolve => setTimeout(() => {
              console.warn("Timeout récupération profil utilisateur qui a duré plus de 10s");
              resolve(currentUser); 
            }, 10000))
          ]);
        }
        
        updateAuthUser(currentUser, enrichedUser)
      } catch (error) {
        console.error("Erreur lors de l'initialisation de la session:", error);
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          setSession(session)
          
          const currentUser = session?.user ?? null
          let enrichedUser = null;
          
          if (currentUser) {
            enrichedUser = await Promise.race([
              enrichUserWithProfile(currentUser, session?.access_token),
              new Promise(resolve => setTimeout(() => resolve(currentUser), 10000))
            ]);
          }
          
          updateAuthUser(currentUser, enrichedUser)
        } catch (error) {
          console.error("Erreur lors du changement d'état auth:", error);
        } finally {
          setLoading(false)
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