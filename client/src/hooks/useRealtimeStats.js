import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

export const useRealtimeStats = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalJobs: 0,
        activeTechnicians: 0,
        revenue: 0,
        trends: { users: 0, jobs: 0, revenue: 0 },
        jobDistribution: [],
        registrationTrends: [],
        activityLog: [],
        detailed: null // Start as null to indicate loading state
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const socket = useSocket();

    const fetchStats = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const response = await api.get('/admin/stats');
            if (response.data && response.data.success && response.data.stats) {
                setStats(response.data.stats);
                setError(null);
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
            // Only set error if we don't have existing data
            if (!stats.detailed) {
                setError('Failed to load dashboard statistics.');
            }
        } finally {
            if (!silent) setLoading(false);
        }
    }, [stats.detailed]);

    useEffect(() => {
        // Initial fetch
        fetchStats();

        // Polling Strategy: "Heartbeat" every 30 seconds
        // Ensures data consistency even if socket events are missed
        const pollInterval = setInterval(() => {
            console.log('💓 Dashboard Heartbeat: Refreshing Stats...');
            fetchStats(true); // Silent refresh
        }, 30000);

        return () => clearInterval(pollInterval);
    }, [fetchStats]);

    useEffect(() => {
        if (!socket) return;

        console.log('🔌 Realtime Dashboard: Listening for updates...');

        // List of events that should trigger a dashboard refresh
        const events = [
            'new_job_created',
            'job_status_updated',
            'admin_job_update',
            'new_user_registered',
            'admin_user_update',
            'technician_status_update',
            'admin_tech_update',
            'technician_location_update',
            'payment_received'
        ];

        const handleUpdate = (data) => {
            console.log('⚡ Realtime Update Received:', data);
            fetchStats(true); // Silent refresh
        };

        events.forEach(event => {
            socket.on(event, handleUpdate);
        });

        return () => {
            events.forEach(event => {
                socket.off(event, handleUpdate);
            });
        };
    }, [socket, fetchStats]);

    return { stats, loading, error, refetch: fetchStats };
};
