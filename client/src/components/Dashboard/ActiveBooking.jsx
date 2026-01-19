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
    Stack
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
} from '@mui/icons-material';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { useSocket } from '../../context/SocketContext';

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
    const [currentJob, setCurrentJob] = useState(job);
    const [techLocation, setTechLocation] = useState(null);

    // Sync prop changes
    useEffect(() => {
        if (job) setCurrentJob(job);
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

        return () => {
            socket.off('job_status_updated');
            socket.off('job_updated');
            socket.off('technician_location_update');
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

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: { xs: 2, md: 3 }, fontFamily: 'Inter, sans-serif' }}>

            {/* Breadcrumbs */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 13, color: TEXT_LIGHT, mb: 2 }}>
                <Typography variant="body2" sx={{ color: 'inherit', '&:hover': { color: PRIMARY_BLUE }, cursor: 'pointer', fontSize: 'inherit' }}>Home</Typography>
                <ChevronRight sx={{ fontSize: 14 }} />
                <Typography variant="body2" sx={{ color: 'inherit', '&:hover': { color: PRIMARY_BLUE }, cursor: 'pointer', fontSize: 'inherit' }}>My Bookings</Typography>
                <ChevronRight sx={{ fontSize: 14 }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: TEXT_DARK, fontSize: 'inherit' }}>Job #{currentJob?.id}</Typography>
            </Box>

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

            {/* Stepper Card */}
            <Card sx={{ mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ py: { xs: 2, md: 3 }, px: { xs: 0, md: 4 } }}>
                    <Stepper alternativeLabel activeStep={activeStep} connector={<QontoConnector />}>
                        {steps.map((label) => (
                            <Step key={label} sx={{ px: 0 }}>
                                <StepLabel StepIconComponent={ColorlibStepIcon}>
                                    <Typography variant="caption" sx={{
                                        fontWeight: 600,
                                        color: activeStep >= steps.indexOf(label) ? PRIMARY_BLUE : TEXT_LIGHT,
                                        fontSize: { xs: '0.55rem', md: '0.75rem' },
                                        lineHeight: 1,
                                        display: 'block',
                                        mt: 0.5
                                    }}>
                                        {label}
                                    </Typography>
                                </StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                </CardContent>
            </Card>

            <Grid container spacing={2}>
                {/* LEFT COL */}
                <Grid item xs={12} sm={4}>
                    <Stack spacing={2}>
                        {/* Professional Profile */}
                        {currentJob?.technician ? (
                            <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
                                <CardContent sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, alignItems: { xs: 'center', sm: 'start' } }}>
                                        <Box sx={{ position: 'relative' }}>
                                            <Avatar
                                                src={currentJob.technician.avatar || null}
                                                sx={{ width: 50, height: 50, border: '2px solid white', boxShadow: 2 }}
                                            >
                                                {currentJob.technician.name?.[0]}
                                            </Avatar>
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
                                                >
                                                    Message
                                                </Button>
                                            </Box>
                                            {techLocation && (
                                                <Box sx={{ bgcolor: '#f6f6f8', p: 1.5, borderRadius: 2, mt: 1, display: 'flex', gap: 1, alignItems: 'start' }}>
                                                    <LocalShipping sx={{ color: TEXT_LIGHT, fontSize: 16 }} />
                                                    <Typography variant="caption" sx={{ color: TEXT_LIGHT, fontStyle: 'italic', lineHeight: 1.3, fontSize: '0.7rem' }}>
                                                        Technician is moving...
                                                    </Typography>
                                                </Box>
                                            )}
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
                            <Box sx={{ p: 2, px: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Booking Details</Typography>
                            </Box>
                            <Box sx={{ p: 3 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Stack spacing={3}>
                                            <Box>
                                                <Typography variant="caption" sx={{ textTransform: 'uppercase', color: TEXT_LIGHT, fontWeight: 700, fontSize: '0.7rem' }}>Service Type</Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                    <AcUnit sx={{ color: PRIMARY_BLUE, fontSize: 18 }} />
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{currentJob?.serviceType || 'Service'}</Typography>
                                                </Box>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" sx={{ textTransform: 'uppercase', color: TEXT_LIGHT, fontWeight: 700, fontSize: '0.7rem' }}>Job ID</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>#{currentJob?.id || '---'}</Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" sx={{ textTransform: 'uppercase', color: TEXT_LIGHT, fontWeight: 700, fontSize: '0.7rem' }}>Date & Time</Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                    <CalendarToday sx={{ color: TEXT_LIGHT, fontSize: 18 }} />
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {currentJob?.scheduledDate ? new Date(currentJob.scheduledDate).toLocaleDateString() : 'TBD'} • {currentJob?.scheduledTime || '--:--'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" sx={{ textTransform: 'uppercase', color: TEXT_LIGHT, fontWeight: 700, fontSize: '0.7rem' }}>Service Address</Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'start', gap: 1, mt: 0.5 }}>
                                                    <LocationOn sx={{ color: TEXT_LIGHT, fontSize: 18 }} />
                                                    <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
                                                        {currentJob?.location?.address || currentJob?.address || 'Location provided'}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            {/* [NEW] Customer Note */}
                                            {currentJob?.description && (
                                                <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2, border: '1px dashed #cbd5e1' }}>
                                                    <Typography variant="caption" sx={{ textTransform: 'uppercase', color: TEXT_LIGHT, fontWeight: 700, fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Chat sx={{ fontSize: 14 }} /> Customer Note
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#334155', mt: 1 }}>
                                                        "{currentJob.description}"
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Stack>
                                    </Grid>
                                    {/* Map */}
                                    <Grid item xs={12}>
                                        <Box sx={{ height: 200, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                                            {loadError ? (
                                                <Box sx={{ height: '100%', bgcolor: '#fef2f2', color: '#dc2626', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                                                    <Typography variant="caption">Map Error: {loadError.message}</Typography>
                                                </Box>
                                            ) : isLoaded ? (
                                                <GoogleMap
                                                    mapContainerStyle={{ width: '100%', height: '100%' }}
                                                    center={jobPos}
                                                    zoom={13}
                                                    options={{
                                                        disableDefaultUI: true,
                                                        zoomControl: true,
                                                        mapTypeControl: false,
                                                        streetViewControl: false
                                                    }}
                                                >
                                                    {/* Job Location Marker */}
                                                    <Marker position={jobPos} />

                                                    {/* Technician Location Marker */}
                                                    {techLocation && (
                                                        <Marker
                                                            position={techLocation}
                                                            icon={{
                                                                path: window.google?.maps?.SymbolPath?.FORWARD_CLOSED_ARROW,
                                                                scale: 4,
                                                                fillColor: PRIMARY_BLUE,
                                                                fillOpacity: 1,
                                                                strokeWeight: 1,
                                                                rotation: 0 // Could calculate bearing if previous loc is known
                                                            }}
                                                            label="Tech"
                                                        />
                                                    )}
                                                </GoogleMap>
                                            ) : (
                                                <Box sx={{ height: '100%', bgcolor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Typography variant="caption" color="text.secondary">Loading Map...</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Card>
                    </Stack>
                </Grid>

                {/* RIGHT COL */}
                <Grid item xs={12} sm={8}>
                    <Stack spacing={2}>
                        {/* Payment Summary */}
                        <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
                            <Box sx={{ p: 2, px: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Payment Summary</Typography>
                            </Box>
                            <CardContent sx={{ p: 2.5 }}>
                                <Stack spacing={1.5}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" sx={{ color: TEXT_LIGHT }}>Service Fee</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{currentJob?.visitingCharges || 0}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" sx={{ color: TEXT_LIGHT }}>Spare Parts</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>--</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" sx={{ color: TEXT_LIGHT }}>Tax (10%)</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{(currentJob?.visitingCharges || 0) * 0.1}</Typography>
                                    </Box>
                                    <Divider sx={{ my: 0.5 }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>Total Amount</Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 900, color: PRIMARY_BLUE }}>₹{currentJob?.totalCost || ((currentJob?.visitingCharges || 0) * 1.1)}</Typography>
                                    </Box>
                                    <Box sx={{ bgcolor: '#eff6ff', p: 1, borderRadius: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                                        <Info sx={{ color: PRIMARY_BLUE, fontSize: 16 }} />
                                        <Typography variant="caption" sx={{ color: PRIMARY_BLUE, lineHeight: 1.2 }}>Final price may vary based on parts used.</Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Actions</Typography>
                                <Stack spacing={1.5}>
                                    <Button variant="contained" startIcon={<SupportAgent />} sx={{ width: '100%', py: 1, borderRadius: 2, bgcolor: PRIMARY_BLUE, textTransform: 'none', fontWeight: 600 }}>
                                        Contact Support
                                    </Button>
                                    <Button variant="outlined" startIcon={<CalendarMonth />} sx={{ width: '100%', py: 1, borderRadius: 2, borderColor: 'divider', color: TEXT_DARK, textTransform: 'none', fontWeight: 600 }}>
                                        Reschedule
                                    </Button>
                                    <Button variant="text" startIcon={<Cancel />} sx={{ width: '100%', py: 1, borderRadius: 2, color: '#dc2626', textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#fef2f2' } }}>
                                        Cancel Booking
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* Safety Tip */}
                        <Box sx={{ bgcolor: '#f0f9ff', border: '1px solid #dbeafe', borderRadius: 3, p: 2, display: 'flex', gap: 2 }}>
                            <Security sx={{ color: '#2563eb', fontSize: 20 }} />
                            <Box>
                                <Typography variant="subtitle2" sx={{ color: '#1e3a8a', fontWeight: 700, fontSize: '0.875rem' }}>Safety First</Typography>
                                <Typography variant="caption" sx={{ color: '#1d4ed8', lineHeight: 1.2 }}>
                                    Share your OTP <Box component="span" sx={{ bgcolor: 'white', px: 0.5, borderRadius: 0.5, fontWeight: 700, fontFamily: 'monospace' }}>{currentJob?.otp || '----'}</Box> with the professional.
                                </Typography>
                            </Box>
                        </Box>
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ActiveBooking;
