import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const useJobHistory = (initialPage = 1, initialLimit = 10) => {
    const { user } = useAuth();
    const socket = useSocket();
    const [loading, setLoading] = useState(true);
    const [jobs, setJobs] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(initialPage);
    const [limit, setLimit] = useState(initialLimit);
    const [totalPages, setTotalPages] = useState(0);
    const [stats, setStats] = useState({
        completedJobs: 0,
        rejected: 0,
        earnings: 0
    });
    const [filters, setFilters] = useState({
        status: 'All Statuses',
        serviceType: 'All Services',
        search: '',
        startDate: '',
        endDate: ''
    });

    const technicianId = user?.id;

    const fetchHistory = useCallback(async () => {
        if (!technicianId) return;
        setLoading(true);
        try {
            const params = {
                page,
                limit,
                ...filters
            };
            const [historyRes, statsRes] = await Promise.all([
                api.get(`/technicians/${technicianId}/job-history`, { params }),
                api.get(`/technicians/${technicianId}/dashboard-stats`)
            ]);

            if (historyRes.data?.success) {
                setJobs(historyRes.data.data);
                setTotal(historyRes.data.total);
                setTotalPages(historyRes.data.totalPages);
            }

            if (statsRes.data?.success) {
                setStats(statsRes.data.stats);
            }
        } catch (err) {
            console.error("Job History/Stats Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    }, [technicianId, page, limit, filters]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    useEffect(() => {
        if (!socket || !technicianId) return;

        const handleRealtimeUpdate = (data) => {
            // [OPTIMISTIC] For history, we just refresh the current page to ensure consistency
            // especially if status changed or a new job was completed
            fetchHistory();
        };

        socket.on('job_status_updated', handleRealtimeUpdate);
        socket.on('job_updated', handleRealtimeUpdate);
        socket.on('new_job_assigned', handleRealtimeUpdate);

        return () => {
            socket.off('job_status_updated', handleRealtimeUpdate);
            socket.off('job_updated', handleRealtimeUpdate);
            socket.off('new_job_assigned', handleRealtimeUpdate);
        };
    }, [socket, technicianId, fetchHistory]);

    const updateFilters = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setPage(1); // Reset to first page on filter change
    };

    const reportIssue = async (issueData) => {
        try {
            const res = await api.post('/complaints', {
                ...issueData,
                technicianId,
                reportedByRole: 'technician'
            });
            return res.data;
        } catch (err) {
            console.error("Report Issue Error:", err);
            throw err;
        }
    };

    return {
        jobs,
        total,
        page,
        totalPages,
        limit,
        loading,
        filters,
        stats,
        setPage,
        setLimit,
        updateFilters,
        refresh: fetchHistory,
        reportIssue
    };
};

export default useJobHistory;
