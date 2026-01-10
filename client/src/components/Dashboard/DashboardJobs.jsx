import { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import useSupabaseRealtime from '../../hooks/useSupabaseRealtime';
import FeedbackModal from './FeedbackModal';
import api from '../../services/api';
import { createJob, getMyJobs } from '../../services/api';
import {
    Grid,
    Typography,
    Card,
    CardContent,
    Button,
    TextField,
    MenuItem,
    Box,
    Chip,
    Avatar,
    IconButton,
    InputAdornment
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add, ElectricBolt, Build, CalendarToday, LocationOn, Star, Person, AccountBalanceWallet } from '@mui/icons-material';

const DashboardJobs = ({ user }) => {
    const theme = useTheme();
    const [jobs, setJobs] = useState([]);
    const [showBooking, setShowBooking] = useState(false);
    const [selectedJobForFeedback, setSelectedJobForFeedback] = useState(null);
    const [newJob, setNewJob] = useState({ serviceType: 'Electrician', description: '', location: '', contactName: user?.name || '', contactPhone: user?.phone || '' });
    const socket = useSocket();

    useEffect(() => {
        if (user) {
            fetchJobs(user.id);
            setNewJob(prev => ({ ...prev, contactName: user.name, contactPhone: user.phone, location: user.location?.latitude ? 'Current Location' : '' }));
        }
    }, [user]);

    useEffect(() => {
        if (socket) {
            socket.on('job_status_updated', (updatedJob) => {
                setJobs(prevJobs => prevJobs.map(job =>
                    job.id === updatedJob.id ? updatedJob : job
                ));
            });
            return () => {
                socket.off('job_status_updated');
            };
        }
    }, [socket]);

    const fetchJobs = async (userId) => {
        try {
            const res = await getMyJobs(userId);
            if (res.data.success) {
                const sorted = res.data.jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setJobs(sorted);
            }
        } catch (err) {
            console.error("Failed to fetch jobs", err);
        }
    };

    // [NEW] Supabase Realtime for Jobs
    useSupabaseRealtime('jobs', (payload) => {
        if (user) fetchJobs(user.id);
    });

    const handleBookService = async (e) => {
        e.preventDefault();
        try {
            const userLoc = user?.location || {};
            const jobData = {
                ...newJob,
                userId: user.id,
                location: userLoc.latitude ? {
                    latitude: userLoc.latitude,
                    longitude: userLoc.longitude,
                    address: userLoc.address || userLoc.display_name || ''
                } : { latitude: 0, longitude: 0 },
                address: userLoc.address || userLoc.city || userLoc.display_name || 'User Dashboard Request'
            };

            await createJob(jobData);
            setShowBooking(false);
            setNewJob({ serviceType: 'Electrician', description: '', location: '', contactName: user.name, contactPhone: user.phone });
            fetchJobs(user.id);
        } catch (err) {
            console.error("Booking failed:", err);
            alert(`Failed to book service: ${err.response?.data?.error || err.message}`);
        }
    };

    const handleSubmitFeedback = async (jobId, ratings, comment) => {
        try {
            const job = jobs.find(j => j.id === jobId);
            if (!job || !job.technicianId) {
                alert('Cannot rate: No technician assigned yet.');
                return;
            }

            await api.post('/feedback', {
                userId: user.id,
                technicianId: job.technicianId,
                ratings,
                comment
            });

            setSelectedJobForFeedback(null);
            alert('Feedback submitted successfully!');
        } catch (error) {
            console.error(error);
            alert('Failed to submit feedback');
        }
    };

    return (
        <Grid container spacing={3}>
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h4" fontWeight="bold">My Requests</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={showBooking ? null : <Add />}
                    onClick={() => setShowBooking(!showBooking)}
                    sx={{ borderRadius: '12px' }}
                >
                    {showBooking ? 'Cancel' : 'New Request'}
                </Button>
            </Grid>

            {showBooking && (
                <Grid item xs={12}>
                    <Card sx={{ borderRadius: '16px', border: `1px solid ${theme.palette.primary.main}` }}>
                        <CardContent sx={{ p: 2 }}>
                            <Typography variant="h5" sx={{ mb: 2 }}>Book a Technician</Typography>
                            <form onSubmit={handleBookService}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            select
                                            fullWidth
                                            label="Service Type"
                                            value={newJob.serviceType}
                                            onChange={(e) => setNewJob({ ...newJob, serviceType: e.target.value })}
                                        >
                                            {['Electrician', 'Plumber', 'AC Technician', 'Painter', 'Carpenter', 'CCTV Technician', 'Biometrics Technician'].map(t => (
                                                <MenuItem key={t} value={t}>{t}</MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Location"
                                            value={user?.location?.city || 'Current Location'}
                                            InputProps={{
                                                readOnly: true,
                                                startAdornment: <InputAdornment position="start"><LocationOn color="action" /></InputAdornment>
                                            }}
                                            helperText="Technician will be assigned based on this location"
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={3}
                                            label="Description"
                                            value={newJob.description}
                                            onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                                            required
                                            placeholder="Describe the issue..."
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Contact Name"
                                            value={newJob.contactName}
                                            onChange={(e) => setNewJob({ ...newJob, contactName: e.target.value })}
                                            required
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Contact Phone"
                                            value={newJob.contactPhone}
                                            onChange={(e) => setNewJob({ ...newJob, contactPhone: e.target.value })}
                                            required
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Button type="submit" variant="contained" fullWidth size="large" sx={{ borderRadius: '12px' }}>
                                            Submit Request
                                        </Button>
                                    </Grid>
                                </Grid>
                            </form>
                        </CardContent>
                    </Card>
                </Grid>
            )}

            <Grid item xs={12}>
                <Grid container spacing={2}>
                    {(jobs || []).map(job => (
                        <Grid item xs={12} key={job.id}>
                            <Card sx={{ borderRadius: '16px', '&:hover': { boxShadow: theme.shadows[4] } }}>
                                <CardContent>
                                    <Grid container spacing={2} alignItems="flex-start">
                                        <Grid item>
                                            <Avatar sx={{
                                                bgcolor: theme.palette.primary.light,
                                                color: theme.palette.primary.dark,
                                                width: 40, height: 40
                                            }}>
                                                {job.serviceType.includes('Electric') ? <ElectricBolt fontSize="small" /> : <Build fontSize="small" />}
                                            </Avatar>
                                        </Grid>
                                        <Grid item xs>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="h6" fontWeight="bold">{job.serviceType}</Typography>
                                                <Chip
                                                    label={job.status}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: job.status === 'pending' ? theme.palette.warning.light :
                                                            job.status === 'accepted' ? theme.palette.info.light :
                                                                job.status === 'completed' ? theme.palette.success.light :
                                                                    theme.palette.grey[200],
                                                        color: job.status === 'pending' ? theme.palette.warning.dark :
                                                            job.status === 'accepted' ? theme.palette.info.dark :
                                                                job.status === 'completed' ? theme.palette.success.dark :
                                                                    theme.palette.grey[700],
                                                        fontWeight: 'bold',
                                                        textTransform: 'uppercase',
                                                        borderRadius: '8px'
                                                    }}
                                                />
                                            </Box>
                                            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                                {job.description}
                                            </Typography>
                                            {job.isCustomOffer && (
                                                <Chip
                                                    label={`Offer: ₹${job.offerPrice}`}
                                                    size="small"
                                                    color="secondary"
                                                    variant="outlined"
                                                    icon={<AccountBalanceWallet fontSize="small" />}
                                                    sx={{ mb: 2, fontWeight: 'bold' }}
                                                />
                                            )}
                                            <Box sx={{ display: 'flex', gap: 3, mb: job.status === 'accepted' ? 2 : 0 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <CalendarToday fontSize="small" color="disabled" />
                                                    <Typography variant="caption" color="textSecondary">{new Date(job.createdAt).toLocaleDateString()}</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <LocationOn fontSize="small" color="disabled" />
                                                    <Typography variant="caption" color="textSecondary">{job.location?.city || 'Location'}</Typography>
                                                </Box>
                                            </Box>

                                            {job.status === 'accepted' && (
                                                <Box sx={{ mt: 2, p: 2, bgcolor: theme.palette.background.default, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Avatar sx={{ bgcolor: theme.palette.secondary.light, color: theme.palette.secondary.dark }}>
                                                        <Person />
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="subtitle2" color="textSecondary">Assigned Technician</Typography>
                                                        <Typography variant="body1" fontWeight="bold">
                                                            {job.technician ? `${job.technician.name} (${job.technician.phone})` : 'Pending Assignment'}
                                                        </Typography>
                                                        {job.technician && job.technician.rating && (
                                                            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: theme.palette.warning.main }}>
                                                                <Star fontSize="inherit" /> {job.technician.rating}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            )}
                                        </Grid>
                                    </Grid>

                                    {job.status === 'completed' && (
                                        <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                fullWidth
                                                startIcon={<Star />}
                                                onClick={() => setSelectedJobForFeedback(job)}
                                                sx={{
                                                    fontWeight: 'bold',
                                                    borderRadius: '12px',
                                                    boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                                                    py: 1.5
                                                }}
                                            >
                                                Rate Service
                                            </Button>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Grid>

            {selectedJobForFeedback && (
                <FeedbackModal
                    job={selectedJobForFeedback}
                    onClose={() => setSelectedJobForFeedback(null)}
                    onSubmit={handleSubmitFeedback}
                />
            )}
        </Grid>
    );
};

export default DashboardJobs;
