import React, { useState } from 'react';
import { Loader2, MapPin, Wrench } from 'lucide-react';
import api from '../../services/api';
import AnimatedModalWrapper from '../AnimatedModalWrapper';
import { useToast } from '../ToastSystem';

const TechnicianCreationModal = ({ isOpen, onClose, onCreated }) => {
    const { success, error } = useToast();
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
                success('Technician created successfully!');
                onClose();
                setFormData({
                    name: '', email: '', phone: '', password: '',
                    serviceType: 'Plumber', location: '', experience: '2'
                });
            }
        } catch (err) {
            error('Failed to create technician: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatedModalWrapper
            isOpen={isOpen}
            onClose={onClose}
            title={
                <span className="flex items-center gap-2">
                    <Wrench className="text-emerald-500" /> Create New Technician
                </span>
            }
            maxWidth="max-w-2xl"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">Full Name</label>
                        <input
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                            placeholder="Technician Name"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">Phone</label>
                        <input
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
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
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
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
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                            placeholder="Secret123"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">Service Type</label>
                        <select
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition appearance-none"
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
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
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
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
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
        </AnimatedModalWrapper>
    );
};

export default TechnicianCreationModal;
