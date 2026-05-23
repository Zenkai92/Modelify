import { createPortal } from 'react-dom';
import Model3D from './Model3D';

const ProductDetailModal = ({ product, open, onClose }) => {
  const formats = Array.isArray(product?.file_formats)
    ? product.file_formats
    : typeof product?.file_formats === 'string' && product.file_formats
      ? product.file_formats.split(',').map(f => f.trim())
      : [];

  // Toujours monté dans le DOM pour éviter la destruction du contexte WebGL.
  // Caché via visibility/pointer-events quand fermé.
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
            <h4 style={{ margin: 0, color: '#fff', fontWeight: 700 }}>
              {product?.title}
            </h4>
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

        {/* Aperçu 3D — toujours rendu pour éviter la perte de contexte WebGL */}
        <div style={{ padding: '1rem 1.5rem 0' }}>
          <Model3D
            modelPath={product?.overview_model_file}
            color="#7c3aed"
          />
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
            <p className="text-muted mb-4" style={{ lineHeight: 1.7 }}>
              {product.description}
            </p>
          )}

          {/* Formats */}
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

          {/* Téléchargement */}
          {product?.download_model_file && (
            <a
              href={product.download_model_file}
              target="_blank"
              rel="noopener noreferrer"
              className="btn w-100 text-white fw-semibold py-2"
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)', border: 'none', borderRadius: '8px' }}
            >
              <i className="bi bi-download me-2"></i>Télécharger le fichier
            </a>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProductDetailModal;
