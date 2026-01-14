import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy loading des pages lourdes ou moins prioritaires
const ProjectRequest = lazy(() => import('./pages/ProjectRequest'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const AuthCallback = lazy(() => import('./pages/auth/AuthCallback'));
const ProjectDetails = lazy(() => import('./pages/ProjectDetails'));
const ProjectEdit = lazy(() => import('./pages/ProjectEdit'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

// Composant de chargement simple
const PageLoader = () => (
  <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Chargement...</span>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Navbar />
        <main>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route
              path="/demande-projet" element={
                <ProtectedRoute>
                  <ProjectRequest />
                </ProtectedRoute>
              }
            />
            <Route path="/profile" element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/status-commandes" element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/completed-projects" element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/projects/:projectId" element={
                <ProtectedRoute>
                  <ProjectDetails />
                </ProtectedRoute>
              }
            />
            <Route path="/projects/:projectId/edit" element={
                <ProtectedRoute>
                  <ProjectEdit />
                </ProtectedRoute>
              }
            />
            <Route path="/admin/users" element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/admin/projects/pending" element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/admin/projects/in-progress" element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/admin/projects/completed" element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;