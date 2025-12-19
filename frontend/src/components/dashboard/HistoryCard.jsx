import React from 'react';

const HistoryCard = () => {
  return (
    <div className="card shadow-sm border-0 rounded-3">
      <div className="card-header bg-white border-bottom py-3">
        <h5 className="mb-0 fw-bold" style={{ color: '#764ba2' }}>
          <i className="bi bi-clock-history me-2"></i>
          Historique des commandes
        </h5>
      </div>
      <div className="card-body p-5 text-center text-muted">
        <i className="bi bi-archive display-4 d-block mb-3"></i>
        <p>Aucun historique disponible.</p>
      </div>
    </div>
  );
};

export default HistoryCard;
