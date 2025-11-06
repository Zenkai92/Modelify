import React from 'react';

const About = () => {
  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-lg-8 mx-auto">
          <h1 className="text-center mb-5">À propos de Modelify</h1>
          
          <div className="mb-5">
            <h2>Notre Mission</h2>
            <p className="lead">
              Chez Modelify, nous croyons que chaque idée mérite d'être visualisée et concrétisée. 
              Notre mission est de démocratiser l'accès à la modélisation 3D professionnelle pour 
              tous les créateurs, entrepreneurs et innovateurs.
            </p>
          </div>

          <div className="mb-5">
            <h2>Notre Expertise</h2>
            <p>
              Forte d'une équipe de designers 3D expérimentés et passionnés, Modelify offre des 
              services de modélisation 3D de haute qualité pour une variété de secteurs :
            </p>
            <ul>
              <li>Design industriel et produits</li>
              <li>Architecture et design d'intérieur</li>
              <li>Prototypage et développement</li>
              <li>Art et créations conceptuelles</li>
              <li>Visualisation technique</li>
            </ul>
          </div>

          <div className="mb-5">
            <h2>Pourquoi Choisir Modelify ?</h2>
            <div className="row">
              <div className="col-md-6">
                <h5>🎯 Précision</h5>
                <p>Modèles 3D détaillés et techniquement précis</p>
                
                <h5>⚡ Rapidité</h5>
                <p>Délais de livraison respectés et processus optimisé</p>
              </div>
              <div className="col-md-6">
                <h5>💡 Créativité</h5>
                <p>Solutions innovantes et approche personnalisée</p>
                
                <h5>🤝 Collaboration</h5>
                <p>Accompagnement étroit tout au long du projet</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h2>Prêt à donner vie à votre projet ?</h2>
            <p className="lead mb-4">
              Contactez-nous dès aujourd'hui pour discuter de vos besoins en modélisation 3D.
            </p>
            <a href="/demande-projet" className="btn btn-primary btn-lg">
              Commencer un projet
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;