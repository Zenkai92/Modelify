import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProjectForm from '../components/forms/ProjectForm';
import FloatingShapes from '../components/FloatingShapes';
import './ProjectRequest.css';

const ProjectEdit = ({ projectId: propProjectId }) => {
  const { projectId: paramProjectId } = useParams();
  const projectId = propProjectId || paramProjectId;
  
  const { session, user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        
        if (user && data.userId !== user.id) {
          throw new Error("Vous n'êtes pas autorisé à modifier ce projet.");
        }

        if (data.status !== 'en attente') {
            throw new Error("Ce projet ne peut plus être modifié.");
        }
        
        setProject(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId, session]);

  if (loading) return (
    <div className="card shadow-sm border-0 rounded-3 p-5 text-center">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Chargement...</span>
      </div>
    </div>
  );

  if (error) return (
    <div className="card shadow-sm border-0 rounded-3 p-5">
        <div className="alert alert-danger mb-0">
            <h4>Erreur</h4>
            <p>{error}</p>
            <button className="btn btn-outline-danger" onClick={() => navigate('/app?view=status-commandes')}>Retour</button>
        </div>
    </div>
  );

  return (
    <div className="card shadow-sm border-0 rounded-3 h-100">
      <div className="card-header bg-white p-4 border-bottom text-center">
        <h3 className="fw-bold mb-1">Modifier le projet</h3>
        <p className="text-muted mb-0">Mettez à jour les informations de votre projet.</p>
        <span className="badge bg-warning text-dark mt-2">
          <i className="bi bi-info-circle me-1"></i>
          Les modifications sont autorisées uniquement en attente
        </span>
      </div>
      
      <div className="card-body p-4 p-md-5 bg-light rounded-bottom">
        <ProjectForm initialData={project} />
      </div>
    </div>
  );
};

export default ProjectEdit;
