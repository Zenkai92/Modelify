import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminProjectList = ({ statusFilter, title }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des projets');
        }

        const data = await response.json();
        let filteredProjects = data.projects || [];
        
        if (statusFilter) {
          if (Array.isArray(statusFilter)) {
             filteredProjects = filteredProjects.filter(p => statusFilter.includes(p.status));
          } else {
             filteredProjects = filteredProjects.filter(p => p.status === statusFilter);
          }
        }
        
        // Tri personnalisé : 'payé' en priorité pour que l'admin voie ce qu'il doit traiter
        filteredProjects.sort((a, b) => {
            const priority = { 'payé': 1, 'en attente': 2, 'devis_envoyé': 3, 'paiement_attente': 4 };
            const pA = priority[a.status] || 10;
            const pB = priority[b.status] || 10;
            return pA - pB; 
        });

        setProjects(filteredProjects);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [session, statusFilter]);

  const handleProjectClick = (projectId) => {
    navigate(`/projects/${projectId}`);
  };

  const formatBudget = (budget) => {
    switch (budget) {
      case 'less_100': return 'Moins de 100€';
      case '100_300': return '100€ - 300€';
      case '300_500': return '300€ - 500€';
      case '500_1000': return '500€ - 1000€';
      case 'more_1000': return 'Plus de 1000€';
      case 'discuss': return 'À discuter';
      default: return budget || '-';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'en attente': return 'bg-warning text-dark';
      case 'devis_envoyé': return 'bg-info text-dark';
      case 'paiement_attente': return 'bg-info text-dark';
      case 'payé': return 'bg-success';
      case 'en cours': return 'bg-primary';
      case 'terminé': return 'bg-success';
      default: return 'bg-secondary';
    }
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <h3 className="card-title mb-4">{title || 'Liste des projets'}</h3>
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Titre</th>
                <th>Client ID</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Budget</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} onClick={() => handleProjectClick(project.id)} style={{ cursor: 'pointer' }}>
                  <td>{project.title}</td>
                  <td><small className="text-muted">{project.userId.substring(0, 8)}...</small></td>
                  <td>{new Date(project.created_at).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge rounded-pill ${getStatusBadgeClass(project.status)}`}>
                      {project.status}
                    </span>
                  </td>
                  <td>{formatBudget(project.budget)}</td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-4">Aucun projet trouvé</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminProjectList;
