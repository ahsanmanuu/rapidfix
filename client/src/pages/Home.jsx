import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Shield, Clock, Zap, Droplet, Paintbrush, Camera, Fan, BatteryCharging, Fingerprint, Printer } from 'lucide-react';
import Button from '../components/Button';
import ErrorBoundary from '../components/ErrorBoundary';
import TechnicianSearchModal from '../components/TechnicianSearchModal';
import ServiceBookingForm from '../components/ServiceBookingForm';
import BookingConfirmationModal from '../components/BookingConfirmationModal';
import UserLoginModal from '../components/UserLoginModal';
import api, { createJob } from '../services/api';

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

const Home = ({ setUser }) => {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [selectedService, setSelectedService] = useState('Electrician');

    // Flow State
    const [bookingParams, setBookingParams] = useState(null); // Data from form
    const [selectedTechnician, setSelectedTechnician] = useState(null); // Selected Tech

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

    // Auto-Sync Location for Logged-In Users
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;

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

                    // 3. Update Local Storage
                    const updatedUser = { ...user, location: newLocation };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    console.log("Home: Location synced to backend");

                } catch (err) {
                    console.error("Home: Location sync failed", err);
                }
            });
        }
    }, []);

    const handleFormSearch = (data) => {
        // Step 1: User fills form and clicks "Book" -> Direct Auto-Assign Flow
        // We do NOT show the map/search modal. We send directly to backend.

        const user = JSON.parse(localStorage.getItem('user'));

        // Prepare base booking data
        // We don't have a selected technician, so technicianId will be null
        const bookingData = {
            ...data,
            technicianId: null,
            visitingCharges: 0, // Default or handled by backend
            agreementAccepted: true // Auto-accept for direct flow or add a small checkbox in form if strict
        };

        if (!user) {
            // Not logged in -> Show Login Modal
            setBookingParams(bookingData);
            setIsLoginOpen(true);
        } else {
            // Logged in -> Create Job Directly (Smart Assignment)
            createJobRequest({ ...bookingData, userId: user.id });
        }
    };

    const handleTechnicianSelect = (technician) => {
        // Step 2: (Legacy/Dashboard Flow) User selects a technician from search results
        setSelectedTechnician(technician);
        setIsSearchOpen(false);
        setIsConfirmOpen(true);
    };

    const handleConfirmBooking = (finalBookingData) => {
        // Step 3: (Legacy/Dashboard Flow) User confirms details in popup
        const user = JSON.parse(localStorage.getItem('user'));

        if (!user) {
            setIsConfirmOpen(false);
            setIsLoginOpen(true);
            setBookingParams(prev => ({ ...prev, ...finalBookingData }));
        } else {
            createJobRequest({ ...bookingParams, ...finalBookingData, userId: user.id });
        }
    };

    const handleLoginSuccess = (user) => {
        // Update App state immediately so navigation works
        if (setUser) setUser(user);

        // Step 4: Login Successful -> Resume Booking
        setIsLoginOpen(false);
        if (bookingParams && selectedTechnician) {
            // Re-trigger booking creation with new user ID
            createJobRequest({ ...bookingParams, userId: user.id });
        }
    };

    const [isRequesting, setIsRequesting] = useState(false);

    const createJobRequest = async (fullData) => {
        try {
            const payload = {
                ...fullData,
                // Ensure field names match backend expectation
                technicianId: selectedTechnician?.id,
            };

            const res = await createJob(payload);
            if (res.data.success) {
                // Step 5: Success
                setIsConfirmOpen(false);

                // Check if user is technician (unlikely for this flow, but safe check)
                const user = JSON.parse(localStorage.getItem('user'));
                if (user && user.role === 'technician') {
                    alert("Booking created! Redirecting to dashboard...");
                    navigate('/technician-dashboard');
                } else {
                    // Custom Success Flow
                    setIsRequesting(true);

                    // Redirect to user dashboard in background and auto terminate logic
                    // We wait 3 seconds to let user read the message, then navigate.
                    // Navigation unmounts Home, thus "auto terminating" the popup.
                    setTimeout(() => {
                        navigate('/dashboard');
                    }, 4000);
                }
            }
        } catch (error) {
            console.error("Job Creation Failed", error);
            alert("Failed to create booking. Please try again.");
        }
    };

    const handleBookNow = (serviceType = 'Electrician') => {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;

        // Quick Booking through Tiles -> Open Map (Legacy/Quick Flow)
        setSelectedService(serviceType);

        const launchModal = (loc) => {
            setBookingParams({
                serviceType,
                location: loc, // TechnicianSearchModal needs this
                scheduledDate: new Date().toISOString().split('T')[0],
                scheduledTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
                contactName: user ? user.name : '',
                contactPhone: '',
                description: 'Quick Tile Booking'
            });
            setIsSearchOpen(true); // Open the Map Modal
        };

        // PRIORITY 1: User Profile Location (Immediate Use)
        if (user && user.location && user.location.latitude) {
            const loc = {
                latitude: user.location.latitude,
                longitude: user.location.longitude,
                address: user.location.address || "Saved Profile Location"
            };
            launchModal(loc);
            return;
        }

        const handleLocationError = (error = null) => {
            console.error("Location detection failed:", error);

            // Fallback: Default Location (New Delhi)
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
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    return (
        <div className="bg-slate-50 min-h-screen font-sans text-slate-900 overflow-x-hidden pt-48">

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
            <section className="relative h-[650px] rounded-3xl overflow-hidden mx-6 shadow-2xl mb-32 z-0 ring-1 ring-slate-900/5">
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
                        {/* Lighter Gradient Overlay for Light Theme readability if needed, or keeping it dark for contrast with white text */}
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-transparent"></div>
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
                            <span className="px-4 py-1.5 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-200 text-xs font-bold uppercase tracking-wider mb-6 inline-block backdrop-blur-md">
                                ✨ #1 Home Service Platform
                            </span>
                            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 text-white drop-shadow-lg tracking-tight">
                                {slides[currentSlide].title}
                            </h1>
                            <p className="text-xl text-slate-200 mb-10 max-w-xl font-medium drop-shadow-md leading-relaxed">
                                {slides[currentSlide].subtitle}
                            </p>
                            <div className="flex gap-5">
                                <Button
                                    onClick={() => handleBookNow('Electrician')} // Default or derive from slide
                                    className="px-10 py-4 text-base font-bold shadow-xl shadow-blue-600/30 bg-transparent hover:bg-white hover:text-slate-900 border-2 border-white rounded-full transform transition hover:-translate-y-1"
                                >
                                    Book Now
                                </Button>
                                <Link to="/services">
                                    <Button variant="secondary" className="px-10 py-4 text-base font-bold bg-transparent hover:bg-white hover:text-slate-900 text-white border-2 border-white backdrop-blur-md rounded-full shadow-lg transform transition hover:-translate-y-1">Learn More</Button>
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
                            className={`h-1.5 rounded-full transition-all duration-500 shadow-sm ${idx === currentSlide ? 'w-12 bg-blue-500' : 'w-2 bg-white/30 hover:bg-white/60'}`}
                        />
                    ))}
                </div>
            </section>



            {/* --- Booking Section (Separated) --- */}
            <div id="booking-form-section" className="container mx-auto px-4 mb-24 relative z-20">
                <div className="text-center mb-8 mt-12">
                    <h2 className="text-3xl font-extrabold text-slate-900">Book a Professional</h2>
                    <p className="text-slate-500 mt-2">Get the help you need, exactly when you need it.</p>
                </div>
                <div className="max-w-7xl mx-auto">
                    <ServiceBookingForm preselectedService={selectedService} onSearch={handleFormSearch} />
                </div>
            </div>

            {/* --- Features / Trust Indicators --- */}
            <div className="bg-white border-y border-slate-100 py-16 shadow-sm relative z-10 mb-24">
                <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12">
                    <FeatureBox icon={<Shield size={32} className="text-blue-600" />} title="Verified Experts" desc="Background checked & trained professionals." />
                    <FeatureBox icon={<Clock size={32} className="text-amber-500" />} title="60-min Service" desc="Rapid response time for urgent repairs." />
                    <FeatureBox icon={<Star size={32} className="text-green-600" />} title="Satisfaction Guarantee" desc="30-day warranty on all jobs done." />
                </div>
            </div>

            {/* --- Services Grid --- */}
            <section className="py-24 container mx-auto px-4">
                <div className="text-center mb-20">
                    <h2 className="text-4xl font-extrabold mb-4 text-slate-900 tracking-tight">Our Professional Services</h2>
                    <p className="text-slate-500 text-lg max-w-2xl mx-auto">Expert solutions for every corner of your home.</p>
                </div>

                {/* Fixed Grid Alignment - Exact 8 Services with Full Names */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 px-4 md:px-12">
                    <div onClick={() => handleBookNow('Electrician')}><ServiceCard icon={<Zap size={32} />} title="Electrician" desc="Wiring & Safety" color="text-amber-500" bg="bg-amber-50" /></div>
                    <div onClick={() => handleBookNow('Plumber')}><ServiceCard icon={<Droplet size={32} />} title="Plumber" desc="Pipes & Leaks" color="text-cyan-600" bg="bg-cyan-50" /></div>
                    <div onClick={() => handleBookNow('Painter')}><ServiceCard icon={<Paintbrush size={32} />} title="Painter" desc="Interior Styling" color="text-pink-500" bg="bg-pink-50" /></div>
                    <div onClick={() => handleBookNow('AC Technician')}><ServiceCard icon={<Fan size={32} />} title="A.C. Technician" desc="Cooling & Gas" color="text-blue-600" bg="bg-blue-50" /></div>

                    <div onClick={() => handleBookNow('Inverter Technician')}><ServiceCard icon={<BatteryCharging size={32} />} title="Inverter Technician" desc="Battery & UPS" color="text-orange-600" bg="bg-orange-50" /></div>
                    <div onClick={() => handleBookNow('CCTV Technician')}><ServiceCard icon={<Camera size={32} />} title="CCTV Technician" desc="Security Cams" color="text-emerald-600" bg="bg-emerald-50" /></div>
                    <div onClick={() => handleBookNow('Biometrics Technician')}><ServiceCard icon={<Fingerprint size={32} />} title="Biometrics Technician" desc="Access Control" color="text-purple-600" bg="bg-purple-50" /></div>
                    <div onClick={() => handleBookNow('Printer Technician')}><ServiceCard icon={<Printer size={32} />} title="Printer Technician" desc="Repair & Fix" color="text-slate-600" bg="bg-slate-50" /></div>
                </div>
            </section>

            {/* Added spacing to prevent collision */}
            <div className="h-20"></div>

            {/* --- Technician of the Month --- */}
            <section className="py-32 bg-slate-900 text-white relative overflow-hidden my-24 mb-32 rounded-[3rem] mx-4 shadow-2xl">
                <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-l from-blue-900/30 to-transparent -skew-x-12 translate-x-20"></div>
                <div className="container mx-auto px-8 relative z-10">
                    <div className="flex flex-col md:flex-row items-center gap-16">
                        <div className="md:w-1/2">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl opacity-50 blur-lg group-hover:opacity-75 transition duration-1000"></div>
                                <img
                                    src="https://images.unsplash.com/photo-1542596594-649edbc13630?q=80&w=1974&auto=format&fit=crop"
                                    alt="Technician of the Month"
                                    className="relative rounded-2xl shadow-2xl w-full object-cover aspect-[4/3] border border-white/10"
                                />
                                <div className="absolute bottom-8 left-8 bg-slate-900/90 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-white/10">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Star size={18} className="text-yellow-400 fill-yellow-400" />
                                        <span className="font-bold text-white text-lg">4.9/5 Rating</span>
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium">Based on 120+ reviews</p>
                                </div>
                            </div>
                        </div>
                        <div className="md:w-1/2 space-y-8">
                            <div>
                                <h4 className="text-blue-400 font-bold uppercase tracking-widest text-sm mb-3">Technician of the Month</h4>
                                <h2 className="text-5xl font-extrabold mb-6 tracking-tight">Meet Raj Kumar</h2>
                                <p className="text-slate-300 text-xl leading-relaxed font-light">
                                    Raj has been Fixofy's top-rated Master Electrician for 3 months running. With over 10 years of experience, he specializes in smart home installations.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                                    <h5 className="text-3xl font-bold text-white mb-1">500+</h5>
                                    <p className="text-slate-400 font-medium">Jobs Completed</p>
                                </div>
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                                    <h5 className="text-3xl font-bold text-white mb-1">100%</h5>
                                    <p className="text-slate-400 font-medium">On-Time Record</p>
                                </div>
                            </div>

                            <Button onClick={() => handleBookNow('Electrician')} className="px-10 py-4 bg-transparent text-white hover:bg-white hover:text-slate-900 border-2 border-white rounded-full font-bold shadow-lg shadow-white/10 transform transition hover:-translate-y-1">Book Raj Now</Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Testimonials --- */}
            <section className="py-32 container mx-auto px-4 bg-slate-50 mb-48">
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
            </section>
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
        whileHover={{ y: -5, scale: 1.02 }}
        className="aspect-square bg-white border border-slate-100 p-4 rounded-[1.5rem] shadow-sm hover:shadow-2xl transition-all group cursor-pointer flex flex-col items-center justify-center text-center relative overflow-hidden"
    >
        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>
        <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-black/5`}>
            <div className={`${color}`}>{icon}</div>
        </div>
        <div className="flex flex-col gap-1 w-full">
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors w-full px-1 leading-tight tracking-tight">{title}</h3>
            <p className="text-slate-400 text-xs font-medium px-1 opacity-90 uppercase tracking-wide">{desc}</p>
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

export default Home;
