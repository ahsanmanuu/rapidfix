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
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import JobHistoryLog from './pages/JobHistoryLog';
import Wallet from './pages/Wallet';
import EarningsHub from './pages/EarningsHub';
import FeedbackHub from './pages/FeedbackHub';
import TechnicianOffers from './pages/TechnicianOffers';
import TechnicianChat from './pages/TechnicianChat';
import TechnicianAuth from './pages/TechnicianAuth';
import NotFound from './pages/NotFound';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ThemeCustomization from './themes';
import { SocketProvider } from './context/SocketContext';
import { useAuth } from './context/AuthContext';
import UnifiedDashboard from './components/UnifiedDashboard';

function App() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();

  const { pathname } = useLocation();
  const isDashboard = pathname.includes('dashboard') || pathname.includes('wallet') || pathname.includes('job-history') || pathname.includes('earnings-hub') || pathname.includes('feedback-hub') || pathname.includes('technician-offers');

  return (
    <ThemeCustomization>
      <SocketProvider user={user}>
        <ErrorBoundary>
          <div className="min-h-screen">
            {/* <LocationPromptModal /> Removed as per user request */}
            {!isDashboard && <Navbar />}
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
              <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />

              {/* STRICT SEPARATION of Logins */}
              <Route path="/admin/login" element={!user || (user.role !== 'admin' && user.role !== 'superadmin') ? <AdminLogin /> : <Navigate to="/admin-dashboard" />} />
              <Route path="/superadmin/login" element={!user || user.role !== 'superadmin' ? <SuperAdminLogin /> : <Navigate to="/super-admin-dashboard" />} />

              {/* Redirects for convenience */}
              <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
              <Route path="/admin/" element={<Navigate to="/admin/login" replace />} />
              <Route path="/admin/dashboard" element={<Navigate to="/admin-dashboard" replace />} />

              <Route
                path="/dashboard"
                element={user ? <UnifiedDashboard /> : <Navigate to="/login" />}
              />
              <Route
                path="/technician-dashboard"
                element={user ? <UnifiedDashboard /> : <Navigate to="/login" />}
              />
              <Route
                path="/job-history"
                element={user ? <JobHistoryLog /> : <Navigate to="/login" />}
              />
              <Route
                path="/admin-dashboard"
                element={user ? <UnifiedDashboard /> : <Navigate to="/admin/login" />}
              />
              <Route
                path="/super-admin-dashboard"
                element={user ? <UnifiedDashboard /> : <Navigate to="/superadmin/login" />}
              />
              <Route
                path="/wallet"
                element={user ? <Wallet /> : <Navigate to="/login" />}
              />
              <Route
                path="/earnings-hub"
                element={user ? <EarningsHub /> : <Navigate to="/login" />}
              />
              <Route
                path="/feedback-hub"
                element={user ? <FeedbackHub /> : <Navigate to="/login" />}
              />
              <Route
                path="/technician-offers"
                element={user ? <TechnicianOffers /> : <Navigate to="/login" />}
              />
              <Route
                path="/technician/chat"
                element={user ? <TechnicianChat /> : <Navigate to="/login" />}
              />
              <Route path="/support" element={<Navigate to="/dashboard" replace />} />
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
