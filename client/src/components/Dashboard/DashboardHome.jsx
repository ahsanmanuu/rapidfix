import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { Grid, Typography, Card, CardContent, Box, Chip, Avatar, List, ListItem, ListItemAvatar, ListItemText, Divider, ListItemButton, ListItemIcon, Button, Modal, IconButton, Backdrop, CircularProgress } from '@mui/material';
import { AccessTime, LocationOn, Assessment, Schedule, Chat, AccountBalanceWallet, Work as WorkIcon, FlashOn, InvertColors as PlumbingIcon, FormatPaint, AcUnit, Videocam, Print, BatteryChargingFull, Fingerprint } from '@mui/icons-material';
import MakeOfferModal from './MakeOfferModal';
import DashboardOffers from './DashboardOffers';
import api, { getWalletBalance, createJob } from '../../services/api';
import TechnicianSearchModal from '../TechnicianSearchModal';
import BookingConfirmationModal from '../BookingConfirmationModal';
import { useAuth } from '../../context/AuthContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

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

        if (liveLocation) launchMap(liveLocation);
        else if (user?.location?.latitude) launchMap(user.location);
        else launchMap(null);
    };

    // --- Stats Calculation ---
    const completedJobs = jobs.filter(j => j.status === 'completed');
    // "Rejected" might mean 'cancelled' or specific status. User said "Rejected".
    const rejectedJobs = jobs.filter(j => j.status === 'cancelled' || j.status === 'rejected');
    const activeJobs = jobs.filter(j => ['pending', 'accepted', 'in_progress'].includes(j.status));

    // Spending Data
    const totalSpent = completedJobs.reduce((sum, j) => sum + (Number(j.offerPrice) || Number(j.visitingCharges) || 0), 0);

    // "Saving chart per job" -> Maybe compare offerPrice vs real market price? 
    // Or just Spending History. I'll stick to Spending History for now as we don't have "market price" easily.
    const spendingData = completedJobs
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .map(j => ({
            name: j.serviceType, // or Date
            date: new Date(j.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            amount: Number(j.offerPrice) || Number(j.visitingCharges) || 0
        }));

    // Service Distribution
    const serviceDist = jobs.reduce((acc, j) => {
        acc[j.serviceType] = (acc[j.serviceType] || 0) + 1;
        return acc;
    }, {});
    const pieData = Object.keys(serviceDist).map(k => ({ name: k, value: serviceDist[k] }));

    const COLORS = [theme.palette.primary.main, theme.palette.secondary.main, theme.palette.success.main, theme.palette.error.main, '#8884d8'];

    return (
        <Box>
            {/* Header / Welcome */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ mb: 1, color: theme.palette.text.primary }}>
                        Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋
                    </Typography>
                    <Typography variant="body1" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOn fontSize="small" color="primary" />
                        {locationName.area || locationName.city || 'Locating...'}
                        {liveLocation && <Chip label="Live" color="success" size="small" sx={{ height: 20, fontSize: '0.65rem' }} />}
                    </Typography>
                </Box>
                {/* Book Now Button for easy access */}
                <Button
                    variant="contained"
                    size="large"
                    startIcon={<FlashOn />}
                    onClick={() => setIsSearchOpen(true)}
                    sx={{
                        borderRadius: '12px',
                        px: 4,
                        py: 1.5,
                        textTransform: 'none',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        boxShadow: '0 8px 16px rgba(33, 150, 243, 0.24)',
                        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                    }}
                >
                    Quick Book Professional
                </Button>
            </Box>

            {/* Stats Grid */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {[
                    { label: 'Total Spent', val: `₹${totalSpent}`, icon: <AccountBalanceWallet />, color: theme.palette.primary.main, bg: 'rgba(33, 150, 243, 0.1)' },
                    { label: 'Completed Jobs', val: completedJobs.length, icon: <Assessment />, color: theme.palette.success.main, bg: 'rgba(0, 200, 83, 0.1)' },
                    { label: 'Active Requests', val: activeJobs.length, icon: <WorkIcon />, color: theme.palette.warning.main, bg: 'rgba(255, 171, 0, 0.1)' },
                    { label: 'Rejected/Cancelled', val: rejectedJobs.length, icon: <AccessTime />, color: theme.palette.error.main, bg: 'rgba(255, 82, 82, 0.1)' }
                ].map((stat, i) => (
                    <Grid item xs={12} sm={6} md={3} key={i}>
                        <Card sx={{
                            borderRadius: '20px',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
                            border: '1px solid rgba(0,0,0,0.03)',
                            height: '100%'
                        }}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                                <Avatar variant="rounded" sx={{
                                    width: 56, height: 56,
                                    bgcolor: stat.bg, color: stat.color,
                                    borderRadius: '14px', mr: 2
                                }}>
                                    {stat.icon}
                                </Avatar>
                                <Box>
                                    <Typography variant="h4" fontWeight="800" sx={{ color: theme.palette.text.primary }}>
                                        {stat.val}
                                    </Typography>
                                    <Typography variant="body2" fontWeight="500" sx={{ color: theme.palette.text.secondary }}>
                                        {stat.label}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Charts Section */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Spending Chart */}
                <Grid item xs={12} md={8}>
                    <Card sx={{ borderRadius: '24px', boxShadow: 'none', border: '1px solid rgba(0,0,0,0.05)', height: '100%', bgcolor: '#fff' }}>
                        <Box sx={{ p: 3, borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="h6" fontWeight="bold">Spending Analysis</Typography>
                            <Chip label="Last 30 Days" size="small" sx={{ bgcolor: 'rgba(0,0,0,0.03)' }} />
                        </Box>
                        <Box sx={{ p: 3, height: 350 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={spendingData.length ? spendingData : [{ date: 'No Data', amount: 0 }]}>
                                    <defs>
                                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.2} />
                                            <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9eaebb', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9eaebb', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
                                        cursor={{ stroke: theme.palette.primary.main, strokeWidth: 1, strokeDasharray: '4 4' }}
                                    />
                                    <Area type="monotone" dataKey="amount" stroke={theme.palette.primary.main} strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Box>
                    </Card>
                </Grid>

                {/* Service Mix Pie Chart */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ borderRadius: '24px', boxShadow: 'none', border: '1px solid rgba(0,0,0,0.05)', height: '100%', bgcolor: '#fff' }}>
                        <Box sx={{ p: 3, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                            <Typography variant="h6" fontWeight="bold">Service Distribution</Typography>
                        </Box>
                        <Box sx={{ p: 3, height: 350, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData.length ? pieData : [{ name: 'None', value: 1 }]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </Box>
                    </Card>
                </Grid>
            </Grid>

            {/* Recent Activity (Completed Jobs) */}
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Recent Activity</Typography>
            <Grid container spacing={2}>
                {jobs.slice(0, 3).map((job) => (
                    <Grid item xs={12} key={job.id}>
                        <Card sx={{
                            borderRadius: '16px',
                            boxShadow: 'none',
                            border: '1px solid rgba(0,0,0,0.05)',
                            transition: 'all 0.2s',
                            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }
                        }}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, '&:last-child': { pb: 2 } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar sx={{ bgcolor: theme.palette.primary.lighter, color: theme.palette.primary.main }}>
                                        {job.serviceType.includes('Plumb') ? <PlumbingIcon /> : <WorkIcon />}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="bold">{job.serviceType}</Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {new Date(job.createdAt).toLocaleDateString()} • {job.status}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Typography variant="h6" fontWeight="bold" color={job.status === 'completed' ? 'success.main' : 'text.secondary'}>
                                    ₹{job.offerPrice || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
                {jobs.length === 0 && (
                    <Grid item xs={12}>
                        <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#fff', borderRadius: '16px' }}>
                            <Typography color="textSecondary">No recent activity found.</Typography>
                        </Box>
                    </Grid>
                )}
            </Grid>

            {/* Modals */}
            <TechnicianSearchModal
                open={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                userLocation={liveLocation || user?.location}
                onSelectTechnician={(tech) => {
                    setSelectedTechnician(tech);
                    setIsSearchOpen(false);
                    setBookingParams({ ...bookingParams, technician: tech });
                    alert(`Selected ${tech.name}. Redirecting to booking...`);
                }}
            />
        </Box>
    );
};

export default DashboardHome;



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

// Priority 3: Final GPS Attempt (Delegate to Modal + Pre-fetch)
if (!navigator.geolocation) {
    alert('Geolocation is not supported');
    return;
}

// 1. Launch immediately (Modal will start its own internal fetch too)
launchMap(null);

// 2. Start Parallel Fetch (Non-blocking) - "Fast Lock" then "Precision Lock"
const updateLoc = (pos) => {
    const newLoc = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        address: "Precise Location"
    };
    setBookingParams(prev => prev ? { ...prev, location: newLoc } : null);
};

// A. Fast Lock (Low Accuracy - Instant)
navigator.geolocation.getCurrentPosition(
    (position) => {
        console.log("[GPS] Fast Lock Acquired:", position.coords.latitude, position.coords.longitude);
        updateLoc(position);

        // B. Precision Lock (High Accuracy - Refinement)
        navigator.geolocation.getCurrentPosition(
            (betterPos) => {
                console.log("[GPS] Precision Lock Acquired");
                updateLoc(betterPos);
            },
            (err) => console.warn("Background Precise GPS failed", err),
            { timeout: 10000, enableHighAccuracy: true, maximumAge: 0 }
        );
    },
    (err) => {
        console.warn("Fast GPS failed, falling back to Precise...", err);
        // Fallback: Try Precise directly if Fast fails
        navigator.geolocation.getCurrentPosition(
            (p) => updateLoc(p),
            (e) => console.error("All GPS attempts failed", e),
            { timeout: 10000, enableHighAccuracy: true }
        );
    },
    { timeout: 2000, enableHighAccuracy: false, maximumAge: 60000 } // Use cached if < 1 min old
);
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
                                transition: 'all 0.2s ease-in-out',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                border: '1px solid transparent',
                                position: 'relative',
                                overflow: 'hidden',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0 12px 24px -4px rgba(0,0,0,0.12)',
                                    borderColor: service.color, // Color border on hover
                                    backgroundColor: service.bg // Light tint background on hover
                                },
                                '&:active': {
                                    transform: 'scale(0.98)',
                                    backgroundColor: service.bg
                                }
                            }}>
                            {/* Hover Gradient Overlay */}
                            <Box sx={{
                                position: 'absolute',
                                inset: 0,
                                background: `linear-gradient(135deg, ${service.color}10, transparent)`,
                                opacity: 0,
                                transition: 'opacity 0.3s',
                                '.MuiCard-root:hover &': { opacity: 1 }
                            }} />

                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, position: 'relative', zIndex: 1 }}>
                                <Avatar sx={{
                                    bgcolor: service.bg,
                                    color: service.color,
                                    width: 56,
                                    height: 56,
                                    margin: '0 auto 12px',
                                    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                    boxShadow: `0 4px 12px ${service.color}30`, // Colored shadow matching icon
                                    '.MuiCard-root:hover &': {
                                        transform: 'scale(1.1) rotate(6deg)',
                                        boxShadow: `0 8px 20px ${service.color}50`
                                    }
                                }}>
                                    {React.cloneElement(service.icon, { fontSize: "medium" })}
                                </Avatar>
                                <Typography variant="body2" fontWeight="700" display="block" sx={{ fontSize: '0.9rem', color: theme.palette.text.primary, letterSpacing: '0.02em' }}>{service.title}</Typography>
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
            <Card sx={{ borderRadius: '16px', mb: 1, backgroundColor: 'transparent', backgroundImage: 'none', boxShadow: 'none' }}>
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
