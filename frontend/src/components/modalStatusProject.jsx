import React from 'react';
import './modalStatusProject.css';

const ModalStatusProject = ({ show, status, projectId, message, onClose }) => {
  if (!show) return null;

  const isSuccess = status === 'success';

  return (
    <div className="modal d-block modal-overlay">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg modal-content-custom">
          
          {/* Header with Gradient */}
          <div className="modal-header text-white border-0 modal-gradient">
            <h5 className="modal-title d-flex align-items-center">
              {isSuccess ? 'Confirmation' : 'Erreur'}
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>

          {/* Body */}
          <div className="modal-body p-4 text-center">
            <div className="mb-4">
                {isSuccess ? (
                    <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow-sm status-icon-container status-icon-success">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" className="bi bi-check-lg" viewBox="0 0 16 16">
                            <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
                        </svg>
                    </div>
                ) : (
                    <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow-sm status-icon-container status-icon-error">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" className="bi bi-exclamation-lg" viewBox="0 0 16 16">
                            <path d="M7.005 3.1a1 1 0 1 1 1.99 0l-.388 6.35a.61.61 0 0 1-1.214 0L7.005 3.1ZM7 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0Z"/>
                        </svg>
                    </div>
                )}
                <h4 className="mb-3 fw-bold">{isSuccess ? 'Demande envoyée !' : 'Oups, une erreur est survenue'}</h4>
                <p className="text-muted">{message}</p>
            </div>

            {isSuccess && projectId && (
              <div className="alert alert-light border project-id-alert">
                <strong>ID du projet :</strong> <span className="project-id-text">#{projectId}</span><br/>
                <small className="text-muted">Nous vous recontacterons bientôt pour les détails.</small>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer border-0 justify-content-center pb-4">
            <button 
              type="button" 
              className="btn text-white px-5 py-2 rounded-pill shadow-sm modal-gradient" 
              onClick={onClose}
            >
              {isSuccess ? 'Continuer' : 'Fermer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalStatusProject;