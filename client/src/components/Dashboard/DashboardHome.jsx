
import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import {
    Grid, Typography, Card, CardContent, Box, Chip, Avatar, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    InputBase, IconButton, Divider, TextField
} from '@mui/material';
import {
    AccessTime, LocationOn, Search, Notifications, Verified,
    AcUnit, WaterDrop, Router, CheckCircle, ReportProblem,
    Forum, Star, Add, Send, ArrowForward, LocalOffer,
    Download as DownloadIcon, History as HistoryIcon
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import TechnicianSearchModal from '../TechnicianSearchModal';
import BookingConfirmationModal from '../BookingConfirmationModal';
import { createJob } from '../../services/api';

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

const DashboardHome = ({ jobs = [] }) => {
    const { user } = useAuth();
    const theme = useTheme();
    const [searchTerm, setSearchTerm] = useState('');

    // Booking State
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedTechnician, setSelectedTechnician] = useState(null);
    const [bookingParams, setBookingParams] = useState(null);

    // Derived Data
    const completedJobs = jobs.filter(j => j.status === 'completed');
    // Find a job pending feedback (mock logic or real if backend supports 'feedbackGiven' flag)
    const jobForFeedback = completedJobs.find(j => !j.feedbackGiven) || completedJobs[0];
    const recentActivity = jobs.slice(0, 5);

    const handleBookNow = (serviceTitle) => {
        setBookingParams({
            serviceType: serviceTitle,
            location: user?.location,
            contactName: user?.name,
            contactPhone: user?.phone,
            description: 'Quick Request'
        });
        setIsSearchOpen(true);
    };

    const handleConfirmBooking = async (finalData) => {
        try {
            const payload = { ...bookingParams, ...finalData, userId: user.id };
            await createJob(payload);
            setIsConfirmOpen(false);
            alert(`Booking Confirmed!`);
            window.location.reload();
        } catch (e) {
            console.error(e);
            alert('Booking failed');
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>

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
                            <Chip label="Limited Time" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 'bold', borderRadius: '4px' }} />
                            <Verified fontSize="small" sx={{ opacity: 0.8 }} />
                        </Box>
                        <Typography variant="h4" fontWeight="900" sx={{ letterSpacing: '-0.025em', mb: 1 }}>
                            Summer Refresh Sale!
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'blue.100', fontWeight: 500 }}>
                            Get 20% off all HVAC and Deep Cleaning services this week.
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" sx={{ color: 'blue.100', textTransform: 'uppercase', fontWeight: 600 }}>Promo Code</Typography>
                                <Typography variant="h5" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>SUMMER20</Typography>
                            </Box>
                            <Button variant="contained" sx={{ bgcolor: '#fff', color: '#2563eb', fontWeight: 'bold', '&:hover': { bgcolor: '#eff6ff' } }}>
                                Copy Code
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </Box>

            <Grid container spacing={4}>
                {/* --- Left Column (Main) --- */}
                <Grid item xs={12} lg={8}>

                    {/* Job History Table */}
                    <Card sx={{ ...CardStyle, mb: 4, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                        <Box sx={{ p: 3, borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                            <Box>
                                <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#0f172a' }}>
                                    <HistoryIcon sx={{ color: '#2563eb' }} />
                                    Job History
                                </Typography>
                                <Typography variant="body2" color="textSecondary">Track your past services and payments</Typography>
                            </Box>
                            <Box sx={{ position: 'relative' }}>
                                <Search sx={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <InputBase
                                    placeholder="Search invoices..."
                                    sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', pl: 5, pr: 2, py: 0.5, fontSize: '0.875rem', width: { xs: '100%', sm: 200 } }}
                                />
                            </Box>
                        </Box>
                        <TableContainer>
                            <Table sx={{ minWidth: 650 }}>
                                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                    <TableRow>
                                        <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>Service Details</TableCell>
                                        <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>Date</TableCell>
                                        <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>Status</TableCell>
                                        <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>Invoice</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {recentActivity.map((job) => (
                                        <TableRow key={job.id} hover>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Avatar variant="rounded" sx={{ bgcolor: '#eff6ff', color: '#2563eb' }}>
                                                        {job.serviceType.includes('AC') ? <AcUnit /> : job.serviceType.includes('Plumb') ? <WaterDrop /> : <Router />}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#0f172a' }}>{job.serviceType}</Typography>
                                                        <Typography variant="caption" color="textSecondary">Pro: {job.technicianName || 'Pending'}</Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ color: '#475569', fontWeight: 500 }}>
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
                                                        textTransform: 'capitalize'
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {job.status === 'completed' ? (
                                                    <Button size="small" startIcon={<DownloadIcon />} sx={{ textTransform: 'none', borderRadius: '6px', color: '#2563eb', bgcolor: 'rgba(37, 99, 235, 0.05)' }}>
                                                        PDF
                                                    </Button>
                                                ) : (
                                                    <Typography variant="caption" color="textSecondary" sx={{ fontStyle: 'italic' }}>No Invoice</Typography>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {recentActivity.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ py: 3, color: '#64748b' }}>No recent jobs found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Box sx={{ p: 2, bgcolor: '#f8fafc', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                            <Button sx={{ textTransform: 'none', fontWeight: 'bold', color: '#2563eb' }}>View All Transactions</Button>
                        </Box>
                    </Card>

                    {/* Feedback Card */}
                    {jobForFeedback && (
                        <Card sx={{ ...CardStyle, position: 'relative', overflow: 'hidden' }}>
                            <Box sx={{ position: 'absolute', right: 0, top: 0, width: 100, height: 100, bgcolor: 'rgba(250, 204, 21, 0.1)', borderRadius: '0 0 0 100%', zIndex: 0 }} />
                            <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
                                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Star sx={{ color: '#eab308' }} /> Leave Feedback
                                </Typography>
                                <Grid container spacing={3}>
                                    <Grid item>
                                        <Avatar
                                            src={jobForFeedback.technicianPhoto}
                                            sx={{ width: 80, height: 80, borderRadius: '12px', bgcolor: '#e2e8f0' }}
                                        >T</Avatar>
                                    </Grid>
                                    <Grid item xs sx={{ display: 'flex', flexDirection: 'column' }}>
                                        <Typography variant="subtitle1">
                                            How was your <Box component="span" fontWeight="bold">{jobForFeedback.serviceType}</Box> with {jobForFeedback.technicianName}?
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                            Service completed on {new Date(jobForFeedback.completedAt || Date.now()).toLocaleDateString()}
                                        </Typography>

                                        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Star key={s} sx={{ color: '#cbd5e1', fontSize: 32, cursor: 'pointer', '&:hover': { color: '#eab308' } }} />
                                            ))}
                                        </Box>

                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                            <TextField fullWidth placeholder="Write a comment (optional)..." size="small" sx={{ bgcolor: '#f8fafc' }} />
                                            <Button variant="contained" sx={{ bgcolor: '#0f172a', textTransform: 'none', fontWeight: 'bold', '&:hover': { bgcolor: '#1e293b' } }}>Submit</Button>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    )}
                </Grid>

                {/* --- Right Column (Sidebar) --- */}
                <Grid item xs={12} lg={4}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>

                        {/* Live Support Widget */}
                        <Card sx={{ ...CardStyle, overflow: 'hidden', height: 400, display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ p: 2, bgcolor: '#2563eb', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Forum fontSize="small" />
                                    <Typography variant="subtitle2" fontWeight="bold">Live Support</Typography>
                                </Box>
                                <Chip
                                    icon={<Box sx={{ width: 6, height: 6, bgcolor: '#4ade80', borderRadius: '50%' }} />}
                                    label="Online"
                                    size="small"
                                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', height: 24, fontSize: '0.7rem' }}
                                />
                            </Box>
                            <Box sx={{ flex: 1, bgcolor: '#f8fafc', p: 2, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#e2e8f0' }}>S</Avatar>
                                    <Box sx={{ bgcolor: '#fff', p: 1.5, borderRadius: '12px 12px 12px 0', border: '1px solid #e2e8f0', maxWidth: '85%' }}>
                                        <Typography variant="body2" color="textSecondary">Hello! How can I help you with your booking today?</Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1, flexDirection: 'row-reverse' }}>
                                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#eff6ff', color: '#2563eb', fontSize: '0.7rem' }}>ME</Avatar>
                                    <Box sx={{ bgcolor: '#2563eb', color: '#fff', p: 1.5, borderRadius: '12px 12px 0 12px', maxWidth: '85%' }}>
                                        <Typography variant="body2">Hi, I need to reschedule my plumbing appointment.</Typography>
                                    </Box>
                                </Box>
                            </Box>
                            <Box sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
                                <Box sx={{ position: 'relative' }}>
                                    <InputBase fullWidth placeholder="Type a message..." sx={{ bgcolor: '#f8fafc', borderRadius: '20px', pl: 2, pr: 5, py: 1, border: '1px solid #e2e8f0' }} />
                                    <IconButton size="small" sx={{ position: 'absolute', right: 4, top: 4, bgcolor: '#2563eb', color: '#fff', '&:hover': { bgcolor: '#1d4ed8' } }}>
                                        <Send fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Box>
                        </Card>

                        {/* Complaints Widget */}
                        <Card sx={{ ...CardStyle }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ReportProblem color="error" /> Complaints
                                </Typography>
                                <Box sx={{ bgcolor: '#f8fafc', borderRadius: '8px', p: 3, textAlign: 'center', border: '1px solid #f1f5f9', mb: 2 }}>
                                    <CheckCircle sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
                                    <Typography variant="subtitle2" fontWeight="bold">No Open Issues</Typography>
                                    <Typography variant="caption" color="textSecondary">Great! All your services are running smoothly.</Typography>
                                </Box>
                                <Button fullWidth variant="outlined" startIcon={<Add />} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 'bold', color: '#475569', borderColor: '#e2e8f0' }}>
                                    File New Complaint
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Upsell / You Might Need */}
                        <Card sx={{ ...CardStyle, background: 'linear-gradient(to bottom right, #ffffff, #f8fafc)' }}>
                            <CardContent>
                                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>You might need</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <Box sx={{ width: 64, height: 64, borderRadius: '8px', bgcolor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <WaterDrop color="primary" />
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight="bold">Pool Cleaning</Typography>
                                        <Typography variant="body2" fontWeight="bold" color="primary">
                                            $120 <Box component="span" sx={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '0.8em', fontWeight: 'normal' }}>$150</Box>
                                        </Typography>
                                    </Box>
                                </Box>
                                <Button fullWidth variant="contained" sx={{ bgcolor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', fontWeight: 'bold', boxShadow: 'none', '&:hover': { bgcolor: 'rgba(37, 99, 235, 0.2)', boxShadow: 'none' } }}>
                                    View Details
                                </Button>
                            </CardContent>
                        </Card>

                    </Box>
                </Grid>
            </Grid>

            {/* Modals from Booking Flow */}
            <TechnicianSearchModal
                open={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                userLocation={user?.location}
                onSelectTechnician={(tech) => {
                    setSelectedTechnician(tech);
                    setIsSearchOpen(false);
                    setIsConfirmOpen(true);
                }}
            />

            {selectedTechnician && bookingParams && (
                <BookingConfirmationModal
                    open={isConfirmOpen}
                    onClose={() => setIsConfirmOpen(false)}
                    technician={selectedTechnician}
                    serviceType={bookingParams.serviceType}
                    location={bookingParams.location}
                    scheduledDate={new Date().toISOString().split('T')[0]} // Default to today
                    onConfirm={handleConfirmBooking}
                />
            )}
        </Box>
    );
};

export default DashboardHome;
