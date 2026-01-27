import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const useEarningsHub = () => {
    const { user } = useAuth();
    const socket = useSocket();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        stats: {
            projectedNet: 0,
            netTrend: 0,
            efficiency: 0,
            fvr: 0,
            pendingValue: 0,
            pendingJobs: 0,
            safety: 0,
            speed: 0,
            growthPotential: 0,
            rank: "...",
            regionMessage: "..."
        },
        earningsData: [],
        aiCoach: [],
        recentJobs: []
    });

    const technicianId = user?.id;

    const fetchData = async () => {
        if (!technicianId) return;
        try {
            const res = await api.get(`/technicians/${technicianId}/earnings-hub`);
            if (res.data && res.data.success) {
                setData({
                    stats: res.data.stats,
                    earningsData: res.data.earningsData,
                    aiCoach: res.data.aiCoach,
                    recentJobs: res.data.recentJobs
                });
            }
        } catch (err) {
            console.error("[useEarningsHub] Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!technicianId) return;

        fetchData();

        // Socket listeners for real-time reactivity
        if (socket) {
            const handleUpdate = () => {
                console.log('[EarningsHub] Real-time Trigger Received');
                fetchData();
            };

            socket.on('job_status_updated', handleUpdate);
            socket.on('wallet_updated', handleUpdate);
            socket.on('analytics_updated', handleUpdate);

            return () => {
                socket.off('job_status_updated', handleUpdate);
                socket.off('wallet_updated', handleUpdate);
                socket.off('analytics_updated', handleUpdate);
            };
        }
    }, [technicianId, socket]);

    return {
        ...data,
        loading,
        refresh: fetchData
    };
};

export default useEarningsHub;
