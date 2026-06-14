import React from 'react';
import { Link } from 'react-router-dom';

const PaymentCancel = () => {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 text-center">
          <div
            className="card shadow-lg border-0 rounded-4 p-5"
            style={{ background: 'linear-gradient(135deg, #fef2f2, #fee2e2)' }}
          >
            <i
              className="bi bi-x-circle-fill mb-4"
              style={{ fontSize: '4rem', color: '#dc2626' }}
            ></i>
            <h2 className="fw-bold mb-2">Paiement annulé</h2>
            <p className="text-muted mb-4">
              Votre paiement a été annulé. Aucun montant n'a été débité.
              Vous pouvez retourner à la boutique et réessayer à tout moment.
            </p>

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

export default PaymentCancel;
