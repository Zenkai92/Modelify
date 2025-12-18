import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProfileInfo = () => {
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
    <div className="card">
      <div className="card-header">
        <h3>Informations personnelles</h3>
      </div>
      <div className="card-body">
        <form>
          {user?.user_metadata?.role !== 'professionnel' && (
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Prénom</label>
                <input type="text" className="form-control" value={user?.user_metadata?.firstName || ''} disabled />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Nom</label>
                <input type="text" className="form-control" value={user?.user_metadata?.lastName || ''} disabled />
              </div>
            </div>
          )}

          {user?.user_metadata?.role === 'professionnel' && (
            <div className="mb-3">
              <label className="form-label">Nom de l'entreprise</label>
              <input type="text" className="form-control" value={user?.user_metadata?.companyName || ''} disabled />
            </div>
          )}

          <div className="mb-3">
            <label className="form-label">Email</label>
            <input type="email" className="form-control" value={user?.email || ''} disabled />
          </div>

          <div className="mb-3">
            <label className="form-label">Adresse</label>
            <input type="text" className="form-control" value={user?.user_metadata?.address || ''} disabled />
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Ville</label>
              <input type="text" className="form-control" value={user?.user_metadata?.city || ''} disabled />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Code postal</label>
              <input type="text" className="form-control" value={user?.user_metadata?.postalCode || ''} disabled />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Compte créé le</label>
            <input type="text" className="form-control" value={formatDate(user?.created_at)} disabled />
          </div>
        </form>
      </div>
    </div>
  );
};

const OrderStatus = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h3>Status des commandes</h3>
      </div>
      <div className="card-body">
        <p>Aucune commande en cours.</p>
      </div>
    </div>
  );
};

const OrderHistory = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h3>Historique des commandes</h3>
      </div>
      <div className="card-body">
        <p>Aucun historique disponible.</p>
      </div>
    </div>
  );
};

const UserDashboard = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const renderContent = () => {
    switch(currentPath) {
      case '/profile':
        return <ProfileInfo />;
      case '/status-commandes':
        return <OrderStatus />;
      case '/historique-commandes':
        return <OrderHistory />;
      default:
        return <ProfileInfo />;
    }
  };

  return (
    <div className="container mt-5 mb-5">
      <div className="row">
        <div className="col-md-3 mb-4">
          <div className="list-group">
            <Link 
              to="/profile" 
              className={`list-group-item list-group-item-action ${currentPath === '/profile' ? 'active' : ''}`}
            >
              <i className="bi bi-person me-2"></i>
              Informations personnelles
            </Link>
            <Link 
              to="/status-commandes" 
              className={`list-group-item list-group-item-action ${currentPath === '/status-commandes' ? 'active' : ''}`}
            >
              <i className="bi bi-activity me-2"></i>
              Status des commandes
            </Link>
            <Link 
              to="/historique-commandes" 
              className={`list-group-item list-group-item-action ${currentPath === '/historique-commandes' ? 'active' : ''}`}
            >
              <i className="bi bi-clock-history me-2"></i>
              Historiques des commandes
            </Link>
          </div>
        </div>
        <div className="col-md-9">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
