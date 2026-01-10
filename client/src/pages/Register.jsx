import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import '../styles/neu-styles.css';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const { setUser } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [location, setLocation] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState(false);
    const [showLocationPopup, setShowLocationPopup] = useState(false);
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhoto(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    useEffect(() => {
        // Attempt to get location immediately
        getRealtimeLocation();

        const handleMouseMove = (e) => {
            const card = document.querySelector('.login-card');
            if (!card) return;

            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const angleX = (x - centerX) / centerX;
            const angleY = (y - centerY) / centerY;

            const shadowX = angleX * 30;
            const shadowY = angleY * 30;

            card.style.boxShadow = `
                ${shadowX}px ${shadowY}px 60px #bec3cf,
                ${-shadowX}px ${-shadowY}px 60px #ffffff
            `;
        };

        document.addEventListener('mousemove', handleMouseMove);
        return () => document.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const getRealtimeLocation = () => {
        if (!navigator.geolocation) {
            setErrors(prev => ({ ...prev, location: 'Geolocation is not supported by your browser' }));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
                setErrors(prev => ({ ...prev, location: '' }));
                setShowLocationPopup(false);
            },
            (error) => {
                console.error("Location error:", error);
                setErrors(prev => ({ ...prev, location: 'Location access is required to register.' }));
                setShowLocationPopup(true); // Show mandatory popup if failed/denied
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
        setErrors(prev => ({ ...prev, [id]: '' }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name) newErrors.name = 'Name is required';
        if (!formData.email) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';
        if (!formData.phone) newErrors.phone = 'Phone is required';

        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 6) newErrors.password = 'Min 6 characters';

        if (formData.confirmPassword !== formData.password) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (!location) {
            newErrors.location = 'Location access is MANDATORY.';
            setShowLocationPopup(true);
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);

        // Use FormData for file upload support
        const formDataPayload = new FormData();
        formDataPayload.append('name', formData.name);
        formDataPayload.append('email', formData.email);
        formDataPayload.append('phone', formData.phone);
        formDataPayload.append('password', formData.password);

        // Location must be stringified for FormData
        if (location) {
            formDataPayload.append('location', JSON.stringify(location));
        } else {
            // Redundant safeguard, validation should catch this
            setErrors(prev => ({ ...prev, location: 'Location missing' }));
            setLoading(false);
            return;
        }

        if (photo) {
            formDataPayload.append('photo', photo);
        }

        try {
            // content-type header is auto-set by browser for FormData
            const response = await api.post('/users/register', formDataPayload);
            if (response.data.success) {
                setSuccess(true);
                setUser(response.data.user, response.data.sessionToken);
                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000);
            }
        } catch (err) {
            console.error("Reg Error", err);
            setErrors(prev => ({ ...prev, general: err.response?.data?.error || 'Registration failed' }));
            setLoading(false);
        }
    };

    return (
        <div className="neu-body">
            {showLocationPopup && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#e0e5ec] p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl border-4 border-red-100">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Location Required</h3>
                        <p className="text-slate-600 mb-6 text-sm">Access to your location is <strong>mandatory</strong> for registration. Please allow location access in your browser settings to continue.</p>
                        <button
                            onClick={getRealtimeLocation}
                            className="w-full bg-[#e0e5ec] text-slate-700 font-bold py-3 rounded-xl shadow-[5px_5px_10px_#bec3cf,-5px_-5px_10px_#ffffff] active:shadow-[inset_3px_3px_6px_#bec3cf,inset_-3px_-3px_6px_#ffffff] transition-all"
                        >
                            Try Again / Allow
                        </button>
                    </div>
                </div>
            )}

            <div className="login-container">
                <div className="login-card" style={{ display: success ? 'none' : 'block' }}>
                    <div className="login-header">
                        <div className="neu-icon">
                            <div className="icon-inner">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="8.5" cy="7" r="4" />
                                    <line x1="20" y1="8" x2="20" y2="14" />
                                    <line x1="23" y1="11" x2="17" y2="11" />
                                </svg>
                            </div>
                        </div>
                        <h2>Create Account</h2>
                        <p>Sign up to get started</p>
                    </div>

                    <div className="flex justify-center mb-6">
                        <div className="relative group cursor-pointer w-24 h-24">
                            <input
                                type="file"
                                id="photo-upload"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                className="hidden"
                            />
                            <label htmlFor="photo-upload" className="cursor-pointer block w-full h-full">
                                <div className={`w-full h-full rounded-full border-4 border-[#e0e5ec] shadow-[inset_5px_5px_10px_#bec3cf,inset_-5px_-5px_10px_#ffffff] flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-200 ${photoPreview ? 'p-0' : 'p-4'}`}>
                                    {photoPreview ? (
                                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <svg className="text-slate-400 w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    )}
                                </div>
                                <div className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-1.5 shadow-lg transform scale-75 group-hover:scale-90 transition-transform">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                            </label>
                        </div>
                    </div>

                    <form className="login-form" onSubmit={handleSubmit} noValidate>
                        {errors.general && (
                            <div className="bg-red-50 text-red-500 text-sm py-3 px-4 rounded-xl mb-6 text-center shadow-inner">
                                {errors.general}
                            </div>
                        )}

                        {errors.location && (
                            <div className="bg-red-50 text-red-500 text-xs py-2 px-3 rounded-lg mb-4 text-center">
                                📍 {errors.location}
                            </div>
                        )}

                        <div className={`form-group ${errors.name ? 'error' : ''}`}>
                            <div className="input-group neu-input">
                                <input
                                    type="text"
                                    id="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder=" "
                                />
                                <label htmlFor="name">Full Name</label>
                                <div className="input-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </div>
                            </div>
                            <span className={`error-message ${errors.name ? 'show' : ''}`}>{errors.name}</span>
                        </div>

                        <div className={`form-group ${errors.email ? 'error' : ''}`}>
                            <div className="input-group neu-input">
                                <input
                                    type="email"
                                    id="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder=" "
                                />
                                <label htmlFor="email">Email address</label>
                                <div className="input-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                        <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                </div>
                            </div>
                            <span className={`error-message ${errors.email ? 'show' : ''}`}>{errors.email}</span>
                        </div>

                        <div className={`form-group ${errors.phone ? 'error' : ''}`}>
                            <div className="input-group neu-input">
                                <input
                                    type="tel"
                                    id="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    placeholder=" "
                                />
                                <label htmlFor="phone">Phone Number</label>
                                <div className="input-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                    </svg>
                                </div>
                            </div>
                            <span className={`error-message ${errors.phone ? 'show' : ''}`}>{errors.phone}</span>
                        </div>

                        <div className={`form-group ${errors.password ? 'error' : ''}`}>
                            <div className="input-group neu-input password-group">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder=" "
                                />
                                <label htmlFor="password">Password</label>
                                <div className="input-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0110 0v4" />
                                    </svg>
                                </div>
                                <button
                                    type="button"
                                    className={`password-toggle neu-toggle ${showPassword ? 'show-password' : ''}`}
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label="Toggle password visibility"
                                >
                                    {!showPassword ? (
                                        <svg className="eye-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    ) : (
                                        <svg className="eye-closed" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'block' }}>
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <span className={`error-message ${errors.password ? 'show' : ''}`}>{errors.password}</span>
                        </div>

                        <div className={`form-group ${errors.confirmPassword ? 'error' : ''}`}>
                            <div className="input-group neu-input password-group">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    id="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    placeholder=" "
                                />
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <div className="input-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0110 0v4" />
                                    </svg>
                                </div>
                                <button
                                    type="button"
                                    className={`password-toggle neu-toggle ${showConfirmPassword ? 'show-password' : ''}`}
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    aria-label="Toggle confirm password visibility"
                                >
                                    {!showConfirmPassword ? (
                                        <svg className="eye-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    ) : (
                                        <svg className="eye-closed" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'block' }}>
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <span className={`error-message ${errors.confirmPassword ? 'show' : ''}`}>{errors.confirmPassword}</span>
                        </div>

                        <button type="submit" className={`neu-button login-btn ${loading ? 'loading' : ''}`} disabled={loading}>
                            <span className="btn-text">Register Account</span>
                            <div className="btn-loader">
                                <div className="neu-spinner"></div>
                            </div>
                        </button>
                    </form>

                    <div className="signup-link">
                        <p>Already have an account? <Link to="/login">Sign in</Link></p>
                    </div>
                </div>

                <div className={`success-message ${success ? 'show' : ''}`} id="successMessage">
                    <div className="success-icon neu-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <h3>Account Created!</h3>
                    <p>Redirecting to your dashboard...</p>
                </div>
            </div>
        </div>
    );
};

export default Register;
