import { useEffect, useState, useCallback } from 'react';
import FloatingShapes from '../components/FloatingShapes';
import ProductCard from '../components/ProductCard';
import AddProductModal from '../components/AddProductModal';
import { useAuth } from '../contexts/AuthContext';
import './Home.css';

const Home = () => {
  const { user } = useAuth();
  const isAdmin = user?.user_metadata?.role === 'admin';

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

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
                      fontSize: '1.4rem',
                      lineHeight: 1,
                      boxShadow: '0 3px 10px rgba(124,58,237,0.4)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    +
                  </button>
                )}
              </h2>
              <p className="lead">Découvrez comment nous pouvons vous aider</p>
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
                <div key={product.id} className="col-md-3 mb-4">
                  <ProductCard
                    title={product.title}
                    description={product.description}
                    model3DProps={{ modelPath: product.overview_model_file, color: '#0d6efd' }}
                  />
                </div>
              ))}
            </div>
          )}
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
    </div>
  );
};

export default Home;
