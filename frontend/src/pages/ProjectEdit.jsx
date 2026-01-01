import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProjectForm from '../components/forms/ProjectForm';
import FloatingShapes from '../components/FloatingShapes';
import './ProjectRequest.css';

const ProjectEdit = () => {
  const { projectId } = useParams();
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
    <div className="project-request-page d-flex align-items-center justify-content-center" style={{minHeight: '100vh'}}>
      <div className="spinner-border text-light" role="status">
        <span className="visually-hidden">Chargement...</span>
      </div>
    </div>
  );

  if (error) return (
    <div className="project-request-page d-flex align-items-center justify-content-center" style={{minHeight: '100vh'}}>
        <div className="alert alert-danger">
            <h4>Erreur</h4>
            <p>{error}</p>
            <button className="btn btn-outline-danger" onClick={() => navigate('/status-commandes')}>Retour</button>
        </div>
    </div>
  );

  return (
    <div className="project-request-page">
      <div className="project-request-header">
        <FloatingShapes />
        <div className="container position-relative z-1 text-center text-white pt-5">
          <h1 className="fw-bold mb-3">Modifier le projet</h1>
          <p className="lead mb-2">Mettez à jour les informations de votre projet.</p>
          <small className="text-white-50 fst-italic">
            <i className="bi bi-info-circle me-1"></i> 
            Les modifications sont autorisées uniquement lorsque le projet est en attente.
          </small>
        </div>
        <div className="custom-shape-divider-bottom">
            <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="shape-fill"></path>
            </svg>
        </div>
      </div>
      
      <div className="container pb-5" style={{ marginTop: '-60px', position: 'relative', zIndex: 2 }}>
        <div className="row justify-content-center">
          <div className="col-lg-9">
            <div className="card shadow-lg border-0 rounded-3">
              <div className="card-body p-4 p-md-5">
                <ProjectForm initialData={project} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectEdit;
