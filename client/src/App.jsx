import ErrorBoundary from './components/ErrorBoundary';
import LocationPromptModal from './components/LocationPromptModal';
import { useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import SuperAdminLogin from './pages/SuperAdminLogin';
import Dashboard from './pages/Dashboard';
import TechnicianDashboard from './pages/TechnicianDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Wallet from './pages/Wallet';
import TechnicianAuth from './pages/TechnicianAuth';
import NotFound from './pages/NotFound';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ThemeCustomization from './themes';
import { SocketProvider } from './context/SocketContext';
import { useAuth } from './context/AuthContext';

function App() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();

  const { pathname } = useLocation();
  const isDashboard = pathname.includes('dashboard') || pathname.includes('wallet');

  return (
    <ThemeCustomization>
      <SocketProvider user={user}>
        <ErrorBoundary>
          <div className="min-h-screen">
            <LocationPromptModal />
            {!isDashboard && <Navbar />}
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
              <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />

              {/* STRICT SEPARATION of Logins */}
              <Route path="/admin/login" element={!user || (user.role !== 'admin' && user.role !== 'superadmin') ? <AdminLogin /> : <Navigate to="/admin-dashboard" />} />
              <Route path="/superadmin/login" element={!user || user.role !== 'superadmin' ? <SuperAdminLogin /> : <Navigate to="/admin-dashboard" />} />

              {/* Redirects for convenience */}
              <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
              <Route path="/admin/" element={<Navigate to="/admin/login" replace />} />
              <Route path="/admin/dashboard" element={<Navigate to="/admin-dashboard" replace />} />

              <Route
                path="/dashboard"
                element={user ? <Dashboard /> : <Navigate to="/login" />}
              />
              <Route
                path="/technician-dashboard"
                element={user ? <TechnicianDashboard /> : <Navigate to="/login" />}
              />
              <Route
                path="/admin-dashboard"
                element={user && (user.role === 'admin' || user.role === 'superadmin') ? <AdminDashboard /> : <Navigate to="/admin/login" />}
              />
              <Route
                path="/wallet"
                element={user ? <Wallet /> : <Navigate to="/login" />}
              />
              <Route path="/join-partner" element={<TechnicianAuth />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            {!isDashboard && <Footer />}
          </div>
        </ErrorBoundary>
      </SocketProvider>
    </ThemeCustomization>
  );
}

export default App;
