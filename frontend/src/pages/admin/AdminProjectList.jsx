import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import { budgetLabel, statusBadgeClass, statusLabel } from '../../constants/projectStatus';

const AdminProjectList = ({ statusFilter, title }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // L'API pagine (100 max par page) : on récupère toutes les pages
        // pour ne perdre aucun projet lors du filtrage par statut côté client
        let allProjects = [];
        let page = 1;
        let totalPages = 1;
        do {
          const response = await apiFetch(`/api/projects?page=${page}&limit=100`, {
            token: session.access_token,
          });

          if (!response.ok) {
            throw new Error('Erreur lors de la récupération des projets');
          }

          const data = await response.json();
          allProjects = allProjects.concat(data.projects || []);
          totalPages = data.total_pages || 1;
          page += 1;
        } while (page <= totalPages);

        let filteredProjects = allProjects;
        
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
    navigate(`/app?view=project-details&id=${projectId}`);
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="card shadow-sm border-0 rounded-3">
      <div className="card-header bg-white border-bottom py-3">
        <h5 className="mb-0 fw-bold dashboard-card-title">
          <i className="bi bi-collection me-2"></i>
          {title || 'Liste des projets'}
        </h5>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="border-0 py-3 ps-4">Titre</th>
                <th className="border-0 py-3">Nom</th>
                <th className="border-0 py-3">Rôle</th>
                <th className="border-0 py-3">Date</th>
                <th className="border-0 py-3">Statut</th>
                <th className="border-0 py-3 pe-4">Budget</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr 
                  key={project.id} 
                  onClick={() => handleProjectClick(project.id)} 
                  style={{ cursor: 'pointer' }}
                >
                  <td className="ps-4">
                    <span className="fw-bold text-dark">{project.title}</span>
                  </td>

                  <td>
                    {`${project.Users?.firstName || ''} ${project.Users?.lastName || ''}`.trim() || '-'}
                  </td>

                  <td><span className={`badge ${
                        project.Users?.role === 'admin' ? 'bg-danger' : 'bg-secondary'
                      }`}>
                        {project.Users?.role || '-'}
                      </span>
                  </td>



                  <td>{new Date(project.created_at).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge rounded-pill ${statusBadgeClass(project.status)}`}>
                      {statusLabel(project.status)}
                    </span>
                  </td>
                  <td className="pe-4">{budgetLabel(project.budget) || '-'}</td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    <i className="bi bi-folder2-open display-4 d-block mb-3"></i>
                    Aucun projet trouvé
                  </td>
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
