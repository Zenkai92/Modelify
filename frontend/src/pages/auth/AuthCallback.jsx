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
        } else if (data.session) {
          // Utilisateur confirmé et connecté
          navigate('/', { replace: true });
        } else {
          setError('Session non trouvée');
        }
      } catch (err) {
        setError('Erreur lors du traitement : ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Confirmation en cours...</span>
        </div>
        <p className="mt-3">Confirmation de votre compte...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          <h4>Erreur de confirmation</h4>
          <p>{error}</p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/login')}
          >
            Retourner à la connexion
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback;