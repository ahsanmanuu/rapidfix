
import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import {
    Grid, Typography, Card, CardContent, Box, Chip, Avatar, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    InputBase, IconButton, Divider, TextField, Stepper, Step, StepLabel, StepConnector
} from '@mui/material';
import {
    AccessTime, LocationOn, Search, Notifications, Verified,
    AcUnit, WaterDrop, Router, CheckCircle, ReportProblem,
    Forum, Star, Add, Send, ArrowForward, LocalOffer,
    Download as DownloadIcon, History as HistoryIcon,
    DirectionsCar, Build, CheckCircleOutline, PendingActions
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import TechnicianSearchModal from '../TechnicianSearchModal';
import BookingConfirmationModal from '../BookingConfirmationModal';
import api, { createJob } from '../../services/api';

// --- Styled Components Helper ---
const CardStyle = {
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)'
    },
    backgroundColor: '#fff'
};

const DashboardHome = ({ jobs = [], setActiveTab, onOpenSearch }) => {
    const { user } = useAuth();
    const socket = useSocket();
    const theme = useTheme();
    const [searchTerm, setSearchTerm] = useState('');

    // Support Chat State
    const [activeSession, setActiveSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingChat, setLoadingChat] = useState(false);
    const messagesEndRef = React.useRef(null);

    // [NEW] Real-time Data State
    const [activeOffer, setActiveOffer] = useState(null);
    const [complaintsCount, setComplaintsCount] = useState(0);

    // Derived Data: Active Job (Find first job that is NOT completed/cancelled)
    // Priority: Arriving > In Progress > Accepted > Pending
    const activeJob = jobs.find(j => ['arriving', 'on_the_way', 'in_progress', 'accepted', 'pending'].includes(j.status));

    // [NEW] Feedback State
    const [feedbackRating, setFeedbackRating] = useState(0);
    const [feedbackComment, setFeedbackComment] = useState('');
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

    // Initial Data Fetch
    useEffect(() => {
        if (!user) return; // Wait for user

        // 1. Fetch Offers & Complaints
        const fetchDashboardData = async () => {
            try {
                const [offersRes, complaintsRes] = await Promise.all([
                    api.get('/api/offers'),
                    api.get(`/api/complaints/user/${user.id}`)
                ]);

                if (offersRes.data.success && offersRes.data.offers?.length > 0) {
                    setActiveOffer(offersRes.data.offers[0]); // Pick latest/first
                }
                if (complaintsRes.data.success) {
                    setComplaintsCount(complaintsRes.data.complaints?.filter(c => c.status !== 'resolved').length || 0);
                }
            } catch (err) {
                console.error("Dashboard Data Fetch Error:", err);
            }
        };

        // 2. Fetch Support Session
        const fetchSupportData = async () => {
            try {
                const { data: res } = await api.post('/api/support/session', { userId: user.id });
                if (res.success && res.session) {
                    setActiveSession(res.session);
                    const existingMessages = Array.isArray(res.session.messages) ? res.session.messages : [];
                    setMessages(existingMessages);
                }
            } catch (err) {
                console.error("Failed to load support chat:", err);
            }
        };

        fetchDashboardData();
        fetchSupportData();
    }, [user]);

    // Socket Listener for Chat
    useEffect(() => {
        if (!socket) return;

        socket.on('support_message', (msg) => {
            // Only add if it belongs to current session or if we are just starting
            setMessages(prev => {
                // Avoid duplicates
                if (prev.find(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
        });

        return () => {
            socket.off('support_message');
        };
    }, [socket]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        const tempMsg = {
            id: Date.now(), // temp id
            sender: 'user',
            message: newMessage,
            createdAt: new Date().toISOString()
        };

        // Optimistic UI update
        setMessages(prev => [...prev, tempMsg]);
        setNewMessage('');

        try {
            let sessionId = activeSession?.id;

            // If no active session, create one
            if (!sessionId) {
                const { data: newSession } = await api.post('/support/session', { userId: user.id });
                setActiveSession(newSession);
                sessionId = newSession.id;
            }

            // Send message
            await api.post('/support/message', {
                sessionId,
                message: tempMsg.message,
                sender: 'user'
            });

        } catch (err) {
            console.error("Failed to send message:", err);
            // Optionally remove the optimistic message or show error
        }
    };

    // Derived Data
    const completedJobs = jobs.filter(j => j.status === 'completed');
    // Find a job pending feedback (mock logic or real if backend supports 'feedbackGiven' flag)
    const jobForFeedback = completedJobs.find(j => !j.feedbackGiven) || completedJobs[0];
    const recentActivity = jobs.slice(0, 5);

    const handleBookNow = (serviceTitle) => {
        onOpenSearch({
            serviceType: serviceTitle,
            location: user?.location,
            contactName: user?.name,
            contactPhone: user?.phone,
            description: 'Quick Request'
        });
    };

    const handleSubmitFeedback = async () => {
        if (!feedbackRating) return alert("Please select a rating.");
        setIsSubmittingFeedback(true);
        try {
            await api.post('/feedback', {
                userId: user.id,
                technicianId: jobForFeedback.technicianId || jobForFeedback.technician?.id, // Ensure correct ID access
                jobId: jobForFeedback.id,
                ratings: {
                    overall: feedbackRating,
                    timeliness: feedbackRating,
                    expertise: feedbackRating,
                    professionalism: feedbackRating,
                    honesty: feedbackRating,
                    behavior: feedbackRating,
                    knowledge: feedbackRating,
                    respect: feedbackRating
                },
                comment: feedbackComment
            });
            alert('Feedback submitted! Thank you.');
            // Ideally remove the card or refresh jobs. reloading page for simplicity:
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert('Failed to submit feedback.');
        } finally {
            setIsSubmittingFeedback(false);
        }
    };

    const handleReportProblem = () => {
        if (setActiveTab) {
            setActiveTab('complaints');
        } else {
            console.warn("setActiveTab prop missing");
        }
    };

    return (
        <Box sx={{ width: '100%', fontFamily: 'Inter, sans-serif' }}>

            {/* --- Hero Banner --- */}
            <Box sx={{
                width: '100%',
                background: 'linear-gradient(to right, #2563eb, #4338ca)',
                borderRadius: '16px',
                p: { xs: 3, md: 4 },
                color: '#fff',
                mb: 4,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.2)'
            }}>
                <Box sx={{ position: 'absolute', top: 0, right: 0, width: 256, height: 256, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%', transform: 'translate(30%, -30%)', filter: 'blur(40px)' }} />

                <Grid container alignItems="center" spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
                    <Grid item xs={12} md={8}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Chip label={activeOffer ? "Special Offer" : "Welcome"} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 'bold', borderRadius: '4px' }} />
                            <Verified fontSize="small" sx={{ opacity: 0.8 }} />
                        </Box>
                        <Typography variant="h4" fontWeight="900" sx={{ letterSpacing: '-0.025em', mb: 1 }}>
                            {activeOffer ? activeOffer.title : `Welcome back, ${user?.name?.split(' ')[0] || 'User'}!`}
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'blue.100', fontWeight: 500 }}>
                            {activeOffer ? activeOffer.description : "Find the perfect professional for your home needs today."}
                        </Typography>
                    </Grid>
                    {activeOffer && (
                        <Grid item xs={12} md={4}>
                            <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" sx={{ color: 'blue.100', textTransform: 'uppercase', fontWeight: 600 }}>Promo Code</Typography>
                                    <Typography variant="h5" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{activeOffer.code}</Typography>
                                </Box>
                                <Button variant="contained" onClick={() => navigator.clipboard.writeText(activeOffer.code)} sx={{ bgcolor: '#fff', color: '#2563eb', fontWeight: 'bold', '&:hover': { bgcolor: '#eff6ff' } }}>
                                    Copy Code
                                </Button>
                            </Box>
                        </Grid>
                    )}
                </Grid>
            </Box>

            {/* Main Dashboard Layout (Flexbox) */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>

                {/* --- Left Column (Flex ~58%) --- */}
                <Box sx={{ flex: 7, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>


                    {/* 1. Job History Table */}
                    <Card sx={{ ...CardStyle, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                        <Box sx={{ p: 2, borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                            <Box>
                                <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#0f172a' }}>
                                    <HistoryIcon sx={{ color: '#2563eb' }} />
                                    Job History
                                </Typography>
                                <Typography variant="caption" color="textSecondary">Track your past services</Typography>
                            </Box>
                            <Box sx={{ position: 'relative' }}>
                                <Search sx={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '1rem' }} />
                                <InputBase
                                    placeholder="Search..."
                                    sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', pl: 4, pr: 2, py: 0.5, fontSize: '0.8rem', width: 140 }}
                                />
                            </Box>
                        </Box>
                        <TableContainer sx={{ maxHeight: 600 }}> {/* Expanded height for better alignment */}
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>Service Details</TableCell>
                                        <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>Date</TableCell>
                                        <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>Status</TableCell>
                                        <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 'bold' }}>Invoice</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {recentActivity.map((job) => (
                                        <TableRow key={job.id} hover>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Avatar variant="rounded" sx={{ bgcolor: '#eff6ff', color: '#2563eb', width: 32, height: 32 }}>
                                                        {job.serviceType.includes('AC') ? <AcUnit fontSize="small" /> : job.serviceType.includes('Plumb') ? <WaterDrop fontSize="small" /> : <Router fontSize="small" />}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="bold" sx={{ color: '#0f172a' }}>{job.serviceType}</Typography>
                                                        <Typography variant="caption" color="textSecondary" noWrap>Pro: {job.technician?.name || 'Pending'}</Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ color: '#475569', fontSize: '0.85rem' }}>
                                                {new Date(job.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={job.status}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: job.status === 'completed' ? '#dcfce7' : '#f1f5f9',
                                                        color: job.status === 'completed' ? '#15803d' : '#475569',
                                                        fontWeight: 'bold',
                                                        textTransform: 'capitalize',
                                                        height: 22,
                                                        fontSize: '0.7rem'
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {job.status === 'completed' ? (
                                                    <Typography
                                                        variant="caption"
                                                        sx={{ color: '#2563eb', fontWeight: 'bold', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const token = localStorage.getItem('sessionToken');
                                                            if (!token || token === 'null' || token === 'undefined') {
                                                                alert("Session expired. Please log in again.");
                                                                return;
                                                            }
                                                            const downloadUrl = `${window.location.origin}/api/invoices/${job.id}/download?token=${token}`;
                                                            console.log('[DashboardHome] Invoice Download URL:', downloadUrl);
                                                            window.open(downloadUrl, '_blank');
                                                        }}
                                                    >
                                                        Download
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="caption" color="textSecondary" sx={{ fontStyle: 'italic' }}>--</Typography>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Card>

                    {/* 2. Feedback Card (Moved Here) */}
                    {jobForFeedback && (
                        <Card sx={{ ...CardStyle, position: 'relative', overflow: 'hidden' }}>
                            <Box sx={{ position: 'absolute', right: 0, top: 0, width: 80, height: 80, bgcolor: 'rgba(250, 204, 21, 0.1)', borderRadius: '0 0 0 100%', zIndex: 0 }} />
                            <CardContent sx={{ p: 2, position: 'relative', zIndex: 1 }}>
                                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Star sx={{ color: '#eab308' }} /> Leave Feedback
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    How was your <b>{jobForFeedback.technician?.serviceType || jobForFeedback.serviceType}</b>?
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                            key={s}
                                            onClick={() => !isSubmittingFeedback && setFeedbackRating(s)}
                                            sx={{
                                                color: s <= feedbackRating ? '#eab308' : '#cbd5e1',
                                                fontSize: 28,
                                                cursor: isSubmittingFeedback ? 'default' : 'pointer',
                                                '&:hover': { color: isSubmittingFeedback ? undefined : '#eab308' }
                                            }}
                                        />
                                    ))}
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <TextField
                                        fullWidth
                                        placeholder={feedbackRating > 0 ? "Tell us more..." : "Select a rating first..."}
                                        size="small"
                                        value={feedbackComment}
                                        onChange={(e) => setFeedbackComment(e.target.value)}
                                        disabled={isSubmittingFeedback}
                                        sx={{ bgcolor: '#f8fafc' }}
                                    />
                                    <Button
                                        variant="contained"
                                        size="small"
                                        onClick={handleSubmitFeedback}
                                        disabled={isSubmittingFeedback || feedbackRating === 0}
                                        sx={{ bgcolor: '#0f172a', textTransform: 'none' }}
                                    >
                                        {isSubmittingFeedback ? '...' : 'Submit'}
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    )}

                    {/* 3. Upsell Card (Moved Here) */}
                    <Card sx={{ ...CardStyle, background: 'linear-gradient(to right, #eff6ff, #fff)' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ width: 48, height: 48, borderRadius: '8px', bgcolor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                    <WaterDrop color="primary" />
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" fontWeight="bold">Pool Cleaning</Typography>
                                    <Typography variant="caption" color="textSecondary">Summer Special Offer</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="h6" fontWeight="bold" color="primary">$120</Typography>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => setActiveTab && setActiveTab('offers')}
                                    sx={{ borderRadius: '6px', textTransform: 'none', mt: 0.5 }}
                                >
                                    View
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* 4. Real-time Job Status Timeline Widget */}
                    {activeJob ? (
                        <Card sx={{ ...CardStyle, p: 3, position: 'relative', overflow: 'hidden' }}>
                            {/* CSS Animation Injection */}
                            <style dangerouslySetInnerHTML={{
                                __html: `
                                @keyframes pulse-ring {
                                    0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7); }
                                    70% { box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); }
                                    100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
                                }
                                @keyframes car-bounce {
                                    0%, 100% { transform: translateY(0); }
                                    50% { transform: translateY(-3px); }
                                }
                            `}} />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                                <Box>
                                    <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <AccessTime color="primary" /> Job Timeline
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">Active Job: <b>{activeJob.serviceType}</b></Typography>
                                </Box>
                                <Chip
                                    label="LIVE TRACKING"
                                    size="small"
                                    color="error"
                                    icon={<Verified style={{ animation: 'pulse-ring 2s infinite', borderRadius: '50%' }} />}
                                    sx={{ fontWeight: 'bold', animation: 'pulse-ring 2s infinite', bgcolor: '#ffe4e6', color: '#be123c', border: 'none' }}
                                />
                            </Box>

                            <Stepper alternativeLabel activeStep={
                                activeJob.status === 'pending' || activeJob.status === 'waiting_confirmation' ? 0 :
                                    activeJob.status === 'accepted' ? 1 :
                                        ['arriving', 'on_the_way', 'in_progress'].includes(activeJob.status) ? 2 : 3
                            } connector={<StepConnector sx={{ '& .MuiStepConnector-line': { borderColor: '#e2e8f0' } }} />}>
                                {[
                                    { label: 'Requested', time: new Date(activeJob.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), icon: <PendingActions /> },
                                    { label: 'Accepted', time: activeJob.status !== 'pending' ? 'Done' : '--:--', icon: <CheckCircle /> },
                                    { label: 'On The Way', time: ['arriving', 'on_the_way', 'in_progress', 'completed'].includes(activeJob.status) ? 'Live' : '--:--', icon: <DirectionsCar /> },
                                    { label: 'Finished', time: '--:--', icon: <Build /> },
                                ].map((step, index) => (
                                    <Step key={step.label}>
                                        <StepLabel
                                            StepIconComponent={() => {
                                                const currentStep = activeJob.status === 'pending' || activeJob.status === 'waiting_confirmation' ? 0 :
                                                    activeJob.status === 'accepted' ? 1 :
                                                        ['arriving', 'on_the_way', 'in_progress'].includes(activeJob.status) ? 2 : 3;

                                                const isActive = index === currentStep;
                                                const isCompleted = index < currentStep;

                                                return (
                                                    <Box sx={{
                                                        width: 40, height: 40, borderRadius: '50%',
                                                        bgcolor: isActive ? '#2563eb' : (isCompleted ? '#dcfce7' : '#f1f5f9'),
                                                        color: isActive ? '#fff' : (isCompleted ? '#16a34a' : '#94a3b8'),
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        zIndex: 1, position: 'relative',
                                                        boxShadow: isActive ? '0 0 0 4px rgba(37, 99, 235, 0.2)' : 'none',
                                                        animation: isActive ? 'pulse-ring 2s infinite' : 'none'
                                                    }}>
                                                        {isActive && index === 2 ? <DirectionsCar fontSize="small" sx={{ animation: 'car-bounce 1s infinite' }} /> :
                                                            isCompleted ? <CheckCircleOutline fontSize="small" /> : step.icon}
                                                    </Box>
                                                );
                                            }}
                                        >
                                            <Typography variant="body2" fontWeight="bold" sx={{ color: '#0f172a' }}>{step.label}</Typography>
                                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>{step.time}</Typography>
                                        </StepLabel>
                                    </Step>
                                ))}
                            </Stepper>

                            {/* Map/Technician Info Mini-Section */}
                            {activeJob.technician ? (
                                <Box sx={{ mt: 3, p: 2, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar src={activeJob.technician.photo} sx={{ width: 48, height: 48, bgcolor: '#0f172a' }}>
                                        {activeJob.technician.name?.[0] || 'T'}
                                    </Avatar>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="subtitle2" fontWeight="bold">{activeJob.technician.name}</Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {activeJob.status === 'arriving' || activeJob.status === 'on_the_way'
                                                ? 'Arriving soon • Live GPS'
                                                : 'Technician Assigned'}
                                        </Typography>
                                    </Box>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        color="primary"
                                        href={activeJob.technician.phone ? `tel:${activeJob.technician.phone}` : '#'}
                                        sx={{ borderRadius: '8px', textTransform: 'none' }}
                                    >
                                        Call
                                    </Button>
                                </Box>
                            ) : (
                                <Box sx={{ mt: 3, p: 2, bgcolor: '#fffbed', borderRadius: '12px', border: '1px solid #fcd34d', display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <PendingActions sx={{ color: '#d97706' }} />
                                    <Typography variant="body2" color="#b45309">Looking for a nearby professional...</Typography>
                                </Box>
                            )}
                        </Card>
                    ) : (
                        // Fallback/Empty State for Active Job Widget
                        <Card sx={{ ...CardStyle, p: 3, borderStyle: 'dashed', borderColor: '#cbd5e1', bgcolor: '#f8fafc' }}>
                            <Box sx={{ textAlign: 'center', py: 2 }}>
                                <HistoryIcon sx={{ fontSize: 40, color: '#94a3b8', mb: 1 }} />
                                <Typography variant="subtitle1" fontWeight="bold" color="textSecondary">No Active Jobs</Typography>
                                <Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: 'block' }}>Ready to book your next service?</Typography>
                                <Button variant="outlined" size="small" onClick={() => handleBookNow('General')} sx={{ borderRadius: '8px' }}>Book Now</Button>
                            </Box>
                        </Card>
                    )}

                </Box>

                {/* --- Right Column (Flex ~42%) --- */}
                {/* Contains: Live Chat, Complaints */}
                <Box sx={{ flex: 5, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>

                    {/* 1. Live Support Widget */}
                    <Card sx={{ ...CardStyle, overflow: 'hidden', height: 600, display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ p: 2, bgcolor: '#2563eb', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Forum fontSize="small" />
                                <Typography variant="subtitle2" fontWeight="bold">Live Support</Typography>
                            </Box>
                            <Chip label="Online" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', height: 20, fontSize: '0.65rem' }} />
                        </Box>
                        <Box sx={{ flex: 1, bgcolor: '#f8fafc', p: 2, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
                            {messages.map((msg) => (
                                <Box
                                    key={msg.id}
                                    sx={{
                                        display: 'flex',
                                        gap: 1,
                                        flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row'
                                    }}
                                >
                                    <Avatar
                                        sx={{
                                            width: 28,
                                            height: 28,
                                            bgcolor: msg.sender === 'user' ? '#eff6ff' : '#e2e8f0',
                                            color: msg.sender === 'user' ? '#2563eb' : '#64748b',
                                            fontSize: '0.6rem'
                                        }}
                                    >
                                        {msg.sender === 'user' ? 'ME' : 'S'}
                                    </Avatar>
                                    <Box sx={{
                                        bgcolor: msg.sender === 'user' ? '#2563eb' : '#fff',
                                        color: msg.sender === 'user' ? '#fff' : 'text.primary',
                                        p: 1.5,
                                        borderRadius: msg.sender === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                                        border: msg.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                                        maxWidth: '85%'
                                    }}>
                                        <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.4 }}>{msg.message}</Typography>
                                    </Box>
                                </Box>
                            ))}
                            <div ref={messagesEndRef} />
                        </Box>
                        <Box sx={{ p: 1.5, borderTop: '1px solid #e2e8f0' }}>
                            <Box sx={{ position: 'relative' }}>
                                <InputBase
                                    fullWidth
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    sx={{ bgcolor: '#fff', borderRadius: '20px', pl: 2, pr: 5, py: 0.5, border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
                                />
                                <IconButton
                                    size="small"
                                    onClick={handleSendMessage}
                                    sx={{ position: 'absolute', right: 4, top: 2, color: '#2563eb' }}
                                >
                                    <Send fontSize="small" />
                                </IconButton>
                            </Box>
                        </Box>
                    </Card>

                    {/* 2. Complaints Widget */}
                    <Card sx={{ ...CardStyle }}>
                        <CardContent sx={{ p: 2 }}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ReportProblem color="error" fontSize="small" /> Complaints & Issues
                            </Typography>
                            <Box sx={{ bgcolor: '#fef2f2', borderRadius: '8px', p: 2, textAlign: 'center', border: '1px solid #fee2e2', mb: 2 }}>
                                {complaintsCount > 0 ? (
                                    <>
                                        <ReportProblem sx={{ fontSize: 32, color: '#ef4444', mb: 1 }} />
                                        <Typography variant="body2" fontWeight="bold" color="error">{complaintsCount} Open Issue{complaintsCount > 1 ? 's' : ''}</Typography>
                                        <Typography variant="caption" color="textSecondary">Our support team is on it.</Typography>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle sx={{ fontSize: 32, color: '#16a34a', mb: 1 }} />
                                        <Typography variant="body2" fontWeight="bold" color="#16a34a">No Open Issues</Typography>
                                        <Typography variant="caption" color="textSecondary">Everything is running smoothly.</Typography>
                                    </>
                                )}
                            </Box>
                            <Button
                                fullWidth
                                variant="outlined"
                                color="error"
                                size="small"
                                onClick={handleReportProblem}
                                sx={{ borderRadius: '8px', textTransform: 'none' }}
                            >
                                Report a Problem
                            </Button>
                        </CardContent>
                    </Card>

                </Box>
            </Box>

        </Box>
    );
};

export default DashboardHome;
