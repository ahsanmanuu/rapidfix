import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress } from '@mui/material';

// Import Original "Perfect" Dashboards
import Dashboard from '../pages/Dashboard'; // User Dashboard
import TechnicianDashboard from '../pages/TechnicianDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import SuperAdminDashboard from '../pages/SuperAdminDashboard';

const UnifiedDashboard = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        }
    }, [user, loading, navigate]);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <CircularProgress />
            </div>
        );
    }

    if (!user) return null;

    // --- Role-Based Routing (Auto-Generated Dashboard) ---
    // This logic ensures each role gets their SPECIFIC, PERFECT design.

    switch (user.role) {
        case 'technician':
            return <TechnicianDashboard />;

        case 'admin':
            return <AdminDashboard />;

        case 'superadmin':
            return <SuperAdminDashboard />;

        case 'user':
        default:
            // Default to User Dashboard
            return <Dashboard />;
    }
};

export default UnifiedDashboard;
