
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
                                                        <Typography variant="caption" color="textSecondary" noWrap>Pro: {job.technicianName || 'Pending'}</Typography>
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
                                                    <Typography variant="caption" sx={{ color: '#2563eb', fontWeight: 'bold', cursor: 'pointer' }}>Download</Typography>
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
                                    How was your <b>{jobForFeedback.serviceType}</b>?
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star key={s} sx={{ color: '#cbd5e1', fontSize: 28, cursor: 'pointer', '&:hover': { color: '#eab308' } }} />
                                    ))}
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <TextField fullWidth placeholder="Comment..." size="small" sx={{ bgcolor: '#f8fafc' }} />
                                    <Button variant="contained" size="small" sx={{ bgcolor: '#0f172a', textTransform: 'none' }}>Submit</Button>
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
                                <Button size="small" variant="outlined" sx={{ borderRadius: '6px', textTransform: 'none', mt: 0.5 }}>View</Button>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* 4. Real-time Job Status Timeline Widget */}
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
                                <Typography variant="caption" color="textSecondary">Active Job: <b>AC Repair - Split Unit</b></Typography>
                            </Box>
                            <Chip
                                label="LIVE TRACKING"
                                size="small"
                                color="error"
                                icon={<Verified style={{ animation: 'pulse-ring 2s infinite', borderRadius: '50%' }} />}
                                sx={{ fontWeight: 'bold', animation: 'pulse-ring 2s infinite', bgcolor: '#ffe4e6', color: '#be123c', border: 'none' }}
                            />
                        </Box>

                        <Stepper alternativeLabel activeStep={2} connector={<StepConnector sx={{ '& .MuiStepConnector-line': { borderColor: '#e2e8f0' } }} />}>
                            {[
                                { label: 'Requested', time: '10:30 AM', icon: <PendingActions /> },
                                { label: 'Accepted', time: '10:35 AM', icon: <CheckCircle /> },
                                { label: 'On The Way', time: '10:45 AM', icon: <DirectionsCar /> },
                                { label: 'Finished', time: '--:--', icon: <Build /> },
                            ].map((step, index) => (
                                <Step key={step.label}>
                                    <StepLabel
                                        StepIconComponent={() => (
                                            <Box sx={{
                                                width: 40, height: 40, borderRadius: '50%',
                                                bgcolor: index <= 2 ? (index === 2 ? '#2563eb' : '#dcfce7') : '#f1f5f9',
                                                color: index <= 2 ? (index === 2 ? '#fff' : '#16a34a') : '#94a3b8',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                zIndex: 1, position: 'relative',
                                                boxShadow: index === 2 ? '0 0 0 4px rgba(37, 99, 235, 0.2)' : 'none',
                                                animation: index === 2 ? 'pulse-ring 2s infinite' : 'none'
                                            }}>
                                                {index === 2 ? <DirectionsCar fontSize="small" sx={{ animation: 'car-bounce 1s infinite' }} /> :
                                                    index < 2 ? <CheckCircleOutline fontSize="small" /> : step.icon}
                                            </Box>
                                        )}
                                    >
                                        <Typography variant="body2" fontWeight="bold" sx={{ color: index <= 2 ? '#0f172a' : '#94a3b8' }}>{step.label}</Typography>
                                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>{step.time}</Typography>
                                    </StepLabel>
                                </Step>
                            ))}
                        </Stepper>

                        {/* Map/Technician Info Mini-Section */}
                        <Box sx={{ mt: 3, p: 2, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ width: 48, height: 48, bgcolor: '#0f172a' }}>AJ</Avatar>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" fontWeight="bold">Alex Johnson</Typography>
                                <Typography variant="caption" color="textSecondary">Arriving in <b>5 mins</b> • White Van (XY-99)</Typography>
                            </Box>
                            <Button size="small" variant="contained" color="primary" sx={{ borderRadius: '8px', textTransform: 'none' }}>Call</Button>
                        </Box>
                    </Card>

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
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Avatar sx={{ width: 28, height: 28, bgcolor: '#e2e8f0' }}>S</Avatar>
                                <Box sx={{ bgcolor: '#fff', p: 1.5, borderRadius: '12px 12px 12px 0', border: '1px solid #e2e8f0', maxWidth: '85%' }}>
                                    <Typography variant="caption" color="textSecondary">Hello! How can I help?</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, flexDirection: 'row-reverse' }}>
                                <Avatar sx={{ width: 28, height: 28, bgcolor: '#eff6ff', color: '#2563eb', fontSize: '0.6rem' }}>ME</Avatar>
                                <Box sx={{ bgcolor: '#2563eb', color: '#fff', p: 1.5, borderRadius: '12px 12px 0 12px', maxWidth: '85%' }}>
                                    <Typography variant="caption">Reschedule my appointment.</Typography>
                                </Box>
                            </Box>
                        </Box>
                        <Box sx={{ p: 1.5, borderTop: '1px solid #e2e8f0' }}>
                            <Box sx={{ position: 'relative' }}>
                                <InputBase fullWidth placeholder="Type..." sx={{ bgcolor: '#fff', borderRadius: '20px', pl: 2, pr: 5, py: 0.5, border: '1px solid #e2e8f0', fontSize: '0.85rem' }} />
                                <IconButton size="small" sx={{ position: 'absolute', right: 4, top: 2, color: '#2563eb' }}>
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
                                <CheckCircle sx={{ fontSize: 32, color: '#ef4444', mb: 1 }} />
                                <Typography variant="body2" fontWeight="bold" color="error">No Open Issues</Typography>
                                <Typography variant="caption" color="textSecondary">Everything is running smoothly.</Typography>
                            </Box>
                            <Button fullWidth variant="outlined" color="error" size="small" sx={{ borderRadius: '8px', textTransform: 'none' }}>
                                Report a Problem
                            </Button>
                        </CardContent>
                    </Card>

                </Box>
            </Box>

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
