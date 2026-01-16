
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Tag, Loader2 } from 'lucide-react';
import api from '../../../services/api';

const OfferManager = () => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        discountPercentage: '',
        validUntil: ''
    });

    const fetchOffers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/offers');
            setOffers(res.data.offers || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOffers();
    }, []);

    const handleDelete = async (id) => {
        if (!confirm('Are you sure?')) return;
        try {
            await api.delete(`/offers/${id}`);
            setOffers(offers.filter(o => o.id !== id));
        } catch (err) {
            alert('Failed to delete offer');
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await api.post('/offers', formData);
            if (res.data.success) {
                setOffers([res.data.offer, ...offers]);
                setFormData({ title: '', description: '', discountPercentage: '', validUntil: '' });
                alert('Offer created!');
            }
        } catch (err) {
            alert('Failed to create offer');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-8 flex items-center gap-3">
                <Tag className="text-blue-500" /> Offer Management
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Form */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 h-fit">
                    <h3 className="text-xl font-bold mb-4 dark:text-gray-200">Create New Offer</h3>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                            <input
                                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-blue-500 transition"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                required
                                placeholder="Summer Sale"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                            <textarea
                                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-blue-500 transition resize-none h-24"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                required
                                placeholder="Get 20% off on all plumbing services..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Discount %</label>
                                <input
                                    type="number"
                                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    value={formData.discountPercentage}
                                    onChange={e => setFormData({ ...formData, discountPercentage: e.target.value })}
                                    required
                                    placeholder="20"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valid Until</label>
                                <input
                                    type="date"
                                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-blue-500 transition text-slate-600 dark:text-gray-300"
                                    value={formData.validUntil}
                                    onChange={e => setFormData({ ...formData, validUntil: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={creating}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex justify-center items-center gap-2 mt-2"
                        >
                            {creating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                            Publish Offer
                        </button>
                    </form>
                </div>

                {/* Offer List */}
                <div className="lg:col-span-2 space-y-4">
                    {loading ? (
                        <div className="text-center py-10 text-slate-400">Loading Offers...</div>
                    ) : offers.length === 0 ? (
                        <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                            <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 dark:text-slate-400 font-medium">No active offers</p>
                        </div>
                    ) : (
                        offers.map(offer => (
                            <div key={offer.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex justify-between items-center group hover:shadow-md transition-all">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className="text-lg font-bold text-slate-800 dark:text-white">{offer.title}</h4>
                                        <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-2 py-0.5 rounded-md uppercase tracking-wide">
                                            {offer.discountPercentage}% OFF
                                        </span>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">{offer.description}</p>
                                    <p className="text-xs text-slate-400 font-medium">Expires: {new Date(offer.validUntil).toLocaleDateString()}</p>
                                </div>
                                <button
                                    onClick={() => handleDelete(offer.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default OfferManager;
