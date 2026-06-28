import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCartStore } from '../store/cartStore';
import Model3D from './Model3D';

const ProductDetailModal = ({ product, open, onClose }) => {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const inCart = useCartStore((state) => (product ? state.isInCart(product.id) : false));
  const [purchased, setPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyError, setBuyError] = useState('');

  const formats = Array.isArray(product?.file_formats)
    ? product.file_formats
    : typeof product?.file_formats === 'string' && product.file_formats
      ? product.file_formats.split(',').map((f) => f.trim())
      : [];

  const downloadFiles = Array.isArray(product?.download_files) ? product.download_files : [];

  useEffect(() => {
    if (open && product && user && session) {
      checkPurchaseStatus();
    } else if (!user) {
      setPurchased(false);
    }
  }, [open, product?.id, user]);

  const checkPurchaseStatus = async () => {
    setCheckingPurchase(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/products/${product.id}/purchased`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setPurchased(data.purchased);
      }
    } catch {
      // silencieux — on affiche juste le bouton Acheter par défaut
    } finally {
      setCheckingPurchase(false);
    }
  };

  const handleBuy = async () => {
    if (!user) {
      onClose();
      navigate('/login');
      return;
    }
    setBuyError('');
    setBuyLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/products/${product.id}/buy`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erreur lors de la redirection');
      window.location.href = data.checkout_url;
    } catch (err) {
      setBuyError(err.message);
      setBuyLoading(false);
    }
  };

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 1050,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        visibility: open ? 'visible' : 'hidden',
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 0.2s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '580px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
        transform: open ? 'scale(1)' : 'scale(0.95)',
        transition: 'transform 0.2s ease',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)',
          padding: '1.25rem 1.5rem',
          borderRadius: '16px 16px 0 0',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem',
          position: 'sticky', top: 0, zIndex: 1,
        }}>
          <div>
            <h4 style={{ margin: 0, color: '#fff', fontWeight: 700 }}>{product?.title}</h4>
            {product?.category && (
              <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem' }}>
                <i className="bi bi-tag me-1"></i>{product.category}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', lineHeight: 1, cursor: 'pointer', opacity: 0.8, flexShrink: 0 }}
          >
            &times;
          </button>
        </div>

        {/* Aperçu 3D */}
        <div style={{ padding: '1rem 1.5rem 0' }}>
          <Model3D modelPath={product?.overview_model_file} color="#7c3aed" />
        </div>

        {/* Infos */}
        <div style={{ padding: '0 1.5rem 1.5rem' }}>
          {/* Prix */}
          {product?.price != null && (
            <div className="mb-3">
              <span
                className="fw-bold"
                style={{
                  fontSize: '2rem',
                  background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {Number(product.price).toFixed(2)} €
              </span>
            </div>
          )}

          {/* Description */}
          {product?.description && (
            <p className="text-muted mb-4" style={{ lineHeight: 1.7 }}>{product.description}</p>
          )}

          {/* Formats inclus */}
          {formats.length > 0 && (
            <div className="mb-4">
              <p className="fw-semibold text-muted small mb-2 text-uppercase" style={{ letterSpacing: '0.05em' }}>
                Formats inclus
              </p>
              <div className="d-flex flex-wrap gap-2">
                {formats.map((fmt) => (
                  <span
                    key={fmt}
                    className="badge px-3 py-2"
                    style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)', fontSize: '0.85rem' }}
                  >
                    {fmt}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Zone achat / téléchargement */}
          {buyError && (
            <div className="alert alert-danger py-2 mb-3 small">
              <i className="bi bi-exclamation-circle me-1"></i>{buyError}
            </div>
          )}

          {checkingPurchase ? (
            <div className="text-center py-2">
              <span className="spinner-border spinner-border-sm text-primary me-2" role="status" aria-hidden="true"></span>
              <span className="text-muted small">Vérification en cours…</span>
            </div>
          ) : purchased ? (
            /* Boutons de téléchargement par format */
            <div>
              <p className="fw-semibold text-success mb-3 small">
                <i className="bi bi-check-circle-fill me-1"></i>Achat confirmé — choisissez votre format :
              </p>
              <div className="d-flex flex-column gap-2">
                {downloadFiles.length > 0 ? (
                  downloadFiles.map(({ url, extension }) => (
                    <a
                      key={extension}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn w-100 fw-semibold py-2"
                      style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)', color: '#fff', border: 'none', borderRadius: '8px' }}
                    >
                      <i className="bi bi-download me-2"></i>
                      Télécharger {extension.toUpperCase()}
                    </a>
                  ))
                ) : (
                  <p className="text-muted small">Aucun fichier disponible pour le moment.</p>
                )}
              </div>
            </div>
          ) : (
            /* Boutons Acheter / Ajouter au panier */
            <div className="d-flex flex-column gap-2">
              <button
                onClick={handleBuy}
                disabled={buyLoading}
                className="btn w-100 fw-semibold py-2"
                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)', color: '#fff', border: 'none', borderRadius: '8px' }}
              >
                {buyLoading ? (
                  <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Redirection vers le paiement…</>
                ) : (
                  <><i className="bi bi-cart-check me-2"></i>Acheter maintenant — {Number(product?.price || 0).toFixed(2)} €</>
                )}
              </button>
              <button
                onClick={() => (inCart ? removeItem(product.id) : addItem(product))}
                disabled={!user}
                className="btn w-100 fw-semibold py-2"
                style={{
                  background: inCart ? '#ecfdf5' : 'transparent',
                  color: inCart ? '#16a34a' : '#3b82f6',
                  border: `1px solid ${inCart ? '#16a34a' : '#3b82f6'}`,
                  borderRadius: '8px',
                }}
              >
                {inCart ? (
                  <><i className="bi bi-check-circle-fill me-2"></i>Dans le panier — Retirer</>
                ) : (
                  <><i className="bi bi-cart-plus me-2"></i>Ajouter au panier</>
                )}
              </button>
              {inCart && (
                <button
                  onClick={() => { onClose(); navigate('/cart'); }}
                  className="btn btn-link btn-sm fw-semibold p-0 w-100 text-center"
                >
                  Voir le panier <i className="bi bi-arrow-right ms-1"></i>
                </button>
              )}
            </div>
          )}

          {!user && !purchased && (
            <p className="text-muted text-center small mt-2 mb-0">
              <i className="bi bi-lock me-1"></i>
              <button
                onClick={() => { onClose(); navigate('/login'); }}
                className="btn btn-link btn-sm p-0 text-muted"
                style={{ verticalAlign: 'baseline' }}
              >
                Connectez-vous
              </button>
              {' '}pour acheter ce produit.
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProductDetailModal;
