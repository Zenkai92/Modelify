import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdminUserList from './AdminUserList';
import AdminProjectList from './AdminProjectList';
import '../UserDashboard.css';

const AdminDashboard = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.user_metadata?.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  const renderContent = () => {
    switch(currentPath) {
      case '/admin/users':
        return <AdminUserList />;
      case '/admin/projects/pending':
        return <AdminProjectList statusFilter="en attente" title="Projets en attente" />;
      case '/admin/projects/in-progress':
        return <AdminProjectList statusFilter="en cours" title="Projets en cours" />;
      case '/admin/projects/completed':
        return <AdminProjectList statusFilter="terminé" title="Projets terminés" />;
      default:
        return <AdminUserList />;
    }
  };

  return (
    <div>
      {/* Header Section */}
      <section className="hero-section text-center py-5 dashboard-hero" style={{ background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)' }}>
        <div className="container position-relative dashboard-hero-content">
          <h1 className="display-5 fw-bold text-white mb-2">Administration</h1>
          <p className="lead text-white-50">Gérez les utilisateurs et les projets</p>
        </div>
        <div className="custom-shape-divider-bottom">
            <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="shape-fill"></path>
            </svg>
        </div>
      </section>

      <div className="container mb-5 dashboard-content-container">
        <div className="row">
          <div className="col-md-3 mb-4">
            <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
              <div className="list-group list-group-flush">
                <Link 
                  to="/admin/users" 
                  className={`list-group-item list-group-item-action py-3 dashboard-nav-link ${currentPath === '/admin/users' || currentPath === '/admin' ? 'active' : ''}`}
                >
                  <i className="bi bi-people me-2"></i>
                  Gestion utilisateurs
                </Link>
                <Link 
                  to="/admin/projects/pending" 
                  className={`list-group-item list-group-item-action py-3 dashboard-nav-link ${currentPath === '/admin/projects/pending' ? 'active' : ''}`}
                >
                  <i className="bi bi-hourglass-split me-2"></i>
                  Projets en attente
                </Link>
                <Link 
                  to="/admin/projects/in-progress" 
                  className={`list-group-item list-group-item-action py-3 dashboard-nav-link ${currentPath === '/admin/projects/in-progress' ? 'active' : ''}`}
                >
                  <i className="bi bi-tools me-2"></i>
                  Projets en cours
                </Link>
                <Link 
                  to="/admin/projects/completed" 
                  className={`list-group-item list-group-item-action py-3 dashboard-nav-link ${currentPath === '/admin/projects/completed' ? 'active' : ''}`}
                >
                  <i className="bi bi-check-circle me-2"></i>
                  Projets terminés
                </Link>
              </div>
            </div>
          </div>
          <div className="col-md-9">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
