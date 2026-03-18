import React from 'react';
import { Link } from 'react-router-dom';
import FloatingShapes from '../components/FloatingShapes';
import ProductCard from '../components/ProductCard';
import './Home.css';

const products = [
  {
    title: 'ModÃ©lisation de produits',
    description: 'CrÃ©ez des modÃ¨les 3D dÃ©taillÃ©s de vos produits pour le prototypage et la prÃ©sentation.',
    model3DProps: {
      type: 'cube',
      color: '#0d6efd',
      modelPath: '/models/gun_epee_plasma.3mf',
      rotation: [-Math.PI / 2, 0, 0],
    },
  },
  {
    title: 'Concepts crÃ©atifs',
    description: 'Transformez vos idÃ©es crÃ©atives en modÃ¨les 3D rÃ©alistes et professionnels.',
    model3DProps: {
      type: 'torus',
      color: '#ffc107',
    },
  },
  {
    title: 'Prototypage rapide',
    description: 'AccÃ©lÃ©rez votre processus de dÃ©veloppement avec nos solutions de prototypage 3D.',
    model3DProps: {
      type: 'sphere',
      color: '#198754',
    },
  },
];

const Home = () => {
  return (
    <div>
      {/* Section Hero */}
      <section className="hero-section text-center">

        <div className="container position-relative home-hero-content">
          <div className="row">
            <div className="col-lg-8 mx-auto">
              <h1 className="display-4 fw-bold mb-4">
                Votre Portail Modelify
              </h1>
              <p className="lead mb-4">
                AccÃ©dez Ã  votre espace unique. Pilotez vos projets de modÃ©lisation, suivez l'avancement de vos demandes, gÃ©rez vos devis et consultez votre historique en un seul endroit.
              </p>
              <Link to="/app" className="btn btn-light btn-lg fw-bold shadow-sm d-inline-flex align-items-center gap-2">
                <i className="bi bi-grid-fill"></i> AccÃ©der au Portail
              </Link>
            </div>
          </div>
        </div>

        {/* Formes flottantes dÃ©coratives extraites dans un composant */}
        <FloatingShapes />

        {/* SÃ©parateur Vague */}
        <div className="custom-shape-divider-bottom">
          <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="shape-fill"></path>
          </svg>
        </div>
      </section>

      {/* Section Produits */}
      <section className="py-5">
        <div className="container">
          <div className="row text-center mb-5">
            <div className="col-12">
              <h2>Nos Produits</h2>
              <p className="lead">DÃ©couvrez comment nous pouvons vous aider</p>
            </div>
          </div>
          <div className="row">
            {products.map((product, index) => (
              <div key={index} className="col-md-4 mb-4">
                <ProductCard
                  title={product.title}
                  description={product.description}
                  model3DProps={product.model3DProps}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
