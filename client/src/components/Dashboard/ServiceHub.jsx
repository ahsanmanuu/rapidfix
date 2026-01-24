import React, { useState } from 'react';
import {
    Box, Grid, Typography, Button, IconButton, useTheme, Card, CardContent,
    Avatar, Chip
} from '@mui/material';
import {
    ArrowForward, Bolt, Plumbing, FormatPaint, AcUnit,
    BatteryChargingFull, Videocam, Fingerprint, Print,
    CardGiftcard, Star, LocalOffer as LocalOfferIcon, CalendarToday
} from '@mui/icons-material';
import TechnicianSearchModal from '../TechnicianSearchModal';
import ServiceScheduleModal from './ServiceScheduleModal';
import ClaimOfferModal from './ClaimOfferModal';
import BookingConfirmationModal from '../BookingConfirmationModal'; // [NEW]
import MakeOfferModal from './MakeOfferModal';
import { useAuth } from '../../context/AuthContext';
import { createJob } from '../../services/api'; // [NEW]



const ServiceHub = () => {
    const theme = useTheme();
    const { user } = useAuth();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [bookingParams, setBookingParams] = useState(null);

    // New Modals State
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false); // [NEW]
    const [selectedTechnician, setSelectedTechnician] = useState(null); // [NEW]
    const [selectedService, setSelectedService] = useState('');
    const [isOfferOpen, setIsOfferOpen] = useState(false);
    const [selectedOffer, setSelectedOffer] = useState(null);
    const [isMakeOfferOpen, setIsMakeOfferOpen] = useState(false);

    const services = [
        { icon: <Bolt fontSize="large" sx={{ color: '#ca8a04' }} />, name: 'Electrician', desc: 'Wiring, Faults & Repairs', bg: '#fefce8' },
        { icon: <Plumbing fontSize="large" sx={{ color: '#2563eb' }} />, name: 'Plumber', desc: 'Pipes, leaks & drains', bg: '#eff6ff' },
        { icon: <FormatPaint fontSize="large" sx={{ color: '#9333ea' }} />, name: 'Painter', desc: 'Walls, trim & exterior', bg: '#faf5ff' },
        { icon: <AcUnit fontSize="large" sx={{ color: '#0891b2' }} />, name: 'A.C. Technician', desc: 'Service, gas & repair', bg: '#ecfeff' },
        { icon: <BatteryChargingFull fontSize="large" sx={{ color: '#ea580c' }} />, name: 'Inverter Technician', desc: 'Battery & power backup', bg: '#fff7ed' },
        { icon: <Print fontSize="large" sx={{ color: '#dc2626' }} />, name: 'Printer Technician', desc: 'Office repair & setup', bg: '#fef2f2' },
        { icon: <Fingerprint fontSize="large" sx={{ color: '#16a34a' }} />, name: 'Biometrics Technician', desc: 'Access control systems', bg: '#f0fdf4' },
        { icon: <Videocam fontSize="large" sx={{ color: '#334155' }} />, name: 'CCTV Technician', desc: 'Installation & monitoring', bg: '#f1f5f9' },
    ];

    const handleBookNow = (serviceName) => {
        // QUICK BOOKING LOGIC: Detect Location -> Open Map

        const launchModal = (loc) => {
            setBookingParams({
                serviceType: serviceName,
                location: loc,
                // NOTE: For immediate bookings, do NOT set scheduledDate/scheduledTime
                // This prevents "past date" validation errors if user takes time to confirm
                contactName: user ? user.name : '',
                contactPhone: '',
                description: 'Quick Tile Booking'
            });
            setIsSearchOpen(true);
        };

        const handleLocationError = (error = null) => {
            console.error("Location detection failed:", error);
            // Fallback 1: User Profile Location
            if (user && user.location && user.location.latitude) {
                const loc = {
                    latitude: user.location.latitude,
                    longitude: user.location.longitude,
                    address: user.location.address || "Saved Profile Location"
                };
                launchModal(loc);
                return;
            }
            // Fallback 2: Default Location (New Delhi)
            const defaultLoc = {
                latitude: 28.6139,
                longitude: 77.2090,
                address: "New Delhi (Default)"
            };
            launchModal(defaultLoc);
        };

        if (!navigator.geolocation) {
            handleLocationError();
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const loc = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    address: "Current Location"
                };
                launchModal(loc);
            },
            (error) => {
                handleLocationError(error);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    const handleClaimOffer = (offer) => {
        setSelectedOffer(offer);
        setIsOfferOpen(true);
    };

    // [New] Handle Technician Select from Map
    const handleTechnicianSelect = (technician) => {
        setSelectedTechnician(technician);
        setIsSearchOpen(false);
        setIsConfirmOpen(true);
    };

    // [New] Handle Confirmation & Booking
    const handleConfirmBooking = (finalBookingData) => {
        if (!user) {
            alert("Please login to book a service"); // Should be handled by AuthGuard ideally
            return;
        }
        createJobRequest({ ...bookingParams, ...finalBookingData, userId: user.id });
    };

    // [New] API Call
    const createJobRequest = async (fullData) => {
        try {
            const payload = {
                ...fullData,
                technicianId: fullData.technicianId || selectedTechnician?.id,
            };

            const res = await createJob(payload);
            if (res.data.success) {
                setIsConfirmOpen(false);
                alert("Booking created successfully!");
                // Optionally redirect to Active Booking or History
            }
        } catch (error) {
            console.error("Job Creation Failed", error);
            const errorMsg = error.response?.data?.error || error.message || "Unknown error";
            alert(`Failed to create booking: ${errorMsg}`);
        }
    };


    return (
        <Box sx={{ display: 'flex', gap: 4, width: '100%', minHeight: '100vh', bgcolor: '#f8fafc' }}>

            {/* Main Content Area */}
            <Box sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
                <Box sx={{ maxWidth: '1200px', mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>

                    {/* Hero Slider */}
                    <Box sx={{
                        position: 'relative',
                        width: '100%',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        height: 280,
                        backgroundColor: '#fff',
                        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)'
                    }}>
                        <Box sx={{
                            display: 'flex',
                            overflowX: 'auto',
                            scrollSnapType: 'x mandatory',
                            height: '100%',
                            '&::-webkit-scrollbar': { display: 'none' }
                        }}>
                            {/* Slide 1: Interior */}
                            <Box sx={{ minWidth: '100%', height: '100%', position: 'relative', scrollSnapAlign: 'center' }}>
                                <Box component="img" src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <Box sx={{
                                    position: 'absolute', inset: 0,
                                    background: 'linear-gradient(to right, rgba(0,0,0,0.6), transparent)',
                                    display: 'flex', flexDirection: 'column', justifyContent: 'center', px: 6
                                }}>
                                    <Chip label="TRENDING" size="small" sx={{ bgcolor: '#447aee', color: '#fff', fontWeight: 'bold', mb: 1, width: 'fit-content', borderRadius: '4px' }} />
                                    <Typography variant="h4" fontWeight="bold" sx={{ color: '#fff', mb: 1 }}>Refresh Your Home</Typography>
                                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', maxWidth: 400, mb: 3 }}>
                                        Get premium painting and interior design services starting at just $199.
                                    </Typography>
                                    <Button variant="contained" sx={{ bgcolor: '#fff', color: '#447aee', fontWeight: 'bold', width: 'fit-content', '&:hover': { bgcolor: '#f8fafc' } }}>
                                        Explore Designs
                                    </Button>
                                </Box>
                            </Box>

                            {/* Slide 2: AC */}
                            <Box sx={{ minWidth: '100%', height: '100%', position: 'relative', scrollSnapAlign: 'center' }}>
                                <Box component="img" src="https://images.unsplash.com/photo-1581094794329-cd1361ddee2e?q=80&w=2000&auto=format&fit=crop" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <Box sx={{
                                    position: 'absolute', inset: 0,
                                    background: 'linear-gradient(to right, rgba(0,0,0,0.6), transparent)',
                                    display: 'flex', flexDirection: 'column', justifyContent: 'center', px: 6
                                }}>
                                    <Chip label="URGENT CARE" size="small" sx={{ bgcolor: '#f97316', color: '#fff', fontWeight: 'bold', mb: 1, width: 'fit-content', borderRadius: '4px' }} />
                                    <Typography variant="h4" fontWeight="bold" sx={{ color: '#fff', mb: 1 }}>AC Breakdown?</Typography>
                                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', maxWidth: 400, mb: 3 }}>
                                        Expert HVAC technicians available within 60 minutes.
                                    </Typography>
                                    <Button variant="contained" sx={{ bgcolor: '#fff', color: '#ea580c', fontWeight: 'bold', width: 'fit-content', '&:hover': { bgcolor: '#f8fafc' } }}>
                                        Book Urgent Repair
                                    </Button>
                                </Box>
                            </Box>
                        </Box>

                        {/* Dots */}
                        <Box sx={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 1 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.8)' }} />
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.4)' }} />
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.4)' }} />
                        </Box>
                    </Box>

                    {/* Quick Booking Grid */}
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mb: 2 }}>
                            <Box>
                                <Typography variant="h5" fontWeight="bold" sx={{ color: '#0f172a' }}>Instant Technician booking</Typography>
                            </Box>
                        </Box>

                        {/* MOBILE ONLY: Schedule & Make Offer Buttons */}
                        <Box sx={{ display: { xs: 'flex', lg: 'none' }, flexDirection: 'column', gap: 2, mb: 3 }}>
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={() => setIsScheduleOpen(true)}
                                startIcon={<CalendarToday sx={{ fontSize: 18 }} />}
                                sx={{
                                    bgcolor: '#447aee',
                                    fontSize: '0.75rem',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    py: 1,
                                    '&:hover': { bgcolor: '#3366d6' }
                                }}
                            >
                                Schedule
                            </Button>
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={() => setIsMakeOfferOpen(true)}
                                startIcon={<LocalOfferIcon sx={{ fontSize: 18 }} />}
                                sx={{
                                    borderColor: '#447aee',
                                    color: '#447aee',
                                    fontSize: '0.75rem',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    py: 1,
                                    '&:hover': { borderColor: '#3366d6', bgcolor: '#eff6ff' }
                                }}
                            >
                                Make Offer
                            </Button>
                        </Box>

                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: '1fr',
                                sm: 'repeat(2, 1fr)',
                                md: 'repeat(4, 1fr)'
                            },
                            gap: 2,
                            width: '100%',
                            pb: 8
                        }}>
                            {services.map((service) => (
                                <Card
                                    key={service.name}
                                    onClick={() => {
                                        setSelectedService(service.name);
                                        handleBookNow(service.name);
                                    }}
                                    sx={{
                                        borderRadius: '12px',
                                        border: '1px solid #f1f5f9',
                                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        p: 2,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                            borderColor: 'rgba(68, 122, 238, 0.3)'
                                        }
                                    }}>
                                    {/* Icon & Text Container */}
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, alignItems: { xs: 'center', md: 'center' }, gap: 2, textAlign: { xs: 'left', md: 'center' }, width: '100%' }}>
                                        <Box sx={{
                                            width: { xs: 48, md: 56 }, height: { xs: 48, md: 56 }, borderRadius: '50%', bgcolor: service.bg,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.1)' },
                                            flexShrink: 0, mx: { md: 'auto' }
                                        }}>
                                            {React.cloneElement(service.icon, { sx: { fontSize: '1.75rem', color: service.icon.props.sx.color } })}
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#1e293b', lineHeight: 1.2, mb: 0.5 }}>{service.name}</Typography>
                                            <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.3, minHeight: { md: '2.6em' } }}>
                                                {service.desc}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Button
                                        fullWidth
                                        size="small"
                                        variant="outlined"
                                        onClick={(e) => { e.stopPropagation(); handleBookNow(service.name); }}
                                        sx={{
                                            mt: 2.5,
                                            borderColor: '#e2e8f0',
                                            color: '#334155',
                                            fontWeight: 600,
                                            textTransform: 'none',
                                            '&:hover': {
                                                borderColor: 'transparent',
                                                bgcolor: '#447aee',
                                                color: '#fff'
                                            }
                                        }}
                                    >
                                        Book Now
                                    </Button>
                                </Card>
                            ))}
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Right Sidebar (Offers) - Hidden on smaller screens similar to Tailwind 'hidden 2xl:flex' */}
            <Box sx={{
                width: 340,
                flexShrink: 0,
                bgcolor: '#fff',
                borderLeft: '1px solid #f1f5f9',
                display: { xs: 'none', lg: 'flex' }, // Show only on Large screens
                flexDirection: 'column',
                p: 3,
                overflowY: 'auto'
            }}>
                <Box sx={{ mb: 4, p: 2.5, borderRadius: '16px', bgcolor: '#f0f9ff', border: '1px solid #bae6fd' }}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#0f172a', mb: 2 }}>Schedule booking or Make an offer</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Button fullWidth variant="contained" onClick={() => setIsScheduleOpen(true)} sx={{ bgcolor: '#447aee', '&:hover': { bgcolor: '#3366d6' }, textTransform: 'none', fontWeight: 600 }}>
                            Schedule Service
                        </Button>
                        <Button fullWidth variant="outlined" onClick={() => setIsMakeOfferOpen(true)} sx={{ borderColor: '#447aee', color: '#447aee', '&:hover': { borderColor: '#3366d6', bgcolor: '#eff6ff' }, textTransform: 'none', fontWeight: 600 }}>
                            Make an Offer
                        </Button>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <LocalOfferIcon sx={{ color: '#447aee' }} />
                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#0f172a' }}>Exclusive Offers</Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box sx={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', height: 180, cursor: 'pointer', '&:hover img': { transform: 'scale(1.05)' } }}>
                        <Box component="img" src="https://images.unsplash.com/photo-1556911220-bff31c812dba?q=80&w=1000&auto=format&fit=crop" sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} />
                        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(30, 58, 138, 0.9), transparent)', p: 2.5, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                            <Chip label="New User" size="small" sx={{ bgcolor: '#fff', color: '#1e3a8a', fontWeight: 'bold', fontSize: '10px', height: 20, mb: 1, width: 'fit-content' }} />
                            <Typography variant="h6" fontWeight="bold" sx={{ color: '#fff', lineHeight: 1.2 }}>20% Off</Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', mb: 1.5 }}>On your first home cleaning</Typography>
                            <Button size="small" variant="contained" onClick={() => handleClaimOffer({ title: '20% Off', discount: '20%', code: 'NEWUSER20', image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?q=80&w=1000&auto=format&fit=crop' })} sx={{ bgcolor: '#447aee', fontSize: '10px', fontWeight: 'bold', '&:hover': { bgcolor: '#3366d6' } }}>Claim Offer</Button>
                        </Box>
                    </Box>

                    <Box sx={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', height: 180, cursor: 'pointer', '&:hover img': { transform: 'scale(1.05)' } }}>
                        <Box component="img" src="https://images.unsplash.com/photo-1621905251918-48416bd8575a?q=80&w=1000&auto=format&fit=crop" sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} />
                        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(124, 45, 18, 0.9), transparent)', p: 2.5, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                            <Chip label="Summer Special" size="small" sx={{ bgcolor: '#fff', color: '#9a3412', fontWeight: 'bold', fontSize: '10px', height: 20, mb: 1, width: 'fit-content' }} />
                            <Typography variant="h6" fontWeight="bold" sx={{ color: '#fff', lineHeight: 1.2 }}>AC Service Pack</Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', mb: 1.5 }}>Full maintenance ready</Typography>
                            <Button size="small" variant="contained" sx={{ bgcolor: '#f97316', fontSize: '10px', fontWeight: 'bold', '&:hover': { bgcolor: '#ea580c' } }}>View Package</Button>
                        </Box>
                    </Box>

                    <Box sx={{ p: 2.5, borderRadius: '16px', bgcolor: '#f8fafc', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                        <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#447aee', mx: 'auto', mb: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                            <CardGiftcard />
                        </Box>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#1e293b' }}>Refer & Earn</Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2 }}>Invite friends and get $20.</Typography>
                        <Typography variant="caption" fontWeight="bold" sx={{ color: '#447aee', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>Invite Friends</Typography>
                    </Box>
                </Box>
            </Box>

            {/* Scheduling Modal */}
            <ServiceScheduleModal
                open={isScheduleOpen}
                onClose={() => setIsScheduleOpen(false)}
                serviceType={selectedService}
                user={user}
                onJobCreated={() => window.location.reload()}
            />

            {/* Offer Modal */}
            <ClaimOfferModal
                open={isOfferOpen}
                onClose={() => setIsOfferOpen(false)}
                offer={selectedOffer}
            />

            {/* Make Offer Modal */}
            <MakeOfferModal
                open={isMakeOfferOpen}
                onClose={() => setIsMakeOfferOpen(false)}
                user={user}
            />

            {/* Technician Search Modal */}
            <TechnicianSearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                userLocation={bookingParams?.location}
                serviceType={bookingParams?.serviceType}
                onBook={handleTechnicianSelect} // [UPDATED]
            />

            {/* [NEW] Booking Confirmation Modal */}
            <BookingConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                technician={selectedTechnician}
                jobDetails={{
                    ...bookingParams,
                    // For immediate bookings, explicitly set undefined to skip backend date validation
                    scheduledDate: undefined,
                    scheduledTime: undefined
                }}
                onConfirm={handleConfirmBooking}
            />

        </Box>
    );
};

export default ServiceHub;
