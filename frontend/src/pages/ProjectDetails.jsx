import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FloatingShapes from '../components/FloatingShapes';
import './ProjectDetails.css';

const ProjectDetails = () => {
  const { projectId } = useParams();
  const { user, session } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quotePrice, setQuotePrice] = useState('');

  useEffect(() => {
    const fetchProject = async () => {
      if (!session) return;
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération du projet');
        }
        const data = await response.json();
        setProject(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId, session]);

  const handleStatusChange = (newStatus) => {
    setPendingStatus(newStatus);
    setShowConfirmModal(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${projectId}/status?status=${pendingStatus}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du statut');
      }

      const data = await response.json();
      setProject(data.project);
      setShowConfirmModal(false);
      setPendingStatus(null);
    } catch (err) {
      console.error(err);
      alert('Erreur lors du changement de statut');
      setShowConfirmModal(false);
    }
  };

  const handleSendQuote = async () => {
    if (!quotePrice || isNaN(quotePrice)) {
        alert("Veuillez entrer un prix valide");
        return;
    }

    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/projects/${projectId}/quote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ price: parseFloat(quotePrice) })
        });

        if (!response.ok) {
            throw new Error("Erreur lors de l'envoi du devis");
        }

        const data = await response.json();
        setProject(data.project);
        setShowQuoteModal(false);
        setQuotePrice('');
        alert("Devis envoyé avec succès !");

    } catch (err) {
        console.error(err);
        alert(err.message);
    }
  };

  const handlePayment = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/projects/${projectId}/pay`, {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${session.access_token}`,
          }
      });

      if (!response.ok) {
          throw new Error("Erreur lors de l'initialisation du paiement");
      }

      const data = await response.json();
      
      // Redirection vers Stripe Checkout
      if (data.url) {
          window.location.href = data.url;
      } else {
          throw new Error("Aucune URL de paiement reçue");
      }

    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return (
    <div className="project-details-section">
      <div className="container project-details-container">
        <div className="text-center text-white">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-3">Chargement du projet...</p>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="project-details-section">
      <div className="container project-details-container">
        <div className="alert alert-danger shadow-lg border-0" role="alert">
          <h4 className="alert-heading">Erreur</h4>
          <p>{error}</p>
          <hr />
          <Link to="/status-commandes" className="btn btn-outline-danger">Retour au tableau de bord</Link>
        </div>
      </div>
    </div>
  );

  if (!project) return null;

  return (
    <div className="project-details-section">      
      <div className="container project-details-container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="text-white fw-bold mb-0">Détails du projet</h1>
          <div>
            {user?.user_metadata?.role === 'admin' && (
              <>
                {project.status === 'en attente' && (
                  <button 
                    className="btn btn-light text-primary fw-bold px-4 shadow-sm me-3"
                    onClick={() => setShowQuoteModal(true)}
                  >
                    <i className="bi bi-file-earmark-text me-2"></i> Faire un devis
                  </button>
                )}
                 {project.status === 'devis_envoyé' && (
                  <span className="badge bg-info me-3 py-2 px-3 text-dark">
                    <i className="bi bi-envelope-paper me-2"></i> Devis envoyé : {project.price} €
                  </span>
                )}
                {/* Le projet doit être payé pour être traité */}
                {project.status === 'payé' && (
                  <button 
                    className="btn btn-light text-primary fw-bold px-4 shadow-sm me-3"
                    onClick={() => handleStatusChange('en cours')}
                  >
                    <i className="bi bi-play-fill me-2"></i> Traiter le projet
                  </button>
                )}
                {project.status === 'en cours' && (
                  <button 
                    className="btn btn-success fw-bold px-4 shadow-sm me-3"
                    onClick={() => handleStatusChange('terminé')}
                  >
                    <i className="bi bi-check-lg me-2"></i> Terminer le projet
                  </button>
                )}
              </>
            )}
            {project.status === 'en attente' && user && project.userId === user.id && (
              <Link to={`/projects/${projectId}/edit`} className="btn btn-warning me-2 text-white">
                <i className="bi bi-pencil me-2"></i> Modifier
              </Link>
            )}
            <Link to="/status-commandes" className="btn back-btn">
              <i className="bi bi-arrow-left me-2"></i> Retour
            </Link>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-8 mb-4 d-flex flex-column">
          
            {/* Notification de devis pour le client */}
            {!loading && project && (project.status === 'devis_envoyé' || project.status === 'paiement_attente') && user && project.userId === user.id && (
              <div className="card border-0 shadow-sm mb-4 bg-white">
                <div className="card-body p-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
                  <div>
                    <h4 className="text-primary mb-1"><i className="bi bi-receipt me-2"></i>Devis reçu</h4>
                    <p className="mb-0 text-muted">Un devis de <strong>{project.price} €</strong> a été établi pour ce projet.</p>
                    {project.status === 'paiement_attente' && (
                        <small className="text-warning"><i className="bi bi-hourglass-split me-1"></i>Paiement initié mais non finalisé.</small>
                    )}
                  </div>
                  <button onClick={handlePayment} className="btn btn-success btn-lg fw-bold px-4 shadow-sm">
                    <i className="bi bi-credit-card-2-front me-2"></i> Payer {project.price} €
                  </button>
                </div>
              </div>
            )}

            <div className="card project-card flex-grow-1">
              <div className="card-body p-4 p-lg-5">
                <h2 className="project-title mb-4">{project.title}</h2>
                
                <div className="mb-5">
                  <h5 className="section-title"><i className="bi bi-file-text"></i> Description</h5>
                  <p className="card-text text-muted">{project.descriptionClient}</p>
                </div>

                <div className="mb-5">
                  <h5 className="section-title"><i className="bi bi-bullseye"></i> Usage</h5>
                  <p className="card-text text-muted">{project.use}</p>
                </div>

                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <div className="detail-label">Niveau de détail</div>
                      <div className="detail-value">{project.detailLevel}</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <div className="detail-label">Nombre d'éléments</div>
                      <div className="detail-value">{project.nbElements}</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <div className="detail-label">Dimensions</div>
                      <div className="detail-value">
                        {project.dimensionNoConstraint ? (
                          <span className="badge bg-light text-dark border">Aucune contrainte</span>
                        ) : (
                          <div className="dimension-grid">
                            <div className="dimension-box">
                              <div className="dimension-label">L</div>
                              <div className="dimension-val">{project.dimensionLength || '-'}</div>
                            </div>
                            <div className="dimension-box">
                              <div className="dimension-label">l</div>
                              <div className="dimension-val">{project.dimensionWidth || '-'}</div>
                            </div>
                            <div className="dimension-box">
                              <div className="dimension-label">H</div>
                              <div className="dimension-val">{project.dimensionHeight || '-'}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <div className="detail-label">Formats de fichiers</div>
                      <div className="detail-value">
                        {project.format ? (
                          project.format.split(',').map((fmt, index) => (
                            <span key={index} className="badge bg-secondary me-1">{fmt}</span>
                          ))
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <div className="detail-label">Budget indicatif</div>
                      <div className="detail-value">
                        {(() => {
                          const budgets = {
                            'less_100': 'Moins de 100€',
                            '100_300': '100€ - 300€',
                            '300_500': '300€ - 500€',
                            '500_1000': '500€ - 1000€',
                            'more_1000': 'Plus de 1000€',
                            'discuss': 'À discuter'
                          };
                          return budgets[project.budget] || project.budget || '-';
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <div className="detail-label">Délai souhaité</div>
                      <div className="detail-value">
                        {(() => {
                           if (!project.deadlineType || project.deadlineType === 'none') return 'Pas de contrainte';
                           const dateStr = project.deadlineDate ? new Date(project.deadlineDate).toLocaleDateString() : '';
                           if (project.deadlineType === 'urgent') return <span className="text-danger fw-bold"><i className="bi bi-exclamation-circle"></i> Urgent ({dateStr})</span>;
                           if (project.deadlineType === 'flexible') return `Flexible (${dateStr})`;
                           return project.deadlineType;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4 mb-4">
            <div className="card project-card mb-4">
              <div className="card-body p-4">
                <h5 className="section-title mb-4"><i className="bi bi-info-circle"></i> Statut du projet</h5>
                
                <div className="status-card-content">
                  <i className={`bi ${
                    project.status === 'terminé' ? 'bi-check-circle-fill status-terminé' : 
                    project.status === 'en cours' ? 'bi-gear-fill status-en-cours' : 
                    'bi-hourglass-split status-attente'
                  } status-icon-large`}></i>
                  
                  <div className={`status-label ${
                    project.status === 'terminé' ? 'status-terminé' : 
                    project.status === 'en cours' ? 'status-en-cours' : 
                    'status-attente'
                  }`}>
                    {project.status}
                  </div>
                  
                  <div className="status-date">
                    Mis à jour le {formatDate(project.updatedAt || project.created_at)}
                  </div>

                  <div className="mt-3 text-center border-top pt-3">
                    <small className="text-muted d-block fst-italic">
                        <i className="bi bi-info-circle me-1"></i>
                        {project.status === 'en attente' 
                            ? "Vous pouvez modifier ce projet tant qu'il est en attente."
                            : "Ce projet ne peut plus être modifié car il est en cours de traitement ou terminé."}
                    </small>
                  </div>
                </div>

                <hr className="my-4" />

                <div className="mb-3">
                  <div className="detail-label">Date de création</div>
                  <div className="detail-value fs-6">{formatDate(project.created_at)}</div>
                </div>
              </div>
            </div>

            {/* Zone pour les fichiers/images */}
            {project.images && project.images.length > 0 ? (
              <div className="card project-card mb-4">
                <div className="card-body p-4">
                  <h5 className="section-title mb-4"><i className="bi bi-paperclip"></i> Fichiers joints</h5>
                  <div className="row g-3">
                    {project.images.map((file, index) => {
                      const isImage = file.file_type === 'image' || file.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                      
                      return (
                        <div key={index} className={isImage ? "col-6" : "col-12"}>
                          {isImage ? (
                            <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="d-block position-relative group-hover">
                              <img 
                                src={file.fileUrl} 
                                alt={`Fichier ${index + 1}`} 
                                className="project-image-thumbnail"
                              />
                              <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-25 opacity-0 hover-opacity-100 transition-opacity rounded">
                                <i className="bi bi-zoom-in text-white fs-3"></i>
                              </div>
                            </a>
                          ) : (
                            <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="d-flex align-items-center p-3 border rounded text-decoration-none bg-light hover-bg-gray">
                              <i className="bi bi-file-earmark-text fs-3 text-primary me-3"></i>
                              <div className="text-truncate">
                                <div className="fw-bold text-dark text-truncate">Document {index + 1}</div>
                                <small className="text-muted">Cliquez pour télécharger</small>
                              </div>
                              <i className="bi bi-download ms-auto text-secondary"></i>
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card project-card bg-transparent border-0 shadow-none">
                 <div className="card-body p-0 text-white opacity-75">
                    <small><i className="bi bi-info-circle me-2"></i>D'autres fonctionnalités seront bientôt disponibles pour ce projet.</small>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Devis */}
      {showQuoteModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-dark">Établir un devis</h5>
                <button type="button" className="btn-close" onClick={() => setShowQuoteModal(false)}></button>
              </div>
              <div className="modal-body text-dark">
                <div className="mb-3">
                  <label htmlFor="quotePrice" className="form-label">Prix du devis (€)</label>
                  <input
                    type="number"
                    className="form-control"
                    id="quotePrice"
                    value={quotePrice}
                    onChange={(e) => setQuotePrice(e.target.value)}
                    placeholder="Ex: 150.00"
                    min="0"
                    step="0.01"
                  />
                  <small className="text-muted">En validant, le client recevra une notification et pourra payer ce montant.</small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowQuoteModal(false)}>Annuler</button>
                <button type="button" className="btn btn-primary" onClick={handleSendQuote}>Envoyer le devis</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation */}
      {showConfirmModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-dark">Confirmation</h5>
                <button type="button" className="btn-close" onClick={() => setShowConfirmModal(false)}></button>
              </div>
              <div className="modal-body text-dark">
                <p>
                  {pendingStatus === 'en cours' 
                    ? 'Êtes-vous sûr de vouloir traiter ce projet ?' 
                    : 'Êtes-vous sûr de vouloir marquer ce projet comme terminé ?'}
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowConfirmModal(false)}>Annuler</button>
                <button type="button" className="btn btn-primary" onClick={confirmStatusChange}>Confirmer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
