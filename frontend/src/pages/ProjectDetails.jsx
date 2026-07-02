import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './ProjectDetails.css';

const ProjectDetails = ({ projectId, onBack, paymentSuccess, stripeSessionId }) => {
  const { user, session } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quotePrice, setQuotePrice] = useState('');
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  // Livrable upload state
  const [deliverableFiles, setDeliverableFiles] = useState([]);
  const [uploadingDeliverables, setUploadingDeliverables] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const fileInputRef = useRef(null);

  const fetchProject = async () => {
    if (!session) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${projectId}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (!response.ok) throw new Error('Erreur lors de la récupération du projet');
      const data = await response.json();
      setProject(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId, session]);

  // Vérification du paiement Stripe après redirection
  useEffect(() => {
    if (!paymentSuccess || !stripeSessionId || !session || !project) return;
    if (project.status === 'payé' || paymentVerified) return;

    const verifyPayment = async () => {
      setVerifyingPayment(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/projects/${projectId}/verify-payment?session_id=${stripeSessionId}`,
          { headers: { 'Authorization': `Bearer ${session.access_token}` } }
        );
        if (response.ok) {
          const data = await response.json();
          setProject(data.project);
          setPaymentVerified(true);
        }
      } catch (err) {
        console.error('Erreur vérification paiement:', err);
      } finally {
        setVerifyingPayment(false);
      }
    };

    verifyPayment();
  }, [paymentSuccess, stripeSessionId, session, project]);

  const handleStatusChange = (newStatus) => {
    setPendingStatus(newStatus);
    setShowConfirmModal(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus) return;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/projects/${projectId}/status?status=${pendingStatus}`,
        { method: 'PUT', headers: { 'Authorization': `Bearer ${session.access_token}` } }
      );
      if (!response.ok) throw new Error('Erreur lors de la mise à jour du statut');
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
    if (!quotePrice || isNaN(quotePrice)) { alert('Veuillez entrer un prix valide'); return; }
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${projectId}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ price: parseFloat(quotePrice) })
      });
      if (!response.ok) throw new Error("Erreur lors de l'envoi du devis");
      const data = await response.json();
      setProject(data.project);
      setShowQuoteModal(false);
      setQuotePrice('');
      alert('Devis envoyé avec succès !');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handlePayment = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${projectId}/pay`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (!response.ok) throw new Error("Erreur lors de l'initialisation du paiement");
      const data = await response.json();
      if (data.url) window.location.href = data.url;
      else throw new Error('Aucune URL de paiement reçue');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleDeliverableFilesChange = (e) => {
    setDeliverableFiles(Array.from(e.target.files));
    setUploadMessage(null);
  };

  const handleUploadDeliverables = async () => {
    if (deliverableFiles.length === 0) return;
    setUploadingDeliverables(true);
    setUploadMessage(null);
    try {
      const formData = new FormData();
      deliverableFiles.forEach(f => formData.append('files', f));
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${projectId}/files`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        body: formData,
      });
      if (!response.ok) throw new Error("Erreur lors de l'upload des livrables");
      const data = await response.json();
      if (data.rejected && data.rejected.length > 0) {
        const details = data.rejected.map(r => `${r.filename} (${r.reason})`).join(', ');
        setUploadMessage({
          type: data.uploaded.length > 0 ? 'partial' : 'error',
          text: `${data.message} — Rejetés : ${details}`,
        });
      } else {
        setUploadMessage({ type: 'success', text: data.message });
      }
      setDeliverableFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchProject();
    } catch (err) {
      setUploadMessage({ type: 'error', text: err.message });
    } finally {
      setUploadingDeliverables(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) return (
    <div className="card shadow-sm border-0 rounded-3 p-5 text-center my-4">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Chargement...</span>
      </div>
      <p className="mt-3 text-muted">Chargement du projet...</p>
    </div>
  );

  if (error) return (
    <div className="card shadow-sm border-0 rounded-3 p-5 my-4">
      <div className="alert alert-danger shadow-sm border-0 mb-0" role="alert">
        <h4 className="alert-heading">Erreur</h4>
        <p>{error}</p>
        <hr />
        <button onClick={() => window.history.back()} className="btn btn-outline-danger">Retour au tableau de bord</button>
      </div>
    </div>
  );

  if (!project) return null;

  const isAdmin = user?.user_metadata?.role === 'admin';
  const isOwner = project.userId === user?.id;

  // Séparer fichiers de référence (client) et livrables (admin)
  const referenceFiles = (project.images || []).filter(f => f.file_type === 'image' || f.file_type === 'document');
  const livrables = (project.images || []).filter(f => f.file_type === 'livrable_image' || f.file_type === 'livrable_doc');

  return (
    <div className="project-details-wrapper w-100">
      <div className="w-100 p-0">
        {/* En-tête */}
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4 bg-white p-4 rounded-3 shadow-sm border">
          <div className="d-flex align-items-center gap-3">
            <div className="detail-header-icon"><i className="bi bi-folder2-open"></i></div>
            <h3 className="fw-bold mb-0 text-dark">Détails du projet</h3>
          </div>
          <div className="d-flex align-items-center flex-wrap gap-2">
            {isAdmin && (
              <>
                {project.status === 'en attente' && (
                  <button className="btn btn-gradient-primary fw-bold px-4 shadow-sm" onClick={() => setShowQuoteModal(true)}>
                    <i className="bi bi-file-earmark-text me-2"></i> Faire un devis
                  </button>
                )}
                {project.status === 'devis_envoyé' && (
                  <span className="badge bg-info py-2 px-3 text-dark">
                    <i className="bi bi-envelope-paper me-2"></i> Devis envoyé : {project.price} €
                  </span>
                )}
                {project.status === 'payé' && (
                  <button className="btn btn-gradient-primary fw-bold px-4 shadow-sm" onClick={() => handleStatusChange('en cours')}>
                    <i className="bi bi-play-fill me-2"></i> Traiter le projet
                  </button>
                )}
                {project.status === 'en cours' && (
                  <button className="btn btn-gradient-success fw-bold px-4 shadow-sm" onClick={() => handleStatusChange('terminé')}>
                    <i className="bi bi-check-lg me-2"></i> Terminer le projet
                  </button>
                )}
              </>
            )}
            {project.status === 'en attente' && isOwner && (
              <button onClick={() => window.location.href = `/app?view=project-edit&id=${projectId}`} className="btn btn-gradient-warning">
                <i className="bi bi-pencil me-2"></i> Modifier
              </button>
            )}
            <button onClick={onBack || (() => window.history.back())} className="btn btn-secondary text-white">
              <i className="bi bi-arrow-left me-2"></i> Retour
            </button>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-8 mb-4 d-flex flex-column">

            {/* Bannière paiement réussi */}
            {(paymentSuccess && (project.status === 'payé' || paymentVerified)) && (
              <div className="alert alert-success d-flex align-items-center gap-3 mb-4 shadow-sm border-0 rounded-3">
                <i className="bi bi-check-circle-fill fs-3"></i>
                <div>
                  <strong>Paiement confirmé !</strong> Votre projet est maintenant en cours de traitement. Vous serez notifié dès la fin de la modélisation.
                </div>
              </div>
            )}

            {/* Vérification paiement en cours */}
            {paymentSuccess && verifyingPayment && (
              <div className="alert alert-info d-flex align-items-center gap-2 mb-4">
                <span className="spinner-border spinner-border-sm"></span>
                Vérification du paiement en cours…
              </div>
            )}

            {/* Notification devis / paiement pour le client */}
            {!loading && project && (project.status === 'devis_envoyé' || project.status === 'paiement_attente') && isOwner && (
              <div className="card border-0 shadow-sm mb-4 bg-white">
                <div className="card-body p-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="section-icon-badge section-icon-badge-lg"><i className="bi bi-receipt"></i></div>
                    <div>
                      <h4 className="mb-1 fw-bold text-dark">Devis reçu</h4>
                      <p className="mb-0 text-muted">Un devis de <strong>{project.price} €</strong> a été établi pour ce projet.</p>
                      {project.status === 'paiement_attente' && (
                        <small className="text-warning"><i className="bi bi-hourglass-split me-1"></i>Paiement initié mais non finalisé.</small>
                      )}
                    </div>
                  </div>
                  <button onClick={handlePayment} className="btn btn-gradient-success btn-lg fw-bold px-4 shadow-sm">
                    <i className="bi bi-credit-card-2-front me-2"></i> Payer {project.price} €
                  </button>
                </div>
              </div>
            )}

            {/* Détails projet */}
            <div className="card project-card flex-grow-1">
              <div className="card-body p-4 p-lg-5">
                <h2 className="project-title mb-4">{project.title}</h2>

                <div className="mb-5">
                  <h5 className="section-title">
                    <span className="section-icon-badge"><i className="bi bi-file-text"></i></span>
                    Description
                  </h5>
                  <p className="card-text text-muted">{project.descriptionClient}</p>
                </div>

                <div className="mb-5">
                  <h5 className="section-title">
                    <span className="section-icon-badge"><i className="bi bi-bullseye"></i></span>
                    Usage
                  </h5>
                  <p className="card-text text-muted">{project.use}</p>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="detail-box h-100">
                      <div className="detail-label">Niveau de détail</div>
                      <div className="detail-value">{project.detailLevel}</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="detail-box h-100">
                      <div className="detail-label">Nombre d'éléments</div>
                      <div className="detail-value">{project.nbElements}</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="detail-box h-100">
                      <div className="detail-label">Dimensions</div>
                      <div className="detail-value">
                        {project.dimensionNoConstraint ? (
                          <span className="badge bg-light text-dark border">Aucune contrainte</span>
                        ) : (
                          <div className="dimension-grid">
                            <div className="dimension-box"><div className="dimension-label">L</div><div className="dimension-val">{project.dimensionLength || '-'}</div></div>
                            <div className="dimension-box"><div className="dimension-label">l</div><div className="dimension-val">{project.dimensionWidth || '-'}</div></div>
                            <div className="dimension-box"><div className="dimension-label">H</div><div className="dimension-val">{project.dimensionHeight || '-'}</div></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="detail-box h-100">
                      <div className="detail-label">Formats de fichiers</div>
                      <div className="detail-value">
                        {project.format ? (
                          project.format.split(',').map((fmt, i) => (
                            <span key={i} className="badge format-badge-gradient me-1">{fmt}</span>
                          ))
                        ) : (
                          <span className="badge bg-light text-dark border">Aucune contrainte</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="detail-box h-100">
                      <div className="detail-label">Budget indicatif</div>
                      <div className="detail-value">
                        {(() => {
                          const budgets = {
                            'less_100': 'Moins de 100€', '100_300': '100€ - 300€',
                            '300_500': '300€ - 500€', '500_1000': '500€ - 1000€',
                            'more_1000': 'Plus de 1000€', 'discuss': 'À discuter'
                          };
                          return budgets[project.budget] || project.budget || <span className="badge bg-light text-dark border">Aucune contrainte</span>;
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="detail-box h-100">
                      <div className="detail-label">Délai souhaité</div>
                      <div className="detail-value">
                        {(() => {
                          if (!project.deadlineType || project.deadlineType === 'none') return <span className="badge bg-light text-dark border">Aucune contrainte</span>;
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
            {/* Statut */}
            <div className="card project-card mb-4">
              <div className="card-body p-4">
                <h5 className="section-title mb-4">
                  <span className="section-icon-badge"><i className="bi bi-info-circle"></i></span>
                  Statut du projet
                </h5>
                <div className="status-card-content">
                  <div className={`status-icon-circle ${project.status === 'terminé' ? 'status-icon-terminé' : project.status === 'en cours' ? 'status-icon-en-cours' : 'status-icon-attente'}`}>
                    <i className={`bi ${project.status === 'terminé' ? 'bi-check-lg' : project.status === 'en cours' ? 'bi-gear-fill' : 'bi-hourglass-split'}`}></i>
                  </div>
                  <div className={`status-label ${project.status === 'terminé' ? 'status-terminé' : project.status === 'en cours' ? 'status-en-cours' : 'status-attente'}`}>
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

            {/* Zone upload livrables — visible par l'admin quand projet en cours ou terminé */}
            {isAdmin && (project.status === 'en cours' || project.status === 'terminé') && (
              <div className="card project-card mb-4">
                <div className="card-body p-4">
                  <h5 className="section-title mb-3">
                    <span className="section-icon-badge"><i className="bi bi-cloud-upload"></i></span>
                    Déposer les livrables
                  </h5>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="form-control form-control-sm mb-2"
                    onChange={handleDeliverableFilesChange}
                    accept=".jpg,.jpeg,.png,.webp,.pdf,.zip,.obj,.fbx,.stl,.glb,.gltf,.blend,.3ds,.dae,.mtl"
                  />
                  {deliverableFiles.length > 0 && (
                    <div className="mb-2">
                      <small className="text-muted">{deliverableFiles.length} fichier(s) sélectionné(s)</small>
                      <ul className="list-unstyled mb-0 mt-1">
                        {deliverableFiles.map((f, i) => (
                          <li key={i}><small><i className="bi bi-file-earmark me-1"></i>{f.name}</small></li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <button
                    className="btn btn-gradient-primary btn-sm w-100"
                    onClick={handleUploadDeliverables}
                    disabled={deliverableFiles.length === 0 || uploadingDeliverables}
                  >
                    {uploadingDeliverables ? (
                      <><span className="spinner-border spinner-border-sm me-2"></span>Upload en cours…</>
                    ) : (
                      <><i className="bi bi-upload me-2"></i>Envoyer les fichiers</>
                    )}
                  </button>
                  {uploadMessage && (
                    <div className={`alert alert-${uploadMessage.type === 'success' ? 'success' : uploadMessage.type === 'partial' ? 'warning' : 'danger'} py-2 mt-2 mb-0 small`}>
                      {uploadMessage.text}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Livrables (fichiers de sortie admin) */}
            {livrables.length > 0 && (
              <div className="card project-card mb-4">
                <div className="card-body p-4">
                  <h5 className="section-title mb-4">
                    <span className="section-icon-badge"><i className="bi bi-box-seam"></i></span>
                    Livrables
                    <span className="badge bg-success ms-2 fs-6">{livrables.length}</span>
                  </h5>
                  <div className="row g-2">
                    {livrables.map((file, index) => {
                      const isImage = file.file_type === 'livrable_image' || file.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                      return (
                        <div key={index} className={isImage ? 'col-6' : 'col-12'}>
                          {isImage ? (
                            <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="d-block">
                              <img src={file.fileUrl} alt={`Livrable ${index + 1}`} className="project-image-thumbnail" />
                            </a>
                          ) : (
                            <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="d-flex align-items-center p-3 border rounded text-decoration-none bg-light">
                              <i className="bi bi-file-earmark-arrow-down fs-3 text-success me-3"></i>
                              <div className="text-truncate">
                                <div className="fw-bold text-dark text-truncate">Livrable {index + 1}</div>
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
            )}

            {/* Fichiers de référence (uploads client) */}
            {referenceFiles.length > 0 && (
              <div className="card project-card mb-4">
                <div className="card-body p-4">
                  <h5 className="section-title mb-4">
                    <span className="section-icon-badge"><i className="bi bi-paperclip"></i></span>
                    Fichiers de référence
                  </h5>
                  <div className="row g-3">
                    {referenceFiles.map((file, index) => {
                      const isImage = file.file_type === 'image' || file.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                      return (
                        <div key={index} className={isImage ? 'col-6' : 'col-12'}>
                          {isImage ? (
                            <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="d-block">
                              <img src={file.fileUrl} alt={`Fichier ${index + 1}`} className="project-image-thumbnail" />
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
            )}

            {referenceFiles.length === 0 && livrables.length === 0 && (
              <div className="card project-card bg-transparent border-0 shadow-none">
                <div className="card-body p-0 text-muted">
                  <small><i className="bi bi-info-circle me-2"></i>Aucun fichier joint pour le moment.</small>
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
              <div className="modal-header modal-header-gradient">
                <h5 className="modal-title"><i className="bi bi-file-earmark-text me-2"></i>Établir un devis</h5>
                <button type="button" className="btn-close" onClick={() => setShowQuoteModal(false)}></button>
              </div>
              <div className="modal-body text-dark">
                <div className="mb-3">
                  <label htmlFor="quotePrice" className="form-label">Prix du devis (€)</label>
                  <input type="number" className="form-control" id="quotePrice" value={quotePrice}
                    onChange={(e) => setQuotePrice(e.target.value)} placeholder="Ex: 150.00" min="0" step="0.01" />
                  <small className="text-muted">En validant, le client pourra payer ce montant directement.</small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowQuoteModal(false)}>Annuler</button>
                <button type="button" className="btn btn-gradient-primary" onClick={handleSendQuote}>Envoyer le devis</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation changement de statut */}
      {showConfirmModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header modal-header-gradient">
                <h5 className="modal-title"><i className="bi bi-question-circle me-2"></i>Confirmation</h5>
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
                <button type="button" className="btn btn-gradient-primary" onClick={confirmStatusChange}>Confirmer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
