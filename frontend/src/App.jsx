import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './layout/Navbar';
import Footer from './layout/Footer';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy loading
const AuthCallback = lazy(() => import('./pages/auth/AuthCallback'));
const AppPortal = lazy(() => import('./pages/AppPortal'));

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
                path="/app" element={
                  <ProtectedRoute>
                    <AppPortal />
                  </ProtectedRoute>
                }
              />
              {/* Fallback to catch all other paths and redirect to /app if authenticated, or / if not */}
              <Route path="*" element={<Home />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;