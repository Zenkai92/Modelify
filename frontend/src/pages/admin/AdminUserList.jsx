import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import UserProjectsModal from './UserProjectsModal';

const AdminUserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const { session } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (!session?.access_token) return;

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error("Accès refusé : Vous n'avez pas les droits d'administrateur.");
          }
          throw new Error('Erreur lors de la récupération des utilisateurs');
        }

        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [session]);

  const handleShowProjects = (user) => {
    setSelectedUser(user);
    setShowProjectsModal(true);
  };

  const handleCloseProjectsModal = () => {
    setShowProjectsModal(false);
    setSelectedUser(null);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  return (
    <>
      <div className="card shadow-sm border-0 rounded-3">
        <div className="card-header bg-white border-bottom py-3">
          <h5 className="mb-0 fw-bold dashboard-card-title">
            <i className="bi bi-people me-2"></i>
            Gestion des utilisateurs
          </h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="border-0 py-3 ps-4">ID</th>
                  <th className="border-0 py-3">Nom</th>
                  <th className="border-0 py-3">Entreprise</th>
                  <th className="border-0 py-3">Email</th>
                  <th className="border-0 py-3">Rôle</th>
                  <th className="border-0 py-3 pe-4">Date d'inscription</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ cursor: 'pointer' }} onClick={() => handleShowProjects(u)}>
                    <td className="ps-4"><small className="text-muted">{u.id.substring(0, 8)}...</small></td>
                    <td><span className="fw-bold text-dark">{u.firstName} {u.lastName}</span></td>
                    <td>{u.companyName || '-'}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge rounded-pill ${
                        u.role === 'admin' ? 'bg-danger' : 
                        u.role === 'professionnel' ? 'bg-info text-dark' : 
                        'bg-secondary'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="pe-4">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      <i className="bi bi-people display-4 d-block mb-3"></i>
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <UserProjectsModal 
        show={showProjectsModal} 
        onClose={handleCloseProjectsModal} 
        user={selectedUser} 
      />
    </>
  );
};

export default AdminUserList;
