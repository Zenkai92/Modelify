import React from 'react';
import ProjectForm from '../components/forms/ProjectForm';

const ProjectRequest = () => {
  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-lg-8 mx-auto">
          <h1 className="text-center mb-5">Demande de projet de modélisation 3D</h1>
          <ProjectForm />
        </div>
      </div>
    </div>
  );
};

export default ProjectRequest;