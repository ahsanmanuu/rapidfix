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

            {/* Active Offers / Jobs */}
            <Grid item xs={12}>
                <DashboardOffers jobs={jobs} />
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
