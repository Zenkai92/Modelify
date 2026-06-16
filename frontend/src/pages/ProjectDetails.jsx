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
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmation ── */}
      {showConfirmModal && (
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
