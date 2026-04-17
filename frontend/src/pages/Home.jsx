import React from 'react';
import { Link } from 'react-router-dom';
import FloatingShapes from '../components/FloatingShapes';
import ProductCard from '../components/ProductCard';
import './Home.css';

const products = [
  {
    title: 'Modélisation de produits',
    description: 'Créez des modèles 3D détaillés de vos produits pour le prototypage et la présentation.',
    model3DProps: {
      type: 'cube',
      color: '#0d6efd',
      modelPath: '/models/gun_epee_plasma.3mf',
      rotation: [-Math.PI / 2, 0, 0],
    },
  },
  {
    title: 'Concepts créatifs',
    description: 'Transformez vos idées créatives en modèles 3D réalistes et professionnels.',
    model3DProps: {
      type: 'torus',
      color: '#ffc107',
    },
  },
  {
    title: 'Prototypage rapide',
    description: 'Accélérez votre processus de développement avec nos solutions de prototypage 3D.',
    model3DProps: {
      type: 'sphere',
      color: '#198754',
    },
  },
  {
    title: 'Impression 3D',
    description: "Donnez vie à vos modèles en les transformant en objets physiques grâce à l'impression 3D.",
    model3DProps: {
      type: 'cone',
      color: '#dc3545',
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
                Bienvenue sur Modelify
              </h1>
              <p className="lead mb-4">
                Découvrez nos réalisations ou accédez à votre portail pour gérer et suivre l'ensemble de vos projets en temps réel.
              </p>
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

      {/* Section Produits */}
      <section id="catalogue" className="py-5">
        <div className="container">
          <div className="row text-center mb-5">
            <div className="col-12">
              <h2>Nos Produits</h2>
              <p className="lead">Découvrez comment nous pouvons vous aider</p>
            </div>
          </div>
          <div className="row">
            {products.map((product, index) => (
              <div key={index} className="col-md-3 mb-4">
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

