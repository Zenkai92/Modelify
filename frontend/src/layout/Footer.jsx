import { Link } from 'react-router-dom';

const LEGAL_LINKS = [
  { hash: 'mentions-legales',          label: 'Mentions légales'                     },
  { hash: 'politique-confidentialite', label: 'Politique de confidentialité'         },
  { hash: 'cgu',                       label: "Conditions générales d'utilisation"   },
  { hash: 'cgv',                       label: 'Conditions générales de vente'        },
  { hash: 'paiement-remboursement',    label: 'Paiement & remboursement'             },
  { hash: 'sav',                       label: 'Service après-vente'                  },
];

const Footer = () => {
  return (
    <footer className="footer mt-auto">
      <div className="container">
        <div className="row">

          {/* Colonne marque */}
          <div className="col-md-4 mb-3">
            <h5>Modelify</h5>
            <p className="mb-0" style={{ fontSize: '0.9rem', opacity: 0.8 }}>
              Votre partenaire pour la modélisation 3D de vos projets et idées.
            </p>
          </div>

          {/* Colonne navigation */}
          <div className="col-md-4 mb-3">
            <h5>Liens rapides</h5>
            <ul className="list-unstyled mb-0">
              <li>
                <Link to="/" className="text-light text-decoration-none footer-link">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/demande-projet" className="text-light text-decoration-none footer-link">
                  Demander un projet
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne informations légales */}
          <div className="col-md-4 mb-3">
            <h5>Informations légales</h5>
            <ul className="list-unstyled mb-0">
              {LEGAL_LINKS.map(({ hash, label }) => (
                <li key={hash}>
                  <Link
                    to={`/legal#${hash}`}
                    className="text-light text-decoration-none footer-link"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        <hr className="my-4" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />

        <div className="row">
          <div className="col-12 text-center">
            <p className="mb-0" style={{ fontSize: '0.85rem', opacity: 0.7 }}>
              &copy; {new Date().getFullYear()} Modelify. Tous droits réservés. &nbsp;·&nbsp;{' '}
              <Link to="/legal#mentions-legales" className="text-light">
                Mentions légales
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
