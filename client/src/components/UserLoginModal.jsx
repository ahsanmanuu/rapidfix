import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, LogIn, AlertCircle, User, Phone, ArrowRight, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

const UserLoginModal = ({ isOpen, onClose, onSuccess }) => {
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

        try {
            if (isLogin) {
                // --- LOGIN FLOW ---
                const res = await api.post('/users/login', {
                    email: formData.email,
                    password: formData.password
                });

                if (res.data.success) {
                    const user = res.data.user;
                    localStorage.setItem('user', JSON.stringify(user));
                    localStorage.setItem('sessionToken', res.data.sessionToken);
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

                // We need location for registration as per backend requirement
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
                    // Use a fallback or let backend handle simple 0,0
                }

                const res = await api.post('/users/register', {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password,
                    location
                });

                if (res.data.success) {
                    setRegisterSuccess(true);
                    const user = res.data.user;
                    localStorage.setItem('user', JSON.stringify(user));
                    localStorage.setItem('sessionToken', res.data.sessionToken);

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
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md font-sans">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden relative ring-1 ring-white/20"
                >
                    {/* Gradient Header */}
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-600 to-indigo-600 pointer-events-none" />

                    {/* Header Content */}
                    <div className="relative z-10 px-8 pt-8 pb-4 flex justify-between items-start">
                        <div>
                            <h3 className="text-3xl font-extrabold text-white tracking-tight">
                                {registerSuccess ? 'Welcome!' : (isLogin ? 'Welcome Back' : 'Create Account')}
                            </h3>
                            <p className="text-blue-100 font-medium text-sm mt-1">
                                {registerSuccess ? 'Registration successful.' : (isLogin ? 'Login to continue your booking' : 'Sign up to get started')}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-8 pt-6 relative z-10 bg-white rounded-t-[2.5rem] mt-4 min-h-[300px]">

                        {registerSuccess ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center py-10 text-center"
                            >
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                                    <CheckCircle2 size={40} />
                                </div>
                                <h4 className="text-xl font-bold text-slate-800">Account Created!</h4>
                                <p className="text-slate-500 mt-2">Redirecting you to complete your booking...</p>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-red-50 text-red-600 text-sm p-4 rounded-2xl flex items-center gap-3 border border-red-100"
                                    >
                                        <AlertCircle size={18} className="shrink-0" />
                                        <span className="font-medium">{error}</span>
                                    </motion.div>
                                )}

                                <AnimatePresence mode="wait">
                                    {!isLogin && (
                                        <motion.div
                                            key="register-fields"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-4 overflow-hidden"
                                        >
                                            <div className="relative group">
                                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                                <input
                                                    type="text"
                                                    name="name"
                                                    placeholder="Full Name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-semibold transition-all"
                                                    required={!isLogin}
                                                />
                                            </div>
                                            <div className="relative group">
                                                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    placeholder="Phone Number"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-semibold transition-all"
                                                    required={!isLogin}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="relative group">
                                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Email Address"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-semibold transition-all"
                                        required
                                    />
                                </div>
                                <div className="relative group">
                                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="Password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-semibold transition-all"
                                        required
                                    />
                                </div>

                                <AnimatePresence mode="wait">
                                    {!isLogin && (
                                        <motion.div
                                            key="confirm-password-field"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden pt-4"
                                        >
                                            <div className="relative group">
                                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                                <input
                                                    type="password"
                                                    name="confirmPassword"
                                                    placeholder="Confirm Password"
                                                    value={formData.confirmPassword}
                                                    onChange={handleChange}
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-semibold transition-all"
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
                                    className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2 mt-2"
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Processing...
                                        </span>
                                    ) : (
                                        <>{isLogin ? 'Login & Continue' : 'Create Account'} <ArrowRight size={18} /></>
                                    )}
                                </motion.button>

                                <div className="pt-4 text-center">
                                    <button
                                        type="button"
                                        onClick={() => setIsLogin(!isLogin)}
                                        className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
                                    >
                                        {isLogin ? (
                                            <>Don't have an account? <span className="text-blue-600 underline decoration-2 underline-offset-2">Sign Up</span></>
                                        ) : (
                                            <>Already have an account? <span className="text-blue-600 underline decoration-2 underline-offset-2">Login</span></>
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
