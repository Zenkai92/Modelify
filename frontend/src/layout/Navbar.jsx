import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, signOut, session } = useAuth();
  const [projectCount, setProjectCount] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (user && session) {
        fetchProjectCount();
    }
  }, [user, session, location.pathname]); // Refresh on route change to keep it updated

  const fetchProjectCount = async () => {
      try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/count`, {
              headers: {
                  'Authorization': `Bearer ${session.access_token}`
              }
          });
          if (response.ok) {
              const data = await response.json();
              setProjectCount(data);
          }
      } catch (error) {
          console.error("Failed to fetch project count", error);
      }
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
              <li className="nav-item d-flex align-items-center">
                <Link className="nav-link text-white d-flex align-items-center gap-2" to="/demande-projet">
                  Demander un projet
                </Link>
              </li>
            )}
            {user ? (
              <li className="nav-item dropdown">
                <button 
                  className="nav-link dropdown-toggle text-white navbar-cursor-pointer btn btn-link text-decoration-none" 
                  id="userDropdown" 
                  type="button"
                  data-bs-toggle="dropdown" 
                  aria-expanded="false"
                >
                  {user.user_metadata?.role === 'professionnel' 
                    ? user.user_metadata?.companyName 
                    : `${user.user_metadata?.firstName} ${user.user_metadata?.lastName}`}
                </button>
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
                    <Link className="dropdown-item" to="/completed-projects">
                      <i className="bi bi-check-circle me-2"></i>
                      Projets terminés
                    </Link>
                  </li>
                  {user.user_metadata?.role === 'admin' && (
                    <>
                      <li><hr className="dropdown-divider" /></li>
                      <li>
                        <Link className="dropdown-item" to="/admin/users">
                          <i className="bi bi-people me-2"></i>
                          Gestion utilisateur
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/admin/projects/pending">
                          <i className="bi bi-hourglass-split me-2"></i>
                          Projets en attente
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/admin/projects/in-progress">
                          <i className="bi bi-tools me-2"></i>
                          Projets en cours
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/admin/projects/completed">
                          <i className="bi bi-check-circle me-2"></i>
                          Projets terminés
                        </Link>
                      </li>
                    </>
                  )}
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button 
                      className="dropdown-item text-danger" 
                      onClick={() => signOut()}
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