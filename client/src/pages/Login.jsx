import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import '../styles/neu-styles.css';

const Login = ({ setUser }) => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({ email: '', password: '' });
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const savedEmail = localStorage.getItem('rememberedEmail');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
    }, []);

    // Effect for ambient light
    useEffect(() => {
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

    const validateEmail = (val) => {
        if (!val) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Please enter a valid email';
        return '';
    };

    const validatePassword = (val) => {
        if (!val) return 'Password is required';
        if (val.length < 6) return 'Password must be at least 6 characters';
        return '';
    };

    const handleBlur = (field) => {
        if (field === 'email') {
            setErrors(prev => ({ ...prev, email: validateEmail(email) }));
        } else if (field === 'password') {
            setErrors(prev => ({ ...prev, password: validatePassword(password) }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const emailError = validateEmail(email);
        const passwordError = validatePassword(password);

        if (emailError || passwordError) {
            setErrors({ email: emailError, password: passwordError });
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/users/login', { email, password });
            if (response.data.success) {
                // Handle Remember Me
                if (rememberMe) {
                    localStorage.setItem('rememberedEmail', email);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }

                setSuccess(true);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                localStorage.setItem('sessionToken', response.data.sessionToken);

                if (setUser) setUser(response.data.user);

                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 2000);
            }
        } catch (err) {
            setErrors(prev => ({ ...prev, password: err.response?.data?.error || 'Login failed' }));
            setLoading(false);
        }
    };

    return (
        <div className="neu-body">
            {/* Success Popup Modal */}
            {success && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#e0e5ec] p-8 rounded-3xl shadow-[20px_20px_60px_#bec3cf,-20px_-20px_60px_#ffffff] flex flex-col items-center justify-center min-w-[300px] border border-white/50 transform transition-all scale-100">
                        <div className="w-20 h-20 bg-[#e0e5ec] rounded-full shadow-[inset_5px_5px_10px_#bec3cf,inset_-5px_-5px_10px_#ffffff] flex items-center justify-center mb-6 text-green-500">
                            <svg className="w-10 h-10 drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-[#3d4468] mb-2 tracking-wide">Login Successful</h3>
                        <p className="text-[#9499b7] font-medium text-sm">Redirecting to Dashboard...</p>
                        <div className="mt-6 w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 animate-[progress_2s_ease-in-out_forwards] w-0"></div>
                        </div>
                    </div>
                </div>
            )}

            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <div className="neu-icon">
                            <div className="icon-inner">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </div>
                        </div>
                        <h2>Welcome back</h2>
                        <p>Please sign in to continue</p>
                    </div>

                    <form className="login-form" onSubmit={handleSubmit} noValidate>
                        <div className={`form-group ${errors.email ? 'error' : ''}`}>
                            <div className="input-group neu-input">
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setErrors(prev => ({ ...prev, email: '' }));
                                    }}
                                    onBlur={() => handleBlur('email')}
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

                        <div className={`form-group ${errors.password ? 'error' : ''}`}>
                            <div className="input-group neu-input password-group">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setErrors(prev => ({ ...prev, password: '' }));
                                    }}
                                    onBlur={() => handleBlur('password')}
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

                        <div className="form-options">
                            <div className="remember-wrapper">
                                <input
                                    type="checkbox"
                                    id="remember"
                                    name="remember"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <label htmlFor="remember" className="checkbox-label">
                                    <div className="neu-checkbox">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </div>
                                    Remember me
                                </label>
                            </div>
                            <a href="#" className="forgot-link">Forgot password?</a>
                        </div>

                        <button type="submit" className={`neu-button login-btn ${loading ? 'loading' : ''}`} disabled={loading}>
                            <span className="btn-text">Sign In</span>
                            <div className="btn-loader">
                                <div className="neu-spinner"></div>
                            </div>
                        </button>
                    </form>

                    <div className="divider">
                        <div className="divider-line"></div>
                        <span>or continue with</span>
                        <div className="divider-line"></div>
                    </div>

                    <div className="social-login">
                        <button type="button" className="social-btn neu-social">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                        </button>
                        <button type="button" className="social-btn neu-social">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                        </button>
                        <button type="button" className="social-btn neu-social">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                            </svg>
                        </button>
                    </div>

                    <div className="signup-link">
                        <p>Don't have an account? <Link to="/register">Sign up</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
