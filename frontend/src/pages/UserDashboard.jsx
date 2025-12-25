import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import PersonalInfoCard from '../components/dashboard/PersonalInfoCard';
import OrderStatusCard from '../components/dashboard/OrderStatusCard';
import './UserDashboard.css';

const UserDashboard = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const renderContent = () => {
    switch(currentPath) {
      case '/profile':
        return <PersonalInfoCard />;
      case '/status-commandes':
        return <OrderStatusCard />;
      default:
        return <PersonalInfoCard />;
    }
  };

  return (
    <div>
      {/* Header Section */}
      <section className="hero-section text-center py-5 dashboard-hero">
        <div className="container position-relative dashboard-hero-content">
          <h1 className="display-5 fw-bold text-white mb-2">Mon Espace</h1>
          <p className="lead text-white-50">Gérez votre profil et vos projets</p>
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
                  to="/profile" 
                  className={`list-group-item list-group-item-action py-3 dashboard-nav-link ${currentPath === '/profile' ? 'active' : ''}`}
                >
                  <i className="bi bi-person me-2"></i>
                  Informations personnelles
                </Link>
                <Link 
                  to="/status-commandes" 
                  className={`list-group-item list-group-item-action py-3 dashboard-nav-link ${currentPath === '/status-commandes' ? 'active' : ''}`}
                >
                  <i className="bi bi-activity me-2"></i>
                  Status des commandes
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

export default UserDashboard;
