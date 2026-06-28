import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import FloatingShapes from '../components/FloatingShapes';
import ProductCard from '../components/ProductCard';
import AddProductModal from '../components/AddProductModal';
import EditProductModal from '../components/EditProductModal';
import ProductDetailModal from '../components/ProductDetailModal';
import { useAuth } from '../contexts/AuthContext';
import './Home.css';

const HOW_IT_WORKS = [
  {
    icon: 'bi-search',
    title: 'Parcourez ou décrivez votre besoin',
    text: "Choisissez un modèle existant dans le catalogue, ou décrivez votre projet pour une création sur-mesure.",
  },
  {
    icon: 'bi-cpu',
    title: 'On prépare votre fichier',
    text: "Notre équipe modélise, vérifie et exporte le fichier dans le ou les formats dont vous avez besoin.",
  },
  {
    icon: 'bi-file-earmark-arrow-down',
    title: 'Téléchargez votre modèle 3D',
    text: "Vous recevez uniquement le fichier STL, OBJ et/ou F3D prêt à imprimer ou à exploiter.",
  },
];

const FEATURES = [
  {
    icon: 'bi-box-seam',
    title: 'Formats multiples',
    text: 'STL, OBJ, F3D : vos fichiers sont livrés dans le format adapté à votre logiciel ou votre imprimante.',
  },
  {
    icon: 'bi-magic',
    title: 'Sur-mesure',
    text: "Une idée précise en tête ? Décrivez-la, on la modélise spécialement pour vous.",
  },
  {
    icon: 'bi-lightning-charge',
    title: 'Livraison numérique immédiate',
    text: "Pas de logistique, pas d'attente : votre fichier est disponible dès qu'il est prêt.",
  },
  {
    icon: 'bi-shield-check',
    title: 'Qualité vérifiée',
    text: 'Chaque modèle est contrôlé avant sa mise en ligne ou sa livraison.',
  },
];

const Home = () => {
  const { user } = useAuth();
  const isAdmin = user?.user_metadata?.role === 'admin';

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);
  const [cardKey, setCardKey] = useState(0);

  const handleCloseDetail = () => {
    setViewProduct(null);
    setCardKey(k => k + 1);
  };

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products`);
      const data = await response.json();
      console.log('GET /api/products -', response.status, data);
      if (response.ok) {
        setProducts(data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des produits:', err);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div>
      {/* Section Hero */}
      <section className="hero-section text-center">

        <div className="container position-relative home-hero-content">
          <div className="row">
            <div className="col-lg-9 mx-auto">
              <span className="hero-eyebrow d-inline-flex align-items-center gap-2 mb-5">
                <i className="bi bi-stars"></i> Plateforme de modèles 3D
              </span>
              <h1 className="fw-bold mb-4">Des modèles 3D prêts à l'emploi, ou sur-mesure</h1>
              <p className="lead mb-4">
                Explorez notre catalogue de modèles 3D, ou décrivez votre projet pour une création sur-mesure.
              </p>
              <div className="d-flex flex-wrap justify-content-center gap-3 mb-4">
                <a href="#catalogue" className="btn btn-light btn-lg fw-bold px-4">
                  <i className="bi bi-grid-3x3-gap-fill me-2"></i>Explorer le catalogue
                </a>
                <Link to="/app?view=demande-projet" className="btn btn-outline-light btn-lg fw-bold px-4">
                  <i className="bi bi-magic me-2"></i>Demander un projet sur-mesure
                </Link>
              </div>
              <div className="d-flex flex-wrap justify-content-center gap-2">
                {['STL', 'OBJ', 'F3D'].map((fmt) => (
                  <span key={fmt} className="hero-format-badge">{fmt}</span>
                ))}
              </div>
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

      {/* Section Comment ça marche */}
      <section className="py-5 bg-white">
        <div className="container">
          <div className="row text-center mb-5">
            <div className="col-lg-7 mx-auto">
              <span className="section-eyebrow">Comment ça marche</span>
              <h2 className="fw-bold mt-2">De l'idée au fichier 3D, en 3 étapes</h2>
            </div>
          </div>
          <div className="row g-4">
            {HOW_IT_WORKS.map((step, index) => (
              <div key={step.title} className="col-md-4 text-center">
                <div className="step-icon-circle">
                  <i className={`bi ${step.icon}`}></i>
                </div>
                <h3 className="h5 fw-bold mb-2">
                  <span className="step-number">{index + 1}.</span> {step.title}
                </h3>
                <p className="text-muted">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider"></div>

      {/* Section Pourquoi Modelify */}
      <section className="py-5 why-section">
        <div className="container">
          <div className="row text-center mb-5">
            <div className="col-lg-7 mx-auto">
              <span className="section-eyebrow">Pourquoi Modelify</span>
              <h2 className="fw-bold mt-2">Conçu pour aller du concept au fichier, vite et bien</h2>
            </div>
          </div>
          <div className="row g-4">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="col-md-6 col-lg-3 text-center">
                <div className="feature-icon-circle">
                  <i className={`bi ${feature.icon}`}></i>
                </div>
                <h3 className="h6 fw-bold mb-2">{feature.title}</h3>
                <p className="text-muted small">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Produits */}
      <section id="catalogue" className="py-5">
        <div className="container">
          <div className="row text-center mb-5">
            <div className="col-12">
              <span className="section-eyebrow d-block mb-2">Catalogue</span>
              <h2 className="d-inline-flex align-items-center gap-3">
                Nos Produits
                {isAdmin && (
                  <button
                    onClick={() => setModalOpen(true)}
                    title="Ajouter un produit"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)',
                      border: 'none',
                      color: '#fff',
                      fontSize: '1.2rem',
                      lineHeight: 1,
                      padding: 0,
                      boxShadow: '0 3px 10px rgba(124,58,237,0.4)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <i className="bi bi-plus" style={{ lineHeight: 1 }}></i>
                  </button>
                )}
              </h2>
              <p className="lead">Des modèles prêts à télécharger, dans les formats STL, OBJ et F3D</p>
            </div>
          </div>

          {loadingProducts ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-box-seam fs-1 d-block mb-3"></i>
              <p>Aucun produit disponible pour le moment.</p>
            </div>
          ) : (
            <div className="row">
              {products.map((product) => (
                <div key={`${product.id}-${cardKey}`} className="col-md-3 mb-4">
                  <ProductCard
                    title={product.title}
                    description={product.description}
                    price={product.price}
                    fileFormats={product.file_formats}
                    model3DProps={{ modelPath: product.overview_model_file, color: '#0d6efd' }}
                    isAdmin={isAdmin}
                    onEdit={() => setEditProduct(product)}
                    onView={() => setViewProduct(product)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bandeau CTA demande sur-mesure */}
      <section className="cta-banner text-center text-white mb-0 py-5">
        {/* Séparateur Vague */}
        <div className="custom-shape-divider-top">
          <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="shape-fill"></path>
          </svg>
        </div>
        <FloatingShapes />

        <div className="container py-4 position-relative z-2">
          <div className="row">
            <div className="col-lg-8 mx-auto">
              <h2 className="fw-bold mb-3">Une idée bien précise en tête ?</h2>
              <p className="lead mb-4">
                Décrivez-nous votre projet : nous le modélisons et vous livrons le fichier 3D correspondant, dans le format de votre choix.
              </p>
              <Link to="/app?view=demande-projet" className="btn btn-light btn-lg fw-bold px-4">
                <i className="bi bi-magic me-2"></i>Demander un projet sur-mesure
              </Link>
            </div>
          </div>
        </div>

        {/* Séparateur Vague */}
        <div className="custom-shape-divider-bottom">
          <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="shape-fill"></path>
          </svg>
        </div>
      </section>

      {/* Modal d'ajout (admin uniquement) */}
      {isAdmin && (
        <AddProductModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onProductAdded={fetchProducts}
        />
      )}  

      {/* Modal d'édition (admin uniquement) */}
      {isAdmin && editProduct && (
        <EditProductModal
          product={editProduct}
          onClose={() => setEditProduct(null)}
          onProductUpdated={fetchProducts}
        />
      )}

      {/* Modal de détail — toujours montée, fermeture force le remontage des canvases */}
      <ProductDetailModal
        product={viewProduct}
        open={!!viewProduct}
        onClose={handleCloseDetail}
      />
    </div>
  );
};

export default Home;
