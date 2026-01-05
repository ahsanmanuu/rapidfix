import { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { Grid, Typography, Card, CardContent, Box, Chip, Avatar, List, ListItem, ListItemAvatar, ListItemText, Divider, ListItemButton, ListItemIcon, Button, Modal, IconButton } from '@mui/material';
import { AccessTime, LocationOn, Assessment, Schedule, Chat, AccountBalanceWallet, Work as WorkIcon, FlashOn, InvertColors as PlumbingIcon, FormatPaint, AcUnit, Videocam, Print, BatteryChargingFull, Fingerprint } from '@mui/icons-material';
import MakeOfferModal from './MakeOfferModal';
import DashboardOffers from './DashboardOffers';
import api, { getWalletBalance, createJob } from '../../services/api';
import TechnicianSearchModal from '../TechnicianSearchModal';
import BookingConfirmationModal from '../BookingConfirmationModal';

const DashboardHome = ({ user, jobs = [] }) => {
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

                            // Save to LocalStorage (Single Source of Truth)
                            const updatedUser = { ...user, location: newLocation };
                            localStorage.setItem('user', JSON.stringify(updatedUser));

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
            alert("Failed to book.");
        }
    };


    const safeJobs = jobs || [];
    const activeJobs = safeJobs.filter(j => ['pending', 'accepted', 'in-progress'].includes(j.status)).length;
    const pendingReview = safeJobs.filter(j => j.status === 'completed' && !j.feedbackGiven).length;

    const cards = [
        {
            icon: <AccountBalanceWallet fontSize="large" sx={{ color: '#fff' }} />,
            title: 'Wallet Balance',
            value: `₹${walletBalance.toFixed(2)}`,
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
                    <Typography variant="h2" gutterBottom>
                        Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                        Here's what's happening with your service requests today.
                    </Typography>
                </Box>
            </Grid>

            {/* Stats Cards (Moved to Top) */}
            {cards.map((card, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card sx={{
                        background: card.bgcolor,
                        color: '#fff',
                        borderRadius: '16px',
                        height: '100%',
                        boxShadow: '0 4px 20px 0 rgba(0,0,0,0.12)'
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="subtitle1" sx={{ opacity: 0.9, color: 'inherit' }}>{card.title}</Typography>
                                    <Typography variant="h3" sx={{ my: 1, fontWeight: 'bold', color: 'inherit' }}>{card.value}</Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.8, color: 'inherit' }}>{card.subValue}</Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 60, height: 60 }}>
                                    {card.icon}
                                </Avatar>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            ))}

            {/* Quick Service Booking Tiles */}
            <Grid item xs={12}>
                <Typography variant="h3" sx={{ mb: 2, fontWeight: 'bold' }}>Quick Book Professional</Typography>
                <Grid container spacing={2}>
                    {quickServices.map((service, idx) => (
                        <Grid item xs={6} sm={4} md={2} key={idx}>
                            <Card
                                onClick={() => handleBookNow(service.title === 'A.C. Technician' ? 'AC Technician' : service.title.replace(' Tech', ' Technician'))}
                                sx={{
                                    borderRadius: '16px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': { transform: 'translateY(-5px)', boxShadow: theme.shadows[4] }
                                }}>
                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                    <Avatar sx={{
                                        bgcolor: service.bg,
                                        color: service.color,
                                        width: 56,
                                        height: 56,
                                        margin: '0 auto 8px'
                                    }}>
                                        {service.icon}
                                    </Avatar>
                                    <Typography variant="subtitle2" fontWeight="bold">{service.title}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Grid>

            <Grid item xs={12}>
                <DashboardOffers />
            </Grid>

            {/* Quick Actions (Restored Shape, Moved Left) */}
            <Grid item xs={12} md={4}>
                <Card sx={{ borderRadius: '16px', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: theme.shadows[2] }}>
                    <CardContent>
                        <Typography variant="h3" sx={{ mb: 3 }}>Other Actions</Typography>
                        <List>
                            <ListItemButton
                                onClick={() => setOpenOfferModal(true)}
                                sx={{ mb: 2, bgcolor: theme.palette.secondary.light, borderRadius: '12px', border: `1px dashed ${theme.palette.secondary.main}`, '&:hover': { bgcolor: theme.palette.secondary.light } }}
                            >
                                <ListItemIcon><AccountBalanceWallet color="secondary" /></ListItemIcon>
                                <ListItemText
                                    primary={<Typography variant="subtitle1" color="secondary" fontWeight="bold">Make an Offer</Typography>}
                                    secondary="Post a custom job with your price"
                                />
                            </ListItemButton>

                            <ListItemButton sx={{ mb: 2, bgcolor: theme.palette.grey[100], borderRadius: '12px' }}>
                                <ListItemIcon><Chat /></ListItemIcon>
                                <ListItemText primary="Contact Support" secondary="Get help" />
                            </ListItemButton>
                            <ListItemButton sx={{ bgcolor: theme.palette.grey[100], borderRadius: '12px' }}>
                                <ListItemIcon><AccountBalanceWallet /></ListItemIcon>
                                <ListItemText primary="Wallet Balance" secondary={`₹${walletBalance}`} />
                            </ListItemButton>
                        </List>
                    </CardContent>
                </Card>
            </Grid>

            {/* Recent Activity */}
            <Grid item xs={12} md={8}>
                <Card sx={{ borderRadius: '16px', height: '100%', boxShadow: theme.shadows[2] }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <Schedule color="primary" sx={{ mr: 1 }} />
                            <Typography variant="h3">Recent Activity</Typography>
                        </Box>
                        <List>
                            {safeJobs.slice(0, 3).map((job, idx) => (
                                <Box key={job.id}>
                                    <ListItem alignItems="flex-start" disablePadding sx={{ py: 2 }}>
                                        <ListItemAvatar>
                                            <Avatar sx={{
                                                bgcolor: job.status === 'completed' ? theme.palette.success.light :
                                                    job.status === 'in-progress' ? theme.palette.primary.light :
                                                        theme.palette.warning.light,
                                                color: job.status === 'completed' ? theme.palette.success.dark :
                                                    job.status === 'in-progress' ? theme.palette.primary.dark :
                                                        theme.palette.warning.dark
                                            }}>
                                                <WorkIcon />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={<Typography variant="h4">{job.serviceType}</Typography>}
                                            secondary={
                                                <Box component="span">
                                                    <Typography component="span" variant="body2" color="textSecondary" display="block">
                                                        {job.description}
                                                    </Typography>
                                                    <Typography component="span" variant="caption" color="textSecondary">
                                                        {new Date(job.createdAt).toLocaleDateString()}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                        <Chip
                                            label={job.status}
                                            size="small"
                                            sx={{
                                                bgcolor: job.status === 'completed' ? theme.palette.success.light :
                                                    job.status === 'in-progress' ? theme.palette.primary.light :
                                                        theme.palette.warning.light,
                                                color: job.status === 'completed' ? theme.palette.success.dark :
                                                    job.status === 'in-progress' ? theme.palette.primary.dark :
                                                        theme.palette.warning.dark,
                                                fontWeight: 'bold',
                                                textTransform: 'uppercase'
                                            }}
                                        />
                                    </ListItem>
                                    {idx < 2 && <Divider variant="inset" component="li" />}
                                </Box>
                            ))}
                            {safeJobs.length === 0 && (
                                <Typography variant="body1" align="center" color="textSecondary" sx={{ py: 4 }}>
                                    No recent activity.
                                </Typography>
                            )}
                        </List>
                    </CardContent>
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
