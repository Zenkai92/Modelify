import React from 'react';

const Footer = () => {
  return (
    <footer className="footer mt-auto">
      <div className="container">
        <div className="row">
          <div className="col-md-6">
            <h5>Modelify</h5>
            <p>Votre partenaire pour la modélisation 3D de vos projets et idées.</p>
          </div>
          <div className="col-md-6">
            <h5>Liens rapides</h5>
            <ul className="list-unstyled">
              <li><a href="/" className="text-light text-decoration-none">Accueil</a></li>
              <li><a href="/demande-projet" className="text-light text-decoration-none">Demander un projet</a></li>
            </ul>
          </div>
        </div>
        <hr className="my-4" />
        <div className="row">
          <div className="col-12 text-center">
            <p>&copy; 2025 Modelify. Tous droits réservés.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;