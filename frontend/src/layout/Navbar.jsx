import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCartStore } from '../store/cartStore';
import './Navbar.css';

const Navbar = () => {
  const { user, signOut, session } = useAuth();
  const cartCount = useCartStore((state) => state.items.length);
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
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark navbar-modelify">
      <div className="container">
        <Link className="navbar-brand fw-bold d-flex align-items-center gap-2" to="/">
          <img src="/logo_modelify.png" alt="" height="32" width="32" />
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
          <ul className="navbar-nav ms-auto align-items-lg-center">
            {user ? (
              <li className="nav-item d-flex align-items-center gap-3">
                <span className="text-white me-1 d-none d-lg-block fw-medium">
                  Bonjour, {`${user?.user_metadata?.firstName || ''} ${user?.user_metadata?.lastName || ''}`.trim() || user?.email?.split('@')[0]}
                </span>
                <Link className="nav-link position-relative d-flex align-items-center gap-2" to="/cart" title="Panier">
                  <span className="position-relative d-inline-flex">
                    <i className="bi bi-cart3 fs-5"></i>
                    {cartCount > 0 && (
                      <span
                        className="position-absolute badge rounded-pill bg-danger"
                        style={{ top: '-6px', right: '-10px', fontSize: '0.6rem' }}
                      >
                        {cartCount}
                      </span>
                    )}
                  </span>
                  Mon Panier
                </Link>
                <Link className="btn btn-sm fw-bold d-flex align-items-center gap-2 btn-gradient-pill" to="/app">
                  <i className="bi bi-grid-fill"></i> Mon Portail
                </Link>
              </li>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link position-relative d-flex align-items-center gap-2" to="/cart" title="Panier">
                    <span className="position-relative d-inline-flex">
                      <i className="bi bi-cart3 fs-5"></i>
                      {cartCount > 0 && (
                        <span
                          className="position-absolute badge rounded-pill bg-danger"
                          style={{ top: '-6px', right: '-10px', fontSize: '0.6rem' }}
                        >
                          {cartCount}
                        </span>
                      )}
                    </span>
                    Mon Panier
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">Connexion</Link>
                </li>
                <li className="nav-item">
                  <Link className="btn btn-sm fw-bold ms-lg-2 btn-gradient-pill" to="/register">Inscription</Link>
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
