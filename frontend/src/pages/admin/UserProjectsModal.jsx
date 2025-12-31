import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const UserProjectsModal = ({ show, onClose, user }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (show && user) {
      fetchProjects();
    } else {
        setProjects([]); // Reset projects when modal closes or user changes
    }
  }, [show, user]);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects?userId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des projets');
      }

      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = (projectId) => {
    onClose(); // Fermer la modale avant la navigation
    navigate(`/projects/${projectId}`);
  };

  if (!show) return null;

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Projets de {user?.firstName} {user?.lastName}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
              </div>
            ) : error ? (
              <div className="alert alert-danger">{error}</div>
            ) : projects.length === 0 ? (
              <div className="text-center py-4 text-muted">
                Aucun projet trouvé pour cet utilisateur.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Titre</th>
                      <th>Date</th>
                      <th>Statut</th>
                      <th>Budget</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project) => (
                      <tr 
                        key={project.id} 
                        onClick={() => handleProjectClick(project.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>{project.title}</td>
                        <td>{new Date(project.created_at).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${
                            project.status === 'terminé' ? 'bg-success' :
                            project.status === 'en cours' ? 'bg-primary' :
                            'bg-warning text-dark'
                          }`}>
                            {project.status}
                          </span>
                        </td>
                        <td>{project.budget || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Fermer</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProjectsModal;
