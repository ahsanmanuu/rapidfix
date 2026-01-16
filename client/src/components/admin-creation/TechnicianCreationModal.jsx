import React, { useState } from 'react';
import { X, Loader2, MapPin, Wrench, Mail, Phone, Lock, Hash } from 'lucide-react';
import api from '../../services/api';

const TechnicianCreationModal = ({ isOpen, onClose, onCreated }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        serviceType: 'Plumber',
        location: '', // City/Address
        experience: '2'
    });

    const serviceTypes = [
        "Plumber", "Electrician", "Painter", "Carpenter",
        "A.C. Technician", "RO Technician", "CCTV Technician"
    ];

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/admin/technicians', {
                ...formData,
                addressDetails: formData.location // Mapping for simplicity
            });
            if (res.data.success) {
                onCreated(res.data.technician);
                onClose();
                setFormData({
                    name: '', email: '', phone: '', password: '',
                    serviceType: 'Plumber', location: '', experience: '2'
                });
            }
        } catch (err) {
            alert('Failed to create technician: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Wrench className="text-emerald-500" /> Create New Technician
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Full Name</label>
                            <input
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                                placeholder="Technician Name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Phone</label>
                            <input
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                                placeholder="+91..."
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Email Address</label>
                            <input
                                type="email"
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                                placeholder="tech@example.com"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Password</label>
                            <input
                                type="text"
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                                placeholder="Secret123"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Service Type</label>
                            <select
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition appearance-none"
                                value={formData.serviceType}
                                onChange={e => setFormData({ ...formData, serviceType: e.target.value })}
                            >
                                {serviceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Experience (Years)</label>
                            <input
                                type="number"
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                                value={formData.experience}
                                onChange={e => setFormData({ ...formData, experience: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">Base Location (City/Address)</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 text-slate-500" size={16} />
                            <input
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 px-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                                placeholder="Downtown, City Center"
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                required
                            />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">We'll register this as their home base for geospatial searches.</p>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-900/40 transition-all transform hover:scale-[1.02] flex justify-center items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'Create Technician'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TechnicianCreationModal;
