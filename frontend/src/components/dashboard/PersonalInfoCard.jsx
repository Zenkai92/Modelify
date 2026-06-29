import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Toast from '../Toast';
import './PersonalInfoCard.css';

const EMPTY_FORM = { firstName: '', lastName: '', email: '', password: '' };

const PersonalInfoCard = () => {
  const { user, session } = useAuth();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // (Re)synchronise le formulaire avec l'utilisateur courant
  const resetForm = () => {
    setForm({
      firstName: user?.user_metadata?.firstName || '',
      lastName: user?.user_metadata?.lastName || '',
      email: user?.email || '',
      password: '',
    });
  };

  useEffect(() => {
    if (!editing) resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = () => {
    resetForm();
    setEditing(true);
  };

  const handleCancel = () => {
    resetForm();
    setEditing(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim();

    if (!firstName || !lastName) {
      setToast({ message: 'Le prénom et le nom sont obligatoires.', type: 'error' });
      return;
    }

    const nameChanged =
      firstName !== (user?.user_metadata?.firstName || '') ||
      lastName !== (user?.user_metadata?.lastName || '');
    const emailChanged = email && email !== user?.email;

    if (!nameChanged && !emailChanged) {
      setToast({ message: 'Aucune modification à enregistrer.', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      // Confirmation par mot de passe obligatoire pour modifier le nom/prénom
      let accessToken = session?.access_token;
      if (nameChanged) {
        if (!form.password) {
          setToast({
            message: 'Veuillez saisir votre mot de passe pour confirmer la modification.',
            type: 'error',
          });
          setSaving(false);
          return;
        }

        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: user.email,
            password: form.password,
          });

        if (signInError) {
          setToast({ message: 'Mot de passe incorrect.', type: 'error' });
          setSaving(false);
          return;
        }

        // On utilise le token rafraîchi par la ré-authentification
        accessToken = signInData?.session?.access_token || accessToken;
      }

      // 1. Mise à jour des informations de profil dans la table Users
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ firstName, lastName }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Erreur lors de la mise à jour du profil');
      }

      // 2. Synchronisation côté Supabase Auth :
      //    - les métadonnées (prénom/nom) utilisées dans toute l'app
      //    - l'email, qui déclenche une confirmation par email s'il change
      const attributes = { data: { firstName, lastName } };
      if (emailChanged) attributes.email = email;

      const { error: authError } = await supabase.auth.updateUser(attributes, {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      });

      if (authError) throw new Error(authError.message);

      if (emailChanged) {
        setToast({
          message: `Un email de confirmation a été envoyé à ${email}. Votre adresse sera mise à jour après validation.`,
          type: 'success',
        });
      } else {
        setToast({ message: 'Profil mis à jour avec succès.', type: 'success' });
      }

      setEditing(false);
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = editing ? 'form-control' : 'form-control bg-light';

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        duration={toast.type === 'success' ? 5000 : 4000}
        onClose={() => setToast({ message: '', type: toast.type })}
      />

      <div className="card shadow-sm border-0 rounded-3">
        <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-bold personal-info-title">
            <i className="bi bi-person-circle me-2"></i>
            Informations personnelles
          </h5>
          {!editing && (
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={handleEdit}
            >
              <i className="bi bi-pencil me-1"></i>Modifier
            </button>
          )}
        </div>
        <div className="card-body p-4">
          <form onSubmit={handleSave}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label text-muted small fw-bold">Prénom</label>
                <input
                  type="text"
                  name="firstName"
                  className={inputClass}
                  value={form.firstName}
                  onChange={handleChange}
                  disabled={!editing || saving}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label text-muted small fw-bold">Nom</label>
                <input
                  type="text"
                  name="lastName"
                  className={inputClass}
                  value={form.lastName}
                  onChange={handleChange}
                  disabled={!editing || saving}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label text-muted small fw-bold">Email</label>
              <input
                type="email"
                name="email"
                className={inputClass}
                value={form.email}
                onChange={handleChange}
                disabled={!editing || saving}
              />
              {editing && (
                <div className="form-text">
                  <i className="bi bi-info-circle me-1"></i>
                  En cas de changement, un email de confirmation sera envoyé à la nouvelle adresse.
                  Le changement ne sera effectif qu'après validation.
                </div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label text-muted small fw-bold">Compte créé le</label>
              <input
                type="text"
                className="form-control bg-light"
                value={formatDate(user?.created_at)}
                disabled
              />
            </div>

            {editing && (
              <div className="mb-3">
                <label className="form-label text-muted small fw-bold">
                  Mot de passe <span className="text-danger">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  className="form-control"
                  value={form.password}
                  onChange={handleChange}
                  disabled={saving}
                  autoComplete="current-password"
                  placeholder="Confirmez avec votre mot de passe"
                />
                <div className="form-text">
                  <i className="bi bi-shield-lock me-1"></i>
                  Requis pour confirmer la modification de votre nom ou prénom.
                </div>
              </div>
            )}

            {editing && (
              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg me-1"></i>Enregistrer
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
};

export default PersonalInfoCard;
