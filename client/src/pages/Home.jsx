import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Shield, Clock, Zap, Droplet, Paintbrush, Camera, Fan, BatteryCharging, Fingerprint, Printer, Wrench, ShieldCheck, Wallet, ThumbsUp, UserCheck, Smile, BookOpen, Briefcase, Heart, MessageSquare } from 'lucide-react';
import Button from '../components/Button';
import ErrorBoundary from '../components/ErrorBoundary';
import TechnicianSearchModal from '../components/TechnicianSearchModal';
import ServiceBookingForm from '../components/ServiceBookingForm';
import BookingConfirmationModal from '../components/BookingConfirmationModal';
import UserLoginModal from '../components/UserLoginModal';
import api, { createJob, getTopRatedTechnicians } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext'; // [NEW]

// --- Hero Slides Data ---
const slides = [
    {
        id: 1,
        image: "https://images.unsplash.com/photo-1621905251189-fc015e7c482e?q=80&w=2069&auto=format&fit=crop",
        title: "Expert Electrical Services",
        subtitle: "Safe, reliable, and certified electricians at your doorstep."
    },
    {
        id: 2,
        image: "https://images.unsplash.com/photo-1581094794329-cd1096d7a43f?q=80&w=2069&auto=format&fit=crop",
        title: "Professional Plumbing",
        subtitle: "Leak fixes, installation, and maintenance by experts."
    },
    {
        id: 3,
        image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=2070&auto=format&fit=crop",
        title: "AC Repair & Service",
        subtitle: "Keep your cool with our premium AC maintenance."
    },
    {
        id: 4,
        image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=2070&auto=format&fit=crop",
        title: "Home Painting",
        subtitle: "Transform your home with vibrant, professional painting."
    },
    {
        id: 5,
        image: "https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?q=80&w=2069&auto=format&fit=crop",
        title: "Master Carpentry",
        subtitle: "Custom furniture and repairs by skilled woodworkers."
    },
    {
        id: 6,
        image: "https://images.unsplash.com/photo-1558002038-1091a1661116?q=80&w=2069&auto=format&fit=crop",
        title: "Smart Home & Security",
        subtitle: "Upgrade your security with CCTV and biometrics."
    }
];

// --- Technician Profiles Data (Fallback) ---
const fallbackProfiles = [
    {
        id: 1,
        name: "Raj Kumar",
        role: "Master Electrician",
        serviceType: "Electrician",
        image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=2070&auto=format&fit=crop",
        rating: "4.9/5",
        reviewCount: "120+",
        jobs: "500+",
        onTime: "100%",
        description: "Raj has been Fixofy's top-rated Master Electrician for 3 months running. With over 10 years of experience, he specializes in smart home installations."
    },
    {
        id: 2,
        name: "Vikram Singh",
        role: "Senior Plumber",
        serviceType: "Plumber",
        image: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?q=80&w=2070&auto=format&fit=crop",
        rating: "4.9/5",
        reviewCount: "150+",
        jobs: "450+",
        onTime: "99%",
        description: "Vikram is the go-to expert for emergency plumbing. Efficient, polite, and extremely skilled in complex pipe installations and leak detection."
    },
    {
        id: 3,
        name: "Sunita Sharma",
        role: "Expert Painter",
        serviceType: "Painter",
        image: "https://images.unsplash.com/photo-1596073419667-9d77d59f033f?q=80&w=1935&auto=format&fit=crop",
        rating: "4.8/5",
        reviewCount: "98",
        jobs: "320+",
        onTime: "98%",
        description: "Sunita brings walls to life with her artistic touch. She is known for her cleanliness, color consultation, and attention to detail in residential painting."
    },
    {
        id: 4,
        name: "Arjun Mehta",
        role: "AC Specialist",
        serviceType: "AC Technician",
        image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=2070&auto=format&fit=crop",
        rating: "4.7/5",
        reviewCount: "85",
        jobs: "250+",
        onTime: "96%",
        description: "Keep your cool with Arjun's expert AC servicing. He specializes in component repair, gas refilling, and energy-efficient cooling optimizations."
    },
    {
        id: 5,
        name: "Rahul Verma",
        role: "Inverter Expert",
        serviceType: "Inverter Technician",
        image: "https://images.unsplash.com/photo-1558227691-41ea78d1f631?q=80&w=1974&auto=format&fit=crop",
        rating: "4.8/5",
        reviewCount: "65",
        jobs: "180+",
        onTime: "97%",
        description: "Rahul ensures you never run out of power. He specializes in inverter battery maintenance, UPS repair, and new power backup installations."
    },
    {
        id: 6,
        name: "Amit Patel",
        role: "CCTV Security Pro",
        serviceType: "CCTV Technician",
        image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1974&auto=format&fit=crop",
        rating: "4.9/5",
        reviewCount: "110",
        jobs: "300+",
        onTime: "99%",
        description: "Secure your premises with Amit's expertise. From IP camera setups to complex DVR networking, he delivers top-tier security solutions."
    },
    {
        id: 7,
        name: "Zoya Khan",
        role: "Biometrics Specialist",
        serviceType: "Biometrics Technician",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop",
        rating: "5.0/5",
        reviewCount: "45",
        jobs: "120+",
        onTime: "100%",
        description: "Zoya is our access control expert. She handles fingerprint sensors, smart locks, and facial recognition systems for offices and smart homes."
    },
    {
        id: 8,
        name: "David Fernandes",
        role: "Printer Technician",
        serviceType: "Printer Technician",
        image: "https://images.unsplash.com/photo-1563206767-5b1d97287397?q=80&w=2070&auto=format&fit=crop",
        rating: "4.6/5",
        reviewCount: "70",
        jobs: "210+",
        onTime: "95%",
        description: "David fixes paper jams and connectivity issues in a flash. Specializing in both laser and inkjet printers for home and office setups."
    }
];

const Home = () => {
    const { user, updateUser, setUser } = useAuth();
    const socket = useSocket(); // [NEW]
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [selectedService, setSelectedService] = useState('Electrician');
    const [selectedTechnician, setSelectedTechnician] = useState(null); // [ENSURE_STATE]
    const [currentTechIndex, setCurrentTechIndex] = useState(0);
    const [technicianProfiles, setTechnicianProfiles] = useState(fallbackProfiles);

    // Fetch Realtime Top Technicians
    useEffect(() => {
        const fetchTopTechs = async () => {
            try {
                const res = await getTopRatedTechnicians();
                if (res.data.success) {
                    const serverUrl = 'http://localhost:3000';
                    const technicians = Array.isArray(res.data.technicians) ? res.data.technicians : [];
                    const profiles = technicians.map(t => ({
                        id: t._id,
                        name: t.name,
                        role: t.expertise || t.serviceType || 'Master Technician',
                        serviceType: t.serviceType,
                        image: t.documents?.photo
                            ? (t.documents.photo.startsWith('http') ? t.documents.photo : `${serverUrl}${t.documents.photo}`)
                            : (fallbackProfiles && fallbackProfiles[0] ? fallbackProfiles[0].image : ''),
                        rating: t.rating || '4.8/5',
                        reviewCount: t.reviewCount || '50+',
                        jobs: t.completedJobs || '100+',
                        onTime: '99%',
                        description: t.bio || `Professional ${t.serviceType} with a track record of excellence.`,
                        // Ensure detailedRatings exists
                        detailedRatings: t.detailedRatings || { behavior: 5, expertise: 5, professionalism: 5, timelieness: 5 }
                    }));
                    setTechnicianProfiles(profiles);
                }
            } catch (err) {
                console.error("Failed to fetch top technicians", err);
            }
        };
        fetchTopTechs();
    }, []);

    // [REAL-TIME] Listen for status updates
    useEffect(() => {
        if (socket) {
            const handleStatusUpdate = ({ technicianId, status }) => {
                setTechnicianProfiles(prev => Array.isArray(prev) ? prev.map(t =>
                    t.id === technicianId ? { ...t, status: status } : t
                ) : []);
            };
            socket.on('technician_status_update', handleStatusUpdate);
            return () => socket.off('technician_status_update', handleStatusUpdate);
        }
    }, [socket]);

    // Flow State
    const [bookingParams, setBookingParams] = useState(null); // Data from form
    // Removed duplicate selectedTechnician state

    // Modals
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isSuccessOpen, setIsSuccessOpen] = useState(false); // Can reuse success modal or alert

    // Auto-advance slides
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    // Auto-advance Technician Profile (Fixed with dependency and bound check)
    useEffect(() => {
        if (!Array.isArray(technicianProfiles) || technicianProfiles.length === 0) return;
        const timer = setInterval(() => {
            setCurrentTechIndex((prev) => (prev + 1) % technicianProfiles.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [Array.isArray(technicianProfiles) ? technicianProfiles.length : 0]);

    // Auto-Sync Location for Logged-In Users
    useEffect(() => {
        if (user && user.id && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                try {
                    // 1. Reverse Geocode
                    let addressText = "Unknown Location";
                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                        const data = await response.json();
                        if (data && data.address) {
                            const city = data.address.city || data.address.town || data.address.village || 'Unknown City';
                            const area = data.address.suburb || data.address.neighbourhood || data.address.road || 'Unknown Area';
                            addressText = `${area}, ${city}`;
                        }
                    } catch (e) { console.error("Geo error", e); }

                    // 2. Update Backend
                    const newLocation = { latitude: lat, longitude: lon, address: addressText };
                    await api.put(`/users/${user.id}`, { location: newLocation });

                    // 3. Update Context (which handles localStorage)
                    updateUser({ location: newLocation });
                    console.log("Home: Location synced to backend");

                } catch (err) {
                    console.error("Home: Location sync failed", err);
                }
            },
                (err) => console.log("Silent location failure:", err),
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
        }
    }, [user?.id]);

    const handleFormSearch = (data) => {
        // Step 1: User fills form and clicks "Book"
        // Open Confirmation Modal instead of direct creation
        const bookingData = {
            ...data,
            technicianId: data.technicianId || null, // [FIX] Preserved from form if present
            visitingCharges: 299, // Set display charge
            agreementAccepted: false // Reset agreement
        };

        setBookingParams(bookingData);
        // Only clear if not specific booking
        if (!data.technicianId) {
            setSelectedTechnician(null);
        }
        setIsConfirmOpen(true);
    };

    const handleTechnicianSelect = (technician) => {
        setSelectedTechnician(technician);
        setIsSearchOpen(false);
        setIsConfirmOpen(true);
    };

    const handleConfirmBooking = (finalBookingData) => {
        if (!user) {
            setIsConfirmOpen(false);
            setIsLoginOpen(true);
            setBookingParams(prev => ({ ...prev, ...finalBookingData }));
        } else {
            createJobRequest({ ...bookingParams, ...finalBookingData, userId: user.id });
        }
    };

    const handleLoginSuccess = (userData) => {
        // setUser is now from context, it handles the state update
        setUser(userData);

        setIsLoginOpen(false);
        if (bookingParams && selectedTechnician) {
            createJobRequest({ ...bookingParams, userId: userData.id });
        }
    };

    const [isRequesting, setIsRequesting] = useState(false);

    const createJobRequest = async (fullData) => {
        try {
            const payload = {
                ...fullData,
                technicianId: fullData.technicianId || selectedTechnician?.id,
            };

            const res = await createJob(payload);
            if (res.data.success) {
                setIsConfirmOpen(false);

                if (user && user.role === 'technician') {
                    alert("Booking created! Redirecting to dashboard...");
                    navigate('/technician-dashboard');
                } else {
                    setIsRequesting(true);
                    setTimeout(() => {
                        navigate('/dashboard');
                    }, 4000);
                }
            }
        } catch (error) {
            console.error("Job Creation Failed", error);
            const errorMsg = error.response?.data?.error || error.message || "Unknown error";
            alert(`Failed to create booking: ${errorMsg}`);
        }
    };

    // Updated to support specific technician booking
    const handleBookNow = (serviceType = 'Electrician', technician = null) => {
        // If specific tech, set state and scroll to form (Bypass Map)
        if (technician) {
            setSelectedService(serviceType);
            setSelectedTechnician(technician);
            document.getElementById('booking-form-section')?.scrollIntoView({ behavior: 'smooth' });
            return;
        }

        // Quick Booking through Tiles -> Open Map (Legacy/Quick Flow)
        setSelectedService(serviceType);
        setSelectedTechnician(null); // Clear specific tech for general map search

        // PRIORITY STRATEGY: Live Location -> User Profile -> Default (New Delhi)

        const launchModal = (loc) => {
            setBookingParams({
                serviceType,
                location: loc,
                scheduledDate: new Date().toISOString().split('T')[0],
                scheduledTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
                contactName: user ? user.name : '',
                contactPhone: '',
                description: 'Quick Tile Booking'
            });
            setIsSearchOpen(true);
        };

        const handleLocationError = (error = null) => {
            console.error("Location detection failed:", error);

            // Fallback 1: User Profile Location (if available)
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
            alert("Location access failed. Showing technicians in New Delhi (Default).");
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
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    };

    return (
        <div className="bg-slate-50 min-h-screen font-sans text-slate-900 overflow-x-hidden pt-24 md:pt-48">

            {/* Modals */}
            <AnimatePresence>
                {isSearchOpen && (
                    <ErrorBoundary onClose={() => setIsSearchOpen(false)}>
                        <TechnicianSearchModal
                            isOpen={isSearchOpen}
                            onClose={() => setIsSearchOpen(false)}
                            userLocation={bookingParams?.location}
                            serviceType={selectedService}
                            onBook={handleTechnicianSelect}
                        />
                    </ErrorBoundary>
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
                {isLoginOpen && (
                    <UserLoginModal
                        isOpen={isLoginOpen}
                        onClose={() => setIsLoginOpen(false)}
                        onSuccess={handleLoginSuccess}
                    />
                )}
                {isRequesting && (
                    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center border border-white/20"
                        >
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Requesting...</h3>
                            <p className="text-slate-500 text-sm leading-relaxed mb-4">
                                Please be patient, our nearby technician will contact you soon.
                            </p>
                            <p className="text-xs text-slate-400 font-medium animate-pulse">
                                Redirecting to dashboard...
                            </p>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- Hero Section with Slideshow --- */}
            <section className="relative h-[650px] overflow-hidden mb-32 z-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0"
                    >
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${(slides && slides[currentSlide]) ? slides[currentSlide].image : ''})` }}
                        />
                        {/* Lighter Gradient Overlay for Light Theme readability if needed, or keeping it dark for contrast with white text */}
                        {/* Red Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-red-950/95 via-red-900/60 to-red-900/20"></div>
                    </motion.div>
                </AnimatePresence>

                <div className="relative container mx-auto px-6 h-full flex items-center z-10">
                    <div className="max-w-3xl space-y-8">
                        <motion.div
                            key={`text-${currentSlide}`}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                        >
                            <span className="px-4 py-1.5 rounded-full bg-red-600/20 border border-red-500/30 text-red-200 text-xs font-bold uppercase tracking-wider mb-6 inline-block backdrop-blur-md">
                                ✨ #1 Home Service Platform
                            </span>
                            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 text-white drop-shadow-lg tracking-tight">
                                {(slides && slides[currentSlide]) ? slides[currentSlide].title : 'Fixofy Services'}
                            </h1>
                            <p className="text-xl text-slate-200 mb-10 max-w-xl font-medium drop-shadow-md leading-relaxed">
                                {(slides && slides[currentSlide]) ? slides[currentSlide].subtitle : 'Expert solutions for your home.'}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto" style={{ flexDirection: 'column', gap: '1rem' }} data-version="nuclear-v4">
                                {/* Mobile-first inline style override for redundancy */}
                                <div className="hidden sm:block"> {/* Spacer for desktop logic if needed, but here we just ensure wrapper is robust */} </div>

                                <Button
                                    onClick={() => handleBookNow('Electrician')}
                                    className="w-full sm:w-auto px-8 py-4 text-base font-bold shadow-xl shadow-blue-600/30 bg-white text-slate-900 border-2 border-white rounded-full transition-all hover:scale-105 active:scale-95 !w-full sm:!w-auto"
                                >
                                    Book Now
                                </Button>
                                <Link to="/services" className="w-full sm:w-auto block">
                                    <Button className="w-full sm:w-auto px-8 py-4 text-base font-bold bg-white/10 backdrop-blur-md text-white border-2 border-white/30 rounded-full transition-all hover:bg-white/20 hover:scale-105 active:scale-95 !w-full sm:!w-auto">
                                        Learn More
                                    </Button>
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Slide Indicators */}
                <div className="absolute bottom-10 left-12 flex gap-3 z-20">
                    {slides.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentSlide(idx)}
                            className={`h-1.5 rounded-full transition-all duration-500 shadow-sm ${idx === currentSlide ? 'w-12 bg-red-600' : 'w-2 bg-white/30 hover:bg-white/60'}`}
                        />
                    ))}
                </div>
            </section>



            {/* --- Booking Section (Separated) --- */}
            <div id="booking-form-section" className="container mx-auto px-4 mb-24 relative z-20">
                <div className="flex flex-col items-center text-center mb-16 mt-12">
                    <div className="inline-flex items-center justify-center p-3 bg-blue-50 rounded-2xl mb-6">
                        <Wrench className="text-blue-600" size={32} />
                    </div>
                    <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">Book a Professional Technician</h2>
                    <p className="text-slate-500 text-lg md:text-xl max-w-2xl text-center">Select a service, pick your preferred time, and get expert help at your doorstep. Fast, reliable, and guaranteed quality.</p>
                </div>

                <div className="flex flex-col items-center">
                    <ServiceBookingForm
                        preselectedService={selectedService}
                        preselectedTechnician={selectedTechnician} // [NEW] Pass tech
                        onSearch={handleFormSearch}
                    />
                </div>
            </div>

            {/* explicit spacer to force separation */}
            <div className="h-[10px] w-full block" aria-hidden="true"></div>

            {/* --- Features Grid (Moved Outside) --- */}
            <div className="container mx-auto px-4 relative z-20 mb-24">
                <div className="flex flex-wrap justify-center items-center gap-3 mx-auto w-full">
                    <div className="w-[170px] shrink-0 h-[50px] flex flex-row items-center justify-center gap-3 p-2 bg-white rounded-lg border border-slate-100 shadow-sm transition-transform hover:-translate-y-1 duration-300">
                        <div className="p-1.5 bg-blue-50 rounded-full text-blue-600 shrink-0">
                            <ShieldCheck size={18} />
                        </div>
                        <p className="text-xs font-bold text-slate-900 leading-tight">Verified Experts</p>
                    </div>
                    <div className="w-[170px] shrink-0 h-[50px] flex flex-row items-center justify-center gap-3 p-2 bg-white rounded-lg border border-slate-100 shadow-sm transition-transform hover:-translate-y-1 duration-300">
                        <div className="p-1.5 bg-blue-50 rounded-full text-blue-600 shrink-0">
                            <Clock size={18} />
                        </div>
                        <p className="text-xs font-bold text-slate-900 leading-tight">On-Time Service</p>
                    </div>
                    <div className="w-[170px] shrink-0 h-[50px] flex flex-row items-center justify-center gap-3 p-2 bg-white rounded-lg border border-slate-100 shadow-sm transition-transform hover:-translate-y-1 duration-300">
                        <div className="p-1.5 bg-blue-50 rounded-full text-blue-600 shrink-0">
                            <Wallet size={18} />
                        </div>
                        <p className="text-xs font-bold text-slate-900 leading-tight">Min. Visit Price</p>
                    </div>
                    <div className="w-[170px] shrink-0 h-[50px] flex flex-row items-center justify-center gap-3 p-2 bg-white rounded-lg border border-slate-100 shadow-sm transition-transform hover:-translate-y-1 duration-300">
                        <div className="p-1.5 bg-blue-50 rounded-full text-blue-600 shrink-0">
                            <ThumbsUp size={18} />
                        </div>
                        <p className="text-xs font-bold text-slate-900 leading-tight">Top Rated</p>
                    </div>
                </div>
            </div>



            {/* --- Services Grid --- */}
            <section className="pt-24 pb-2 container mx-auto px-4">
                <div className="text-center mb-20">
                    <h2 className="text-4xl font-extrabold mb-4 text-slate-900 tracking-tight">Our Professional Services</h2>
                    <p className="text-slate-500 text-lg mx-auto text-center w-full block px-4">Expert solutions for every corner of your home.</p>
                </div>

                {/* Flexbox alignment for dynamic centering */}
                <div className="flex flex-wrap justify-center gap-3 md:gap-6 px-2 md:px-12 w-full">
                    {[
                        { id: 'Electrician', icon: <Zap size={18} />, title: "Electrician", desc: "Wiring & Safety", color: "text-amber-500", bg: "bg-amber-50" },
                        { id: 'Plumber', icon: <Droplet size={18} />, title: "Plumber", desc: "Pipes & Leaks", color: "text-cyan-600", bg: "bg-cyan-50" },
                        { id: 'Painter', icon: <Paintbrush size={18} />, title: "Painter", desc: "Interior Styling", color: "text-pink-500", bg: "bg-pink-50" },
                        { id: 'AC Technician', icon: <Fan size={18} />, title: "A.C. Technician", desc: "Cooling & Gas", color: "text-blue-600", bg: "bg-blue-50" },
                        { id: 'Inverter Technician', icon: <BatteryCharging size={18} />, title: "Inverter Technician", desc: "Battery & UPS", color: "text-orange-600", bg: "bg-orange-50" },
                        { id: 'CCTV Technician', icon: <Camera size={18} />, title: "CCTV Technician", desc: "Security Cams", color: "text-emerald-600", bg: "bg-emerald-50" },
                        { id: 'Biometrics Technician', icon: <Fingerprint size={18} />, title: "Biometrics Technician", desc: "Access Control", color: "text-purple-600", bg: "bg-purple-50" },
                        { id: 'Printer Technician', icon: <Printer size={18} />, title: "Printer Technician", desc: "Repair & Fix", color: "text-slate-600", bg: "bg-slate-50" },
                    ].map((service) => (
                        <div key={service.id} onClick={() => handleBookNow(service.id)} className="w-[170px] shrink-0">
                            <ServiceCard icon={service.icon} title={service.title} desc={service.desc} color={service.color} bg={service.bg} />
                        </div>
                    ))}
                </div>
            </section>

            {/* --- Technician of the Month --- */}
            <section className="pt-24 pb-24 bg-slate-900 text-white relative overflow-hidden mt-[25px] mb-32 mx-4 shadow-2xl">
                <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-l from-blue-900/30 to-transparent -skew-x-12 translate-x-20"></div>
                <div className="container mx-auto px-8 relative z-10">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentTechIndex}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col md:flex-row items-center gap-16"
                        >
                            <div className="md:w-1/2">
                                <div className="relative group mt-[15px]">
                                    <div className="relative group/img overflow-hidden rounded-[2.5rem] bg-slate-100 shadow-2xl border-4 border-white aspect-square max-w-[450px] mx-auto scale-90 group-hover:scale-100 transition-transform duration-700">
                                        <img
                                            src={(technicianProfiles && technicianProfiles[currentTechIndex]) ? technicianProfiles[currentTechIndex].image : (fallbackProfiles && fallbackProfiles[0] ? fallbackProfiles[0].image : '')}
                                            alt="Technician of the Month"
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    </div>
                                    <div className="absolute bottom-8 left-8 bg-slate-900/90 backdrop-blur-md p-5 shadow-xl border border-white/10">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Star size={18} className="text-yellow-400 fill-yellow-400" />
                                            <span className="font-bold text-white text-lg">{technicianProfiles[currentTechIndex]?.rating || '4.8'} Rating</span>
                                        </div>
                                        <p className="text-xs text-slate-400 font-medium">Based on {technicianProfiles[currentTechIndex]?.reviewCount || '0'} reviews</p>
                                    </div>
                                </div>
                            </div>
                            <div className="md:w-1/2 space-y-8">
                                <div>
                                    <h4 className="text-blue-400 font-bold uppercase tracking-widest text-sm mb-3">Technician of the Month • {technicianProfiles[currentTechIndex]?.serviceType}</h4>
                                    <h2 className="text-5xl font-extrabold mb-6 tracking-tight">Meet {technicianProfiles[currentTechIndex]?.name}</h2>
                                    <p className="text-slate-300 text-xl leading-relaxed font-light">
                                        {technicianProfiles[currentTechIndex]?.description}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-8 mb-5">
                                    <div className="bg-white/5 p-6 border border-white/5 backdrop-blur-sm">
                                        <h5 className="text-3xl font-bold text-white mb-1">{technicianProfiles[currentTechIndex]?.jobsCompleted || technicianProfiles[currentTechIndex]?.jobs || '0'}</h5>
                                        <p className="text-slate-400 font-medium">Jobs Completed</p>
                                    </div>
                                    <div className="bg-white/5 p-6 border border-white/5 backdrop-blur-sm">
                                        <h5 className="text-3xl font-bold text-white mb-1">{technicianProfiles[currentTechIndex]?.onTime || '100%'}</h5>
                                        <p className="text-slate-400 font-medium">On-Time Record</p>
                                    </div>
                                </div>

                                {/* Detailed Ratings Grid - Realtime Fetched Data */}
                                <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-6 p-5 bg-slate-800/50 rounded-xl border border-white/5">
                                    <RatingRow color="cyan" icon={UserCheck} label="Behavior" score={technicianProfiles[currentTechIndex]?.detailedRatings?.behavior || 5} />
                                    <RatingRow color="amber" icon={Smile} label="Attitude" score={technicianProfiles[currentTechIndex]?.detailedRatings?.attitude || 5} />
                                    <RatingRow color="emerald" icon={BookOpen} label="Knowledge" score={technicianProfiles[currentTechIndex]?.detailedRatings?.expertise || 5} />
                                    <RatingRow color="indigo" icon={Briefcase} label="Professionalism" score={technicianProfiles[currentTechIndex]?.detailedRatings?.professionalism || 5} />
                                    <RatingRow color="rose" icon={Heart} label="Respect" score={technicianProfiles[currentTechIndex]?.detailedRatings?.respect || 5} />
                                    <RatingRow color="violet" icon={ShieldCheck} label="Honesty" score={technicianProfiles[currentTechIndex]?.detailedRatings?.honesty || 5} />
                                    <RatingRow color="sky" icon={Clock} label="Timeliness" score={technicianProfiles[currentTechIndex]?.detailedRatings?.timeliness || 5} />
                                    <RatingRow color="lime" icon={MessageSquare} label="Communication" score={technicianProfiles[currentTechIndex]?.detailedRatings?.communication || 5} />
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Button
                                        onClick={() => handleBookNow(technicianProfiles[currentTechIndex]?.serviceType || 'Electrician', technicianProfiles[currentTechIndex])}
                                        disabled={technicianProfiles[currentTechIndex]?.status === 'engaged'}
                                        className={`px-10 py-4 bg-transparent text-white border-2 border-white font-bold shadow-lg shadow-white/10 transform transition 
                                            ${technicianProfiles[currentTechIndex]?.status === 'engaged' ? 'opacity-50 cursor-not-allowed hover:none' : 'hover:bg-white hover:text-slate-900 hover:-translate-y-1'}`}
                                    >
                                        {technicianProfiles[currentTechIndex]?.status === 'engaged'
                                            ? `Expert Busy`
                                            : `Book ${(technicianProfiles[currentTechIndex]?.name || '').split(' ')[0]} Now`}
                                    </Button>
                                    <div className="flex gap-2 items-center justify-center sm:justify-start pt-2 sm:pt-0">
                                        {(Array.isArray(technicianProfiles) ? technicianProfiles : []).map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setCurrentTechIndex(idx)}
                                                className={`h-2 rounded-full transition-all duration-300 ${idx === currentTechIndex ? 'w-8 bg-blue-500' : 'w-2 bg-slate-600 hover:bg-slate-500'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </section >

            {/* --- Testimonials --- */}
            < section className="py-32 container mx-auto px-4 bg-slate-50 mb-48" >
                <div className="text-center mb-44">
                    <h2 className="text-4xl font-extrabold mb-4 text-slate-900">What Our Clients Say</h2>
                    <p className="text-slate-500 text-lg">Trusted by thousands of homeowners across the city.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <TestimonialCard
                        name="Sarah Jenkins"
                        role="Homeowner"
                        review="Fixofy saved my weekend! The plumber arrived in 45 minutes and fixed a burst pipe that was flooding my kitchen."
                        rating={5}
                    />
                    <TestimonialCard
                        name="Michael Chen"
                        role="Business Owner"
                        review="We use Fixofy for all our office maintenance. The detailed dashboard makes tracking expenses and repairs so easy."
                        rating={5}
                    />
                    <TestimonialCard
                        name="Priya Patel"
                        role="Interior Designer"
                        review="The painters from Fixofy were meticulous, clean, and finished ahead of schedule. Highly recommended!"
                        rating={5}
                    />
                </div>
            </section >
        </div >
    );
};


const FeatureBox = ({ icon, title, desc }) => (
    <div className="flex items-start gap-5 p-6 rounded-2xl transition-all cursor-default border border-transparent hover:border-slate-100 hover:bg-white hover:shadow-xl hover:-translate-y-1">
        <div className="bg-blue-50 p-4 rounded-xl text-blue-600">
            {icon}
        </div>
        <div>
            <h3 className="font-bold text-slate-900 text-xl mb-2">{title}</h3>
            <p className="text-slate-500 text-base leading-relaxed">{desc}</p>
        </div>
    </div>
);

const ServiceCard = ({ icon, title, desc, color, bg }) => (
    <motion.div
        whileHover={{ y: -2 }}
        className="flex flex-row items-center gap-3 bg-white p-2 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer h-[50px] group overflow-hidden"
    >
        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0 border border-black/5`}>
            <div className={`${color} scale-75`}>{icon}</div>
        </div>
        <div className="flex flex-col justify-center min-w-0">
            <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">{title}</h3>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide truncate">{desc}</p>
        </div>
    </motion.div>
);

const TestimonialCard = ({ name, role, review, rating }) => (
    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex gap-1 mb-4 text-amber-500">
            {[...Array(rating)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
        </div>
        <p className="text-slate-600 italic mb-6 leading-relaxed">"{review}"</p>
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-blue-600 text-sm">
                {name[0]}
            </div>
            <div>
                <h4 className="font-bold text-sm text-slate-900">{name}</h4>
                <p className="text-xs text-slate-500">{role}</p>
            </div>
        </div>
    </div>
);

const RatingRow = ({ label, score, icon: Icon, color = 'blue' }) => (
    <div className="flex items-center justify-between text-xs mb-1">
        <div className="flex items-center gap-2 text-slate-400 font-medium">
            {Icon && <Icon className={`w-3.5 h-3.5 text-${color}-400`} />}
            <span>{label}</span>
        </div>
        <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
                <Star
                    key={i}
                    size={12}
                    className={`transition-all duration-300 ${i < Math.round(score) ? `fill-${color}-500 text-${color}-500` : 'fill-slate-700/30 text-slate-700/30'}`}
                />
            ))}
        </div>
    </div>
);

export default Home;
