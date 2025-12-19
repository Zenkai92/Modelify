import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './PersonalInfoCard.css';

const PersonalInfoCard = () => {
  const { user } = useAuth();
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  return (
    <div className="card shadow-sm border-0 rounded-3">
      <div className="card-header bg-white border-bottom py-3">
        <h5 className="mb-0 fw-bold personal-info-title">
          <i className="bi bi-person-circle me-2"></i>
          Informations personnelles
        </h5>
      </div>
      <div className="card-body p-4">
        <form>
          {user?.user_metadata?.role !== 'professionnel' && (
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label text-muted small fw-bold">Prénom</label>
                <input type="text" className="form-control bg-light" value={user?.user_metadata?.firstName || ''} disabled />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label text-muted small fw-bold">Nom</label>
                <input type="text" className="form-control bg-light" value={user?.user_metadata?.lastName || ''} disabled />
              </div>
            </div>
          )}

          {user?.user_metadata?.role === 'professionnel' && (
            <div className="mb-3">
              <label className="form-label text-muted small fw-bold">Nom de l'entreprise</label>
              <input type="text" className="form-control bg-light" value={user?.user_metadata?.companyName || ''} disabled />
            </div>
          )}

          <div className="mb-3">
            <label className="form-label text-muted small fw-bold">Email</label>
            <input type="email" className="form-control bg-light" value={user?.email || ''} disabled />
          </div>

          <div className="mb-3">
            <label className="form-label text-muted small fw-bold">Adresse</label>
            <input type="text" className="form-control bg-light" value={user?.user_metadata?.address || ''} disabled />
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label text-muted small fw-bold">Ville</label>
              <input type="text" className="form-control bg-light" value={user?.user_metadata?.city || ''} disabled />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label text-muted small fw-bold">Code postal</label>
              <input type="text" className="form-control bg-light" value={user?.user_metadata?.postalCode || ''} disabled />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label text-muted small fw-bold">Compte créé le</label>
            <input type="text" className="form-control bg-light" value={formatDate(user?.created_at)} disabled />
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonalInfoCard;
