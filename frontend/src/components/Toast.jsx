import React, { useEffect } from 'react';
import './Toast.css';

const Toast = ({ message, type = 'error', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className={`toast-container position-fixed top-0 end-0 p-3`} style={{ zIndex: 1055 }}>
      <div className={`toast show align-items-center text-white bg-${type === 'error' ? 'danger' : 'success'} border-0`} role="alert" aria-live="assertive" aria-atomic="true">
        <div className="d-flex">
          <div className="toast-body">
            {type === 'error' && <i className="bi bi-exclamation-circle-fill me-2"></i>}
            {type === 'success' && <i className="bi bi-check-circle-fill me-2"></i>}
            {message}
          </div>
          <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={onClose} aria-label="Close"></button>
        </div>
      </div>
    </div>
  );
};

export default Toast;
