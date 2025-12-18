import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand fw-bold d-flex align-items-center" to="/">
          Modelify
        </Link>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            {user && (
              <li className="nav-item">
                <Link className="nav-link text-white" to="/demande-projet">Demander un projet</Link>
              </li>
            )}
            {user ? (
              <li className="nav-item dropdown">
                <a 
                  className="nav-link dropdown-toggle text-white" 
                  href="#"
                  id="userDropdown" 
                  role="button" 
                  data-bs-toggle="dropdown" 
                  aria-expanded="false"
                  style={{ cursor: 'pointer' }}
                >
                  {user.user_metadata?.role === 'professionnel' 
                    ? user.user_metadata?.companyName 
                    : `${user.user_metadata?.firstName} ${user.user_metadata?.lastName}`}
                </a>
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                  <li>
                    <Link className="dropdown-item" to="/profile">
                      <i className="bi bi-person me-2"></i>
                      Informations personnelles
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/status-commandes">
                      <i className="bi bi-activity me-2"></i>
                      Status des commandes
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/historique-commandes">
                      <i className="bi bi-clock-history me-2"></i>
                      Historiques des commandes
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button 
                      className="dropdown-item text-danger" 
                      onClick={handleSignOut}
                    >
                      <i className="bi bi-box-arrow-right me-2"></i>
                      Déconnexion
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">Connexion</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/register">Inscription</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;