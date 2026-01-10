import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import api from '../services/api';
import ErrorBoundary from '../components/ErrorBoundary';
import DashboardLayout from '../components/Dashboard/DashboardLayout';
import DashboardHome from '../components/Dashboard/DashboardHome';
import DashboardJobs from '../components/Dashboard/DashboardJobs';
import DashboardProfile from '../components/Dashboard/DashboardProfile';
import ChatInterface from '../components/Dashboard/ChatInterface';
import DashboardFinance from '../components/Dashboard/DashboardFinance';
import { getMyJobs, getUserProfile } from '../services/api';
import { useSocket } from '../context/SocketContext';

import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    console.log("Dashboard: Rendering started");
    const { user, logout, updateUser } = useAuth();
    const navigate = useNavigate();
    // Default to 'loading' state to differentiate from 'not logged in'
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('home');
    const [jobs, setJobs] = useState([]);
    const [isBanned, setIsBanned] = useState(false);

    // Socket Hook
    const socket = useSocket();

    useEffect(() => {
        console.log("Dashboard: UseEffect triggered");
        if (!user) {
            console.log("Dashboard: No user, redirecting to login");
            navigate('/login');
            return;
        }

        // Fetch latest profile to ensure status is fresh
        fetchProfile(user.id);
        fetchJobs(user.id);
    }, [user?.id, navigate]);

    const fetchProfile = async (userId) => {
        try {
            const res = await getUserProfile(userId);
            if (res.data.success) {
                const freshUser = res.data.user;
                updateUser(freshUser);
                setIsBanned(freshUser.status === 'Banned');
            }
        } catch (err) {
            console.error("Dashboard: Failed to fetch profile", err);
            // If the error specifically says banned (403), we can catch it here if backend returns it
            if (err.response?.status === 403) {
                setIsBanned(true);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const fetchJobs = async (userId) => {
        try {
            console.log("Dashboard: Fetching jobs for user", userId);
            const res = await getMyJobs(userId);
            if (res.data.success) {
                console.log("Dashboard: Jobs fetched successfully", res.data.jobs?.length);
                setJobs(Array.isArray(res.data.jobs) ? res.data.jobs : []);
            }
        } catch (err) {
            console.error("Dashboard: Failed to fetch jobs", err);
            setJobs([]);
        }
    };

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('sessionToken');
            if (token) {
                await api.post('/users/logout', { token });
            }
        } catch (error) {
            console.error("Logout error", error);
        } finally {
            // Hard Logout to bypass protected route redirects
            localStorage.removeItem('user');
            localStorage.removeItem('sessionToken');
            window.location.replace('/');
        }
    };

    // Listen for Ban Events
    useEffect(() => {
        if (!socket) return;

        const handleStatusChange = (data) => {
            console.log("Account Status Changed:", data);
            if (data.status === 'Banned') {
                setIsBanned(true);
                updateUser({ status: 'Banned' });
            } else if (data.status === 'Active') {
                setIsBanned(false);
                updateUser({ status: 'Active' });
            }
        };

        const handleMembershipUpdate = (data) => {
            console.log("Membership Updated Event:", data);
            if (data.user) {
                updateUser(data.user);
            }
        };

        const handleRealtimeUpdate = (data) => {
            console.log("Realtime Update Received:", data);
            fetchJobs(user.id);
            // Also refresh profile if needed
            fetchProfile(user.id);
        };

        socket.on('account_status_change', handleStatusChange);
        socket.on('membership_update', handleMembershipUpdate);

        // Listen to generic job updates (covers creation, status change, acceptance)
        socket.on('job_updated', handleRealtimeUpdate);
        socket.on('job_status_change', handleRealtimeUpdate);
        socket.on('new_job', handleRealtimeUpdate);
        socket.on('notification', handleRealtimeUpdate); // Catch-all for notifications

        return () => {
            socket.off('account_status_change', handleStatusChange);
            socket.off('membership_update', handleMembershipUpdate);
            socket.off('job_updated', handleRealtimeUpdate);
            socket.off('job_status_change', handleRealtimeUpdate);
            socket.off('new_job', handleRealtimeUpdate);
            socket.off('notification', handleRealtimeUpdate);
        };
    }, [socket]);

    // Explicit Loading State
    if (isLoading || !user) {
        console.log("Dashboard: Rendering loading state");
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: '#f4f6f8'
            }}>
                {/* Fallback to simple HTML in case MUI crashes */}
                <h2 style={{ fontFamily: 'sans-serif', color: '#555' }}>Loading Dashboard...</h2>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mt-4"></div>
            </div>
        );
    }

    // BAN OVERLAY
    if (isBanned) {
        return (
            <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-bounce-in">
                    <div className="size-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-4xl text-red-600">block</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Account Suspended</h2>
                    <p className="text-slate-600 mb-8">
                        You are blacklisted. To activate your profile please contact support.
                    </p>
                    <button
                        onClick={handleLogout}
                        className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        );
    }

    console.log("Dashboard: Rendering Main Content");
    return (
        <ErrorBoundary>
            <DashboardLayout
                user={user}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onLogout={handleLogout}
            >
                <div className="animate-fade-in h-full">
                    {activeTab === 'home' && <DashboardHome user={user} jobs={jobs} />}
                    {activeTab === 'history' && <DashboardJobs user={user} jobs={jobs} refreshJobs={() => fetchJobs(user.id)} />}
                    {activeTab === 'jobs' && <DashboardJobs user={user} jobs={jobs} refreshJobs={() => fetchJobs(user.id)} />}
                    {activeTab === 'profile' && <DashboardProfile />}
                    {activeTab === 'chat' && <ChatInterface user={user} />}
                    {activeTab === 'finance' && <DashboardFinance user={user} />}
                </div>
            </DashboardLayout>
        </ErrorBoundary>
    );
};

export default Dashboard;
