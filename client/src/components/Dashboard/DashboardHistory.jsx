import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    TextField,
    Button,
    InputAdornment,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Collapse,
    Divider,
    Avatar,
    Stack,
    Pagination,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Rating,
    CircularProgress
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
    Search,
    DateRange,
    FilterList,
    Download,
    CheckCircle,
    PendingActions,
    Payments,
    ExpandMore,
    ExpandLess,
    Description,
    Star,
    Bolt,
    Plumbing,
    AcUnit,
    FormatPaint,
    CleaningServices,
    Check,
    ChevronLeft,
    ChevronRight,
    HomeRepairService
} from '@mui/icons-material';

const PRIMARY_BLUE = '#2463eb';
const BG_LIGHT = '#f6f6f8';
const TEXT_DARK = '#111621';

const DashboardHistory = ({ jobs = [] }) => {
    const [expandedId, setExpandedId] = useState(null);

    const handleToggle = (index) => {
        setExpandedId(prev => (prev === index ? null : index));
    };

    // --- Filter State ---
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [localJobs, setLocalJobs] = useState(jobs);
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false); // Toggle for advanced filters on mobile/desktop

    // Sync with props ONLY if no filters are active (to prevent overwriting filtered results on real-time updates)
    useEffect(() => {
        const hasFilters = search || (statusFilter && statusFilter !== 'all') || startDate || endDate;
        if (!hasFilters) {
            setLocalJobs(jobs);
        }
    }, [jobs, search, statusFilter, startDate, endDate]);

    // Fetch jobs when filters change (Debounced search could be better, but explicit 'Apply' or effect is fine)
    // For simplicity, let's auto-fetch on status/date change, and debounce search.

    const { currentUser } = useAuth();

    // Define fetch logic
    const fetchFiltered = async (overrideParams = {}) => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const params = {
                q: search,
                status: statusFilter === 'all' ? '' : statusFilter,
                start: startDate,
                end: endDate,
                ...overrideParams
            };
            const res = await api.getMyJobs(currentUser.id, params);
            if (res.data.success) {
                setLocalJobs(res.data.jobs || []);
                setPage(1);
            }
        } catch (err) {
            console.error("Filter Fetch Error:", err);
            setLocalJobs([]);
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch for Search and Status ONLY
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchFiltered();
        }, 500);
        return () => clearTimeout(timer);
    }, [search, statusFilter, currentUser]); // Dates removed from dependency

    // Manual Trigger for Date Filter
    const handleApplyDateFilter = () => {
        fetchFiltered();
    };

    // CSV Export
    const handleExport = () => {
        if (!localJobs || localJobs.length === 0) {
            alert("No jobs to export. Please adjust your filters.");
            return;
        }

        alert(`Generating CSV for ${localJobs.length} jobs...`);

        const headers = ['Job ID', 'Service', 'Technician', 'Date', 'Time', 'Status', 'Cost', 'Total'];
        const rows = localJobs.map(j => [
            j.id,
            j.serviceType,
            j.technician?.name || 'Unassigned',
            new Date(j.scheduledDate || j.createdAt).toLocaleDateString(),
            j.scheduledTime || new Date(j.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            getStatusColor(j.status).label,
            j.visitingCharges || 0,
            j.totalCost || 0
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(item => `"${item || ''}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `job_history_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- Feedback Logic ---
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [selectedJobForFeedback, setSelectedJobForFeedback] = useState(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submittingFeedback, setSubmittingFeedback] = useState(false);

    const handleRateClick = (job) => {
        setSelectedJobForFeedback(job);
        setRating(0);
        setComment('');
        setFeedbackOpen(true);
    };

    const handleCloseFeedback = () => {
        setFeedbackOpen(false);
        setSelectedJobForFeedback(null);
    };

    const handleSubmitFeedback = async () => {
        if (!rating) return;
        setSubmittingFeedback(true);
        try {
            // Need technician ID. The job object should have it.
            // row.originalJob or similar if we mapped it, but here 'currentRows' are mapped objects.
            // We need to pass the full job object or ensure the mapped 'row' has the technicianId.
            // Let's check the mapping... row.technicianId needs to be added to mapping.

            await api.post('/api/feedback', {
                jobId: selectedJobForFeedback.realJobId, // We'll add this to the row map
                technicianId: selectedJobForFeedback.technicianId,
                userId: currentUser.id,
                rating,
                comment,
                serviceType: selectedJobForFeedback.service
            });

            // Optional: Refresh jobs or show success
            handleCloseFeedback();
        } catch (error) {
            console.error("Failed to submit feedback:", error);
        } finally {
            setSubmittingFeedback(false);
        }
    };

    // --- Dynamic Stats Calculation ---
    // 1. Total Spend (Sum of totalCost or visitingCharges for completed jobs)
    // 2. Total Jobs Done (Count of completed jobs)
    // 3. Ongoing Projects (Count of pending/assigned/in_progress)

    const completedJobs = jobs.filter(j => j.status === 'completed');
    const ongoingJobs = jobs.filter(j => ['pending', 'assigned', 'accepted', 'in_progress'].includes(j.status));

    const totalSpend = completedJobs.reduce((sum, job) => sum + (Number(job.totalCost) || Number(job.visitingCharges) || 0), 0);
    const totalJobsCount = completedJobs.length;
    const ongoingCount = ongoingJobs.length;

    const stats = [
        { title: 'Total Spend', value: `₹${totalSpend.toLocaleString()}`, change: 'Lifetime', icon: <Payments sx={{ fontSize: 20 }} />, color: '#16a34a', bg: '#f0fdf4' },
        { title: 'Total Jobs Done', value: totalJobsCount, change: 'Lifetime', icon: <CheckCircle sx={{ fontSize: 20 }} />, color: '#2463eb', bg: '#eff6ff' },
        { title: 'Ongoing Projects', value: ongoingCount, change: 'Active', icon: <PendingActions sx={{ fontSize: 20 }} />, color: '#ea580c', bg: '#fff7ed' }
    ];

    // --- Map Jobs to Rows ---
    const getServiceIcon = (serviceName) => {
        const lower = (serviceName || '').toLowerCase();
        if (lower.includes('plumb')) return <Plumbing />;
        if (lower.includes('electric') || lower.includes('wire')) return <Bolt />;
        if (lower.includes('ac') || lower.includes('cool')) return <AcUnit />;
        if (lower.includes('clean')) return <CleaningServices />;
        if (lower.includes('paint')) return <FormatPaint />;
        return <HomeRepairService />;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return { bg: '#ecfdf5', color: '#047857', label: 'Completed' };
            case 'cancelled': return { bg: '#fef2f2', color: '#dc2626', label: 'Cancelled' };
            case 'rejected': return { bg: '#fef2f2', color: '#dc2626', label: 'Rejected' };
            case 'in_progress': return { bg: '#eff6ff', color: '#1d4ed8', label: 'In Progress' };
            case 'assigned': return { bg: '#fff7ed', color: '#c2410c', label: 'Assigned' };
            case 'accepted': return { bg: '#fff7ed', color: '#c2410c', label: 'Accepted' };
            default: return { bg: '#f3f4f6', color: '#4b5563', label: 'Pending' };
        }
    };

    // --- Pagination Properties ---
    const [page, setPage] = useState(1);
    const rowsPerPage = 5;

    // We filter 'localJobs', not 'jobs' prop
    // Actually, localJobs IS already filtered by API.
    // But we might still want client-side search if API fails? No, trust API.

    const totalCount = localJobs.length;
    const totalPages = Math.ceil(totalCount / rowsPerPage);
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, totalCount);

    // Get current page rows
    const currentRows = localJobs.slice(startIndex, startIndex + rowsPerPage).map(job => {
        const icon = getServiceIcon(job.serviceType);
        const statusMeta = getStatusColor(job.status);
        const cost = job.totalCost || job.visitingCharges || 0;

        return {
            id: `#${job.id}`,
            service: job.serviceType || 'General Service',
            subService: job.description ? (job.description.length > 30 ? job.description.substring(0, 30) + '...' : job.description) : 'Standard Request',
            proName: job.technician?.name || 'Unassigned',
            proImg: job.technician?.photo || `https://ui-avatars.com/api/?name=${job.technician?.name || 'Pro'}&background=random`,
            date: new Date(job.scheduledDate || job.createdAt).toLocaleDateString(),
            time: job.scheduledTime || new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            cost: `₹${cost}`,
            status: statusMeta.label,
            statusBg: statusMeta.bg,
            statusColor: statusMeta.color,
            icon: icon,
            iconBg: '#f3f4f6', // Default simple bg
            iconColor: '#4b5563',
            // Detailed Data for Expanded View
            fullDescription: job.description || "No description provided.",
            professionalNote: job.professionalNote || "No notes from professional.",
            timeline: job.timeline || [],
            // Hidden fields for logic
            realJobId: job.id,
            technicianId: job.technician?.id
        };
    });

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
            setExpandedId(null); // Collapse all on page change
        }
    };

    // Helper Component for consistent card styling
    const StatCard = ({ stat, isMobile = false }) => (
        <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <CardContent sx={{ p: isMobile ? 2 : 3, '&:last-child': { pb: isMobile ? 2 : 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: isMobile ? 1 : 2 }}>
                    <Box sx={{
                        width: isMobile ? 28 : 32, height: isMobile ? 28 : 32, borderRadius: '50%',
                        bgcolor: stat.bg, color: stat.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        {React.cloneElement(stat.icon, { sx: { fontSize: isMobile ? 18 : 20 } })}
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary', whiteSpace: 'nowrap', fontSize: isMobile ? '0.75rem' : '0.875rem' }}>{stat.title}</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'baseline', gap: isMobile ? 0.5 : 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: TEXT_DARK, fontSize: isMobile ? '1.5rem' : '2.125rem', lineHeight: 1.2 }}>{stat.value}</Typography>
                    {stat.change && (
                        <Chip
                            label={stat.change}
                            size="small"
                            sx={{
                                bgcolor: '#ecfdf5',
                                color: '#059669',
                                fontSize: isMobile ? '0.65rem' : '0.75rem',
                                fontWeight: 600,
                                height: isMobile ? 20 : 24,
                                maxWidth: '100%',
                                '& .MuiChip-label': { px: 1, textOverflow: 'ellipsis' }
                            }}
                        />
                    )}
                </Box>
            </CardContent>
        </Card>
    );

    const Row = ({ row, isExpanded, onToggle }) => {
        return (
            <>
                <TableRow
                    sx={{
                        '&:hover': { bgcolor: 'grey.50' },
                        cursor: 'pointer',
                        bgcolor: isExpanded ? 'rgba(36, 99, 235, 0.04)' : 'inherit',
                        borderLeft: isExpanded ? `4px solid ${PRIMARY_BLUE}` : '4px solid transparent',
                        transition: 'all 0.2s'
                    }}
                    onClick={onToggle}
                >
                    <TableCell sx={{ py: { xs: 1.5, md: 2 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 2 } }}>
                            <Box sx={{
                                width: { xs: 32, md: 40 }, height: { xs: 32, md: 40 }, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                bgcolor: row.iconBg, color: row.iconColor, flexShrink: 0
                            }}>
                                {React.cloneElement(row.icon, { sx: { fontSize: { xs: 18, md: 24 } } })}
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: { xs: '0.8rem', md: '0.875rem' } }}>{row.service}</Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{row.subService}</Typography>
                            </Box>
                        </Box>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Typography variant="body2" sx={{ color: PRIMARY_BLUE, fontWeight: 500 }}>{row.id}</Typography>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar src={row.proImg} sx={{ width: 32, height: 32 }} />
                            <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>{row.proName}</Typography>
                        </Box>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="body2" sx={{ color: 'text.primary' }}>{row.date}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{row.time}</Typography>
                        </Box>
                    </TableCell>
                    <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: { xs: '0.8rem', md: '0.875rem' } }}>{row.cost}</Typography>
                    </TableCell>
                    <TableCell>
                        <Chip
                            label={row.status}
                            size="small"
                            sx={{
                                bgcolor: row.statusBg,
                                color: row.statusColor,
                                fontWeight: 600,
                                borderRadius: '999px',
                                height: 24,
                                fontSize: '0.7rem',
                                '& .MuiChip-label': { px: 1 }
                            }}
                        />
                    </TableCell>
                    <TableCell align="right" sx={{ px: { xs: 1, md: 2 } }}>
                        <IconButton size="small" sx={{ color: isExpanded ? PRIMARY_BLUE : 'text.secondary' }}>
                            {isExpanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>

                                {/* Mobile Only Details (Hidden columns appear here) */}
                                <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Job ID</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: PRIMARY_BLUE }}>{row.id}</Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'right' }}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Date & Time</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.date}, {row.time}</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'white', p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                        <Avatar src={row.proImg} sx={{ width: 40, height: 40 }} />
                                        <Box>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Professional</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.proName}</Typography>
                                        </Box>
                                    </Box>
                                    <Divider />
                                </Box>

                                {/* Timeline */}
                                <Box sx={{ flex: 1, width: '100%' }}>
                                    <Typography variant="subtitle2" sx={{ mb: 3, fontWeight: 600 }}>Service Timeline</Typography>
                                    <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'space-between', width: '100%', px: 0 }}>
                                        <Box sx={{ position: 'absolute', top: { xs: '11px', md: '14px' }, left: 0, right: 0, height: 2, bgcolor: 'grey.300', zIndex: 0 }} />
                                        {/* Render Dynamic Timeline Steps */}
                                        {/* We map a standard set of steps, but check against row.timeline to see which are completed */}
                                        {['Request Received', 'Pro Assigned', 'Work Started', 'Completed'].map((step, index) => {
                                            // Determine active state based on row.timeline or status
                                            // Simple heuristic: if status map index >= step index
                                            const statusOrder = ['pending', 'assigned', 'in_progress', 'completed'];
                                            // Map nice label to status key if needed, or just use index
                                            // Let's use the row's status to determine progress
                                            let currentProgressIndex = 0;
                                            const s = (row.status || '').toLowerCase();
                                            if (s === 'completed') currentProgressIndex = 3;
                                            else if (s === 'in progress' || s === 'in_progress') currentProgressIndex = 2;
                                            else if (s === 'assigned' || s === 'accepted') currentProgressIndex = 1;
                                            else currentProgressIndex = 0;

                                            const isCompleted = index <= currentProgressIndex;
                                            const isCurrent = index === currentProgressIndex;

                                            return (
                                                <Box key={step} sx={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: 'grey.50', px: 0.5, flex: 1 }}>
                                                    <Box sx={{
                                                        width: { xs: 24, md: 30 }, height: { xs: 24, md: 30 }, borderRadius: '50%',
                                                        bgcolor: isCompleted ? (index === 3 ? '#10b981' : PRIMARY_BLUE) : 'grey.300',
                                                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        boxShadow: isCurrent && index === 3 ? '0 0 0 4px #d1fae5' : 'none',
                                                        mb: 0.5
                                                    }}>
                                                        <Check sx={{ fontSize: { xs: 14, md: 16 } }} />
                                                    </Box>
                                                    <Typography variant="caption" sx={{
                                                        fontWeight: 600,
                                                        color: isCompleted ? (index === 3 ? '#10b981' : 'text.secondary') : 'text.disabled',
                                                        fontSize: { xs: '0.55rem', md: '0.7rem' },
                                                        textAlign: 'center',
                                                        lineHeight: 1.1,
                                                        mt: 0.5
                                                    }}>
                                                        {step}
                                                    </Typography>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                </Box>

                                {/* Actions */}
                                <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', md: 'auto' }, flexDirection: { xs: 'column', sm: 'row' } }}>
                                    <Button
                                        variant="outlined"
                                        startIcon={<Description />}
                                        sx={{ textTransform: 'none', color: 'text.primary', borderColor: 'grey.300', width: { xs: '100%', sm: 'auto' } }}
                                    >
                                        Download Invoice
                                    </Button>
                                    <Button
                                        variant="contained"
                                        startIcon={<Star />}
                                        onClick={() => handleRateClick(row)}
                                        sx={{ textTransform: 'none', bgcolor: PRIMARY_BLUE, '&:hover': { bgcolor: '#1d4ed8' }, width: { xs: '100%', sm: 'auto' } }}
                                    >
                                        Rate Professional
                                    </Button>
                                </Box>

                                {/* Details - Dynamically rendered */}
                                <Grid container spacing={2} sx={{ mt: 2 }}>
                                    <Grid item xs={12} md={6}>
                                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'white' }}>
                                            <Typography variant="caption" sx={{ textTransform: 'uppercase', color: 'text.secondary', fontWeight: 600 }}>Customer Note</Typography>
                                            <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: 'text.primary' }}>
                                                "{row.fullDescription}"
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'white' }}>
                                            <Typography variant="caption" sx={{ textTransform: 'uppercase', color: 'text.secondary', fontWeight: 600 }}>Professional Note</Typography>
                                            <Typography variant="body2" sx={{ mt: 1, color: 'text.primary' }}>
                                                "{row.professionalNote}"
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Collapse>
                    </TableCell>
                </TableRow>
            </>
        );
    };

    return (
        <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 4 }, fontFamily: 'Inter, sans-serif' }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, color: TEXT_DARK }}>Job History</Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>Manage, track, and review your service requests history.</Typography>
            </Box>

            {/* Stats - Mobile Layout (Flex Column) */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 4 }}>
                {/* 1. Total Spend (Full Width) */}
                <Box sx={{ width: '100%' }}>
                    <StatCard stat={stats[0]} isMobile={true} />
                </Box>
                {/* 2. Side by Side (Jobs & Projects) */}
                <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <StatCard stat={stats[1]} isMobile={true} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <StatCard stat={stats[2]} isMobile={true} />
                    </Box>
                </Box>
            </Box>

            {/* Stats - Desktop Layout (Grid) */}
            <Grid container spacing={2} sx={{ mb: 4, display: { xs: 'none', md: 'flex' } }}>
                {stats.map((stat, i) => (
                    <Grid item xs={12} md={4} key={i}>
                        <StatCard stat={stat} isMobile={false} />
                    </Grid>
                ))}
            </Grid>

            {/* Table Section */}
            <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                {/* Advanced Toolbar */}
                <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
                        <TextField
                            placeholder="Search by ID, Service..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            size="small"
                            InputProps={{
                                startAdornment: (<InputAdornment position="start"><Search sx={{ color: 'text.disabled' }} /></InputAdornment>),
                                sx: { borderRadius: 2, bgcolor: '#f8fafc' }
                            }}
                            sx={{ width: '100%', maxWidth: 300, flex: 1 }}
                        />

                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', width: { xs: '100%', md: 'auto' } }}>
                            {/* Status Select */}
                            <TextField
                                select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                size="small"
                                SelectProps={{ native: true }}
                                sx={{ minWidth: 140, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="assigned">Assigned</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="rejected">Rejected</option>
                            </TextField>

                            <Button
                                variant="outlined"
                                startIcon={<DateRange />}
                                onClick={() => setShowFilters(!showFilters)}
                                sx={{ borderRadius: 2, textTransform: 'none', color: 'text.primary', borderColor: '#e2e8f0' }}
                            >
                                {startDate ? `${startDate} - ${endDate || '...'}` : 'Date Range'}
                            </Button>

                            <Button
                                variant="contained"
                                startIcon={<Download />}
                                onClick={handleExport}
                                sx={{ borderRadius: 2, textTransform: 'none', bgcolor: 'rgba(36, 99, 235, 0.05)', color: PRIMARY_BLUE, boxShadow: 'none', '&:hover': { bgcolor: 'rgba(36, 99, 235, 0.1)' } }}
                            >
                                Export
                            </Button>
                        </Box>
                    </Box>

                    {/* Collapsible Date Filters */}
                    <Collapse in={showFilters}>
                        <Box sx={{ mt: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                            <TextField
                                label="Start Date"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                size="small"
                                InputLabelProps={{ shrink: true }}
                                sx={{ bgcolor: 'white' }}
                            />
                            <TextField
                                label="End Date"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                size="small"
                                InputLabelProps={{ shrink: true }}
                                sx={{ bgcolor: 'white' }}
                            />
                            <Button
                                variant="contained"
                                size="small"
                                onClick={handleApplyDateFilter}
                                sx={{ textTransform: 'none', bgcolor: PRIMARY_BLUE }}
                            >
                                Apply Filter
                            </Button>
                            <Button
                                size="small"
                                onClick={() => {
                                    setStartDate('');
                                    setEndDate('');
                                    fetchFiltered({ start: '', end: '' }); // Clear and fetch
                                }}
                            >
                                Clear Dates
                            </Button>
                        </Box>
                    </Collapse>
                </Box>

                {loading && <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>}
                {/* DESKTOP TABLE VIEW */}
                <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                {['Service', 'Job ID', 'Professional', 'Date & Time', 'Cost', 'Status', 'Actions'].map((head, i) => (
                                    <TableCell key={head} align={i === 6 ? 'right' : 'left'} sx={{
                                        textTransform: 'uppercase', fontSize: 11, fontWeight: 600, color: 'text.secondary', py: 2
                                    }}>
                                        {head}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {currentRows.length > 0 ? (
                                currentRows.map((row, index) => (
                                    <Row
                                        key={row.id}
                                        row={row}
                                        isExpanded={expandedId === index}
                                        onToggle={() => handleToggle(index)}
                                    />
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                                        No jobs found matching your search.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* MOBILE CARD VIEW */}
                <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column' }}>
                    {currentRows.length > 0 ? (
                        currentRows.map((row, index) => {
                            const isExpanded = expandedId === index;
                            return (
                                <Box key={row.id} sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: isExpanded ? 'rgba(36, 99, 235, 0.04)' : 'white' }}>
                                    {/* Mobile Row Header */}
                                    <Box
                                        onClick={() => handleToggle(index)}
                                        sx={{ p: 2, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', cursor: 'pointer' }}
                                    >
                                        <Box sx={{ display: 'flex', gap: 2, flex: 1, minWidth: 0 }}>
                                            {/* Icon */}
                                            <Box sx={{
                                                width: 40, height: 40, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                bgcolor: row.iconBg, color: row.iconColor, flexShrink: 0
                                            }}>
                                                {React.cloneElement(row.icon, { sx: { fontSize: 20 } })}
                                            </Box>

                                            {/* Main Info */}
                                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1.2, mb: 0.5, wordBreak: 'break-word' }}>
                                                    {row.service}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                    <Typography variant="caption" sx={{ color: PRIMARY_BLUE, fontWeight: 500 }}>{row.id}</Typography>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>• {row.date}</Typography>
                                                </Box>
                                                <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>{row.cost}</Typography>
                                            </Box>
                                        </Box>

                                        {/* Status & Toggle */}
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                                            <Chip
                                                label={row.status}
                                                size="small"
                                                sx={{
                                                    bgcolor: row.statusBg,
                                                    color: row.statusColor,
                                                    fontWeight: 600,
                                                    borderRadius: '6px',
                                                    height: 24,
                                                    fontSize: '0.7rem',
                                                }}
                                            />
                                            <IconButton size="small" sx={{ color: isExpanded ? PRIMARY_BLUE : 'text.secondary', p: 0.5 }}>
                                                {isExpanded ? <ExpandLess /> : <ExpandMore />}
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    {/* Mobile Expanded Content */}
                                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                        <Box sx={{ px: 2, pb: 2 }}>
                                            <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>

                                                {/* Pro Details */}
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                                    <Avatar src={row.proImg} sx={{ width: 32, height: 32 }} />
                                                    <Box>
                                                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1 }}>Professional</Typography>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.proName}</Typography>
                                                    </Box>
                                                </Box>

                                                <Divider sx={{ mb: 2 }} />

                                                {/* Timeline Short - Compact Version */}
                                                <Typography variant="caption" sx={{ fontWeight: 600, mb: 1.5, display: 'block' }}>Service Timeline</Typography>
                                                <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'space-between', width: '100%', mb: 2.5 }}>
                                                    <Box sx={{ position: 'absolute', top: '11px', left: 0, right: 0, height: 2, bgcolor: 'grey.300', zIndex: 0 }} />
                                                    {['Request Received', 'Pro Assigned', 'Work Started', 'Completed'].map((step, i) => (
                                                        <Box key={step} sx={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: 'white', px: 0.5, flex: 1 }}>
                                                            <Box sx={{
                                                                width: 24, height: 24, borderRadius: '50%',
                                                                bgcolor: i === 3 ? '#10b981' : PRIMARY_BLUE,
                                                                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                boxShadow: i === 3 ? '0 0 0 4px #d1fae5' : 'none',
                                                                mb: 0.5
                                                            }}>
                                                                <Check sx={{ fontSize: 12 }} />
                                                            </Box>
                                                            <Typography variant="caption" sx={{
                                                                fontWeight: 600,
                                                                color: i === 3 ? '#10b981' : 'text.secondary',
                                                                fontSize: '0.55rem',
                                                                textAlign: 'center',
                                                                lineHeight: 1.1,
                                                                mt: 0.5
                                                            }}>
                                                                {step}
                                                            </Typography>
                                                        </Box>
                                                    ))}
                                                </Box>

                                                {/* Actions */}
                                                <Stack spacing={1}>
                                                    <Button size="small" variant="outlined" startIcon={<Description />} fullWidth>
                                                        Invoice
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        startIcon={<Star />}
                                                        fullWidth
                                                        onClick={() => handleRateClick(row)}
                                                        sx={{ bgcolor: PRIMARY_BLUE }}
                                                    >
                                                        Rate Pro
                                                    </Button>
                                                </Stack>
                                            </Box>
                                        </Box>
                                    </Collapse>
                                </Box>
                            );
                        })
                    ) : (
                        <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>No jobs found matching your search.</Box>
                    )}
                </Box>

                {/* Pagination */}
                <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f9fafb' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Showing <Typography component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{totalCount > 0 ? startIndex + 1 : 0}</Typography> to <Typography component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{endIndex}</Typography> of <Typography component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{totalCount}</Typography> results
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        <IconButton
                            size="small"
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1}
                            sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'white', borderRadius: 1 }}
                        >
                            <ChevronLeft fontSize="small" />
                        </IconButton>
                        <IconButton
                            size="small"
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalPages || totalPages === 0}
                            sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'white', borderRadius: 1 }}
                        >
                            <ChevronRight fontSize="small" />
                        </IconButton>
                    </Stack>
                </Box>
            </Paper>

            {/* Feedback Dialog */}
            <Dialog open={feedbackOpen} onClose={handleCloseFeedback} maxWidth="sm" fullWidth>
                <DialogTitle>Rate Your Experience</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2, gap: 2 }}>
                        <Avatar
                            src={selectedJobForFeedback?.proImg}
                            sx={{ width: 64, height: 64, mb: 1 }}
                        />
                        <Typography variant="h6">{selectedJobForFeedback?.proName}</Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            {selectedJobForFeedback?.service} • {selectedJobForFeedback?.id}
                        </Typography>

                        <Rating
                            name="simple-controlled"
                            value={rating}
                            onChange={(event, newValue) => {
                                setRating(newValue);
                            }}
                            size="large"
                            sx={{ my: 2 }}
                        />

                        <TextField
                            autoFocus
                            margin="dense"
                            id="comment"
                            label="Share your feedback (Optional)"
                            type="text"
                            fullWidth
                            multiline
                            rows={4}
                            variant="outlined"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={handleCloseFeedback} color="inherit">Cancel</Button>
                    <Button
                        onClick={handleSubmitFeedback}
                        variant="contained"
                        disabled={!rating || submittingFeedback}
                        sx={{ bgcolor: PRIMARY_BLUE }}
                    >
                        {submittingFeedback ? <CircularProgress size={24} color="inherit" /> : 'Submit Review'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DashboardHistory;
