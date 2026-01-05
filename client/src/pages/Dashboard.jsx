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
import { getMyJobs } from '../services/api';

const Dashboard = ({ logout }) => {
    console.log("Dashboard: Rendering started");
    const navigate = useNavigate();
    // Default to 'loading' state to differentiate from 'not logged in'
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('home');
    const [jobs, setJobs] = useState([]);

    useEffect(() => {
        console.log("Dashboard: UseEffect triggered");
        try {
            const storedUser = localStorage.getItem('user');
            const token = localStorage.getItem('sessionToken');

            console.log("Dashboard: Auth data", { hasUser: !!storedUser, hasToken: !!token });

            if (!storedUser || !token) {
                console.log("Dashboard: No auth data, redirecting to login");
                // If we have a logout prop, use it to ensure App state is clean
                if (logout) logout();
                navigate('/login');
                return;
            }

            const u = JSON.parse(storedUser);
            if (!u || !u.id) {
                console.error("Dashboard: Invalid user object", u);
                if (logout) logout();
                navigate('/login');
                return;
            }

            console.log("Dashboard: User loaded", u.id);
            setUser(u);
            setIsLoading(false); // User loaded, stop loading
            fetchJobs(u.id);

        } catch (error) {
            console.error("Dashboard: Critical initialization error", error);
            // Emergency cleanup
            if (logout) logout();
            else {
                localStorage.removeItem('user');
                localStorage.removeItem('sessionToken');
            }
            navigate('/login');
        }
    }, [navigate, logout]);

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
            // Use the passed logout function to update App.jsx state
            if (logout) {
                logout();
            } else {
                localStorage.removeItem('user');
                localStorage.removeItem('sessionToken');
            }
            navigate('/'); // Redirect to Home as requested
        }
    };

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
                    {activeTab === 'jobs' && <DashboardJobs user={user} jobs={jobs} refreshJobs={() => fetchJobs(user.id)} />}
                    {activeTab === 'profile' && <DashboardProfile user={user} setUser={setUser} />}
                    {activeTab === 'chat' && <ChatInterface user={user} />}
                    {activeTab === 'finance' && <DashboardFinance user={user} />}
                </div>
            </DashboardLayout>
        </ErrorBoundary>
    );
};

export default Dashboard;
