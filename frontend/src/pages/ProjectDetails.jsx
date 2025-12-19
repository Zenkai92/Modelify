import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FloatingShapes from '../components/FloatingShapes';
import './ProjectDetails.css';

const ProjectDetails = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/projects/${projectId}`);
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
  }, [projectId]);

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
          <Link to="/status-commandes" className="btn back-btn">
            <i className="bi bi-arrow-left me-2"></i> Retour
          </Link>
        </div>

        <div className="row">
          <div className="col-lg-8 mb-4">
            <div className="card project-card h-100">
              <div className="card-body p-4 p-lg-5">
                <h2 className="project-title mb-4">{project.title}</h2>
                
                <div className="mb-5">
                  <h5 className="section-title"><i className="bi bi-file-text"></i> Description</h5>
                  <p className="card-text text-muted">{project.descriptionClient}</p>
                </div>

                <div className="mb-5">
                  <h5 className="section-title"><i className="bi bi-bullseye"></i> Objectif</h5>
                  <p className="card-text text-muted">{project.goal}</p>
                </div>

                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <div className="detail-label">Type de projet</div>
                      <div className="detail-value">{project.typeProject}</div>
                    </div>
                  </div>
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
                    Mis à jour le {formatDate(project.updated_at || project.createdAt)}
                  </div>
                </div>

                <hr className="my-4" />

                <div className="mb-3">
                  <div className="detail-label">Date de création</div>
                  <div className="detail-value fs-6">{formatDate(project.createdAt)}</div>
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
    </div>
  );
};

export default ProjectDetails;
