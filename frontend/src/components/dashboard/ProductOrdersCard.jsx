import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './OrderStatusCard.css';

const ProductOrdersCard = () => {
  const { session } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!session) return;
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/mine`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!response.ok) throw new Error('Erreur lors de la récupération des commandes');
        const data = await response.json();
        setOrders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [session]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPrice = (price) => {
    if (price == null) return '';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
  };

  if (loading) return (
    <div className="card shadow-sm border-0 rounded-3">
      <div className="card-body p-5 text-center">
        <div className="spinner-border order-status-spinner" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="card shadow-sm border-0 rounded-3">
      <div className="card-body p-4">
        <div className="alert alert-danger mb-0">{error}</div>
      </div>
    </div>
  );

  return (
    <div className="card shadow-sm border-0 rounded-3">
      <div className="card-header bg-white border-bottom py-3">
        <h5 className="mb-0 fw-bold order-status-title">
          <i className="bi bi-bag-check me-2"></i>
          Mes Commandes
        </h5>
      </div>
      <div className="card-body p-0">
        {orders.length === 0 ? (
          <div className="p-5 text-center text-muted">
            <i className="bi bi-bag display-4 d-block mb-3"></i>
            <p className="mb-0">Aucune commande pour le moment.</p>
          </div>
        ) : (
          <div className="p-3 d-flex flex-column gap-3">
            {orders.map((order) => {
              const files = Array.isArray(order.product?.download_files) ? order.product.download_files : [];
              return (
                <div key={order.id} className="border rounded-3 p-3">
                  <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                    <div>
                      <span className="fw-bold">{order.product?.title ?? '—'}</span>
                      {order.product?.category && (
                        <span className="text-muted small ms-2">{order.product.category}</span>
                      )}
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-muted small">{formatDate(order.created_at)}</span>
                      {order.product?.price != null && (
                        <span className="fw-semibold small">{formatPrice(order.product.price)}</span>
                      )}
                      <span className="badge rounded-pill bg-success">Payée</span>
                    </div>
                  </div>

                  {files.length > 0 ? (
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      {files.map(({ url, extension }) => (
                        <a
                          key={extension}
                          href={url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm fw-semibold"
                          style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                          }}
                        >
                          <i className="bi bi-download me-1"></i>
                          Télécharger {extension.toUpperCase()}
                        </a>
                      ))}
                    </div>
                  ) : order.product?.download_model_file ? (
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      <a
                        href={order.product.download_model_file}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm fw-semibold"
                        style={{
                          background: 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                        }}
                      >
                        <i className="bi bi-download me-1"></i>
                        Télécharger {(order.product.file_formats?.[0] ?? 'fichier').toUpperCase()}
                      </a>
                    </div>
                  ) : (
                    <p className="text-muted small mb-0 mt-2">
                      <i className="bi bi-info-circle me-1"></i>
                      Aucun fichier disponible.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductOrdersCard;
