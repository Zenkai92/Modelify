import React, { useState, useEffect } from 'react';
import ProjectForm from '../components/forms/ProjectForm';
import FloatingShapes from '../components/FloatingShapes';
import { useAuth } from '../contexts/AuthContext';
import './ProjectRequest.css';

const ProjectRequest = () => {
  const { session } = useAuth();
  const [projectCount, setProjectCount] = useState(null);

  useEffect(() => {
    if (session) {
        fetchProjectCount();
    }
  }, [session]);

  const fetchProjectCount = async () => {
      try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/count`, {
              headers: {
                  'Authorization': `Bearer ${session.access_token}`
              }
          });
          if (response.ok) {
              const data = await response.json();
              setProjectCount(data);
          }
      } catch (error) {
          console.error("Failed to fetch project count", error);
      }
  };

  return (
    <div className="card shadow-sm border-0 rounded-3 h-100">
      <div className="card-header bg-white p-4 border-bottom text-center">
        <h3 className="fw-bold mb-1">Lancer un projet personnalisé</h3>
        <p className="text-muted mb-2">Commandez votre projet personnalisé en quelques clics.</p>
        <p className="small mb-0">
          <i className="bi bi-info-circle me-1 text-primary"></i>
          Service sur devis. Une fois votre demande évaluée, une estimation tarifaire vous sera envoyée pour validation.
        </p>
        
        {projectCount && (
          <div className={`mt-3 badge ${projectCount.active_projects >= projectCount.limit ? 'bg-danger' : 'bg-info'} py-2 px-3`}>
            {projectCount.active_projects >= projectCount.limit ? (
              <i className="bi bi-exclamation-circle me-1"></i>
            ) : (
              <i className="bi bi-info-circle me-1"></i>
            )}
            Projets en cours : {projectCount.active_projects} / {projectCount.limit}
          </div>
        )}
      </div>
      
      <div className="card-body p-4 p-md-5 bg-light rounded-bottom">
        <ProjectForm />
      </div>
    </div>
  );
};

export default ProjectRequest;