import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import PersonalInfoCard from '../components/dashboard/PersonalInfoCard';
import OrderStatusCard from '../components/dashboard/OrderStatusCard';
import AdminUserList from './admin/AdminUserList';
import AdminProjectList from './admin/AdminProjectList';

import ProjectRequest from './ProjectRequest';
import ProjectDetails from './ProjectDetails';
import ProjectEdit from './ProjectEdit';
import FloatingShapes from '../components/FloatingShapes';

const AppPortal = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') || 'profile';
  const projectId = searchParams.get('id');
  const { user, signOut } = useAuth();
  
  const isAdmin = user?.user_metadata?.role === 'admin';

  const setView = (newView) => {
    setSearchParams({ view: newView });
  };

  const renderContent = () => {
    if (view === 'project-details' && projectId) return <ProjectDetails projectId={projectId} onBack={() => setView('status-commandes')} />;
    if (view === 'project-edit' && projectId) return <ProjectEdit projectId={projectId} onBack={() => setView('status-commandes')} />;
    if (view === 'demande-projet') return <ProjectRequest />;

    switch(view) {
      case 'profile': return <PersonalInfoCard />;
      case 'status-commandes': return <OrderStatusCard title="Statut des commandes" allowedStatuses={['en cours', 'en attente', 'devis_envoyé', 'paiement_attente', 'payé']} />;
      case 'completed-projects': return <OrderStatusCard title="Projets terminés" allowedStatuses={['terminé']} />;
      case 'admin-users': return isAdmin ? <AdminUserList /> : <PersonalInfoCard />;
      case 'admin-pending': return isAdmin ? <AdminProjectList statusFilter={['en attente', 'devis_envoyé', 'paiement_attente', 'payé']} title="Projets à gérer / en attente" /> : <PersonalInfoCard />;
      case 'admin-progress': return isAdmin ? <AdminProjectList statusFilter="en cours" title="Projets en cours de modélisation" /> : <PersonalInfoCard />;
      case 'admin-completed': return isAdmin ? <AdminProjectList statusFilter="terminé" title="Projets terminés" /> : <PersonalInfoCard />;
      default: return <PersonalInfoCard />;
    }
  };

  return (
    <div className="app-portal bg-light" style={{minHeight: '100vh'}}>
      {/* Universal Portal Header with unified theme */}
      <section className="hero-section text-center py-5 position-relative overflow-hidden" style={isAdmin ? {background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)'} : {backgroundColor: '#212529'}}>
        <FloatingShapes />
        <div className="container position-relative z-1 pt-4 pb-2">
          <h1 className="display-5 fw-bold text-white mb-2">{isAdmin ? 'Administration' : 'Mon Portail'}</h1>
          <p className="lead text-white-50">Gérez vos informations, demandes et projets depuis cette interface</p>
        </div>
      </section>

      {/* Main App Layout */}
      <div className="container pb-5" style={{ marginTop: '-40px', position: 'relative', zIndex: 2 }}>
        <div className="row">
          <div className="col-lg-3 col-md-4 mb-4">
            <div className="card shadow-sm border-0 rounded-3 overflow-hidden sticky-top" style={{top: '20px'}}>
              <div className="list-group list-group-flush">
                <button onClick={() => setView('demande-projet')} className={`list-group-item list-group-item-action py-3 text-start border-0 fw-bold ${(view === 'demande-projet' || view === 'project-edit') ? 'active bg-primary text-white' : 'text-primary'}`}>
                  <i className="bi bi-plus-circle me-2"></i>Nouveau Projet
                </button>
                <button onClick={() => setView('profile')} className={`list-group-item list-group-item-action py-3 text-start border-0 ${view === 'profile' ? 'active' : ''}`}>
                  <i className="bi bi-person me-2"></i>Mon Profil
                </button>
                <button onClick={() => setView('status-commandes')} className={`list-group-item list-group-item-action py-3 text-start border-0 ${view === 'status-commandes' || view === 'project-details' ? 'active' : ''}`}>
                  <i className="bi bi-activity me-2"></i>Mes Commandes
                </button>
                <button onClick={() => setView('completed-projects')} className={`list-group-item list-group-item-action py-3 text-start border-0 ${view === 'completed-projects' ? 'active' : ''}`}>
                  <i className="bi bi-check-circle me-2"></i>Historique
                </button>
                <button onClick={() => signOut()} className="list-group-item list-group-item-action py-3 text-start border-0 fw-bold text-danger border-bottom">
                  <i className="bi bi-box-arrow-right me-2"></i>Déconnexion
                </button>

                {isAdmin && (
                  <>
                    <div className="p-3 bg-light fw-bold text-muted small text-uppercase border-top">Gestion Admin</div>
                    <button onClick={() => setView('admin-users')} className={`list-group-item list-group-item-action py-3 text-start border-0 ${view === 'admin-users' ? 'active' : ''}`}>
                      <i className="bi bi-people me-2"></i>Utilisateurs
                    </button>
                    <button onClick={() => setView('admin-pending')} className={`list-group-item list-group-item-action py-3 text-start border-0 ${view === 'admin-pending' ? 'active' : ''}`}>
                      <i className="bi bi-hourglass-split me-2"></i>À gérer / Devis
                    </button>
                    <button onClick={() => setView('admin-progress')} className={`list-group-item list-group-item-action py-3 text-start border-0 ${view === 'admin-progress' ? 'active' : ''}`}>
                      <i className="bi bi-tools me-2"></i>En cours
                    </button>
                    <button onClick={() => setView('admin-completed')} className={`list-group-item list-group-item-action py-3 text-start border-0 ${view === 'admin-completed' ? 'active' : ''}`}>
                      <i className="bi bi-check-all me-2"></i>Terminés
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="col-lg-9 col-md-8">
            {/* dynamic content rendered directly without sub-pages */}
            <div className="w-100 fade-in">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppPortal;
