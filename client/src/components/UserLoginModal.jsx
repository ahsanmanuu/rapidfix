import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, User, Phone, Mail, Lock, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const UserLoginModal = ({ isOpen, onClose, onSuccess }) => {
    const { setUser } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [registerSuccess, setRegisterSuccess] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        phone: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(null);
    }

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Fetch Location for BOTH Login and Register
        let location = { latitude: 0, longitude: 0, address: "Unknown" };
        try {
            const pos = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
            });
            location = {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                address: "Current Location"
            };
        } catch (locErr) {
            console.warn("Location fetch failed, using default", locErr);
        }

        try {
            if (isLogin) {
                // --- LOGIN FLOW ---
                const res = await api.post('/users/login', {
                    email: formData.email,
                    password: formData.password,
                    location // Pass dynamic location
                });

                if (res.data.success) {
                    const user = res.data.user;
                    setUser(user, res.data.sessionToken);
                    onSuccess(user);
                }
            } else {
                // --- REGISTER FLOW ---

                // Validate Passwords
                if (formData.password !== formData.confirmPassword) {
                    setError("Passwords do not match");
                    setLoading(false);
                    return;
                }

                const res = await api.post('/users/register', {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password,
                    location // Use fetched location
                });

                if (res.data.success) {
                    setRegisterSuccess(true);
                    const user = res.data.user;
                    setUser(user, res.data.sessionToken);

                    // Delay slightly to show success animation
                    setTimeout(() => {
                        onSuccess(user);
                    }, 1500);
                }
            }
        } catch (err) {
            console.error("Auth failed", err);
            setError(err.response?.data?.error || "Authentication failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md font-sans">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 30 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative border-2 border-red-500"
                >
                    {/* Artistic Header Background - RELATIVE LAYOUT FIX */}
                    <div className="relative w-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 overflow-hidden shrink-0">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>

                        {/* Title Section */}
                        <div className="relative z-10 px-6 md:px-8 py-8 md:py-10 flex flex-col items-center text-center">
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-3 md:mb-4 shadow-inner ring-1 ring-white/30 border border-white/20">
                                <User size={24} className="text-white drop-shadow-md md:w-8 md:h-8" />
                            </div>
                            <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-sm">
                                {registerSuccess ? 'Welcome!' : (isLogin ? 'Welcome Back' : 'Create Account')}
                            </h3>
                            <p className="text-blue-100 font-medium text-xs md:text-sm mt-2 max-w-[200px] leading-relaxed">
                                {registerSuccess ? 'Your journey begins now.' : (isLogin ? 'Enter your details to access your account' : 'Join us for premium service experience')}
                            </p>
                        </div>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 md:top-5 md:right-5 z-20 p-2 md:p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-lg rounded-full text-white transition-all shadow-lg ring-1 ring-white/20 group"
                    >
                        <X size={18} className="group-hover:rotate-90 transition-transform duration-300 md:w-5 md:h-5" />
                    </button>

                    {/* Main Content Area - REMOVED TOP PADDING */}
                    <div className="py-6 md:py-8 px-6 md:px-8 relative z-10 bg-white max-h-[60vh] overflow-y-auto">
                        {registerSuccess ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center py-6 text-center space-y-4"
                            >
                                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                                    <CheckCircle2 size={48} className="text-white" />
                                </div>
                                <h4 className="text-2xl font-bold text-slate-800">Success!</h4>
                                <p className="text-slate-500 font-medium">Redirecting you to your dashboard...</p>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-3 md:p-4 rounded-r-xl flex items-start gap-3 shadow-sm mb-2"
                                    >
                                        <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                        <span className="font-semibold text-sm leading-relaxed">{error}</span>
                                    </motion.div>
                                )}

                                <AnimatePresence mode="wait">
                                    {!isLogin && (
                                        <motion.div
                                            key="register-fields-1"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden flex flex-col gap-5"
                                        >
                                            <div className="group flex items-center w-full bg-white border-2 border-slate-100 rounded-2xl transition-all shadow-sm hover:border-slate-200 focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/10">
                                                <div className="pl-4 shrink-0">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-focus-within:text-blue-600 group-focus-within:bg-blue-50 transition-all duration-300">
                                                        <User size={20} />
                                                    </div>
                                                </div>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    placeholder="Full Name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    className="w-full bg-transparent border-none py-4 px-4 text-slate-700 font-bold placeholder:font-medium placeholder:text-slate-300 outline-none"
                                                    required={!isLogin}
                                                />
                                            </div>
                                            <div className="group flex items-center w-full bg-white border-2 border-slate-100 rounded-2xl transition-all shadow-sm hover:border-slate-200 focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/10">
                                                <div className="pl-4 shrink-0">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-focus-within:text-blue-600 group-focus-within:bg-blue-50 transition-all duration-300">
                                                        <Phone size={20} />
                                                    </div>
                                                </div>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    placeholder="Phone Number"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    className="w-full bg-transparent border-none py-4 px-4 text-slate-700 font-bold placeholder:font-medium placeholder:text-slate-300 outline-none"
                                                    required={!isLogin}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Common Fields */}
                                <div className="flex flex-col gap-5">
                                    <div className="group flex items-center w-full bg-white border-2 border-slate-100 rounded-2xl transition-all shadow-sm hover:border-slate-200 focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/10">
                                        <div className="pl-4 shrink-0">
                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-focus-within:text-blue-600 group-focus-within:bg-blue-50 transition-all duration-300">
                                                <Mail size={20} />
                                            </div>
                                        </div>
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="Email Address"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full bg-transparent border-none py-4 px-4 text-slate-700 font-bold placeholder:font-medium placeholder:text-slate-300 outline-none"
                                            required
                                        />
                                    </div>
                                    <div className="group flex items-center w-full bg-white border-2 border-slate-100 rounded-2xl transition-all shadow-sm hover:border-slate-200 focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/10">
                                        <div className="pl-4 shrink-0">
                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-focus-within:text-blue-600 group-focus-within:bg-blue-50 transition-all duration-300">
                                                <Lock size={20} />
                                            </div>
                                        </div>
                                        <input
                                            type="password"
                                            name="password"
                                            placeholder="Password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full bg-transparent border-none py-4 px-4 text-slate-700 font-bold placeholder:font-medium placeholder:text-slate-300 outline-none"
                                            required
                                        />
                                    </div>
                                </div>

                                <AnimatePresence mode="wait">
                                    {!isLogin && (
                                        <motion.div
                                            key="confirm-password-field"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden flex flex-col gap-5"
                                        >
                                            <div className="group flex items-center w-full bg-white border-2 border-slate-100 rounded-2xl transition-all shadow-sm hover:border-slate-200 focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/10">
                                                <div className="pl-4 shrink-0">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-focus-within:text-blue-600 group-focus-within:bg-blue-50 transition-all duration-300">
                                                        <Lock size={20} />
                                                    </div>
                                                </div>
                                                <input
                                                    type="password"
                                                    name="confirmPassword"
                                                    placeholder="Confirm Password"
                                                    value={formData.confirmPassword}
                                                    onChange={handleChange}
                                                    className="w-full bg-transparent border-none py-4 px-4 text-slate-700 font-bold placeholder:font-medium placeholder:text-slate-300 outline-none"
                                                    required={!isLogin}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-3 mt-6 group shrink-0"
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Processing...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-lg">{isLogin ? 'Login Securely' : 'Create Account'}</span>
                                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </motion.button>

                                <div className="pt-2 pb-2 text-center shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setIsLogin(!isLogin)}
                                        className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors group"
                                    >
                                        {isLogin ? (
                                            <>Don't have an account? <span className="text-blue-600 font-bold underline decoration-2 underline-offset-4 group-hover:text-blue-700">Sign Up Free</span></>
                                        ) : (
                                            <>Already have an account? <span className="text-blue-600 font-bold underline decoration-2 underline-offset-4 group-hover:text-blue-700">Login Here</span></>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default UserLoginModal;
