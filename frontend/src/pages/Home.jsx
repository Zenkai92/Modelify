import React from 'react';
import { Link } from 'react-router-dom';
import FloatingShapes from '../components/FloatingShapes';
import './Home.css';

const Home = () => {
  return (
    <div>
      {/* Section Hero */}
      <section className="hero-section text-center">
        
        <div className="container position-relative home-hero-content">
          <div className="row">
            <div className="col-lg-8 mx-auto">
              <h1 className="display-4 fw-bold mb-4">
                Donnez vie à vos idées avec Modelify
              </h1>
              <p className="lead mb-4">
                Plateforme de demandes de modélisation 3D pour vos produits et concepts innovants
              </p>
              <Link to="/demande-projet" className="btn btn-light btn-lg">
                Commencer un projet
              </Link>
            </div>
          </div>
        </div>

        {/* Formes flottantes décoratives extraites dans un composant */}
        <FloatingShapes />

        {/* Séparateur Vague */}
        <div className="custom-shape-divider-bottom">
            <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="shape-fill"></path>
            </svg>
        </div>
      </section>

      {/* Section Services */}
      <section className="py-5">
        <div className="container">
          <div className="row text-center mb-5">
            <div className="col-12">
              <h2>Nos Services</h2>
              <p className="lead">Découvrez comment nous pouvons vous aider</p>
            </div>
          </div>
          <div className="row">
            <div className="col-md-4 mb-4">
              <div className="card h-100 project-card">
                <div className="card-body text-center">
                  <div className="mb-3">
                    <i className="fas fa-cube fa-3x text-primary"></i>
                  </div>
                  <h5 className="card-title">Modélisation de produits</h5>
                  <p className="card-text">
                    Créez des modèles 3D détaillés de vos produits pour le prototypage et la présentation.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="card h-100 project-card">
                <div className="card-body text-center">
                  <div className="mb-3">
                    <i className="fas fa-lightbulb fa-3x text-warning"></i>
                  </div>
                  <h5 className="card-title">Concepts créatifs</h5>
                  <p className="card-text">
                    Transformez vos idées créatives en modèles 3D réalistes et professionnels.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="card h-100 project-card">
                <div className="card-body text-center">
                  <div className="mb-3">
                    <i className="fas fa-cogs fa-3x text-success"></i>
                  </div>
                  <h5 className="card-title">Prototypage rapide</h5>
                  <p className="card-text">
                    Accélérez votre processus de développement avec nos solutions de prototypage 3D.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section CTA */}
      <section className="bg-light py-5">
        <div className="container">
          <div className="row">
            <div className="col-lg-8 mx-auto text-center">
              <h2>Prêt à commencer ?</h2>
              <p className="lead mb-4">
                Soumettez votre demande de projet dès maintenant et recevez un devis personnalisé
              </p>
              <Link to="/demande-projet" className="btn btn-primary btn-lg">
                Faire une demande
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;