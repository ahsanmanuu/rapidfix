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
import { useSocket } from '../../context/SocketContext';
import api, { getMyJobs, updateUserJob } from '../../services/api';
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
    HomeRepairService,
    Edit,
    Save
} from '@mui/icons-material';

const PRIMARY_BLUE = '#2463eb';
const BG_LIGHT = '#f6f6f8';
const TEXT_DARK = '#111621';

// --- Helpers ---
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

// --- Components ---
const JobRow = ({ row, isExpanded, onToggle, handleRateClick, currentUser, onJobUpdate }) => {
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [editedNote, setEditedNote] = useState(row.fullDescription || '');
    const [savingNote, setSavingNote] = useState(false);

    // Sync state when row updates (e.g. via socket)
    useEffect(() => {
        if (!isEditingNote) {
            setEditedNote(row.fullDescription || '');
        }
    }, [row.fullDescription, isEditingNote]);

    const handleSaveNote = async () => {
        setSavingNote(true);
        try {
            await updateUserJob(row.realJobId, { description: editedNote });
            // Optimistic Update
            if (onJobUpdate) {
                onJobUpdate({ id: row.realJobId, description: editedNote });
            }
            setIsEditingNote(false);
            // Socket will update the UI eventually, but this ensures instant feedback
        } catch (err) {
            alert('Failed to save note: ' + err.message);
        } finally {
            setSavingNote(false);
        }
    };

    const s = (row.status || '').toLowerCase();

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

                            {/* Timeline */}
                            <Box sx={{ flex: 1, width: '100%', mb: 3 }}>
                                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>Service Timeline</Typography>
                                <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'space-between', width: '100%', px: 0 }}>
                                    <Box sx={{ position: 'absolute', top: { xs: '11px', md: '14px' }, left: 0, right: 0, height: 2, bgcolor: 'grey.300', zIndex: 0 }} />
                                    {['Request Received', 'Pro Assigned', 'Work Started', 'Completed'].map((step, index) => {
                                        let currentProgressIndex = 0;
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
                            <Box sx={{ display: 'flex', gap: 2, mb: 3, width: { xs: '100%', md: 'auto' }, flexDirection: { xs: 'column', sm: 'row' } }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<Description />}
                                    disabled={s !== 'completed'}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const token = localStorage.getItem('sessionToken');
                                        if (!token || token === 'null' || token === 'undefined') {
                                            alert("Session expired. Please log in again.");
                                            return;
                                        }
                                        const downloadUrl = `${window.location.origin}/api/invoices/${row.realJobId}/download?token=${token}`;
                                        window.open(downloadUrl, '_blank');
                                    }}
                                    sx={{ textTransform: 'none', color: 'text.primary', borderColor: 'grey.300', width: { xs: '100%', sm: 'auto' } }}
                                >
                                    Download Invoice
                                </Button>
                                {row.feedbackGiven ? (
                                    <Button
                                        variant="outlined"
                                        startIcon={<CheckCircle />}
                                        disabled
                                        sx={{ textTransform: 'none', color: '#16a34a', borderColor: '#16a34a', width: { xs: '100%', sm: 'auto' } }}
                                    >
                                        Rated ✓
                                    </Button>
                                ) : (
                                    <Button
                                        variant="contained"
                                        startIcon={<Star />}
                                        disabled={s !== 'completed'}
                                        onClick={() => handleRateClick(row)}
                                        sx={{ textTransform: 'none', bgcolor: PRIMARY_BLUE, '&:hover': { bgcolor: '#1d4ed8' }, width: { xs: '100%', sm: 'auto' } }}
                                    >
                                        Rate Professional
                                    </Button>
                                )}
                            </Box>

                            {/* Details - Dynamically rendered with Edit Mode */}
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'white', height: '100%' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                            <Typography variant="caption" sx={{ textTransform: 'uppercase', color: 'text.secondary', fontWeight: 600 }}>Customer Note</Typography>
                                            {!isEditingNote && (
                                                <IconButton size="small" onClick={() => setIsEditingNote(true)}>
                                                    <Edit fontSize="small" color="primary" />
                                                </IconButton>
                                            )}
                                        </Box>

                                        {isEditingNote ? (
                                            <Box>
                                                <TextField
                                                    fullWidth
                                                    multiline
                                                    rows={3}
                                                    size="small"
                                                    value={editedNote}
                                                    onChange={(e) => setEditedNote(e.target.value)}
                                                    sx={{ mb: 1 }}
                                                />
                                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                                    <Button size="small" onClick={() => { setIsEditingNote(false); setEditedNote(row.fullDescription || ''); }}>
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        startIcon={<Save />}
                                                        onClick={handleSaveNote}
                                                        disabled={savingNote}
                                                    >
                                                        Save
                                                    </Button>
                                                </Box>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.primary' }}>
                                                "{row.fullDescription}"
                                            </Typography>
                                        )}
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'white', height: '100%' }}>
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

const MobileJobCard = ({ row, isExpanded, onToggle, handleRateClick, onJobUpdate }) => {
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [editedNote, setEditedNote] = useState(row.fullDescription || '');
    const [savingNote, setSavingNote] = useState(false);

    useEffect(() => {
        if (!isEditingNote) {
            setEditedNote(row.fullDescription || '');
        }
    }, [row.fullDescription, isEditingNote]);

    const handleSaveNote = async () => {
        setSavingNote(true);
        try {
            await updateUserJob(row.realJobId, { description: editedNote });
            if (onJobUpdate) {
                onJobUpdate({ id: row.realJobId, description: editedNote });
            }
            setIsEditingNote(false);
        } catch (err) {
            alert('Failed to save note: ' + err.message);
        } finally {
            setSavingNote(false);
        }
    };

    return (
        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: isExpanded ? 'rgba(36, 99, 235, 0.04)' : 'white' }}>
            {/* Mobile Row Header */}
            <Box
                onClick={onToggle}
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

                        {/* Mobile Note Edit */}
                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>Customer Note</Typography>
                                {!isEditingNote && (
                                    <IconButton size="small" onClick={() => setIsEditingNote(true)} sx={{ p: 0.5 }}>
                                        <Edit sx={{ fontSize: 16 }} color="primary" />
                                    </IconButton>
                                )}
                            </Box>
                            {isEditingNote ? (
                                <Box>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={2}
                                        size="small"
                                        value={editedNote}
                                        onChange={(e) => setEditedNote(e.target.value)}
                                        sx={{ mb: 1 }}
                                    />
                                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                        <Button size="small" onClick={() => { setIsEditingNote(false); setEditedNote(row.fullDescription || ''); }}>
                                            Cancel
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="contained"
                                            onClick={handleSaveNote}
                                            disabled={savingNote}
                                        >
                                            Save
                                        </Button>
                                    </Box>
                                </Box>
                            ) : (
                                <Typography variant="body2" sx={{ fontStyle: 'italic', mb: 2, fontSize: '0.85rem' }}>"{row.fullDescription}"</Typography>
                            )}
                        </Box>

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
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={<Description />}
                                fullWidth
                                onClick={() => {
                                    const token = localStorage.getItem('sessionToken');
                                    if (!token || token === 'null' || token === 'undefined') {
                                        alert("Session expired. Please log in again.");
                                        return;
                                    }
                                    const directUrl = `${window.location.origin}/api/invoices/${row.realJobId}/download?token=${token}`;
                                    window.open(directUrl, '_blank');
                                }}
                            >
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
};

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

    const { user: currentUser } = useAuth();

    // Define fetch logic
    const fetchFiltered = async (overrideParams = {}) => {
        if (!currentUser) return;
        setLoading(true);
        try {
            // Robust param construction: default to current state, but allow overrides. 
            // Crucial: defaulting to '' for undefined dates to prevent "undefined" string at server.
            const getVal = (key, current) => overrideParams[key] !== undefined ? overrideParams[key] : current;

            const params = {
                q: getVal('q', search),
                status: getVal('status', statusFilter) === 'all' ? '' : getVal('status', statusFilter),
                start: getVal('start', startDate) || '',
                end: getVal('end', endDate) || ''
            };
            const res = await getMyJobs(currentUser.id, params);
            // console.log("FetchFiltered Response:", res.data);
            if (res.data.success) {
                const fetchedJobs = res.data.jobs || [];
                setLocalJobs(fetchedJobs);
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

    // --- Real-time Updates (Socket) ---
    const { socket } = useSocket();

    // [NEW] Manual Job Update Handler for Optimistic UI
    const handleManualJobUpdate = (updatedFields) => {
        setLocalJobs(prevJobs => prevJobs.map(j => j.id === updatedFields.id ? { ...j, ...updatedFields } : j));
    };

    useEffect(() => {
        if (!socket) return;

        const handleJobUpdate = (updatedJob) => {
            if (!updatedJob || !updatedJob.id) return;
            // console.log("Real-time Job Update Received:", updatedJob);

            setLocalJobs(prevJobs => {
                // Check if job exists in current list
                const exists = prevJobs.some(j => j.id === updatedJob.id);
                if (exists) {
                    return prevJobs.map(j => j.id === updatedJob.id ? { ...j, ...updatedJob } : j);
                } else {
                    // Optionally prepend if it's a new job and matches filters?
                    // For now, let's just update existing ones to minimize jumps
                    return prevJobs;
                }
            });
        };



        socket.on('job_status_updated', handleJobUpdate);
        socket.on('job_updated', handleJobUpdate); // Listen to both just in case

        return () => {
            socket.off('job_status_updated', handleJobUpdate);
            socket.off('job_updated', handleJobUpdate);
        };
    }, [socket]);

    // CSV Export
    // CSV Export - Robust Server-Fetch Implementation
    // CSV Export - Hybrid Robust Implementation (Server Fetch -> Local Fallback)
    const handleExport = async () => {
        let jobsToExport = [];
        let usedFallback = false;

        const generateCSV = (data, source) => {
            if (!data || data.length === 0) {
                alert(`No jobs found to export (${source}).`);
                return;
            }
            alert(`Generating CSV with ${data.length} jobs (${source})...`);

            const headers = ['Job ID', 'Service', 'Technician', 'Date', 'Time', 'Status', 'Cost', 'Total'];
            const rows = data.map(j => [
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
            link.setAttribute('download', `job_history_${startDate || 'all'}_to_${endDate || 'all'}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        // 1. Try Server Fetch
        if (currentUser) {
            setLoading(true);
            try {
                const exportParams = {
                    q: search || '',
                    status: statusFilter === 'all' ? '' : (statusFilter || ''),
                    start: startDate || '',
                    end: endDate || ''
                };
                console.log("Attempting Server Export:", exportParams);
                const res = await getMyJobs(currentUser.id, exportParams);
                if (res.data.success && res.data.jobs) {
                    jobsToExport = res.data.jobs;
                    console.log(`Server Export Success: ${jobsToExport.length} jobs retrieved.`);
                } else {
                    throw new Error("Server returned success:false");
                }
            } catch (err) {
                const errMsg = err.response?.data?.error || err.message;
                console.warn(`Server Export Failed (${errMsg}), using local view fallback.`);
                usedFallback = true;
                jobsToExport = localJobs; // Fallback
                generateCSV(jobsToExport, `Visible View - Server Error: ${errMsg}`);
                return; // Exit here as we handled generation
            } finally {
                setLoading(false);
            }
        } else {
            console.warn("No user context, using local jobs.");
            usedFallback = true;
            jobsToExport = localJobs;
            generateCSV(jobsToExport, "Visible View - Missing User Context");
            return;
        }

        // 2. Execute Export
        if (usedFallback && jobsToExport.length > 0) {
            // Optional: notify user they are getting local data
            console.log("Exporting local view data.");
        }

        generateCSV(jobsToExport, usedFallback ? 'Visible View' : 'Server Data');
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
        if (!rating) {
            alert("Please select a rating first.");
            return;
        }
        if (!selectedJobForFeedback?.technicianId) {
            alert("Cannot submit feedback: Technician information is missing for this job.");
            console.error("[Feedback] Missing technicianId:", selectedJobForFeedback);
            return;
        }

        setSubmittingFeedback(true);
        try {
            // Build the ratings object expected by the backend
            // The backend requires: timeliness, expertise, professionalism, honesty, behavior, knowledge, respect, overall
            const ratings = {
                timeliness: rating,
                expertise: rating,
                professionalism: rating,
                honesty: rating,
                behavior: rating,
                knowledge: rating,
                respect: rating,
                overall: rating
            };

            console.log("[Feedback] Submitting:", {
                jobId: selectedJobForFeedback.realJobId,
                technicianId: selectedJobForFeedback.technicianId,
                userId: currentUser.id,
                ratings,
                comment
            });

            await api.post('/feedback', {
                jobId: selectedJobForFeedback.realJobId,
                technicianId: selectedJobForFeedback.technicianId,
                userId: currentUser.id,
                ratings,
                comment,
                serviceType: selectedJobForFeedback.service
            });

            alert("Thank you! Your feedback has been submitted successfully.");

            // Update local state to immediately reflect the rating
            setLocalJobs(prevJobs => prevJobs.map(job =>
                job.id === selectedJobForFeedback.realJobId
                    ? { ...job, feedbackGiven: true }
                    : job
            ));

            handleCloseFeedback();
        } catch (error) {
            console.error("[Feedback] Submission Error:", error);
            const errorMsg = error.response?.data?.error || error.message || "Unknown error";
            alert(`Failed to submit feedback: ${errorMsg}`);
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
    // Helpers moved to module scope

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
            fullDescription: job.description || "Quick Tile Booking",
            professionalNote: job.professionalNote || "No notes from professional.",
            timeline: job.timeline || [],
            // Hidden fields for logic
            realJobId: job.id,
            technicianId: job.technician?.id,
            feedbackGiven: job.feedbackGiven || false
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

    // Row and MobileJobCard are now defined outside Component to preserve state during re-renders.

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
                                    <JobRow
                                        key={row.id}
                                        row={row}
                                        isExpanded={expandedId === index}
                                        onToggle={() => handleToggle(index)}
                                        handleRateClick={handleRateClick}
                                        currentUser={currentUser}
                                        onJobUpdate={handleManualJobUpdate}
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
                        currentRows.map((row, index) => (
                            <MobileJobCard
                                key={row.id}
                                row={row}
                                isExpanded={expandedId === index}
                                onToggle={() => handleToggle(index)}
                                handleRateClick={handleRateClick}
                                onJobUpdate={handleManualJobUpdate}
                            />
                        ))
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
