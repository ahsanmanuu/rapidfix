import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/neu-styles.css';
import { useAuth } from '../context/AuthContext';

const AdminLogin = () => {
    const { setUser } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Clear any stale local user data on mount to avoid 401 traps
    useEffect(() => {
        localStorage.removeItem('user');
        localStorage.removeItem('sessionToken');
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await api.post('/admin/login', { email, password });
            if (res.data.success) {
                const adminUser = { ...res.data.admin, role: 'admin' };
                // Use actual session token from backend
                setUser(adminUser, res.data.sessionToken);

                navigate('/admin-dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Are you sure you are an Admin?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="neu-body flex items-center justify-center min-h-screen">
            <div className="login-card w-full max-w-md p-8 bg-[#e0e5ec] rounded-3xl shadow-[20px_20px_60px_#bec3cf,-20px_-20px_60px_#ffffff]">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-[#3d4468]">Admin Portal</h2>
                    <p className="text-gray-500 mt-2">Restricted Access</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="form-group">
                        <label className="block text-sm font-bold text-[#3d4468] mb-2">Email Address</label>
                        <input
                            type="email"
                            className="w-full p-4 rounded-xl bg-[#e0e5ec] shadow-[inset_5px_5px_10px_#bec3cf,inset_-5px_-5px_10px_#ffffff] border-none focus:outline-none focus:shadow-[inset_2px_2px_5px_#bec3cf,inset_-2px_-2px_5px_#ffffff] transition-all"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="block text-sm font-bold text-[#3d4468] mb-2">Password</label>
                        <input
                            type="password"
                            className="w-full p-4 rounded-xl bg-[#e0e5ec] shadow-[inset_5px_5px_10px_#bec3cf,inset_-5px_-5px_10px_#ffffff] border-none focus:outline-none focus:shadow-[inset_2px_2px_5px_#bec3cf,inset_-2px_-2px_5px_#ffffff] transition-all"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-100 text-red-600 text-sm font-medium text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-xl bg-[#e0e5ec] shadow-[8px_8px_16px_#bec3cf,-8px_-8px_16px_#ffffff] text-[#3d4468] font-bold text-lg hover:shadow-[deleted] active:shadow-[inset_4px_4px_8px_#bec3cf,inset_-4px_-4px_8px_#ffffff] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {loading ? 'Authenticating...' : 'Login as Admin'}
                    </button>

                    <div className="text-center mt-4">
                        <a href="/login" className="text-sm text-gray-500 hover:text-blue-600">Not an Admin? Go to User Login</a>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
