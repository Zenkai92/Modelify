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
      <div className="card shadow-sm">
        <div className="card-body">
          <h3 className="card-title mb-4">Gestion des utilisateurs</h3>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Nom</th>
                  <th>Entreprise</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Date d'inscription</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ cursor: 'pointer' }} onClick={() => handleShowProjects(u)}>
                    <td><small className="text-muted">{u.id.substring(0, 8)}...</small></td>
                    <td>{u.firstName} {u.lastName}</td>
                    <td>{u.companyName || '-'}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${
                        u.role === 'admin' ? 'bg-danger' : 
                        u.role === 'professionnel' ? 'bg-info text-dark' : 
                        'bg-secondary'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-4">Aucun utilisateur trouvé</td>
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
