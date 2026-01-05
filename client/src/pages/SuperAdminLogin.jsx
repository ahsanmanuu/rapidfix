import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/neu-styles.css';

const SuperAdminLogin = ({ setUser }) => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await api.post('/superadmin/login', { email, password });
            if (res.data.success) {
                const adminUser = { ...res.data.superadmin, role: 'superadmin' };
                localStorage.setItem('user', JSON.stringify(adminUser));
                localStorage.setItem('sessionToken', 'dummy-super-token');

                if (setUser) setUser(adminUser);

                // Redirect to super dashboard (using admin dashboard for now, or new one)
                navigate('/admin-dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Authentication Failed. Access Denied.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="neu-body flex items-center justify-center min-h-screen bg-slate-900">
            <div className="login-card w-full max-w-md p-8 bg-slate-800 rounded-3xl shadow-2xl border border-slate-700">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-red-500 tracking-wider">SUPER ADMIN</h2>
                    <p className="text-gray-400 mt-2 text-sm uppercase tracking-widest">Top Level Clearance</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="form-group">
                        <label className="block text-sm font-bold text-gray-400 mb-2">Secure ID</label>
                        <input
                            type="email"
                            className="w-full p-4 rounded-xl bg-slate-900 text-white border border-slate-700 focus:border-red-500 focus:outline-none transition-all"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="block text-sm font-bold text-gray-400 mb-2">Passcode</label>
                        <input
                            type="password"
                            className="w-full p-4 rounded-xl bg-slate-900 text-white border border-slate-700 focus:border-red-500 focus:outline-none transition-all"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-900/30 border border-red-500/50 text-red-400 text-sm font-medium text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-lg shadow-lg shadow-red-900/50 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Verifying...' : 'Access Control'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SuperAdminLogin;
