import React from 'react';
import ProjectForm from '../components/forms/ProjectForm';
import FloatingShapes from '../components/FloatingShapes';
import './ProjectRequest.css';

const ProjectRequest = () => {
  return (
    <div className="project-request-page">
      <div className="project-request-header">
        <FloatingShapes />
        <div className="container position-relative z-1 text-center text-white pt-5">
          <h1 className="fw-bold mb-3">Lancer un nouveau projet</h1>
          <p className="lead">Décrivez votre besoin, nous nous occupons de la modélisation.</p>
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
                <ProjectForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectRequest;