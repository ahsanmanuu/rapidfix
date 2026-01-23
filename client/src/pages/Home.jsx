import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Zap, Droplet, Paintbrush, Camera, Fan, BatteryCharging, Fingerprint, Printer, ShieldCheck, Clock, Wallet, ThumbsUp, Wrench, Menu, X, ArrowRight, Home as HomeIcon, Info, Phone, Search } from 'lucide-react';
import Button from '../components/Button';
import ErrorBoundary from '../components/ErrorBoundary';
import TechnicianSearchModal from '../components/TechnicianSearchModal';
import ServiceBookingForm from '../components/ServiceBookingForm';
import BookingConfirmationModal from '../components/BookingConfirmationModal';
import UserLoginModal from '../components/UserLoginModal';
import api, { createJob, getTopRatedTechnicians } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import TestimonialSlider from '../components/TestimonialSlider';

// --- Hero Slides Data ---
const slides = [
    {
        id: 1,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCvarhq-HhhkwdLuvzmpXigpceywpwZzoqO3-l3DIcSmfIwQy7XC1Ejuf6gVtY9HjNVkKjaumYDwanvCbrpnFtQEY2gqmm1OBIWeBruKpphiObbgAGUJqb1MZAdcoh5wsbNiT4S_mStwXWVrqxPcrD61aeMVTWFizHS2CqaD0P3JlqAwF99jUdtR6VF4tNAN2w0fZILYTTn-kXL4JK7bv3GX6zIQRvwAi_wMeCZrw8c908TxobkxaonUKTtUMEgzczcZwhmr0FDUV0",
        title: "Expert Electrical Services",
        subtitle: "Safe, reliable, and certified electricians at your doorstep."
    },
    {
        id: 2,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLBUT2icHHXQZkYUc9V_3YYe7S443u8_BiZny09aEAPhJ9gBQavsO8RWPYF8Vvds02pwLox6pGisoGXIFxxa6ssBReSLR_0atjG72hTddzI9g5cV6EqtZvqHxpiHGM1a2fotjARMT_ehh5mO8iTdWJvNUNAhWc53pJ6KyVz76xcmScE7PoF4Jio-DRhIM3alKj8jkihHj_yxHkoMUtpEFwRh0yUFvi2Uu1mAHrrx6ynm3_l-Hrv9BYM4RhZ5TCJ8UYl4uM5cMaHbQ",
        title: "Professional Plumbing",
        subtitle: "Leak fixes, installation, and maintenance by experts."
    },
    {
        id: 3,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAbdc7b6PsdagI9Bc3SH-dN48HpjWQSsjmXq9x6UaLaLTra3j9XE_46U7IF7ncZSzXIPl6ZYVRRdXQMkndUSep5bWj0lhcj237j9cBX9N-br4YniETNe8E1dL7MUOOfTF26wIWpCSqLfaQpcu9Vi3KXKGzYyFYbc1e7jejAQTugHqORDwRTPjUBS8IUn_xG36Fz504H3ZbMwqXjptUgXhAkY1oljvYDXB0-pVhF2V24_KKcLRYfFtJx9B_s6beCX3YQaTcFhPpP-f0",
        title: "Home Painting",
        subtitle: "Transform your home with vibrant, professional painting."
    },
    {
        id: 4,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDTpqLMZe068aQ5zM2tjAgRr-SxIbYSar_VDXTJd6whKTN5Qca4E_XxQPFxgFMir_Tc5oM1rFyVhBFpGD8aliUQbx5ZTYh2JAKWAk25CCom5--Kev17RMzsfz_uKiZ93egWJK_qs53qf7n3SpbQN-nfnQNPjc_RxPVl9DFzyRrTyhUTSkw6yjmSH-xVeI711bMbLAgT4Pi1qj8IIn-irgM4KUg3NKRq2VRkHrZAv_y7PGCLKICAs6OjqkjSs6LH93zCIG2ADQn0Lnk",
        title: "AC Repair & Service",
        subtitle: "Keep your cool with our premium AC maintenance."
    },
    {
        id: 5,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA9rsM9b-ce64JhhC_-UZDQg5kVKq5QPhxr083DxIbhxyGEwr9S__YFUHnT__dGx6YMnfGmkKxc3aYbsLI38f4wgenFq4uvwDiZXqvOMF5M6I1ck-KMHxpIWiEXbGWcooWMHjbTrChtPFMi52QpAa8p8UD30RGscnPNsJiPyUN4jpdwvhRfKPQmN0y6aK5yH0z6__KGZWp8FwdR6Ru5ik9rJ974IS0S51GMsdrgqvUtxGRzTyCbjvslpZnpbax-S7qOf-rHXehdMEM",
        title: "Inverter Technician",
        subtitle: "Keep your power running smoothly."
    },
    {
        id: 6,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA7dAHXJwHIV2Lxr5KNvN_q88IWJ_-WzdsrM0EcltIz7GXYyV1VIdqRoK1iELZs5FbowfqpUvc2SAcO-HGtxv1r7A6sf9p0XwbNH9r_ixX9LNgF9h1qcnqczBBq2A0JZu9O_v3jGA_OxWWCjPmPB0h2tbksFYiRefHcIYriyy8kmd1-AlzCg6Wv2KHH-rpW6c6N4E8USq2VwBKhS7LR6XXWILG50WsbEmYEG8m3ZxTeL7dd74GBnRDamkJ0LTYteO2hwyv52HtyS9Y",
        title: "CCTV Technician",
        subtitle: "Secure your home with expert camera installation."
    },
    {
        id: 7,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDjLcUD-7oeXZNUGjhdUxo7vxcx8yUD3ONOKjsQhLjSUNsDpPlLkqV_Ouyxq1_6DnU1uXhUOPeYc0m4dZb0tF9KdjzrEmwYKSbjQ2gI2FxI6unRnXJOSoYFoCWb9IecwX12ldQSQVBvD-lD_Qnigz4I7e5V5YZofFCnFQiXAW0GLd77o4tG29g8KHD4TnmZtkjMblO6Za6yZbfZaL0lPdKRO6CDwnFTWXALlRmDpXtuQOYylN26jFvIaOkYUoZTuOd1WjSFW6Nw7OM",
        title: "Biometrics Technician",
        subtitle: "Advanced access control systems."
    },
    {
        id: 8,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBOp8qEBYt7z2NMu4saUbiY__a2sDBjBaZ3ruhnUkBBZQ1jrNLKL0umwsCsBm68jNX-u80ruYd35SQ_DjhRt6F1GOmUFDhhqVxn7vDVoPkuUNJ_ZKvsh-tYTrHRqNtvdTB-qYCY5c_uZgEpG0cdpBRw3MBHhzMvYYMqF7uQungoWACt7wq8pV1FG2C9k2UZI7N9lbSu9VBAJ3R7eI1T7EN7TpFjrJ11KGFNqr4rqn26Nx0pbH0tgWebdlBX02ODVHs2rgLDO90MAqE",
        title: "Printer Technician",
        subtitle: "Quick repair for all printer models."
    }
];

// --- Fallback Profile Data ---
const fallbackProfiles = [
    {
        id: 1,
        name: "Mike T.",
        role: "Master Electrician",
        serviceType: "Electrician",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCoTTqZzMJ9rmZtWCa81emQ91tAcWmwjr4NvvNSTRDa1GtDDMh2SoDq1VM91H_9Sx7Lnsa84i686veJJhEeMQHNoh67zjQj3dsAooits95DioLKqwxY_DGQ4kgLP4zZDepsYhmNvlH38PL8cyWCVrwf5FvSWgh0r8nuFvSPj9CX2nMtT5d6pUvoWU4LjLvFaYqDxGHE28QMWq_sy6LAHmsAf6Uk0Tc_n4s5-UkckxryyhZLaLoOvJh-rB5vqjx7LCuOSb3ZZmQ0-rQ",
        rating: "4.9",
        reviewCount: "124",
    },
    {
        id: 2,
        name: "Sarah J.",
        role: "Senior Cleaner",
        serviceType: "Cleaner",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBrf83VP8EswMsGimgtKZyhmLBJG8JIKcwwUTgu9tn0Ax7iFQZ_qVblzjERi2kzc1nuRlIr07wuKMsSUj6Ydf51ifVYkym8tiJy-1n1X2wbQDmSyMi5u7-BtmzFQOzh-n3-48aphmR91as57WoqV8QZfDFFdADmKI9e59CB8e_esiedpC1Iuk9YshsJtkxZUJ2nq5mEWKK5QhVfHlzFE_TP0AhESFnhEAUhoUHfTZXkdc8Mpu9Yos9HQvqqrVsZrVcTd6ENlLQpJkI",
        rating: "5.0",
        reviewCount: "89",
    },
    {
        id: 3,
        name: "David L.",
        role: "Expert Electrician",
        serviceType: "Electrician",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC_YyAkl9V09FZtUkAugOkJnQD5LgiQTaW6ZxeEesB1YWnpxRi5fINdYM1MgGbBqfGdLBtdL32m-P-b0tkoXuO_B6e79QIcuvd-s-JPIr_y78Ju-CQsmt1VTIHjgWkT7YWYOEYfHsmbyRvOp8qgrpPRqSurnCfEIrB7aJPx_o4p4AnkY8IUp8Jg5QnZRIMcTk65IAq9vyJesC1Vmz_ig2dDIMAzb1FyDEIkzWgyIRuGXRxyyV2NG7O_8lRhTol9c4KHO-UhtnZZp7A",
        rating: "4.8",
        reviewCount: "210",
    },
    {
        id: 4,
        name: "Jenny R.",
        role: "Interior Painter",
        serviceType: "Painter",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCA3fL692G4L0CTOfmVaZFOrg_0yalWWjtvjiG-yCtlHST9lD0_RlTs10DgcmbsrvHframlczzuFePvT4yLoANBEoTb1LanUv3_JFsWvhJ_dtl05eN98XP6vs7uX5ltVEvoa9Qzy_I5B6-cE5NJ-jtJfBlZqovHnvv4giF7ZUfm5SBad6iuv_hKtuZkqh5Gn24HqOPfMFVEBa80-5wTC5sN1V1gCSu907d6bbv1P5Gwu2V3yj7yTWFikpCdF9rfn-Xi11qmyqMBPbM",
        rating: "4.9",
        reviewCount: "156",
    }
];

const Home = () => {
    const { user, updateUser, setUser } = useAuth();
    const socket = useSocket();
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [selectedService, setSelectedService] = useState('Electrician');
    const [selectedTechnician, setSelectedTechnician] = useState(null);
    const [technicianProfiles, setTechnicianProfiles] = useState(fallbackProfiles);
    const [searchTerm, setSearchTerm] = useState('');
    const [loadingProfiles, setLoadingProfiles] = useState(true);
    const [loadingTestimonials, setLoadingTestimonials] = useState(true);

    // Fetch Realtime Top Technicians //
    useEffect(() => {
        const fetchTopTechs = async () => {
            setLoadingProfiles(true);
            try {
                const res = await getTopRatedTechnicians();
                if (res.data.success && Array.isArray(res.data.technicians) && res.data.technicians.length > 0) {
                    const serverUrl = 'http://localhost:3000';
                    const technicians = res.data.technicians;
                    const profiles = technicians.map(t => ({
                        id: t._id,
                        name: t.name,
                        role: t.expertise || t.serviceType || 'Master Technician',
                        serviceType: t.serviceType,
                        image: t.documents?.photo
                            ? (t.documents.photo.startsWith('http') ? t.documents.photo : `${serverUrl}${t.documents.photo}`)
                            : (fallbackProfiles && fallbackProfiles[0] ? fallbackProfiles[0].image : ''),
                        rating: t.rating ? t.rating.toFixed(1) : '4.8',
                        reviewCount: t.reviewCount ? `${t.reviewCount}` : '50',
                        description: t.bio || `Professional ${t.serviceType}.`
                    }));
                    // Only override fallback if we get enough profiles
                    if (profiles.length >= 4) {
                        setTechnicianProfiles(profiles.slice(0, 4));
                    }
                }
            } catch (err) {
                console.error("Failed to fetch top technicians", err);
            } finally {
                setLoadingProfiles(false);
            }
        };
        fetchTopTechs();

        // Simulate testimonials loading
        setTimeout(() => setLoadingTestimonials(false), 1500);
    }, []);

    // Flow State
    const [bookingParams, setBookingParams] = useState(null);

    // Modals
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isRequesting, setIsRequesting] = useState(false);

    // Auto-advance slides
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 4000);
        return () => clearInterval(timer);
    }, []);

    const handleFormSearch = (data) => {
        // This is called from the specialized forms if we use them
        const bookingData = {
            ...data,
            technicianId: data.technicianId || null,
            visitingCharges: 299,
            agreementAccepted: false
        };
        setBookingParams(bookingData);
        if (!data.technicianId) setSelectedTechnician(null);
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
        setUser(userData);
        setIsLoginOpen(false);
        if (bookingParams && selectedTechnician) {
            createJobRequest({ ...bookingParams, userId: userData.id });
        }
    };

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

    const handleBookNow = (serviceType = 'Electrician', technician = null) => {
        if (technician) {
            setSelectedService(serviceType);
            setSelectedTechnician(technician);
            // Launch Confirmation Directly for Specific Tech
            setBookingParams({
                serviceType,
                location: user?.location || { address: "Current Location", latitude: 28.6139, longitude: 77.2090 },
                scheduledDate: new Date().toISOString().split('T')[0],
                scheduledTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
                contactName: user ? user.name : '',
                contactPhone: '',
                description: `Booking with ${technician.name}`,
                technicianId: technician.id
            });
            setIsConfirmOpen(true);
            return;
        }

        setSelectedService(serviceType);
        setSelectedTechnician(null);

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
            if (user && user.location && user.location.latitude) {
                const loc = {
                    latitude: user.location.latitude,
                    longitude: user.location.longitude,
                    address: user.location.address || "Saved Profile Location"
                };
                launchModal(loc);
                return;
            }
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

    return (
        <div className="bg-[#f6f7f8] font-sans text-[#111418] overflow-x-hidden">

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
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- Hero Section --- */}
            <div className="w-full bg-white relative">
                <div className="flex flex-col">
                    <div className="relative flex min-h-[600px] md:min-h-[700px] w-full flex-col items-center justify-start pt-32 p-4 overflow-hidden bg-gray-900 pb-32">
                        {/* Animated Background Slideshow */}
                        <div className="absolute inset-0 z-0">
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
                                        style={{ backgroundImage: `url(${slides[currentSlide].image})` }}
                                    />
                                    <div className="absolute inset-0 bg-black/60 z-10"></div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Hero Content */}
                        <div className="relative z-20 flex flex-col gap-6 items-center text-center max-w-[720px]">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                                className="flex flex-col gap-4 text-white"
                            >
                                <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-[-0.033em] drop-shadow-xl">
                                    Fix it Fast. Fix it Right.
                                </h1>
                                <h2 className="text-gray-200 text-base md:text-lg font-medium leading-normal max-w-[600px] mx-auto drop-shadow-md">
                                    Trusted professionals for every home and business need. Book top-rated experts in seconds.
                                </h2>
                            </motion.div>
                        </div>

                        {/* Dots Animation */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-3">
                            {slides.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${idx === currentSlide ? 'bg-[#FF6B00]' : 'bg-white/40'}`}
                                ></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Booking Form Overlay --- */}
            <div className="relative z-30 -mt-24 px-4 sm:px-6 md:px-8 lg:px-12 mb-24 w-full flex justify-center">
                <ServiceBookingForm onSearch={handleFormSearch} />
            </div>

            {/* --- Promo Banner --- */}
            <div className="w-full bg-gradient-to-r from-[#FF6B00]/10 via-orange-100 to-[#FF6B00]/10 border-b border-orange-100">
                <div className="flex justify-center py-4 px-4">
                    <div className="flex items-center gap-2 text-[#FF6B00] text-sm font-bold animate-pulse">
                        <ShieldCheck size={20} />
                        <p>First Service 10% Off - Limited Time Offer! Use code: FIXOFY10</p>
                    </div>
                </div>
            </div>

            {/* --- Browse by Category --- */}
            <div className="flex flex-col items-center w-full bg-white pb-12 pt-12">
                <div className="flex flex-col max-w-6xl w-full px-6 md:px-12 py-0">
                    <section className="flex flex-col gap-10">
                        <div className="flex items-center justify-between">
                            <h2 className="text-[#111418] text-[22px] md:text-[28px] font-bold leading-tight tracking-[-0.015em]">Browse by Category</h2>
                            <a href="#" className="text-[#FF6B00] text-sm font-bold hover:underline flex items-center gap-1">
                                View All <ArrowRight size={14} />
                            </a>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {[
                                { title: "Plumbing", count: "120+ Pros", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLBUT2icHHXQZkYUc9V_3YYe7S443u8_BiZny09aEAPhJ9gBQavsO8RWPYF8Vvds02pwLox6pGisoGXIFxxa6ssBReSLR_0atjG72hTddzI9g5cV6EqtZvqHxpiHGM1a2fotjARMT_ehh5mO8iTdWJvNUNAhWc53pJ6KyVz76xcmScE7PoF4Jio-DRhIM3alKj8jkihHj_yxHkoMUtpEFwRh0yUFvi2Uu1mAHrrx6ynm3_l-Hrv9BYM4RhZ5TCJ8UYl4uM5cMaHbQ" },
                                { title: "Cleaning", count: "85+ Pros", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuB-j9VB93sldOMD_tOMci0XUjsOcTTe41_-2kBwB7RixXTAKkgf6VvMIQqYJRjOl1D-r9q-pgVszCVjabprzbMyfcbpaFuTqm8xqvd86JTXiFm08J2iMrJeubWfIWFjNlURL9ci034W2I5CeP0fgZkMegNs_XHucIOkqYom-F5V-OSmAA3k8Hp2dwgQ7MP5oXIgsVh11BBhDqOpAXYEK86eAhZagO3K2qNBp0C92tVDSlrUa8VAOjWNxLoclNfeMYOeJuWlWlSHRek" },
                                { title: "Moving", count: "40+ Pros", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAhS4vGctRzjAlkA5mvpa-_x59rn5IIs1ew_nSqikCkK72Yv-Bd5QdB1yQyDieSoxpsuSrPQGTmIfc5a8NcWbhSSkmzsh7L3LyetnizNqqCk92QPCGfa1CP--FABOXFPytFTmrv2p8SEPm1GfUx5c7Cx3mbCVSQLh6izQt7pk-wrVxOf-evrEem2qG9e6RLKBCX673iNivvzDqVLsIKNNn-C2Yx67Eg4fdCCFMahKJKo84Iyw-S1NtWdh05e95bqPFc1WHfTk03TFE" },
                                { title: "Electrical", count: "90+ Pros", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCvarhq-HhhkwdLuvzmpXigpceywpwZzoqO3-l3DIcSmfIwQy7XC1Ejuf6gVtY9HjNVhKjaumYDwanvCbrpnFtGEY2gqmm1OBIWeBruKpphiObbgAGUJqb1MZAdcoh5wsbNiT4S_mStwXWVrqxPcrD61aeMVTWFizHS2CqaD0P3JlqAwF99jUdtR6VF4tNAN2w0fZILYTTn-kXL4JK7bv3GX6zIQRvwAi_wMeCZrw8c908TxobkxaonUKTtUMEgzczcZwhmr0FDUV0" },
                                { title: "Painting", count: "60+ Pros", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAbdc7b6PsdagI9Bc3SH-dN48HpjWQSsjmXq9x6UaLaLTra3j9XE_46U7IF7ncZSzXIPl6ZYVRRdXQMkndUSep5bWj0lhcj237j9cBX9N-br4YniETNe8E1dL7MUOOfTF26wIWpCSqLfaQpcu9Vi3KXKGzYyFYbc1e7jejAQTugHqORDwRTPjUBS8IUn_xG36Fz504H3ZbMwqXjptUgXhAkY1oljvYDXB0-pVhF2V24_KKcLRYfFtJx9B_s6beCX3YQaTcFhPpP-f0" },
                                { title: "Repair", count: "55+ Pros", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCeSuAgkcsLCo35A_qybTBUKn6GN8x8ZAa-21PufWp43hpF6JEYXBOYkz34Vn50AJBHYefwWH-bF8irFKSaJFPwpUhn4Aol8_pETg7RwhC7IA-Y0IgXx4vVjGwUskJGu8mYEv9-s7g1Tg3iPWH2agIZgEhoK-7VnWLD9L9GmOUIVSaZAKC6dAYnPWzRPCGmh_bBbXhpMV8kbkBo5eOQI9Qb_Z5W_K-fBiTOtym17NccjbJsqyYeViNfaregBet8Z3BSvXu67s9h_bc" }
                            ].map((cat, idx) => (
                                <div key={idx} className="group flex flex-col gap-2 cursor-pointer p-2 rounded-xl hover:bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                                    <div className="w-full aspect-square bg-cover bg-center rounded-lg overflow-hidden relative" style={{ backgroundImage: `url(${cat.img})` }}>
                                        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
                                    </div>
                                    <div>
                                        <p className="text-[#111418] text-base font-bold leading-normal group-hover:text-[#FF6B00] transition-colors">{cat.title}</p>
                                        <p className="text-[#617589] text-xs font-normal leading-normal">{cat.count}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* --- Instant Book Section (Compact Tiles) --- */}
            <section className="w-full bg-[#fffbf7] border-y border-[#fceee0] py-12 md:py-16 mt-0 mb-6 font-sans">
                <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
                    <div className="flex flex-col gap-2 items-center text-center mb-8">
                        <h2 className="text-[#111418] text-xl md:text-2xl font-bold">Instant Book: Professional Now</h2>
                        <p className="text-[#617589] text-sm">Book verified experts instantly.</p>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2 md:gap-3">
                        {[
                            { id: 'Electrician', title: "Electrician", icon: <Zap size={20} /> },
                            { id: 'Plumber', title: "Plumber", icon: <Droplet size={20} /> },
                            { id: 'Painter', title: "Painter", icon: <Paintbrush size={20} /> },
                            { id: 'AC Technician', title: "A.C. Tech", icon: <Fan size={20} /> },
                            { id: 'Inverter Technician', title: "Inverter", icon: <BatteryCharging size={20} /> },
                            { id: 'CCTV Technician', title: "CCTV", icon: <Camera size={20} /> },
                            { id: 'Biometrics Technician', title: "Biometrics", icon: <Fingerprint size={20} /> },
                            { id: 'Printer Technician', title: "Printer", icon: <Printer size={20} /> },
                        ].map((service) => (
                            <div
                                key={service.id}
                                onClick={() => handleBookNow(service.id)}
                                className="group bg-white rounded-xl p-2.5 md:p-3 border border-gray-100 hover:border-[#FF6B00]/30 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col items-center text-center gap-1.5 cursor-pointer"
                            >
                                <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-orange-50 group-hover:bg-[#FF6B00] group-hover:text-white text-[#FF6B00] flex items-center justify-center transition-colors">
                                    {service.icon}
                                </div>
                                <h3 className="text-[#111418] font-semibold text-[10px] md:text-xs leading-tight">{service.title}</h3>
                                <button className="w-full py-1 rounded-lg text-[#FF6B00] hover:bg-[#FF6B00] hover:text-white font-semibold text-[9px] md:text-[10px] border border-[#FF6B00]/30 transition-all">
                                    Book
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- Top Rated Pros Section --- */}
            <div className="flex flex-col items-center w-full">
                <div className="flex flex-col max-w-6xl w-full px-6 md:px-12 py-12 gap-12">
                    <section className="flex flex-col gap-8">
                        <div className="flex flex-col gap-2 items-center text-center">
                            <h2 className="text-[#111418] text-[24px] md:text-[30px] font-bold leading-tight tracking-[-0.015em]">Meet Our Top-Rated Pros</h2>
                            <p className="text-[#617589] text-base">Vetted experts ready to tackle your next project.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {loadingProfiles ? (
                                // Skeleton Loaders matching actual card layout
                                [1, 2, 3, 4].map(i => (
                                    <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col gap-4 shadow-sm animate-pulse">
                                        {/* Profile Section Skeleton */}
                                        <div className="flex items-start gap-3">
                                            <div className="w-14 h-14 rounded-full bg-slate-200 shrink-0"></div>
                                            <div className="flex-1 min-w-0 flex flex-col gap-2">
                                                <div>
                                                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                                                    <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <div className="h-2 bg-slate-100 rounded w-full"></div>
                                                    <div className="h-2 bg-slate-100 rounded w-full"></div>
                                                    <div className="h-2 bg-slate-100 rounded w-4/5"></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Badges Skeleton */}
                                        <div className="flex gap-1.5">
                                            <div className="h-6 bg-slate-100 rounded-full w-20"></div>
                                            <div className="h-6 bg-slate-100 rounded-full w-16"></div>
                                            <div className="h-6 bg-slate-100 rounded-full w-12"></div>
                                        </div>

                                        {/* Button Skeleton */}
                                        <div className="h-10 bg-slate-200 rounded-xl w-full"></div>
                                    </div>
                                ))
                            ) : (
                                technicianProfiles && technicianProfiles.map((tech) => {
                                    // Generate dynamic description based on service type
                                    const getServiceDescription = (serviceType) => {
                                        const descriptions = {
                                            'Electrician': 'Expert in electrical installations, repairs, and maintenance. Handles wiring, circuit breakers, and lighting systems with certified expertise.',
                                            'Plumber': 'Specialized in pipe repairs, leak fixes, and water system installations. Professional solutions for all plumbing needs.',
                                            'Painter': 'Professional painting services for interior and exterior. Expert in color consultation and premium finishes.',
                                            'AC Technician': 'Certified AC repair and maintenance specialist. Expert in installation, servicing, and troubleshooting cooling systems.',
                                            'A.C. Technician': 'Certified AC repair and maintenance specialist. Expert in installation, servicing, and troubleshooting cooling systems.',
                                            'CCTV Technician': 'Professional security camera installation and maintenance. Expert in surveillance systems and monitoring solutions.',
                                            'Inverter Technician': 'Specialized in power backup systems and inverter installations. Expert in battery maintenance and power solutions.',
                                            'Biometrics Technician': 'Advanced biometric system installation and support. Expert in fingerprint and facial recognition security.',
                                            'Printer Technician': 'Professional printer repair and maintenance specialist. Expert in all printer models and troubleshooting.',
                                            'Cleaner': 'Professional cleaning services for homes and offices. Expert in deep cleaning and sanitization.'
                                        };
                                        return descriptions[serviceType] || tech.description || 'Professional service provider with verified expertise and excellent customer ratings.';
                                    };

                                    return (
                                        <div key={tech.id} className="bg-white rounded-2xl border-2 border-orange-200 p-5 flex flex-col gap-4 shadow-sm hover:shadow-lg hover:border-orange-400 transition-all duration-300 group h-full overflow-hidden">
                                            {/* Profile Picture - Centered at Top */}
                                            <div className="flex justify-center">
                                                <div
                                                    className="w-16 h-16 rounded-full bg-center bg-cover border-2 border-slate-100 group-hover:border-orange-200 transition-colors"
                                                    style={{ backgroundImage: `url(${tech.image})` }}
                                                ></div>
                                            </div>

                                            {/* Text Content Below Picture */}
                                            <div className="flex flex-col gap-2 text-center overflow-hidden">
                                                {/* Name */}
                                                <h3 className="text-slate-900 text-base font-bold truncate">{tech.name}</h3>

                                                {/* Rating */}
                                                <div className="flex items-center gap-1 justify-center">
                                                    <Star size={13} className="text-amber-400 fill-amber-400" />
                                                    <span className="text-amber-600 text-sm font-bold">{tech.rating}</span>
                                                    <span className="text-slate-400 text-xs">({tech.reviewCount})</span>
                                                </div>

                                                {/* Description - Fully Justified, Clamped to 3 lines */}
                                                <p className="text-slate-500 text-xs leading-relaxed text-justify line-clamp-3">
                                                    {getServiceDescription(tech.serviceType)}
                                                </p>
                                            </div>

                                            {/* Badges */}
                                            <div className="flex flex-wrap gap-1.5 justify-center">
                                                <span className="px-2.5 py-1 bg-orange-50 text-orange-600 text-[10px] font-bold rounded-full border border-orange-100">{tech.serviceType}</span>
                                                <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full border border-blue-100">Verified</span>
                                                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-100">Pro</span>
                                            </div>

                                            {/* Book Button */}
                                            <button
                                                onClick={() => handleBookNow(tech.serviceType, tech)}
                                                className="mt-auto w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-sm shadow-sm shadow-orange-500/20 hover:shadow-md hover:shadow-orange-500/30 transition-all active:scale-[0.98]"
                                            >
                                                Book Now
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </section>

                    {/* --- Testimonials --- */}
                    <section className="flex flex-col gap-8">
                        <div className="flex flex-col gap-2 items-center text-center">
                            <h2 className="text-[#111418] text-[20px] md:text-[24px] font-bold leading-tight tracking-[-0.015em]">What Our Customers Say</h2>
                            <p className="text-[#617589] text-sm">Real stories from satisfied customers.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {loadingTestimonials ? (
                                // Skeleton Loaders for Testimonials
                                [1, 2, 3].map(i => (
                                    <div key={i} className="flex flex-col gap-3 p-4 bg-white rounded-xl border-2 border-slate-900 shadow-lg animate-pulse">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                                            <div className="flex-1">
                                                <div className="h-4 bg-slate-200 rounded w-2/3 mb-2"></div>
                                                <div className="flex gap-0.5">
                                                    {[...Array(5)].map((_, j) => <div key={j} className="w-3 h-3 bg-slate-100 rounded-full"></div>)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-2 bg-slate-100 rounded w-full"></div>
                                            <div className="h-2 bg-slate-100 rounded w-full"></div>
                                            <div className="h-2 bg-slate-100 rounded w-3/4"></div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                [
                                    { name: "James Peterson", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCoTTqZzMJ9rmZtWCa81emQ91tAcWmwjr4NvvNSTRDa1GtDDMh2SoDq1VM91H_9Sx7Lnsa84i686veJJhEeMQHNoh67zjQj3dsAooits95DioLKqwxY_DGQ4kgLP4zZDepsYhmNvlH38PL8cyWCVrwf5FvSWgh0r8nuFvSPj9CX2nMtT5d6pUvoWU4LjLvFaYqDxGHE28QMWq_sy6LAHmsAf6Uk0Tc_n4s5-UkckxryyhZLaLoOvJh-rB5vqjx7LCuOSb3ZZmQ0-rQ", review: "Fixofy is a lifesaver! The electrician arrived in 30 minutes and fixed the issue immediately. Highly recommended service." },
                                    { name: "Linda Meyer", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBrf83VP8EswMsGimgtKZyhmLBJG8JIKcwwUTgu9tn0Ax7iFQZ_qVblzjERi2kzc1nuRlIr07wuKMsSUj6Ydf51ifVYkym8tiJy-1n1X2wbQDmSyMi5u7-BtmzFQOzh-n3-48aphmR91as57WoqV8QZfDFFdADmKI9e59CB8e_esiedpC1Iuk9YshsJtkxZUJ2nq5mEWKK5QhVfHlzFE_TP0AhESFnhEAUhoUHfTZXkdc8Mpu9Yos9HQvqqrVsZrVcTd6ENlLQpJkI", review: "Excellent service. The cleaner did a fantastic deep clean of my apartment. It feels like a brand new home." },
                                    { name: "Robert Fox", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCA3fL692G4L0CTOfmVaZFOrg_0yalWWjtvjiG-yCtlHST9lD0_RlTs10DgcmbsrvHframlczzuFePvT4yLoANBEoTb1LanUv3_JFsWvhJ_dtl05eN98XP6vs7uX5ltVEvoa9Qzy_I5B6-cE5NJ-jtJfBlZqovHnvv4giF7ZUfm5SBad6iuv_hKtuZkqh5Gn24HqOPfMFVEBa80-5wTC5sN1V1gCSu907d6bbv1P5Gwu2V3yj7yTWFikpCdF9rfn-Xi11qmyqMBPbM", review: "Fair pricing and very professional workers. The booking process was seamless and the painter did a great job." }
                                ].map((review, idx) => (
                                    <div key={idx} className="flex flex-col gap-3 p-4 bg-white rounded-xl border-2 border-slate-900 shadow-lg hover:shadow-xl transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 bg-cover border border-gray-100" style={{ backgroundImage: `url(${review.img})` }}></div>
                                            <div>
                                                <h3 className="font-bold text-[#111418] text-base">{review.name}</h3>
                                                <div className="flex text-[#FF6B00] gap-0.5">
                                                    {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-current" />)}
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-[#4b5563] italic text-xs leading-relaxed">"{review.review}"</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* --- Download App Section --- */}
                    <section className="relative w-full overflow-hidden rounded-2xl bg-[#101922] shadow-2xl max-w-[1280px] mx-auto mb-16">
                        <div className="flex flex-col-reverse md:flex-row items-center">
                            <div className="flex-1 p-8 md:p-12 lg:p-16 flex flex-col gap-6 z-10 text-center md:text-left">
                                <div className="flex flex-col gap-3">
                                    <span className="text-[#FF6B00] font-bold tracking-wider uppercase text-sm">Download App</span>
                                    <h2 className="text-white text-3xl md:text-4xl font-black leading-tight">Get Fixofy on the Go</h2>
                                    <p className="text-gray-400 text-lg md:max-w-md">Book pros, track your service, and pay securely all from your pocket. Available for iOS and Android.</p>
                                </div>
                                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                    <button className="flex items-center gap-3 bg-white hover:bg-gray-100 text-[#111418] px-5 py-3 rounded-lg transition-colors">
                                        <div className="flex flex-col items-start leading-none">
                                            <span className="text-[10px] font-medium text-gray-600 uppercase">Download on the</span>
                                            <span className="text-base font-bold">App Store</span>
                                        </div>
                                    </button>
                                    <button className="flex items-center gap-3 bg-transparent border border-gray-600 hover:bg-gray-800 text-white px-5 py-3 rounded-lg transition-colors">
                                        <div className="flex flex-col items-start leading-none">
                                            <span className="text-[10px] font-medium text-gray-400 uppercase">Get it on</span>
                                            <span className="text-base font-bold">Google Play</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 w-full h-64 md:h-auto relative flex items-center justify-center pt-8 md:pt-0">
                                <div className="relative w-[180px] md:w-[240px] aspect-[9/18] bg-gray-800 rounded-[2rem] border-8 border-gray-700 shadow-2xl overflow-hidden transform md:rotate-6 hover:rotate-0 transition-transform duration-500">
                                    <div className="absolute top-0 left-0 right-0 h-6 bg-gray-800 z-20 flex justify-center">
                                        <div className="w-16 h-4 bg-black rounded-b-xl"></div>
                                    </div>
                                    <div
                                        className="w-full h-full bg-white flex flex-col relative"
                                        style={{ backgroundImage: 'url(https://lh3.googleusercontent.com/aida-public/AB6AXuDUTNMMhDdumZF_8xNQCOie_nsgsxDMo0fJWcwUnagS_2WkKPvZKeXyj1IZXqmPeQCEKbGtnY5iDOnpAyWCgpOyBT1isYTGKkSbZn6tE7qp0hXfKxacCKVihic1Sv43HX0Z6B-vacmQ10bH_ZkBv5bR32X5zPG9nEZsbHsym5JxfdQpKM6gN_wTdRHcrd4gOFmE_I8kP4MOcXZCNugytlzD83_XNWGkDpr2zDvOFHS2aCnkM-yYAZVqE6rSbuX1L9PdE7xyTwHUvyI)', backgroundSize: 'cover', backgroundPosition: 'center' }}
                                    >
                                        <div className="mt-auto bg-white/90 backdrop-blur-md p-3 m-3 rounded-xl shadow-lg">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 bg-cover" style={{ backgroundImage: 'url(https://lh3.googleusercontent.com/aida-public/AB6AXuDwnjQVBG1j7-XVitbOX5uXUnrx5UKPjqFlShbJK7zR3_dIA5Fo94kUodyzW5i0YiVGSLbJFTflJGrVCbq5_LwBNKriHbFPb1fw9BNs2wypBBEwc0VXOrRQ3Lsyy4S3WHnAZLb3JREbs7co8yFXYsrRkn2mfoW588IbUhoqirBX6BfxDY2XQOMgLxz0eEzQwkhLfApfBR7kLQ16uW-2kzix9QSoqnsr-QSnbk_mxuf0M6GIyYK-pkhc0BEU0bYUrbxSuHeJIo-qW8E)' }}></div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-900">Mike is arriving</p>
                                                    <p className="text-[10px] text-gray-500">5 mins away • Plumbing</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Home;
