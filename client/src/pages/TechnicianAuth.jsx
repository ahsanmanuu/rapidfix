import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AuthErrorAlert from '../components/AuthErrorAlert';
import LocationAuthModal from '../components/LocationAuthModal';
import SuccessModal from '../components/SuccessModal';
import '../styles/TechnicianAuth.css';

const TechnicianAuth = ({ setUser }) => {
    const navigate = useNavigate();
    const [isSwitched, setIsSwitched] = useState(false);
    const [isBrandActive, setIsBrandActive] = useState(false);
    const [isHeadingActive, setIsHeadingActive] = useState(false);
    const [isSuccessActive, setIsSuccessActive] = useState(false);
    const [activeFields, setActiveFields] = useState({});

    // Form States
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [signupData, setSignupData] = useState({
        name: '',
        email: '',
        phone: '',
        serviceType: 'Electrician',
        experience: '',
        country: '',
        state: '',
        city: '',
        pincode: '',
        password: '',
        confirmPassword: '',
        photo: null,
        pan: null,
        aadhar: null,
        dl: null
    });
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [alertMessage, setAlertMessage] = useState(null);

    // Workflow States
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);

    // Removed auto-location on mount to comply with "pop up asking to enable" requirement flow

    const handleFocus = (field) => {
        setActiveFields(prev => ({ ...prev, [field]: true }));
    };

    const handleBlur = (field, value) => {
        if (!value) {
            setActiveFields(prev => ({ ...prev, [field]: false }));
        }
    };

    const handleSwitch = (e, toSignup) => {
        e.preventDefault();
        setIsSwitched(toSignup);
        setErrors({});
        setAlertMessage(null);
        if (toSignup) {
            setShowLocationModal(true);
        }
    };

    const handleLoginChange = (e) => {
        setLoginData({ ...loginData, [e.target.name]: e.target.value });
        setErrors({});
    };

    const handleSignupChange = (e) => {
        if (e.target.type === 'file') {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 50 * 1024) { // 50KB limit
                    setErrors(prev => ({ ...prev, [e.target.name]: "File size must be less than 50KB" }));
                    e.target.value = null; // Reset input
                    setSignupData(prev => ({ ...prev, [e.target.name]: null }));
                    return;
                }
                setSignupData(prev => ({ ...prev, [e.target.name]: file }));
                setErrors(prev => ({ ...prev, [e.target.name]: null }));
            }
        } else {
            setSignupData({ ...signupData, [e.target.name]: e.target.value });
            setErrors({});
        }
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setAlertMessage(null);
        try {
            const payload = {
                email: loginData.email.trim(),
                password: loginData.password.trim()
            };
            const res = await api.post('/technicians/login', payload);
            if (res.data.success) {
                const techUser = { ...res.data.technician, role: 'technician' };
                localStorage.setItem('user', JSON.stringify(techUser));
                localStorage.setItem('sessionToken', 'dummy-tech-token');
                if (setUser) setUser(techUser);
                navigate('/technician-dashboard');
            }
        } catch (err) {
            console.error("Login Error", err);
            const msg = err.response?.data?.error || 'Invalid credentials. Please check your email and password.';
            setErrors({ login: msg });
            setAlertMessage(msg);
        } finally {
            setLoading(false);
        }
    };

    // Step 1: User clicks Signup -> Validation -> Show Location Warning Modal
    const handleSignupClick = (e) => {
        e.preventDefault();
        setAlertMessage(null);
        if (signupData.password !== signupData.confirmPassword) {
            setErrors({ signup: "Passwords do not match" });
            return;
        }

        // Basic Fields Check
        const requiredFields = ['name', 'email', 'password', 'phone', 'experience', 'country', 'state', 'city', 'pincode'];
        const missingField = requiredFields.find(field => !signupData[field]);
        if (missingField) {
            setErrors({ signup: "Please fill all basic details" });
            return;
        }

        // Document Check
        if (!signupData.photo) {
            setErrors({ signup: "Profile Photo is mandatory" });
            return;
        }
        if (!signupData.pan) {
            setErrors({ signup: "PAN Card is mandatory" });
            return;
        }
        if (!signupData.aadhar) {
            setErrors({ signup: "Aadhar Card is mandatory" });
            return;
        }

        // Location Check
        if (!location) {
            // Promt again if they missed it or it failed
            setShowLocationModal(true);
            return;
        }

        // Proceed to Register
        registerTechnician(location);
    };

    // Step 2: User Agrees in Modal -> Get and Store Location (Wait for Signup Click)
    const handleLocationConfirm = () => {
        if (!navigator.geolocation) {
            setAlertMessage("Geolocation is not supported by your browser.");
            setShowLocationModal(false);
            return;
        }

        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const loc = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                setLocation(loc);
                setLoading(false);
                setShowLocationModal(false);
            },
            (err) => {
                console.error("Location access denied", err);
                setLoading(false);
                setShowLocationModal(false);
                // We let them fill the form, but on submit we will block if location is null
                // Or we can set an error. For now, just close and let them try again later.
                // setAlertMessage("Location is mandatory. You can fill details but enable location to submit.");
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const registerTechnician = async (loc) => {
        try {
            const formData = new FormData();

            // 1. Append Text Fields FIRST (Critical for Multer)
            Object.keys(signupData).forEach(key => {
                if (!['photo', 'pan', 'aadhar', 'dl'].includes(key)) {
                    // Ensure not null/undefined
                    const val = signupData[key] !== null && signupData[key] !== undefined ? signupData[key] : '';
                    formData.append(key, val);
                }
            });

            // 2. Append Location
            formData.append('location', JSON.stringify(loc));

            // 3. Append Files LAST
            Object.keys(signupData).forEach(key => {
                if (['photo', 'pan', 'aadhar', 'dl'].includes(key)) {
                    if (signupData[key]) formData.append(key, signupData[key]);
                }
            });

            const res = await api.post('/technicians/register', formData);
            if (res.data.success) {
                // Success!
                // 1. Show Success Animation in TechnicianAuth (sliding panels)
                // 2. Show Success Modal Overlay
                setShowLocationModal(false);
                setIsRegistered(true); // For sliding animation

                // Trigger visual effects from original design
                setIsBrandActive(true);
                setTimeout(() => setIsHeadingActive(true), 300);
                setTimeout(() => setIsSuccessActive(true), 600);

                // Show the redirect modal
                setTimeout(() => setShowSuccessModal(true), 1000);

                const techUser = { ...res.data.technician, role: 'technician' };
                // Persist session
                localStorage.setItem('user', JSON.stringify(techUser));
                localStorage.setItem('sessionToken', 'dummy-tech-token');

                // Update App State
                if (setUser) setUser(techUser);
            }
        } catch (err) {
            const msg = err.response?.data?.error || 'Registration failed';
            setErrors({ signup: msg });
            setAlertMessage(msg);
            setShowLocationModal(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="tech-auth-body pt-36">
            <AuthErrorAlert message={alertMessage} onClose={() => setAlertMessage(null)} />
            <LocationAuthModal isOpen={showLocationModal} onConfirm={handleLocationConfirm} />
            <SuccessModal isOpen={showSuccessModal} onComplete={() => navigate('/technician-dashboard')} />

            <div className="container tech-auth-container">
                <section id="formHolder">
                    <div className="row" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'stretch', minHeight: '100vh', width: '100%', margin: 0 }}>
                        {/* Brand Box */}
                        <div className={`col-sm-6 brand ${isBrandActive ? 'active' : ''}`}>
                            <a href="#" className="logo">FIX <span>.</span></a>

                            <div className={`heading ${isHeadingActive ? 'active' : ''}`}>
                                <h2>Fixofy</h2>
                                <p>Partner Program</p>
                            </div>

                            <div className={`success-msg ${isSuccessActive ? 'active' : ''}`}>
                                <p>Great! You are one of our partners now</p>
                                <a className="profile" onClick={() => navigate('/technician-dashboard')}>Go to Dashboard</a>
                            </div>
                        </div>

                        {/* Form Box */}
                        <div className="col-sm-6 form" style={{ display: isBrandActive ? 'none' : 'block' }}>

                            {/* Login Form */}
                            <div className={`login form-peice ${isSwitched ? 'switched' : ''}`}>
                                <form className="tech-form login-form" onSubmit={handleLoginSubmit}>
                                    <div className="form-group">
                                        <label className={activeFields.loginEmail || loginData.email ? 'active' : ''} htmlFor="loginemail">Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            id="loginemail"
                                            required
                                            value={loginData.email}
                                            onChange={handleLoginChange}
                                            onFocus={() => handleFocus('loginEmail')}
                                            onBlur={(e) => handleBlur('loginEmail', e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className={activeFields.loginPassword || loginData.password ? 'active' : ''} htmlFor="loginPassword">Password</label>
                                        <input
                                            type="password"
                                            name="password"
                                            id="loginPassword"
                                            required
                                            value={loginData.password}
                                            onChange={handleLoginChange}
                                            onFocus={() => handleFocus('loginPassword')}
                                            onBlur={(e) => handleBlur('loginPassword', e.target.value)}
                                        />
                                    </div>

                                    {/* Removed inline error to use popup */}

                                    <div className="CTA">
                                        <input type="submit" value={loading ? "Logging in..." : "Login"} disabled={loading} />
                                        <a href="#" className="switch" onClick={(e) => handleSwitch(e, true)}>I'm New</a>
                                    </div>
                                </form>
                            </div>

                            {/* Signup Form */}
                            <div className={`signup form-peice ${isSwitched ? 'switched' : ''}`}>
                                <form className="tech-form signup-form" onSubmit={handleSignupClick}>
                                    <div className="form-group">
                                        <label className={activeFields.signupName || signupData.name ? 'active' : ''} htmlFor="name">Full Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            id="name"
                                            className="name"
                                            value={signupData.name}
                                            onChange={handleSignupChange}
                                            onFocus={() => handleFocus('signupName')}
                                            onBlur={(e) => handleBlur('signupName', e.target.value)}
                                        />
                                        <span className="error"></span>
                                    </div>

                                    <div className="form-group">
                                        <label className={activeFields.signupEmail || signupData.email ? 'active' : ''} htmlFor="email">Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            id="email"
                                            className="email"
                                            value={signupData.email}
                                            onChange={handleSignupChange}
                                            onFocus={() => handleFocus('signupEmail')}
                                            onBlur={(e) => handleBlur('signupEmail', e.target.value)}
                                        />
                                        <span className="error"></span>
                                    </div>

                                    <div className="form-group">
                                        <label className={activeFields.signupPhone || signupData.phone ? 'active' : ''} htmlFor="phone">Phone Number</label>
                                        <input
                                            type="text"
                                            name="phone"
                                            id="phone"
                                            value={signupData.phone}
                                            onChange={handleSignupChange}
                                            onFocus={() => handleFocus('signupPhone')}
                                            onBlur={(e) => handleBlur('signupPhone', e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="active" style={{ transform: 'translateY(0)', top: '-20px', fontSize: '10px' }}>Service Type</label>
                                        <select
                                            name="serviceType"
                                            value={signupData.serviceType}
                                            onChange={handleSignupChange}
                                            style={{ border: 'none', borderBottom: '1px solid #eee', width: '100%', padding: '10px 0', outline: 'none', marginTop: '10px' }}
                                        >
                                            <option value="Electrician">Electrician</option>
                                            <option value="Plumber">Plumber</option>
                                            <option value="Painter">Painter</option>
                                            <option value="AC Technician">A.C. Technician</option>
                                            <option value="Inverter Technician">Inverter Technician</option>
                                            <option value="CCTV Technician">CCTV Technician</option>
                                            <option value="Biometrics Technician">Biometrics Technician</option>
                                            <option value="Printer Technician">Printer Technician</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className={activeFields.signupExp || signupData.experience ? 'active' : ''} htmlFor="experience">Experience (Years)</label>
                                        <input
                                            type="number"
                                            name="experience"
                                            id="experience"
                                            min="0"
                                            value={signupData.experience}
                                            onChange={handleSignupChange}
                                            onFocus={() => handleFocus('signupExp')}
                                            onBlur={(e) => handleBlur('signupExp', e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className={activeFields.signupCountry || signupData.country ? 'active' : ''} htmlFor="country">Country</label>
                                        <input
                                            type="text"
                                            name="country"
                                            id="country"
                                            list="country-list"
                                            value={signupData.country}
                                            onChange={handleSignupChange}
                                            onFocus={() => handleFocus('signupCountry')}
                                            onBlur={(e) => handleBlur('signupCountry', e.target.value)}
                                        />
                                        <datalist id="country-list">
                                            <option value="India" />
                                            <option value="USA" />
                                            <option value="UAE" />
                                            <option value="UK" />
                                            <option value="Canada" />
                                        </datalist>
                                    </div>

                                    <div className="form-group">
                                        <label className={activeFields.signupState || signupData.state ? 'active' : ''} htmlFor="state">State</label>
                                        <input
                                            type="text"
                                            name="state"
                                            id="state"
                                            list="state-list"
                                            value={signupData.state}
                                            onChange={handleSignupChange}
                                            onFocus={() => handleFocus('signupState')}
                                            onBlur={(e) => handleBlur('signupState', e.target.value)}
                                        />
                                        <datalist id="state-list">
                                            <option value="Maharashtra" />
                                            <option value="Delhi" />
                                            <option value="Karnataka" />
                                            <option value="Tamil Nadu" />
                                            <option value="Uttar Pradesh" />
                                        </datalist>
                                    </div>

                                    <div className="form-group">
                                        <label className={activeFields.signupCity || signupData.city ? 'active' : ''} htmlFor="city">City</label>
                                        <input
                                            type="text"
                                            name="city"
                                            id="city"
                                            list="city-list"
                                            value={signupData.city}
                                            onChange={handleSignupChange}
                                            onFocus={() => handleFocus('signupCity')}
                                            onBlur={(e) => handleBlur('signupCity', e.target.value)}
                                        />
                                        <datalist id="city-list">
                                            <option value="Mumbai" />
                                            <option value="Pune" />
                                            <option value="Nagpur" />
                                            <option value="Delhi" />
                                            <option value="Bangalore" />
                                        </datalist>
                                    </div>

                                    <div className="form-group">
                                        <label className={activeFields.signupPincode || signupData.pincode ? 'active' : ''} htmlFor="pincode">Pincode</label>
                                        <input
                                            type="text"
                                            name="pincode"
                                            id="pincode"
                                            value={signupData.pincode}
                                            onChange={handleSignupChange}
                                            onFocus={() => handleFocus('signupPincode')}
                                            onBlur={(e) => handleBlur('signupPincode', e.target.value)}
                                            placeholder={activeFields.signupPincode ? "Type to search..." : ""}
                                        />
                                    </div>

                                    {/* Document Uploads */}
                                    <h4 style={{ marginTop: '20px', marginBottom: '15px', color: '#636e72', fontSize: '14px', textTransform: 'uppercase', fontWeight: 'bold' }}>Documents (Max 50KB)</h4>

                                    <div className="form-group">
                                        <label className="active" style={{ position: 'relative', transform: 'none', top: 0, color: '#f95959' }}>Profile Photo (Mandatory)</label>
                                        <input type="file" name="photo" accept="image/*" onChange={handleSignupChange} required style={{ border: 'none', padding: '10px 0' }} />
                                        {errors.photo && <span style={{ color: 'red', fontSize: '11px' }}>{errors.photo}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label className="active" style={{ position: 'relative', transform: 'none', top: 0, color: '#f95959' }}>PAN Card (Mandatory)</label>
                                        <input type="file" name="pan" accept="image/*,.pdf" onChange={handleSignupChange} required style={{ border: 'none', padding: '10px 0' }} />
                                        {errors.pan && <span style={{ color: 'red', fontSize: '11px' }}>{errors.pan}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label className="active" style={{ position: 'relative', transform: 'none', top: 0, color: '#f95959' }}>Aadhar Card (Mandatory)</label>
                                        <input type="file" name="aadhar" accept="image/*,.pdf" onChange={handleSignupChange} required style={{ border: 'none', padding: '10px 0' }} />
                                        {errors.aadhar && <span style={{ color: 'red', fontSize: '11px' }}>{errors.aadhar}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label className="active" style={{ position: 'relative', transform: 'none', top: 0, color: '#636e72' }}>Driving License (Optional)</label>
                                        <input type="file" name="dl" accept="image/*,.pdf" onChange={handleSignupChange} style={{ border: 'none', padding: '10px 0' }} />
                                        {errors.dl && <span style={{ color: 'red', fontSize: '11px' }}>{errors.dl}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label className={activeFields.signupPass || signupData.password ? 'active' : ''} htmlFor="password">Password</label>
                                        <input
                                            type="password"
                                            name="password"
                                            id="password"
                                            className="pass"
                                            value={signupData.password}
                                            onChange={handleSignupChange}
                                            onFocus={() => handleFocus('signupPass')}
                                            onBlur={(e) => handleBlur('signupPass', e.target.value)}
                                        />
                                        <span className="error"></span>
                                    </div>

                                    <div className="form-group">
                                        <label className={activeFields.signupConfirm || signupData.confirmPassword ? 'active' : ''} htmlFor="passwordCon">Confirm Password</label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            id="passwordCon"
                                            className="passConfirm"
                                            value={signupData.confirmPassword}
                                            onChange={handleSignupChange}
                                            onFocus={() => handleFocus('signupConfirm')}
                                            onBlur={(e) => handleBlur('signupConfirm', e.target.value)}
                                        />
                                        <span className="error"></span>
                                    </div>

                                    <div className="CTA">
                                        <input type="submit" value={loading ? "Registering..." : "Signup Now"} id="submit" disabled={loading} />
                                        <a href="#" className="switch" onClick={(e) => handleSwitch(e, false)}>I have an account</a>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </section>

                <footer style={{ position: 'relative', marginTop: '50px', clear: 'both', paddingBottom: '20px', width: '100%', textAlign: 'center' }}>
                    <p>Designed for <a href="/" target="_blank">Fixofy Partners</a></p>
                </footer>
            </div>
        </div>
    );
};

export default TechnicianAuth;
