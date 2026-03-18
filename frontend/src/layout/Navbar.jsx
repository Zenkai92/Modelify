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
            {user ? (
              <li className="nav-item d-flex align-items-center">
                <Link className="btn btn-light btn-sm fw-bold d-flex align-items-center gap-2" to="/app">
                  <i className="bi bi-grid-fill"></i> Mon Portail
                </Link>
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
