import ErrorBoundary from './components/ErrorBoundary';
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

function App() {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        // Basic validation to prevent crashing
        if (u && u.name && u.id) return u;
      }
      return null;
    } catch (e) {
      console.error("Failed to parse user from local storage", e);
      return null;
    }
  });

  const navigate = useNavigate();

  const logout = () => {
    navigate('/');
    setTimeout(() => {
      localStorage.removeItem('user');
      localStorage.removeItem('sessionToken'); // Clean up token too
      setUser(null);
    }, 100);
  };

  const { pathname } = useLocation();
  const isDashboard = pathname.includes('dashboard') || pathname.includes('wallet');

  return (
    <ThemeCustomization>
      <SocketProvider user={user}>
        <ErrorBoundary>
          <div className="min-h-screen">
            {!isDashboard && <Navbar user={user} logout={logout} />}
            <Routes>
              <Route path="/" element={<Home setUser={setUser} />} />
              <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/dashboard" />} />
              <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />

              {/* STRICT SEPARATION of Logins */}
              <Route path="/admin/login" element={!user ? <AdminLogin setUser={setUser} /> : <Navigate to="/admin-dashboard" />} />
              <Route path="/superadmin/login" element={!user ? <SuperAdminLogin setUser={setUser} /> : <Navigate to="/admin-dashboard" />} />

              <Route
                path="/dashboard"
                element={user ? <Dashboard logout={logout} /> : <Navigate to="/login" />}
              />
              <Route
                path="/technician-dashboard"
                element={user ? <TechnicianDashboard user={user} logout={logout} /> : <Navigate to="/login" />}
              />
              <Route
                path="/admin-dashboard"
                element={user ? <AdminDashboard /> : <Navigate to="/login" />}
              />
              <Route
                path="/wallet"
                element={user ? <Wallet /> : <Navigate to="/login" />}
              />
              <Route path="/join-partner" element={<TechnicianAuth setUser={setUser} />} />
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
