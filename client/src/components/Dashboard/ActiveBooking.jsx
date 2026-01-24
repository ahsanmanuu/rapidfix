import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Chip,
    Avatar,
    Divider,
    Stepper,
    Step,
    StepLabel,
    StepConnector,
    styled,
    Stack,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton
} from '@mui/material';
import {
    Check,
    LocalShipping,
    Construction,
    Flag,
    Star,
    Chat,
    FormatQuote,
    AcUnit,
    CalendarToday,
    LocationOn,
    SupportAgent,
    CalendarMonth,
    Cancel,
    Security,
    Info,
    ChevronRight,
    Edit,
    Save,
} from '@mui/icons-material';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { useSocket } from '../../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { updateUserJob, cancelJob, createSupportSession, sendSupportMessage, getChatHistory, sendChatMessage } from '../../services/api';

const PRIMARY_BLUE = '#2463eb';
const TEXT_DARK = '#111318';
const TEXT_LIGHT = '#616e89';

// Custom Stepper Connector
const QontoConnector = styled(StepConnector)(({ theme }) => ({
    [`&.${stepConnectorClasses.alternativeLabel}`]: {
        top: 10,
        left: 'calc(-50% + 16px)',
        right: 'calc(50% + 16px)',
        [theme.breakpoints.down('sm')]: {
            top: 7,
            left: 'calc(-50% + 12px)',
            right: 'calc(50% + 12px)',
        },
    },
    [`&.${stepConnectorClasses.active}`]: {
        [`& .${stepConnectorClasses.line}`]: {
            borderColor: PRIMARY_BLUE,
        },
    },
    [`&.${stepConnectorClasses.completed}`]: {
        [`& .${stepConnectorClasses.line}`]: {
            borderColor: PRIMARY_BLUE,
        },
    },
    [`& .${stepConnectorClasses.line}`]: {
        borderColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#eaeaf0',
        borderTopWidth: 3,
        borderRadius: 1,
    },
}));

import { stepConnectorClasses } from '@mui/material/StepConnector';

const ColorlibStepIconRoot = styled('div')(({ theme, ownerState }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#ccc',
    zIndex: 1,
    color: '#fff',
    width: 35,
    height: 35,
    [theme.breakpoints.down('sm')]: {
        width: 24,
        height: 24,
    },
    display: 'flex',
    borderRadius: '50%',
    justifyContent: 'center',
    alignItems: 'center',
    ...(ownerState.active && {
        backgroundColor: PRIMARY_BLUE,
        boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)',
    }),
    ...(ownerState.completed && {
        backgroundColor: PRIMARY_BLUE,
    }),
}));

function ColorlibStepIcon(props) {
    const { active, completed, className } = props;

    const icons = {
        1: <Check fontSize="small" />,
        2: <Check fontSize="small" />,
        3: <LocalShipping fontSize="small" />,
        4: <Construction fontSize="small" />,
        5: <Flag fontSize="small" />,
    };

    return (
        <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
            {icons[String(props.icon)]}
        </ColorlibStepIconRoot>
    );
}

const ActiveBooking = ({ job }) => {
    const socket = useSocket();
    const navigate = useNavigate();
    const [currentJob, setCurrentJob] = useState(job);
    const [techLocation, setTechLocation] = useState(null);

    // Action States
    const [openReschedule, setOpenReschedule] = useState(false);
    const [openCancel, setOpenCancel] = useState(false);
    const [openSupport, setOpenSupport] = useState(false);
    const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' });
    const [cancelReason, setCancelReason] = useState('');
    const [supportMessage, setSupportMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [sessionId, setSessionId] = useState(null);

    // Tech Chat State
    const [openTechChat, setOpenTechChat] = useState(false);
    const [techChatHistory, setTechChatHistory] = useState([]);
    const [techMessage, setTechMessage] = useState('');

    // Customer Note Editing State
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [editedNote, setEditedNote] = useState(job?.description || '');
    const [savingNote, setSavingNote] = useState(false);

    // Sync prop changes
    useEffect(() => {
        if (job) {
            setCurrentJob(job);
            setEditedNote(job.description || '');
            // Pre-fill reschedule data
            setRescheduleData({
                date: job.scheduledDate ? job.scheduledDate.split('T')[0] : '',
                time: job.scheduledTime || ''
            });
        }
    }, [job]);

    // Socket listeners
    useEffect(() => {
        if (!socket || !currentJob) return;

        // Job Status Update
        socket.on('job_status_updated', (updatedJob) => {
            if (updatedJob.id === currentJob.id) {
                setCurrentJob(prev => ({ ...prev, ...updatedJob }));
            }
        });

        // Job Full Update
        socket.on('job_updated', (updatedJob) => {
            if (updatedJob.id === currentJob.id) {
                setCurrentJob(updatedJob);
            }
        });

        // Technician Location Update
        socket.on('technician_location_update', (data) => {
            if (data.technicianId === currentJob.technicianId) {
                setTechLocation({ lat: data.latitude, lng: data.longitude });
            }
        });

        // Chat Message Received
        socket.on('receive_message', (message) => {
            // Check if this message belongs to current tech chat AND current job
            if ((message.senderId === currentJob.technicianId || message.receiverId === currentJob.technicianId) &&
                (!message.jobId || message.jobId === currentJob.id)) { // [UPDATED] Filter by Job ID
                setTechChatHistory(prev => [...prev, message]);
            }
        });

        return () => {
            socket.off('job_status_updated');
            socket.off('job_updated');
            socket.off('technician_location_update');
            socket.off('receive_message');
        };
    }, [socket, currentJob]);


    // Google Maps Loader
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    });

    const steps = ['Request Received', 'Pro Assigned', 'Work Started', 'Completed'];

    // Calculate Active Step based on Status
    let activeStep = 0;
    const status = (currentJob?.status || 'pending').toLowerCase();
    if (['pending'].includes(status)) activeStep = 0;
    else if (['assigned', 'accepted', 'waiting_confirmation'].includes(status)) activeStep = 1;
    else if (['in_progress', 'ongoing', 'started'].includes(status)) activeStep = 2; // Tech on way or started? Usually 'on_way' is separate
    else if (['completed'].includes(status)) activeStep = 4;

    // Refine 'Work Started' to capture 'on_way' if needed, but keeping simple mapping
    if (status === 'on_way') activeStep = 2; // Treat as part of active phase

    // Job Location
    const jobLat = parseFloat(currentJob?.location?.latitude || 28.6139);
    const jobLng = parseFloat(currentJob?.location?.longitude || 77.2090);
    const jobPos = { lat: jobLat, lng: jobLng };

    // Handler Functions
    const handleRescheduleSubmit = async () => {
        try {
            await updateUserJob(currentJob.id, {
                scheduledDate: rescheduleData.date,
                scheduledTime: rescheduleData.time,
                description: `${currentJob.description || ''} [Rescheduled by User]`
            });
            setOpenReschedule(false);
            alert("Booking rescheduled successfully!");
        } catch (err) {
            alert("Failed to reschedule: " + err.message);
        }
    };

    const handleCancelSubmit = async () => {
        if (!confirm("Are you sure you want to cancel this booking?")) return;
        try {
            await cancelJob(currentJob.id, cancelReason);
            setOpenCancel(false);
            alert("Booking cancelled.");
            navigate('/dashboard');
        } catch (err) {
            alert("Failed to cancel: " + err.message);
        }
    };

    const handleSupportOpen = async () => {
        setOpenSupport(true);
        try {
            const res = await createSupportSession(currentJob.userId);
            if (res.data.success) {
                setSessionId(res.data.session.id);
                setChatHistory(res.data.session.messages || []);
            }
        } catch (err) {
            console.error("Support session error", err);
        }
    };

    const handleEndSession = async () => {
        if (!sessionId) {
            setOpenSupport(false);
            return;
        }
        try {
            await closeSupportSession(sessionId);
            setSessionId(null);
            setChatHistory([]);
            setOpenSupport(false);
        } catch (err) {
            console.error("Error closing session", err);
            setOpenSupport(false);
        }
    };

    const handleSendSupport = async () => {
        if (!supportMessage.trim() || !sessionId) return;
        try {
            const res = await sendSupportMessage({
                sessionId,
                sender: 'user',
                text: supportMessage,
                userId: currentJob.userId
            });
            if (res.data.success) {
                setChatHistory(res.data.session.messages);
                setSupportMessage('');
            }
        } catch (err) {
            console.error("Failed to send message", err);
        }
    };

    const handleTechChatOpen = async () => {
        if (!currentJob?.technicianId) return;
        setOpenTechChat(true);
        try {
            const res = await getChatHistory(currentJob.userId, currentJob.technicianId, currentJob.id); // [UPDATED] Pass jobId
            if (res.data.success) {
                setTechChatHistory(Array.isArray(res.data.chats) ? res.data.chats : []);
            }
        } catch (err) {
            console.error("Failed to fetch chat history", err);
            setTechChatHistory([]); // Fallback
        }
    };

    const handleSendTechMessage = async () => {
        if (!techMessage.trim()) return;
        try {
            // Optimistic update
            const tempMsg = {
                senderId: currentJob.userId,
                receiverId: currentJob.technicianId,
                message: techMessage,
                senderName: 'User', // Could fetch name from user profile or localStorage
                jobId: currentJob.id, // [UPDATED]
                createdAt: new Date().toISOString()
            };
            // setTechChatHistory(prev => [...prev, tempMsg]); // Allow socket to handle update to avoid dupe if fast

            await sendChatMessage({
                senderId: currentJob.userId,
                receiverId: currentJob.technicianId,
                message: techMessage,
                senderName: 'User',
                jobId: currentJob.id // [UPDATED]
            });
            setTechMessage('');
        } catch (err) {
            alert("Failed to send message: " + err.message);
        }
    };

    // [NEW] Restriction Logic
    const [openRestriction, setOpenRestriction] = useState(false);

    const checkModificationAllowed = () => {
        if (!currentJob?.scheduledDate) return true;

        try {
            const dateStr = currentJob.scheduledDate.split('T')[0];
            const timeStr = currentJob.scheduledTime || '00:00';
            const scheduled = new Date(`${dateStr}T${timeStr}`);
            const now = new Date();
            const diffMs = scheduled - now;
            const diffHours = diffMs / (1000 * 60 * 60);

            return diffHours >= 2;
        } catch (e) {
            console.error("Time calc error", e);
            return true; // Fail safe
        }
    };

    const handleRescheduleClick = () => {
        if (checkModificationAllowed()) {
            setOpenReschedule(true);
        } else {
            setOpenRestriction(true);
        }
    };

    const handleCancelClick = () => {
        if (checkModificationAllowed()) {
            setOpenCancel(true);
        } else {
            setOpenRestriction(true);
        }
    };

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 3 }, fontFamily: 'Inter, sans-serif' }}>

            {/* Breadcrumbs */}
            {/* Same as before... reusing context */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 13, color: TEXT_LIGHT, mb: 2 }}>
                <Typography variant="body2" sx={{ color: 'inherit', '&:hover': { color: PRIMARY_BLUE }, cursor: 'pointer', fontSize: 'inherit' }}>Home</Typography>
                <ChevronRight sx={{ fontSize: 14 }} />
                <Typography variant="body2" sx={{ color: 'inherit', '&:hover': { color: PRIMARY_BLUE }, cursor: 'pointer', fontSize: 'inherit' }}>My Bookings</Typography>
                <ChevronRight sx={{ fontSize: 14 }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: TEXT_DARK, fontSize: 'inherit' }}>Job #{currentJob?.id}</Typography>
            </Box>

            {/* ... (Header and Grid - keeping mostly same but updating Buttons) ... */}

            {/* Header */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2, mb: 3 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: TEXT_DARK, mb: 0.5 }}>Active Booking</Typography>
                    <Typography variant="body2" sx={{ color: TEXT_LIGHT }}>Track your ongoing service request in real-time.</Typography>
                </Box>
                <Chip
                    icon={<Box sx={{ width: 6, height: 6, bgcolor: '#22c55e', borderRadius: '50%', ml: 1 }} className="animate-pulse" />}
                    label={status.replace('_', ' ').toUpperCase()}
                    sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 600, fontSize: 12, height: 28, '& .MuiChip-label': { px: 1.5 } }}
                />
            </Box>

            <Grid container spacing={2}>
                {/* LEFT COL */}
                <Grid item xs={12} md={8}>
                    <Stack spacing={2}>
                        {/* Stepper Card */}
                        <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
                            <CardContent sx={{ py: { xs: 2, md: 3 }, px: { xs: 0, md: 4 } }}>
                                <Stepper alternativeLabel activeStep={activeStep} connector={<QontoConnector />}>
                                    {steps.map((label) => (
                                        <Step key={label} sx={{ px: 0 }}>
                                            <StepLabel StepIconComponent={ColorlibStepIcon}>
                                                <Typography variant="caption" sx={{ fontWeight: 600, color: activeStep >= steps.indexOf(label) ? PRIMARY_BLUE : TEXT_LIGHT, fontSize: { xs: '0.55rem', md: '0.75rem' }, lineHeight: 1, display: 'block', mt: 0.5 }}>{label}</Typography>
                                            </StepLabel>
                                        </Step>
                                    ))}
                                </Stepper>
                            </CardContent>
                        </Card>

                        {/* Professional Profile */}
                        {currentJob?.technician ? (
                            <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
                                <CardContent sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, alignItems: { xs: 'center', sm: 'start' } }}>
                                        <Box sx={{ position: 'relative' }}>
                                            <Avatar src={currentJob.technician.avatar || null} sx={{ width: 50, height: 50, border: '2px solid white', boxShadow: 2 }}>{currentJob.technician.name?.[0]}</Avatar>
                                            <Box sx={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, bgcolor: '#22c55e', borderRadius: '50%', border: '2px solid white' }} />
                                        </Box>
                                        <Box sx={{ flex: 1, width: '100%', textAlign: { xs: 'center', sm: 'left' } }}>
                                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'center', sm: 'start' }, mb: 1 }}>
                                                <Box>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>{currentJob.technician.name}</Typography>
                                                    <Typography variant="caption" sx={{ color: TEXT_LIGHT, display: 'block', mb: 0.5, fontSize: '0.7rem' }}>Technician</Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', sm: 'start' }, gap: 0.5 }}>
                                                        <Star sx={{ color: '#facc15', fontSize: 14 }} />
                                                        <Typography variant="caption" sx={{ fontWeight: 700 }}>4.9</Typography>
                                                    </Box>
                                                </Box>
                                                <Button
                                                    variant="contained"
                                                    startIcon={<Chat sx={{ fontSize: 16 }} />}
                                                    size="small"
                                                    sx={{ mt: { xs: 1.5, sm: 0 }, bgcolor: 'rgba(36, 99, 235, 0.1)', color: PRIMARY_BLUE, boxShadow: 'none', '&:hover': { bgcolor: 'rgba(36, 99, 235, 0.2)' }, textTransform: 'none', fontWeight: 600, height: 28, fontSize: '0.75rem', minWidth: 'auto', px: 1.5 }}
                                                    onClick={handleTechChatOpen}
                                                >
                                                    Message
                                                </Button>
                                            </Box>
                                            {techLocation && <Box sx={{ bgcolor: '#f6f6f8', p: 1.5, borderRadius: 2, mt: 1, display: 'flex', gap: 1, alignItems: 'start' }}><LocalShipping sx={{ color: TEXT_LIGHT, fontSize: 16 }} /><Typography variant="caption" sx={{ color: TEXT_LIGHT, fontStyle: 'italic', lineHeight: 1.3, fontSize: '0.7rem' }}>Technician is moving...</Typography></Box>}
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', p: 2 }}>
                                <Typography variant="body2" color="text.secondary">Waiting for technician assignment...</Typography>
                            </Card>
                        )}

                        {/* Booking Details */}
                        <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                            <Box sx={{ p: 2, px: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}><Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Booking Details</Typography></Box>
                            <Box sx={{ p: 3 }}>
                                <Grid container spacing={3} alignItems="stretch">
                                    <Grid item xs={12} md={5}>
                                        <Stack spacing={3}>
                                            <Box><Typography variant="caption" sx={{ textTransform: 'uppercase', color: TEXT_LIGHT, fontWeight: 700, fontSize: '0.7rem' }}>Service Type</Typography><Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}><AcUnit sx={{ color: PRIMARY_BLUE, fontSize: 18 }} /><Typography variant="body2" sx={{ fontWeight: 600 }}>{currentJob?.serviceType || 'Service'}</Typography></Box></Box>
                                            <Box><Typography variant="caption" sx={{ textTransform: 'uppercase', color: TEXT_LIGHT, fontWeight: 700, fontSize: '0.7rem' }}>Job ID</Typography><Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>#{currentJob?.id || '---'}</Typography></Box>
                                            <Box><Typography variant="caption" sx={{ textTransform: 'uppercase', color: TEXT_LIGHT, fontWeight: 700, fontSize: '0.7rem' }}>Date & Time</Typography><Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}><CalendarToday sx={{ color: TEXT_LIGHT, fontSize: 18 }} /><Typography variant="body2" sx={{ fontWeight: 600 }}>{currentJob?.scheduledDate ? new Date(currentJob.scheduledDate).toLocaleDateString() : 'TBD'} • {currentJob?.scheduledTime || '--:--'}</Typography></Box></Box>
                                            <Box><Typography variant="caption" sx={{ textTransform: 'uppercase', color: TEXT_LIGHT, fontWeight: 700, fontSize: '0.7rem' }}>Service Address</Typography><Box sx={{ display: 'flex', alignItems: 'start', gap: 1, mt: 0.5 }}><LocationOn sx={{ color: TEXT_LIGHT, fontSize: 18 }} /><Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>{currentJob?.location?.address || currentJob?.address || 'Location provided'}</Typography></Box></Box>
                                            <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 2, border: '1px dashed #cbd5e1' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                                    <Typography variant="caption" sx={{ textTransform: 'uppercase', color: TEXT_LIGHT, fontWeight: 700, fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Chat sx={{ fontSize: 14 }} /> Customer Note
                                                    </Typography>
                                                    {!isEditingNote ? (
                                                        <IconButton size="small" onClick={() => setIsEditingNote(true)} sx={{ p: 0.5 }}>
                                                            <Edit sx={{ fontSize: 14, color: PRIMARY_BLUE }} />
                                                        </IconButton>
                                                    ) : null}
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
                                                            placeholder="Describe your issue or add notes..."
                                                            sx={{ mb: 1, '& .MuiInputBase-input': { fontSize: '0.875rem' } }}
                                                        />
                                                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                                            <Button
                                                                size="small"
                                                                onClick={() => {
                                                                    setIsEditingNote(false);
                                                                    setEditedNote(currentJob?.description || '');
                                                                }}
                                                                sx={{ fontSize: '0.7rem', py: 0.5 }}
                                                            >
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                disabled={savingNote}
                                                                startIcon={<Save sx={{ fontSize: 14 }} />}
                                                                onClick={async () => {
                                                                    setSavingNote(true);
                                                                    try {
                                                                        await updateUserJob(currentJob.id, { description: editedNote });
                                                                        setCurrentJob(prev => ({ ...prev, description: editedNote }));
                                                                        setIsEditingNote(false);
                                                                    } catch (err) {
                                                                        alert('Failed to save note: ' + err.message);
                                                                    } finally {
                                                                        setSavingNote(false);
                                                                    }
                                                                }}
                                                                sx={{ fontSize: '0.7rem', py: 0.5, bgcolor: PRIMARY_BLUE }}
                                                            >
                                                                {savingNote ? 'Saving...' : 'Save'}
                                                            </Button>
                                                        </Box>
                                                    </Box>
                                                ) : (
                                                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#334155', mt: 0.5 }}>
                                                        "{currentJob?.description || 'Quick Tile Booking'}"
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Box sx={{ bgcolor: '#eff6ff', p: 1.5, borderRadius: 2, border: '1px dashed #bfdbfe' }}>
                                                <Typography variant="caption" sx={{ textTransform: 'uppercase', color: '#1e40af', fontWeight: 700, fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <FormatQuote sx={{ fontSize: 14 }} /> Professional Note
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#1e3a8a', mt: 0.5 }}>
                                                    "{currentJob?.professionalNote || 'No notes from professional.'}"
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Grid>
                                    <Grid item xs={12} md={7} sx={{ width: '100%', minWidth: 0 }}>
                                        <Box id="map-container-box" sx={{ height: { xs: 300, md: '100%' }, minHeight: { md: 350 }, width: '100%', minWidth: '100%', position: 'relative', borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', display: 'block' }}>
                                            {loadError ? <Box sx={{ height: '100%', bgcolor: '#fef2f2', color: '#dc2626', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}><Typography variant="caption">Map Error: {loadError.message}</Typography></Box> : isLoaded ? (
                                                <GoogleMap mapContainerStyle={{ width: '100%', height: '100%', minWidth: '100%' }} center={jobPos} zoom={15} onLoad={map => { setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 500); const bounds = new window.google.maps.LatLngBounds(); bounds.extend(jobPos); if (techLocation) { bounds.extend(techLocation); map.fitBounds(bounds); } else { map.setCenter(jobPos); } }} options={{ disableDefaultUI: false, zoomControl: true, mapTypeControl: false, streetViewControl: false, fullscreenControl: true }}>
                                                    <Marker position={jobPos} animation={window.google.maps.Animation.DROP} />
                                                    {techLocation && <Marker position={techLocation} icon={{ path: window.google?.maps?.SymbolPath?.FORWARD_CLOSED_ARROW, scale: 5, fillColor: PRIMARY_BLUE, fillOpacity: 1, strokeWeight: 1, rotation: 0 }} label={{ text: "Tech", color: "white", fontSize: "10px", fontWeight: "bold" }} />}
                                                </GoogleMap>
                                            ) : <Box sx={{ height: '100%', bgcolor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography variant="caption" color="text.secondary">Loading Map...</Typography></Box>}
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Card>
                    </Stack>
                </Grid>

                {/* RIGHT COL - Sidebar */}
                <Grid item xs={12} md={4}>
                    <Stack spacing={2}>
                        {/* Payment Summary */}
                        <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
                            <Box sx={{ p: 2, px: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}><Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Payment Summary</Typography></Box>
                            <CardContent sx={{ p: 2.5 }}>
                                <Stack spacing={1.5}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" sx={{ color: TEXT_LIGHT }}>Service Fee</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>₹{currentJob?.visitingCharges || 0}</Typography></Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" sx={{ color: TEXT_LIGHT }}>Spare Parts</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{currentJob?.sparePartsCost ? `₹${currentJob.sparePartsCost}` : '--'}</Typography></Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" sx={{ color: TEXT_LIGHT }}>Tax (10%)</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{currentJob?.tax ? `₹${currentJob.tax}` : `₹${(currentJob?.visitingCharges || 0) * 0.1}`}</Typography></Box>
                                    <Divider sx={{ my: 0.5 }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Typography variant="body2" sx={{ fontWeight: 700 }}>Total Amount</Typography><Typography variant="h6" sx={{ fontWeight: 900, color: PRIMARY_BLUE }}>₹{currentJob?.totalCost || ((currentJob?.visitingCharges || 0) * 1.1)}</Typography></Box>
                                    <Box sx={{ bgcolor: '#eff6ff', p: 1, borderRadius: 2, display: 'flex', gap: 1, alignItems: 'center' }}><Info sx={{ color: PRIMARY_BLUE, fontSize: 16 }} /><Typography variant="caption" sx={{ color: PRIMARY_BLUE, lineHeight: 1.2 }}>Final price may vary based on parts used.</Typography></Box>
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
                            <Box sx={{ p: 2, px: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}><Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Actions</Typography></Box>
                            <CardContent sx={{ p: 2.5 }}>
                                <Stack spacing={1.5}>
                                    <Button variant="outlined" startIcon={<SupportAgent />} fullWidth sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }} onClick={handleSupportOpen}>Contact Support</Button>
                                    {/* [UPDATED] Use handleRescheduleClick */}
                                    <Button variant="outlined" startIcon={<CalendarMonth />} fullWidth sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }} onClick={handleRescheduleClick}>Reschedule</Button>
                                    {/* [UPDATED] Use handleCancelClick */}
                                    <Button variant="outlined" color="error" startIcon={<Cancel />} fullWidth sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, borderColor: '#ef4444', color: '#ef4444' }} onClick={handleCancelClick}>Cancel Booking</Button>
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* Safety Tip */}
                        <Box sx={{ bgcolor: '#f0f9ff', border: '1px solid #dbeafe', borderRadius: 3, p: 2, display: 'flex', gap: 2 }}>
                            <Security sx={{ color: '#2563eb', fontSize: 20 }} />
                            <Box>
                                <Typography variant="subtitle2" sx={{ color: '#1e3a8a', fontWeight: 700, fontSize: '0.875rem' }}>Safety First</Typography>
                                <Typography variant="caption" sx={{ color: '#1d4ed8', lineHeight: 1.2 }}>Share your OTP <Box component="span" sx={{ bgcolor: 'white', px: 0.5, borderRadius: 0.5, fontWeight: 700, fontFamily: 'monospace' }}>{currentJob?.otp || '----'}</Box> with the professional.</Typography>
                            </Box>
                        </Box>
                    </Stack>
                </Grid>
            </Grid>

            {/* --- DIALOGS --- */}

            {/* [NEW] Restriction Dialog */}
            <Dialog open={openRestriction} onClose={() => setOpenRestriction(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Info color="error" /> Action Not Allowed
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Bookings cannot be cancelled or rescheduled within <b>2 hours</b> of the scheduled time.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Please contact support if you have an urgent issue.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenRestriction(false)}>Close</Button>
                    <Button variant="contained" startIcon={<SupportAgent />} onClick={() => { setOpenRestriction(false); handleSupportOpen(); }}>Contact Support</Button>
                </DialogActions>
            </Dialog>

            {/* Reschedule Dialog */}
            <Dialog open={openReschedule} onClose={() => setOpenReschedule(false)} fullWidth maxWidth="xs">
                <DialogTitle>Reschedule Booking</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>Choose a new date and time for your service.</Typography>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField label="New Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={rescheduleData.date} onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })} />
                        <TextField label="New Time" type="time" fullWidth InputLabelProps={{ shrink: true }} value={rescheduleData.time} onChange={(e) => setRescheduleData({ ...rescheduleData, time: e.target.value })} />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenReschedule(false)}>Close</Button>
                    <Button variant="contained" onClick={handleRescheduleSubmit}>Confirm Reschedule</Button>
                </DialogActions>
            </Dialog>

            {/* Cancel Dialog */}
            <Dialog open={openCancel} onClose={() => setOpenCancel(false)} fullWidth maxWidth="xs">
                <DialogTitle>Cancel Booking</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>Are you sure? A cancellation fee may apply if less than 2 hours before.</Typography>
                    <TextField label="Reason for cancellation" multiline rows={3} fullWidth value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenCancel(false)}>Back</Button>
                    <Button variant="contained" color="error" onClick={handleCancelSubmit}>Cancel Booking</Button>
                </DialogActions>
            </Dialog>

            {/* Support Dialog */}
            <Dialog open={openSupport} onClose={() => setOpenSupport(false)} fullWidth maxWidth="sm">
                <DialogTitle>Contact Support</DialogTitle>
                <DialogContent>
                    <Box sx={{ height: 300, bgcolor: '#f8fafc', borderRadius: 2, p: 2, mb: 2, overflowY: 'auto', border: '1px solid #e2e8f0' }}>
                        {chatHistory.length === 0 ? <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 10 }}>Start a conversation...</Typography> : chatHistory.map((msg, i) => (
                            <Box key={i} sx={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', mb: 1 }}>
                                <Box sx={{ bgcolor: msg.sender === 'user' ? PRIMARY_BLUE : 'white', color: msg.sender === 'user' ? 'white' : 'text.primary', p: 1.5, borderRadius: 2, maxWidth: '80%', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}><Typography variant="body2">{msg.text}</Typography></Box>
                            </Box>
                        ))}
                    </Box>
                    <Stack direction="row" spacing={1}>
                        <TextField fullWidth placeholder="Type a message..." size="small" value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} />
                        <Button variant="outlined" color="error" onClick={handleEndSession} sx={{ whiteSpace: 'nowrap' }}>End Chat</Button>
                        <Button variant="contained" onClick={handleSendSupport}>Send</Button>
                    </Stack>
                </DialogContent>
            </Dialog>
            {/* Tech Chat Dialog */}
            <Dialog open={openTechChat} onClose={() => setOpenTechChat(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar src={currentJob?.technician?.avatar} sx={{ width: 30, height: 30 }}>{currentJob?.technician?.name?.[0]}</Avatar>
                    Chat with {currentJob?.technician?.name || 'Technician'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ height: 350, bgcolor: '#f8fafc', borderRadius: 2, p: 2, mb: 2, overflowY: 'auto', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                        {techChatHistory.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 15 }}>No messages yet. Say hello!</Typography>
                        ) : (
                            techChatHistory.map((msg, i) => {
                                const isMe = msg.senderId === currentJob.userId;
                                return (
                                    <Box key={i} sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', mb: 1.5 }}>
                                        <Box sx={{
                                            bgcolor: isMe ? PRIMARY_BLUE : 'white',
                                            color: isMe ? 'white' : 'text.primary',
                                            p: 1.5, px: 2, borderRadius: 2, maxWidth: '75%',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                            borderTopRightRadius: isMe ? 0 : 2,
                                            borderTopLeftRadius: isMe ? 2 : 0
                                        }}>
                                            <Typography variant="body2">{msg.message || msg.text}</Typography>
                                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.8, fontSize: '0.65rem', textAlign: 'right' }}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Typography>
                                        </Box>
                                    </Box>
                                );
                            })
                        )}
                    </Box>
                    <Stack direction="row" spacing={1}>
                        <TextField
                            fullWidth
                            placeholder="Type a message..."
                            size="small"
                            value={techMessage}
                            onChange={(e) => setTechMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendTechMessage()}
                        />
                        <Button variant="contained" onClick={handleSendTechMessage} endIcon={<Chat />}>Send</Button>
                    </Stack>
                </DialogContent>
            </Dialog>

        </Box >
    );
};

export default ActiveBooking;
