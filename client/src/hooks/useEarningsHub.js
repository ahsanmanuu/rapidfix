import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const useEarningsHub = (timeRange = '30D') => {
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

    // Wrapped in useCallback to ensure stability
    const fetchData = useCallback(async () => {
        if (!technicianId) return;

        // Don't set loading true here to avoid flickering on soft refreshes if desired, 
        // but for range change we might want it. Let's keep smooth.

        try {
            const res = await api.get(`/technicians/${technicianId}/earnings-hub`, {
                params: { timeRange }
            });
            if (res.data && res.data.success) {
                setData({
                    stats: res.data.stats || {
                        projectedNet: 0,
                        netTrend: 0,
                        efficiency: 0,
                        fvr: 0,
                        pendingValue: 0,
                        pendingJobs: 0,
                        safety: 5,
                        speed: 5,
                        growthPotential: 0,
                        rank: "...",
                        regionMessage: "..."
                    },
                    earningsData: res.data.earningsData || [],
                    aiCoach: res.data.aiCoach || [],
                    recentJobs: res.data.recentJobs || []
                });
            }
        } catch (err) {
            console.error("[useEarningsHub] Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    }, [technicianId, timeRange]);

    useEffect(() => {
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
    }, [fetchData, socket]); // fetchData includes timeRange and technicianId deps

    return {
        ...data,
        loading,
        refresh: fetchData
    };
};

export default useEarningsHub;
