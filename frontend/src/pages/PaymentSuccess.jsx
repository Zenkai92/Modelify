import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('product_id');
  const { session } = useAuth();
  const [confirmed, setConfirmed] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // Polling pendant 15s max pour attendre la confirmation du webhook Stripe
  useEffect(() => {
    if (!productId || !session || confirmed || attempts >= 15) return;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/products/${productId}/purchased`,
          { headers: { Authorization: `Bearer ${session.access_token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.purchased) setConfirmed(true);
        }
      } catch {}
      setAttempts((a) => a + 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [attempts, productId, session, confirmed]);

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 text-center">
          <div
            className="card shadow-lg border-0 rounded-4 p-5"
            style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}
          >
            <i
              className="bi bi-check-circle-fill mb-4"
              style={{ fontSize: '4rem', color: '#16a34a' }}
            ></i>
            <h2 className="fw-bold mb-2">Paiement réussi !</h2>
            <p className="text-muted mb-4">
              Votre achat est confirmé. Retournez sur la boutique pour télécharger vos fichiers.
            </p>

            {productId && !confirmed && attempts < 15 && (
              <div className="alert alert-info py-2 small mb-4">
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Confirmation en cours…
              </div>
            )}
            {confirmed && (
              <div className="alert alert-success py-2 small mb-4">
                <i className="bi bi-check-circle me-1"></i>
                Votre achat est maintenant disponible dans la boutique.
              </div>
            )}
            {attempts >= 15 && !confirmed && (
              <div className="alert alert-warning py-2 small mb-4">
                La confirmation peut prendre quelques secondes supplémentaires.
                Vos fichiers seront disponibles dès que le paiement sera validé.
              </div>
            )}

            <Link
              to="/"
              className="btn btn-lg fw-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)', border: 'none', borderRadius: '10px' }}
            >
              <i className="bi bi-shop me-2"></i>Retour à la boutique
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
