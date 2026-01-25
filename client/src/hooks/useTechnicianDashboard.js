import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const useTechnicianDashboard = () => {
    const { user } = useAuth();
    const socket = useSocket();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        earnings: 0,
        completedJobs: 0,
        rating: 0,
        active: 0,
        pending: 0,
        todayEarnings: 0,
        monthlyRevenue: 0,
        usersServed: 0,
        complaints: 0,
        accepted: 0,
        rejected: 0
    });
    const [activeJobs, setActiveJobs] = useState([]);
    const [activityFeed, setActivityFeed] = useState([]);
    const [earningsData, setEarningsData] = useState([]);

    const technicianId = user?.id;

    const fetchData = async () => {
        if (!technicianId) return;
        // Keep loading true only on initial load or if we want a spinner on every refresh (usually annoying)
        // So we might want to handle loading state more carefully. 
        // For now, only set false after first fetch.

        try {
            const res = await api.get(`/technicians/${technicianId}/dashboard-stats`);
            if (res.data && res.data.success) {
                const d = res.data;
                setStats(prev => ({ ...prev, ...d.stats, active: d.activeJobs.length }));
                setEarningsData(d.earningsData);
                setActiveJobs(d.activeJobs);
                setActivityFeed(d.activityFeed);
            }
        } catch (err) {
            console.error("Dashboard Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!technicianId) return;

        // Initial Fetch
        fetchData();

        // Polling every 10 seconds
        const interval = setInterval(fetchData, 10000);

        // Socket Listeners
        if (socket) {
            const handleUpdate = (data) => {
                console.log('[Dashboard] Realtime Update:', data);
                fetchData();
            };

            const handleActivity = (data) => {
                // Optimistic update for activity feed if we wanted, but fetching fresh is safer for consistency
                console.log('[Dashboard] New Activity:', data);
                fetchData();
            };

            socket.on('new_job_assigned', handleUpdate);
            socket.on('job_status_updated', handleUpdate);
            socket.on('wallet_updated', handleUpdate);
            socket.on('new_job_created', handleUpdate); // For unassigned jobs in marketplace

            socket.on('stats_updated', handleUpdate);
            socket.on('technician_status_update', handleUpdate);
            socket.on('technician_rating_updated', handleUpdate);
            socket.on('new_activity', handleActivity);

            return () => {
                clearInterval(interval);
                socket.off('new_job_assigned', handleUpdate);
                socket.off('job_status_updated', handleUpdate);
                socket.off('wallet_updated', handleUpdate);
                socket.off('new_job_created', handleUpdate);

                socket.off('stats_updated', handleUpdate);
                socket.off('technician_status_update', handleUpdate);
                socket.off('technician_rating_updated', handleUpdate);
                socket.off('new_activity', handleActivity);
            };
        }

        return () => clearInterval(interval);
    }, [technicianId, socket]);

    return { stats, activeJobs, activityFeed, earningsData, loading, reload: fetchData };
};



export default useTechnicianDashboard;
