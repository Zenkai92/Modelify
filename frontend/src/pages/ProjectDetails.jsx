import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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
    <div className="container mt-5">
      <div className="text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="container mt-5">
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
      <Link to="/dashboard" className="btn btn-primary">Retour au tableau de bord</Link>
    </div>
  );

  if (!project) return null;

  return (
    <div className="container mt-5 mb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Détails du projet</h1>
        <Link to="/dashboard" className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left"></i> Retour
        </Link>
      </div>

      <div className="row">
        <div className="col-md-8">
          <div className="card mb-4">
            <div className="card-header">
              <h3 className="card-title h5 mb-0">{project.title}</h3>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <h5 className="text-muted mb-2">Description</h5>
                <p className="card-text">{project.descriptionClient}</p>
              </div>

              <div className="mb-4">
                <h5 className="text-muted mb-2">Objectif</h5>
                <p className="card-text">{project.goal}</p>
              </div>

              <div className="row mb-4">
                <div className="col-md-6">
                  <h5 className="text-muted mb-2">Type de projet</h5>
                  <p>{project.typeProject}</p>
                </div>
                <div className="col-md-6">
                  <h5 className="text-muted mb-2">Niveau de détail</h5>
                  <p>{project.detailLevel}</p>
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-md-6">
                  <h5 className="text-muted mb-2">Nombre d'éléments</h5>
                  <p>{project.nbElements}</p>
                </div>
                <div className="col-md-6">
                  <h5 className="text-muted mb-2">Dimensions</h5>
                  {project.dimensionNoConstraint ? (
                    <p>Aucune contrainte de dimension</p>
                  ) : (
                    <ul className="list-unstyled">
                      <li>Longueur: {project.dimensionLength || '-'} cm</li>
                      <li>Largeur: {project.dimensionWidth || '-'} cm</li>
                      <li>Hauteur: {project.dimensionHeight || '-'} cm</li>
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card mb-4">
            <div className="card-header">
              <h3 className="card-title h5 mb-0">Statut</h3>
            </div>
            <div className="card-body">
              <div className={`alert ${
                project.status === 'terminé' ? 'alert-success' : 
                project.status === 'en cours' ? 'alert-primary' : 
                'alert-warning'
              } mb-0`}>
                <h4 className="alert-heading h5 text-capitalize">{project.status}</h4>
                <p className="mb-0">Créé le {formatDate(project.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Zone pour les fichiers/images si nécessaire plus tard */}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
