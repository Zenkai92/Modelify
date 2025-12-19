import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const OrderStatusCard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      try {
        const response = await fetch(`http://localhost:8000/api/projects?userId=${user.id}`);
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des commandes');
        }
        const data = await response.json();
        setProjects(data.projects);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) return (
    <div className="card shadow-sm border-0 rounded-3">
      <div className="card-body p-5 text-center">
        <div className="spinner-border" style={{ color: '#764ba2' }} role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="card shadow-sm border-0 rounded-3">
      <div className="card-body p-4">
        <div className="alert alert-danger mb-0">{error}</div>
      </div>
    </div>
  );

  return (
    <div className="card shadow-sm border-0 rounded-3">
      <div className="card-header bg-white border-bottom py-3">
        <h5 className="mb-0 fw-bold" style={{ color: '#764ba2' }}>
          <i className="bi bi-activity me-2"></i>
          Status des commandes
        </h5>
      </div>
      <div className="card-body p-0">
        {projects.length === 0 ? (
          <div className="p-5 text-center text-muted">
            <i className="bi bi-inbox display-4 d-block mb-3"></i>
            <p className="mb-3">Aucune commande en cours.</p>
            <Link to="/demande-projet" className="btn text-white" style={{ backgroundColor: '#764ba2', borderColor: '#764ba2' }}>
              <i className="bi bi-plus-lg me-2"></i>
              Créer une nouvelle demande
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="border-0 py-3 ps-4">Titre du projet</th>
                  <th className="border-0 py-3">Date de création</th>
                  <th className="border-0 py-3 pe-4">Statut</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td className="ps-4">
                      <Link to={`/projects/${project.id}`} className="text-decoration-none fw-bold text-dark">
                        {project.title}
                      </Link>
                    </td>
                    <td>{formatDate(project.createdAt)}</td>
                    <td className="pe-4">
                      <span className={`badge rounded-pill ${
                        project.status === 'terminé' ? 'bg-success' : 
                        project.status === 'en cours' ? 'bg-primary' : 
                        'bg-warning text-dark'
                      }`}>
                        {project.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderStatusCard;
