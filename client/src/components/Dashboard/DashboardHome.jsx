import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { Grid, Typography, Card, CardContent, Box, Chip, Avatar, List, ListItem, ListItemAvatar, ListItemText, Divider, ListItemButton, ListItemIcon, Button, Modal, IconButton } from '@mui/material';
import { AccessTime, LocationOn, Assessment, Schedule, Chat, AccountBalanceWallet, Work as WorkIcon, FlashOn, InvertColors as PlumbingIcon, FormatPaint, AcUnit, Videocam, Print, BatteryChargingFull, Fingerprint } from '@mui/icons-material';
import MakeOfferModal from './MakeOfferModal';
import DashboardOffers from './DashboardOffers';
import api, { getWalletBalance, createJob } from '../../services/api';
import TechnicianSearchModal from '../TechnicianSearchModal';
import BookingConfirmationModal from '../BookingConfirmationModal';
import { useAuth } from '../../context/AuthContext';

const DashboardHome = ({ jobs = [] }) => {
    const { user, updateUser } = useAuth();
    const theme = useTheme();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [openOfferModal, setOpenOfferModal] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0);
    const [locationName, setLocationName] = useState({ city: 'Detecting...', area: 'Unknown Area' });

    // Live Location State (Synced with Backend)
    const [liveLocation, setLiveLocation] = useState(null);

    // Booking Flow State
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [bookingParams, setBookingParams] = useState(null);
    const [selectedTechnician, setSelectedTechnician] = useState(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (user?.id) {
            fetchWallet(user.id);
        }

        const syncLocation = async () => {
            if (!navigator.geolocation) return;

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;

                    // 1. Fetch Readable Address
                    let addressText = "Unknown Location";
                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                        const data = await response.json();
                        if (data && data.address) {
                            const city = data.address.city || data.address.town || data.address.village || 'Unknown City';
                            const area = data.address.suburb || data.address.neighbourhood || data.address.road || 'Unknown Area';
                            addressText = `${area}, ${city}`;
                            setLocationName({ city, area });
                        }
                    } catch (e) {
                        console.error("Address lookup failed", e);
                        setLocationName({ city: `${lat.toFixed(4)}, ${lon.toFixed(4)}`, area: "GPS Location" });
                    }

                    // 2. Sync to Backend (The "User Manager")
                    if (user?.id) {
                        try {
                            const newLocation = {
                                latitude: lat,
                                longitude: lon,
                                address: addressText
                            };

                            // Save to DB
                            await api.put(`/users/${user.id}`, { location: newLocation });

                            // Update Context (Single Source of Truth)
                            updateUser({ location: newLocation });

                            // Update React State for Booking usage
                            setLiveLocation(newLocation);

                            console.log("Location synced to backend:", newLocation);
                        } catch (err) {
                            console.error("Failed to sync location to backend", err);
                        }
                    }
                },
                (err) => {
                    console.warn("GPS access denied, using saved profile", err);
                    if (user?.location) {
                        setLiveLocation(user.location);
                        const parts = (user.location.address || "").split(',');
                        if (parts.length >= 2) {
                            setLocationName({
                                city: parts[parts.length - 1]?.trim(),
                                area: parts.slice(0, parts.length - 1).join(',')?.trim()
                            });
                        } else {
                            setLocationName({ city: user.location.address || "Saved Location", area: "" });
                        }
                    }
                }
            );
        };

        syncLocation();
    }, [user]);

    const fetchAddress = async (lat, lon) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const data = await response.json();
            if (data && data.address) {
                const city = data.address.city || data.address.town || data.address.village || 'Unknown City';
                const area = data.address.suburb || data.address.neighbourhood || data.address.road || 'Unknown Area';
                setLocationName({ city, area });
            }
        } catch (error) {
            console.error("Reverse geocoding failed", error);
            setLocationName({
                city: `${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)}`,
                area: 'Address lookup failed'
            });
        }
    };

    const fetchWallet = async (userId) => {
        try {
            const res = await getWalletBalance(userId);
            if (res.data.success) {
                setWalletBalance(res.data.balance);
            }
        } catch (error) {
            console.error("Failed to fetch wallet", error);
        }
    };

    const handleOfferSuccess = () => {
        alert('Your offer has been posted successfully!');
    };

    // --- Booking Logic ---
    const handleBookNow = (serviceType) => {
        const launchMap = (loc) => {
            setBookingParams({
                serviceType,
                location: loc,
                scheduledDate: new Date().toISOString().split('T')[0],
                scheduledTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
                contactName: user?.name || '',
                contactPhone: user?.phone || '',
                description: 'Quick Dashboard Booking'
            });
            setIsSearchOpen(true);
        };

        // Priority 1: Use Live Synced Location (Fresh from GPS + DB)
        if (liveLocation) {
            launchMap(liveLocation);
            return;
        }

        // Priority 2: Fallback to existing User Prop (if sync hasn't finished yet)
        if (user?.location?.latitude) {
            const loc = {
                latitude: user.location.latitude,
                longitude: user.location.longitude,
                address: user.location.address || (locationName.area + ", " + locationName.city)
            };
            launchMap(loc);
            return;
        }

        // Priority 3: Final GPS Attempt (if all else fails and sync didn't run)
        if (!navigator.geolocation) {
            alert('Geolocation is not supported');
            return;
        }

        navigator.geolocation.getCurrentPosition((position) => {
            const loc = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                address: locationName.area + ", " + locationName.city
            };
            launchMap(loc);
        }, (err) => {
            alert("Please enable location to find technicians");
        });
    };

    const handleTechnicianSelect = (tech) => {
        setSelectedTechnician(tech);
        setIsSearchOpen(false);
        setIsConfirmOpen(true);
    };

    const handleConfirmBooking = async (finalData) => {
        try {
            // finalData contains visitingCharges, agreement, technicianId
            const payload = {
                ...bookingParams,
                ...finalData,
                userId: user.id
            };

            const res = await createJob(payload);
            if (res.data.success) {
                setIsConfirmOpen(false);
                alert(`Booking Confirmed! Technician ${selectedTechnician.name} has been notified.`);
                // Optionally refresh jobs (would require parent refresh)
                window.location.reload(); // Simple refresh to show new job
            }
        } catch (e) {
            console.error("Booking failed", e);
            const errorMsg = e.response?.data?.error || e.message || "Unknown error";
            alert(`Failed to book: ${errorMsg}`);
        }
    };


    const safeJobs = Array.isArray(jobs) ? jobs : [];
    const activeJobs = safeJobs.filter(j => ['pending', 'accepted', 'in-progress'].includes(j?.status)).length;
    const pendingReview = safeJobs.filter(j => j?.status === 'completed' && !j?.feedbackGiven).length;

    const cards = [
        {
            icon: <AccountBalanceWallet fontSize="large" sx={{ color: '#fff' }} />,
            title: 'Wallet Balance',
            value: `₹${(Number(typeof walletBalance === 'object' ? (walletBalance.balance || 0) : walletBalance) || 0).toFixed(2)}`,
            subValue: 'Add money to wallet',
            bgcolor: 'linear-gradient(135deg, #FF512F 0%, #DD2476 100%)' // Crimson/Pink gradient
        },
        {
            icon: <LocationOn fontSize="large" sx={{ color: '#fff' }} />,
            title: 'Service Location',
            value: locationName.city,
            subValue: locationName.area,
            bgcolor: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' // Green gradient
        },
        {
            icon: <Assessment fontSize="large" sx={{ color: '#fff' }} />,
            title: 'Active Jobs',
            value: activeJobs,
            subValue: pendingReview > 0 ? `${pendingReview} need review` : 'All caught up',
            bgcolor: 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)' // Blue gradient
        }
    ];

    const quickServices = [
        { title: 'Electrician', icon: <FlashOn fontSize="large" />, color: '#ffb300', bg: '#fff8e1' },
        { title: 'Plumber', icon: <PlumbingIcon fontSize="large" />, color: '#039be5', bg: '#e1f5fe' },
        { title: 'Painter', icon: <FormatPaint fontSize="large" />, color: '#e91e63', bg: '#fce4ec' },
        { title: 'A.C. Technician', icon: <AcUnit fontSize="large" />, color: '#1e88e5', bg: '#e3f2fd' },
        { title: 'Inverter Tech', icon: <BatteryChargingFull fontSize="large" />, color: '#f57c00', bg: '#fff3e0' },
        { title: 'CCTV Technician', icon: <Videocam fontSize="large" />, color: '#43a047', bg: '#e8f5e9' },
        { title: 'Biometrics Tech', icon: <Fingerprint fontSize="large" />, color: '#673ab7', bg: '#ede7f6' },
        { title: 'Printer Tech', icon: <Print fontSize="large" />, color: '#607d8b', bg: '#eceff1' },
    ];

    return (
        <Grid container spacing={3}>
            {/* ... Welcome & Existing Stats ... */}
            <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Here's what's happening with your service requests today.
                    </Typography>
                </Box>
            </Grid>

            {/* Stats Cards (Moved to Top) */}
            {cards.map((card, index) => (
                <Grid item xs={6} sm={4} md={4} key={index}>
                    <Card sx={{
                        background: card.bgcolor,
                        color: '#fff',
                        borderRadius: '12px',
                        height: '100%',
                        boxShadow: '0 2px 10px 0 rgba(0,0,0,0.08)'
                    }}>
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="caption" sx={{ opacity: 0.9, color: 'inherit', fontSize: '0.7rem' }}>{card.title}</Typography>
                                    <Typography variant="h6" sx={{ my: 0.25, fontWeight: 'bold', color: 'inherit', lineHeight: 1.2 }}>{card.value}</Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.8, color: 'inherit', fontSize: '0.6rem' }}>{card.subValue}</Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 32, height: 32 }}>
                                    {React.cloneElement(card.icon, { fontSize: "small" })}
                                </Avatar>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            ))}

            {/* Quick Service Booking Tiles */}
            <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Quick Book Professional</Typography>
                <Grid container spacing={2}>
                    {quickServices.map((service, idx) => (
                        <Grid item xs={6} sm={4} md={3} key={idx}>
                            <Card
                                onClick={() => handleBookNow(service.title === 'A.C. Technician' ? 'AC Technician' : service.title.replace(' Tech', ' Technician'))}
                                sx={{
                                    borderRadius: '16px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                    border: '1px solid transparent',
                                    '&:hover': {
                                        transform: 'translateY(-5px)',
                                        boxShadow: '0 12px 24px -4px rgba(0,0,0,0.1)',
                                        borderColor: theme.palette.primary.main
                                    }
                                }}>
                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                    <Avatar sx={{
                                        bgcolor: service.bg,
                                        color: service.color,
                                        width: 48,
                                        height: 48,
                                        margin: '0 auto 12px',
                                        transition: 'transform 0.3s',
                                        '.MuiCard-root:hover &': {
                                            transform: 'scale(1.1) rotate(5deg)'
                                        }
                                    }}>
                                        {/* Scale down icon inside */}
                                        {React.cloneElement(service.icon, { fontSize: "medium" })}
                                    </Avatar>
                                    <Typography variant="body2" fontWeight="700" display="block" sx={{ fontSize: '0.85rem', color: theme.palette.text.primary }}>{service.title}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}

                    {/* Other Actions Card */}
                    <Grid item xs={12} sm={4} md={6}>
                        <Card sx={{
                            borderRadius: '16px',
                            height: '100%',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, width: '100%' }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            color="secondary"
                                            startIcon={<AccountBalanceWallet />}
                                            onClick={() => setOpenOfferModal(true)}
                                            sx={{ borderRadius: '12px', height: '100%', py: 1.5, borderColor: theme.palette.secondary.main, textTransform: 'none', justifyContent: 'flex-start', px: 2 }}
                                        >
                                            <Box sx={{ textAlign: 'left' }}>
                                                <Typography variant="subtitle2" fontWeight="bold">Make Offer</Typography>
                                                <Typography variant="caption" display="block" sx={{ lineHeight: 1, opacity: 0.7 }}>Post Custom Job</Typography>
                                            </Box>
                                        </Button>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            color="primary"
                                            startIcon={<Chat />}
                                            sx={{ borderRadius: '12px', height: '100%', py: 1.5, textTransform: 'none', justifyContent: 'flex-start', px: 2 }}
                                        >
                                            <Box sx={{ textAlign: 'left' }}>
                                                <Typography variant="subtitle2" fontWeight="bold">Support</Typography>
                                                <Typography variant="caption" display="block" sx={{ lineHeight: 1, opacity: 0.7 }}>Get Help</Typography>
                                            </Box>
                                        </Button>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Grid>

            <Grid item xs={12}>
                <DashboardOffers />
            </Grid>

            {/* Quick Actions (Merged above) */}

            {/* Recent Activity (Moved to Top & Made Horizontal) */}
            <Grid item xs={12}>
                <Card sx={{ borderRadius: '16px', boxShadow: theme.shadows[1], mb: 1, backgroundColor: 'transparent', backgroundImage: 'none', boxShadow: 'none' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, px: 1 }}>
                        <Schedule color="primary" sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="h6" fontWeight="bold">Recent Activity</Typography>
                    </Box>
                    <Box sx={{
                        display: 'flex',
                        gap: 2,
                        overflowX: 'auto',
                        pb: 1,
                        '::-webkit-scrollbar': { height: '6px' },
                        '::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '4px' },
                        '::-webkit-scrollbar-thumb': { background: '#ccc', borderRadius: '4px' }
                    }}>
                        {safeJobs.slice(0, 5).map((job) => (
                            <Card key={job.id} sx={{
                                minWidth: 280,
                                borderRadius: '12px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                border: '1px solid ' + theme.palette.divider,
                                flexShrink: 0
                            }}>
                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Avatar sx={{
                                                width: 32, height: 32,
                                                bgcolor: theme.palette.primary.light,
                                                color: theme.palette.primary.dark
                                            }}>
                                                <WorkIcon fontSize="small" />
                                            </Avatar>
                                            <Typography variant="subtitle2" fontWeight="bold">{job.serviceType}</Typography>
                                        </Box>
                                        <Chip
                                            label={job.status}
                                            size="small"
                                            sx={{
                                                height: 20,
                                                fontSize: '0.65rem',
                                                fontWeight: 'bold',
                                                textTransform: 'uppercase',
                                                bgcolor: job.status === 'completed' ? theme.palette.success.light :
                                                    job.status === 'in-progress' ? theme.palette.primary.light :
                                                        theme.palette.warning.light,
                                                color: job.status === 'completed' ? theme.palette.success.dark :
                                                    job.status === 'in-progress' ? theme.palette.primary.dark :
                                                        theme.palette.warning.dark
                                            }}
                                        />
                                    </Box>
                                    <Typography variant="body2" color="textSecondary" noWrap title={job.description} sx={{ mb: 1 }}>
                                        {job.description}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <AccessTime fontSize="inherit" />
                                        {new Date(job.createdAt).toLocaleDateString()} • {new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Typography>
                                </CardContent>
                            </Card>
                        ))}
                        {safeJobs.length === 0 && (
                            <Box sx={{ width: '100%', py: 3, textAlign: 'center', bgcolor: '#f9f9f9', borderRadius: '12px' }}>
                                <Typography variant="body2" color="textSecondary">No recent activity found.</Typography>
                            </Box>
                        )}
                    </Box>
                </Card>
            </Grid>



            {/* Modals */}
            <MakeOfferModal
                open={openOfferModal}
                onClose={() => setOpenOfferModal(false)}
                user={user}
                onSuccess={handleOfferSuccess}
            />

            {/* Booking Flow Modals */}
            {isSearchOpen && (
                <TechnicianSearchModal
                    isOpen={isSearchOpen}
                    onClose={() => setIsSearchOpen(false)}
                    userLocation={bookingParams?.location}
                    serviceType={bookingParams?.serviceType}
                    onBook={handleTechnicianSelect}
                />
            )}
            {isConfirmOpen && (
                <BookingConfirmationModal
                    isOpen={isConfirmOpen}
                    onClose={() => setIsConfirmOpen(false)}
                    technician={selectedTechnician}
                    jobDetails={bookingParams}
                    onConfirm={handleConfirmBooking}
                />
            )}
        </Grid>
    );
};

export default DashboardHome;
