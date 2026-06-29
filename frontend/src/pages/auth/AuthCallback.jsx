import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const AuthCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          setError('Erreur lors de la confirmation : ' + error.message);
          return;
        }

        if (!data.session) {
          setError('Session non trouvée');
          return;
        }

        const { user, access_token } = data.session;
        const provider = user.app_metadata?.provider;

        // Pour les connexions OAuth (Google, etc.), créer le profil si c'est le premier login
        if (provider && provider !== 'email') {
          await ensureOAuthProfileExists(user, access_token);
        }

        navigate('/', { replace: true });
      } catch (err) {
        setError('Erreur lors du traitement : ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <>
      {loading && (
        <div className="container py-5 text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Connexion en cours...</span>
          </div>
          <p className="mt-3">Finalisation de la connexion...</p>
        </div>
      )}

      {error && (
        <div className="container py-5">
          <div className="alert alert-danger">
            <h4>Erreur de connexion</h4>
            <p>{error}</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/login')}
            >
              Retourner à la connexion
            </button>
          </div>
        </div>
      )}
    </>
  );
};

async function ensureOAuthProfileExists(user, token) {
  try {
    // Vérifier si le profil existe déjà
    const checkResponse = await fetch(
      `${import.meta.env.VITE_API_URL}/api/users/me`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!checkResponse.ok) return;

    const profile = await checkResponse.json();

    // Si le profil vient du fallback backend (pas encore en base), on le crée
    // Le fallback retourne firstName="" et lastName="" sans avoir de record réel
    const meta = user.user_metadata ?? {};
    const isNewUser =
      !profile.firstName &&
      !profile.lastName &&
      (new Date(user.last_sign_in_at) - new Date(user.created_at)) < 30000;

    if (!isNewUser) return;

    const fullName = meta.full_name ?? meta.name ?? '';
    const parts = fullName.trim().split(/\s+/);
    const firstName = meta.given_name ?? parts[0] ?? '';
    const lastName = meta.family_name ?? parts.slice(1).join(' ') ?? '';

    const profileData = {
      id: user.id,
      email: user.email,
      firstName,
      lastName,
      role: 'user',
      companyName: '',
      createdAt: new Date().toISOString(),
      updateAt: new Date().toISOString(),
    };

    await fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    });
  } catch (err) {
    console.error('Erreur lors de la création du profil OAuth:', err);
  }
}

export default AuthCallback;
