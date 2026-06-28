import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './ProjectDetails.css';

const STATUS_LABELS = {
  'en attente':       'En attente',
  'devis_envoyé':     'Devis envoyé',
  'paiement_attente': 'Paiement en attente',
  'payé':             'Payé',
  'en cours':         'En cours',
  'terminé':          'Terminé',
};

const STATUS_CSS = {
  'en attente':       'pd-status-en-attente',
  'devis_envoyé':     'pd-status-devis-envoye',
  'paiement_attente': 'pd-status-devis-envoye',
  'payé':             'pd-status-paye',
  'en cours':         'pd-status-en-cours',
  'terminé':          'pd-status-termine',
};

const BUDGET_LABELS = {
  less_100:   'Moins de 100 €',
  '100_300':  '100 € – 300 €',
  '300_500':  '300 € – 500 €',
  '500_1000': '500 € – 1 000 €',
  more_1000:  'Plus de 1 000 €',
  discuss:    'À discuter',
};

const ProjectDetails = ({ projectId, onBack }) => {
  const { user, session } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quotePrice, setQuotePrice] = useState('');
  const [lightboxImg, setLightboxImg] = useState(null);

  const isAdmin = user?.user_metadata?.role === 'admin';
  const isOwner = user && project?.userId === user.id;

  useEffect(() => {
    const fetchProject = async () => {
      if (!session) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) throw new Error('Erreur lors de la récupération du projet');
        setProject(await res.json());
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
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/projects/${projectId}/status?status=${pendingStatus}`,
        { method: 'PUT', headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProject(data.project);
    } catch { /* silent */ } finally {
      setShowConfirmModal(false);
      setPendingStatus(null);
    }
  };

  const handleSendQuote = async () => {
    if (!quotePrice || isNaN(quotePrice)) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${projectId}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ price: parseFloat(quotePrice) }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProject(data.project);
      setShowQuoteModal(false);
      setQuotePrice('');
    } catch { /* silent */ }
  };

  const handlePayment = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${projectId}/pay`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch { /* silent */ }
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

  if (loading) return (
    <div className="pd-center">
      <div className="spinner-border" role="status" style={{ color: '#764ba2' }} />
      <span style={{ color: '#718096', fontSize: '0.88rem' }}>Chargement…</span>
    </div>
  );

  if (error) return (
    <div className="pd-center">
      <p style={{ color: '#4a5568' }}>{error}</p>
      <button className="pd-btn pd-btn-outline" onClick={onBack || (() => window.history.back())}>Retour</button>
    </div>
  );

  if (!project) return null;

  const images = (project.images || []).filter(f =>
    f.file_type === 'image' || f.fileUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
  );
  const docs = (project.images || []).filter(f =>
    !(f.file_type === 'image' || f.fileUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i))
  );

  return (
<<<<<<< HEAD
    <div className="project-details-wrapper w-100">
      <div className="w-100 p-0">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4 bg-white p-4 rounded-3 shadow-sm border">
          <div className="d-flex align-items-center gap-3">
            <div className="detail-header-icon">
              <i className="bi bi-folder2-open"></i>
            </div>
            <h3 className="fw-bold mb-0 text-dark">Détails du projet</h3>
          </div>
          <div className="d-flex align-items-center flex-wrap gap-2">
            {user?.user_metadata?.role === 'admin' && (
              <>
                {project.status === 'en attente' && (
                  <button
                    className="btn btn-gradient-primary fw-bold px-4 shadow-sm"
                    onClick={() => setShowQuoteModal(true)}
                  >
                    <i className="bi bi-file-earmark-text me-2"></i> Faire un devis
                  </button>
                )}
                 {project.status === 'devis_envoyé' && (
                  <span className="badge bg-info py-2 px-3 text-dark">
                    <i className="bi bi-envelope-paper me-2"></i> Devis envoyé : {project.price} €
                  </span>
                )}
                {/* Le projet doit être payé pour être traité */}
                {project.status === 'payé' && (
                  <button
                    className="btn btn-gradient-primary fw-bold px-4 shadow-sm"
                    onClick={() => handleStatusChange('en cours')}
                  >
                    <i className="bi bi-play-fill me-2"></i> Traiter le projet
                  </button>
                )}
                {project.status === 'en cours' && (
                  <button
                    className="btn btn-gradient-success fw-bold px-4 shadow-sm"
                    onClick={() => handleStatusChange('terminé')}
                  >
                    <i className="bi bi-check-lg me-2"></i> Terminer le projet
                  </button>
                )}
              </>
            )}
            {project.status === 'en attente' && user && project.userId === user.id && (
              <button
                onClick={() => window.location.href = `/app?view=project-edit&id=${projectId}`}
                className="btn btn-gradient-warning"
              >
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
          
            {/* Notification de devis pour le client */}
            {!loading && project && (project.status === 'devis_envoyé' || project.status === 'paiement_attente') && user && project.userId === user.id && (
              <div className="card border-0 shadow-sm mb-4 bg-white">
                <div className="card-body p-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="section-icon-badge section-icon-badge-lg">
                      <i className="bi bi-receipt"></i>
                    </div>
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
                    <div className="detail-box h-100">
                      <div className="detail-label">Formats de fichiers</div>
                      <div className="detail-value">
                        {project.format ? (
                          project.format.split(',').map((fmt, index) => (
                            <span key={index} className="badge format-badge-gradient me-1">{fmt}</span>
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
                            'less_100': 'Moins de 100€',
                            '100_300': '100€ - 300€',
                            '300_500': '300€ - 500€',
                            '500_1000': '500€ - 1000€',
                            'more_1000': 'Plus de 1000€',
                            'discuss': 'À discuter'
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
            <div className="card project-card mb-4">
              <div className="card-body p-4">
                <h5 className="section-title mb-4">
                  <span className="section-icon-badge"><i className="bi bi-info-circle"></i></span>
                  Statut du projet
                </h5>

                <div className="status-card-content">
                  <div className={`status-icon-circle ${
                    project.status === 'terminé' ? 'status-icon-terminé' :
                    project.status === 'en cours' ? 'status-icon-en-cours' :
                    'status-icon-attente'
                  }`}>
                    <i className={`bi ${
                      project.status === 'terminé' ? 'bi-check-lg' :
                      project.status === 'en cours' ? 'bi-gear-fill' :
                      'bi-hourglass-split'
                    }`}></i>
                  </div>

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
                  <h5 className="section-title mb-4">
                    <span className="section-icon-badge"><i className="bi bi-paperclip"></i></span>
                    Fichiers joints
                  </h5>
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
                 <div className="card-body p-0 text-muted">
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
              <div className="modal-header modal-header-gradient">
                <h5 className="modal-title"><i className="bi bi-file-earmark-text me-2"></i>Établir un devis</h5>
                <button type="button" className="btn-close" onClick={() => setShowQuoteModal(false)}></button>
=======
    <div className="pd-wrapper">

      {/* ── Header ── */}
      <div className="pd-header pd-card">
        <div className="pd-header-left">
          <button className="pd-back" onClick={onBack || (() => window.history.back())}>
            <i className="bi bi-arrow-left" /> Retour
          </button>
          <div>
            <h1 className="pd-title">{project.title}</h1>
            <span className={`pd-status-badge ${STATUS_CSS[project.status] || ''}`}>
              {STATUS_LABELS[project.status] || project.status}
            </span>
          </div>
        </div>

        <div className="pd-actions">
          {isAdmin && project.status === 'en attente' && (
            <button className="pd-btn" onClick={() => setShowQuoteModal(true)}>
              <i className="bi bi-file-earmark-text" /> Faire un devis
            </button>
          )}
          {isAdmin && project.status === 'payé' && (
            <button className="pd-btn" onClick={() => handleStatusChange('en cours')}>
              <i className="bi bi-play-fill" /> Traiter le projet
            </button>
          )}
          {isAdmin && project.status === 'en cours' && (
            <button className="pd-btn" onClick={() => handleStatusChange('terminé')}>
              <i className="bi bi-check-lg" /> Terminer le projet
            </button>
          )}
          {isOwner && project.status === 'en attente' && (
            <button className="pd-btn pd-btn-outline"
              onClick={() => window.location.href = `/app?view=project-edit&id=${projectId}`}>
              <i className="bi bi-pencil" /> Modifier
            </button>
          )}
        </div>
      </div>

      {/* ── Bandeau paiement ── */}
      {isOwner && (project.status === 'devis_envoyé' || project.status === 'paiement_attente') && (
        <div className="pd-notice">
          <div>
            <p className="pd-notice-title">Devis reçu — {project.price} €</p>
            <p className="pd-notice-sub">Procédez au paiement pour lancer votre projet.</p>
          </div>
          <button className="pd-btn" onClick={handlePayment}>
            <i className="bi bi-credit-card-2-front" /> Payer {project.price} €
          </button>
        </div>
      )}

      {/* ── Corps ── */}
      <div className="pd-body">

        {/* Colonne principale */}
        <div className="pd-main">

          <div className="pd-card">
            <p className="pd-section-title">Description</p>
            <p className="pd-block-text">{project.descriptionClient || '—'}</p>
          </div>

          <div className="pd-card">
            <p className="pd-section-title">Usage prévu</p>
            <p className="pd-block-text">{project.use || '—'}</p>
          </div>

          <div className="pd-card">
            <p className="pd-section-title">Spécifications</p>
            <div className="pd-specs">

              <div className="pd-spec">
                <span className="pd-spec-key">Niveau de détail</span>
                <span className="pd-spec-val">{project.detailLevel || '—'}</span>
>>>>>>> 5fb9fb1db3e970bc607487b9693ea4de955e88c8
              </div>

              <div className="pd-spec">
                <span className="pd-spec-key">Nombre d'éléments</span>
                <span className="pd-spec-val">{project.nbElements || '—'}</span>
              </div>

              <div className="pd-spec">
                <span className="pd-spec-key">Dimensions</span>
                <span className="pd-spec-val">
                  {project.dimensionNoConstraint
                    ? 'Aucune contrainte'
                    : [
                        project.dimensionLength && `L ${project.dimensionLength}`,
                        project.dimensionWidth  && `l ${project.dimensionWidth}`,
                        project.dimensionHeight && `H ${project.dimensionHeight}`,
                      ].filter(Boolean).join(' · ') || '—'
                  }
                </span>
              </div>

              <div className="pd-spec">
                <span className="pd-spec-key">Formats de fichiers</span>
                <span className="pd-spec-val">{project.format || 'Aucune contrainte'}</span>
              </div>

              <div className="pd-spec">
                <span className="pd-spec-key">Budget indicatif</span>
                <span className="pd-spec-val">{BUDGET_LABELS[project.budget] || '—'}</span>
              </div>

              <div className="pd-spec">
                <span className="pd-spec-key">Délai souhaité</span>
                <span className="pd-spec-val">
                  {!project.deadlineType || project.deadlineType === 'none'
                    ? 'Aucune contrainte'
                    : project.deadlineType === 'urgent'
                      ? <span className="badge-urgent"><i className="bi bi-exclamation-circle me-1" />Urgent · {project.deadlineDate ? new Date(project.deadlineDate).toLocaleDateString('fr-FR') : ''}</span>
                      : `Flexible · ${project.deadlineDate ? new Date(project.deadlineDate).toLocaleDateString('fr-FR') : ''}`
                  }
                </span>
              </div>

            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="pd-sidebar">

          <div className="pd-card">
            <p className="pd-section-title">Informations</p>
            <div className="pd-info-list">
              <div className="pd-info-row">
                <span>Statut</span>
                <span className={`pd-status-badge ${STATUS_CSS[project.status] || ''}`}>
                  {STATUS_LABELS[project.status] || project.status}
                </span>
              </div>
              <div className="pd-info-row">
                <span>Créé le</span>
                <span>{formatDate(project.created_at)}</span>
              </div>
              <div className="pd-info-row">
                <span>Mis à jour</span>
                <span>{formatDate(project.updatedAt || project.created_at)}</span>
              </div>
              {project.price && (
                <div className="pd-info-row">
                  <span>Devis</span>
                  <span className="pd-price">{project.price} €</span>
                </div>
<<<<<<< HEAD
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowQuoteModal(false)}>Annuler</button>
                <button type="button" className="btn btn-gradient-primary" onClick={handleSendQuote}>Envoyer le devis</button>
              </div>
=======
              )}
            </div>
            {isOwner && project.status === 'en attente' && (
              <p className="pd-hint">
                <i className="bi bi-info-circle me-1" />
                Vous pouvez modifier ce projet tant qu'il est en attente.
              </p>
            )}
          </div>

          {(images.length > 0 || docs.length > 0) && (
            <div className="pd-card">
              <p className="pd-section-title">Fichiers joints</p>

              {images.length > 0 && (
                <div className="pd-img-grid">
                  {images.map((f, i) => (
                    <button key={i} className="pd-img-btn" onClick={() => setLightboxImg(f.fileUrl)}>
                      <img src={f.fileUrl} alt={`Fichier ${i + 1}`} />
                    </button>
                  ))}
                </div>
              )}

              {docs.map((f, i) => (
                <a key={i} href={f.fileUrl} target="_blank" rel="noopener noreferrer" className="pd-doc">
                  <i className="bi bi-file-earmark" />
                  <span>Document {i + 1}</span>
                  <i className="bi bi-download" />
                </a>
              ))}
            </div>
          )}

        </aside>
      </div>

      {/* ── Lightbox ── */}
      {lightboxImg && (
        <div className="pd-lightbox" onClick={() => setLightboxImg(null)}>
          <img src={lightboxImg} alt="Aperçu" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* ── Modal devis ── */}
      {showQuoteModal && (
        <div className="pd-overlay" onClick={() => setShowQuoteModal(false)}>
          <div className="pd-modal" onClick={e => e.stopPropagation()}>
            <div className="pd-modal-head">
              <span>Établir un devis</span>
              <button onClick={() => setShowQuoteModal(false)}><i className="bi bi-x-lg" /></button>
            </div>
            <div className="pd-modal-body">
              <label className="pd-label" htmlFor="quotePrice">Montant (€)</label>
              <input
                id="quotePrice"
                type="number"
                className="pd-input"
                value={quotePrice}
                onChange={e => setQuotePrice(e.target.value)}
                placeholder="150.00"
                min="0"
                step="0.01"
              />
              <p className="pd-hint mt-2">Le client sera notifié et pourra régler ce montant en ligne.</p>
            </div>
            <div className="pd-modal-foot">
              <button className="pd-btn pd-btn-outline" onClick={() => setShowQuoteModal(false)}>Annuler</button>
              <button className="pd-btn" onClick={handleSendQuote}>Envoyer le devis</button>
>>>>>>> 5fb9fb1db3e970bc607487b9693ea4de955e88c8
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmation ── */}
      {showConfirmModal && (
<<<<<<< HEAD
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
=======
        <div className="pd-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="pd-modal" onClick={e => e.stopPropagation()}>
            <div className="pd-modal-head">
              <span>Confirmation</span>
              <button onClick={() => setShowConfirmModal(false)}><i className="bi bi-x-lg" /></button>
            </div>
            <div className="pd-modal-body">
              <p>
                {pendingStatus === 'en cours'
                  ? 'Confirmer la prise en charge de ce projet ?'
                  : 'Marquer ce projet comme terminé ?'}
              </p>
            </div>
            <div className="pd-modal-foot">
              <button className="pd-btn pd-btn-outline" onClick={() => setShowConfirmModal(false)}>Annuler</button>
              <button className="pd-btn" onClick={confirmStatusChange}>Confirmer</button>
>>>>>>> 5fb9fb1db3e970bc607487b9693ea4de955e88c8
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
