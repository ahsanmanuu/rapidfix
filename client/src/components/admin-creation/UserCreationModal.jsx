import React, { useState } from 'react';
import { X, Loader2, MapPin, User, Mail, Phone, Lock } from 'lucide-react';
import api from '../../services/api';

const UserCreationModal = ({ isOpen, onClose, onCreated }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        location: '' // City or Address string
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/superadmin/create-user', formData);
            if (res.data.success) {
                onCreated(res.data.user);
                onClose();
                setFormData({ name: '', email: '', phone: '', password: '', location: '' });
            }
        } catch (err) {
            alert('Failed to create user: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-700 overflow-hidden transform transition-all scale-100 opacity-100">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <User className="text-blue-500" /> Create New User
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-slate-500" size={16} />
                                <input
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Phone</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 text-slate-500" size={16} />
                                <input
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    placeholder="+91..."
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-slate-500" size={16} />
                            <input
                                type="email"
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                                placeholder="john@example.com"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-slate-500" size={16} />
                            <input
                                type="text"
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                                placeholder="Secret123"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">Location (City/Address)</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 text-slate-500" size={16} />
                            <input
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                                placeholder="New York, NY"
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                required
                            />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">We'll attempt to geocode this address automatically.</p>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-900/40 transition-all transform hover:scale-[1.02] flex justify-center items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserCreationModal;
