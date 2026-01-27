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

                // [OPTIMISTIC] If update contains job info, sync list immediately
                // Only treat as job if it has job-specific fields (scheduledDate, or technicianId property distinct from id)
                // Technicians have 'id' and 'serviceType', so those aren't unique enough.
                const isJob = data && data.id && (data.technicianId || data.scheduledDate || data.userId);

                if (isJob) {
                    setActiveJobs(prev => {
                        const exists = prev.some(j => j.id === data.id);

                        // Check if job should still be in active list
                        const isActive = ['pending', 'accepted', 'in_progress', 'arrived', 'arriving', 'on_the_way'].includes(data.status);

                        if (isActive) {
                            if (exists) {
                                return prev.map(j => j.id === data.id ? { ...j, ...data } : j);
                            } else {
                                // Add to list if it's new and active
                                return [data, ...prev];
                            }
                        } else {
                            // If NOT active anymore (cancelled/completed), remove it
                            return prev.filter(j => j.id !== data.id);
                        }
                    });

                    // Optional: Update stats if status changed
                    // (Easier to just call fetchData for full stats consistency)
                }

                fetchData();
            };

            const handleActivity = (data) => {
                console.log('[Dashboard] New Activity:', data);
                fetchData();
            };

            socket.on('new_job_assigned', handleUpdate);
            socket.on('job_status_updated', handleUpdate);
            socket.on('job_updated', handleUpdate); // Added
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
