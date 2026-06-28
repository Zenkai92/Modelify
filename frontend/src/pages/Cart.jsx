import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCartStore } from '../store/cartStore';

const Cart = () => {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const [purchasedIds, setPurchasedIds] = useState([]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !session) {
      setPurchasedIds([]);
      return;
    }
    fetch(`${import.meta.env.VITE_API_URL}/api/cart/purchased-ids`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setPurchasedIds(data?.product_ids || []))
      .catch(() => {});
  }, [user, session]);

  const purchasableItems = items.filter((item) => !purchasedIds.includes(item.id));
  const total = purchasableItems.reduce((sum, item) => sum + Number(item.price || 0), 0);

  const handleCheckout = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setError('');
    setCheckoutLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/cart/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ product_ids: purchasableItems.map((item) => item.id) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erreur lors de la redirection');
      window.location.href = data.checkout_url;
    } catch (err) {
      setError(err.message);
      setCheckoutLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-cart-x" style={{ fontSize: '3rem', color: '#9ca3af' }}></i>
        <h3 className="fw-bold mt-3 mb-2">Votre panier est vide</h3>
        <p className="text-muted mb-4">Parcourez la boutique pour ajouter des modèles 3D à votre panier.</p>
        <Link
          to="/"
          className="btn btn-lg fw-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)', border: 'none', borderRadius: '10px' }}
        >
          <i className="bi bi-shop me-2"></i>Retour à la boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h2 className="fw-bold mb-4">Mon panier</h2>

      {error && (
        <div className="alert alert-danger py-2 mb-3 small">
          <i className="bi bi-exclamation-circle me-1"></i>{error}
        </div>
      )}

      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <ul className="list-group list-group-flush">
          {items.map((item) => {
            const alreadyPurchased = purchasedIds.includes(item.id);
            return (
              <li
                key={item.id}
                className="list-group-item d-flex align-items-center justify-content-between py-3"
              >
                <div>
                  <p className="fw-semibold mb-1">{item.title}</p>
                  {alreadyPurchased ? (
                    <span className="badge bg-success-subtle text-success">
                      <i className="bi bi-check-circle me-1"></i>Déjà acheté
                    </span>
                  ) : (
                    <span className="text-muted">{Number(item.price || 0).toFixed(2)} €</span>
                  )}
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="btn btn-sm btn-outline-danger"
                >
                  Supprimer du panier
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="d-flex align-items-center justify-content-between mb-4">
        <span className="fs-5 fw-semibold">Total</span>
        <span
          className="fw-bold"
          style={{
            fontSize: '1.75rem',
            background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {total.toFixed(2)} €
        </span>
      </div>

      {!user && (
        <p className="text-muted text-center small mb-3">
          <i className="bi bi-lock me-1"></i>
          <button onClick={() => navigate('/login')} className="btn btn-link btn-sm p-0">
            Connectez-vous
          </button>
          {' '}pour passer au paiement.
        </p>
      )}

      <button
        onClick={handleCheckout}
        disabled={checkoutLoading || purchasableItems.length === 0}
        className="btn w-100 btn-lg fw-semibold py-2 text-white"
        style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)', border: 'none', borderRadius: '10px' }}
      >
        {checkoutLoading ? (
          <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Redirection vers le paiement…</>
        ) : (
          <><i className="bi bi-credit-card me-2"></i>Passer au paiement — {total.toFixed(2)} €</>
        )}
      </button>
    </div>
  );
};

export default Cart;
