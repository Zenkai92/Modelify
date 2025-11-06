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
        <Link className="navbar-brand fw-bold" to="/">
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
            <li className="nav-item">
              <Link className="nav-link" to="/">Accueil</Link>
            </li>
            {user && (
              <li className="nav-item">
                <Link className="nav-link" to="/demande-projet">Demander un projet</Link>
              </li>
            )}
            {user ? (
              <>
                <li className="nav-item">
                  <span className="nav-link">
                    Bonjour, {user.user_metadata?.firstName || user.email}
                  </span>
                </li>
                <li className="nav-item">
                  <button 
                    className="btn btn-outline-light btn-sm"
                    onClick={handleSignOut}
                  >
                    Déconnexion
                  </button>
                </li>
              </>
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