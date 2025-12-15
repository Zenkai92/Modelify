import React from 'react';

const ModalStatusProject = ({ show, status, projectId, message, onClose }) => {
  if (!show) return null;

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className={`modal-header ${status === 'success' ? 'bg-success' : 'bg-danger'} text-white`}>
            <h5 className="modal-title">
              {status === 'success' ? '✓ Succès' : '✕ Erreur'}
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            <p className="mb-3">{message}</p>
            {status === 'success' && projectId && (
              <div className="alert alert-info">
                <strong>ID du projet :</strong> #{projectId}<br/>
                <small>Nous vous recontacterons bientôt pour les détails de votre projet.</small>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalStatusProject;