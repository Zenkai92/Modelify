import Model3D from './Model3D';

const ProductCard = ({ title, description, price, fileFormats, model3DProps, isAdmin, onEdit }) => {
  const formats = Array.isArray(fileFormats)
    ? fileFormats
    : typeof fileFormats === 'string' && fileFormats
      ? fileFormats.split(',').map(f => f.trim())
      : [];

  return (
    <div className="card h-100 project-card" style={{ position: 'relative' }}>
      {isAdmin && (
        <button
          onClick={onEdit}
          title="Modifier le produit"
          style={{
            position: 'absolute',
            top: '0.6rem',
            right: '0.6rem',
            zIndex: 10,
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)',
            border: 'none',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(124,58,237,0.4)',
          }}
        >
          <i className="bi bi-pencil" style={{ fontSize: '0.75rem' }}></i>
        </button>
      )}
      <div className="card-body d-flex flex-column">
        <Model3D {...model3DProps} />
        <h5 className="card-title text-center">{title}</h5>
        {description && <p className="card-text text-muted small text-center">{description}</p>}
        <div className="mt-auto pt-2 d-flex align-items-center justify-content-between gap-2">
          <div className="d-flex flex-wrap gap-1">
            {formats.map((fmt) => (
              <span
                key={fmt}
                className="badge"
                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)' }}
              >
                {fmt}
              </span>
            ))}
          </div>
          {price != null && (
            <span className="fw-bold text-nowrap" style={{ color: '#7c3aed', fontSize: '1.1rem' }}>
              {Number(price).toFixed(2)} €
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
