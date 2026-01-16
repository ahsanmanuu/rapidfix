
import React, { useState, useEffect } from 'react';
import { MessageSquareQuote, Trash2, CheckCircle, XCircle } from 'lucide-react';
import api from '../../../services/api';

const TestimonialManager = () => {
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTestimonials = async () => {
        setLoading(true);
        try {
            const res = await api.get('/testimonials');
            setTestimonials(res.data.testimonials || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTestimonials();
    }, []);

    const handleDelete = async (id) => {
        if (!confirm('Delete this testimonial?')) return;
        try {
            await api.delete(`/testimonials/${id}`);
            setTestimonials(testimonials.filter(t => t.id !== id));
        } catch (err) {
            alert('Failed to delete testimonial');
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-8 flex items-center gap-3">
                <MessageSquareQuote className="text-purple-500" /> Testimonials
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-10 text-slate-400">Loading...</div>
                ) : testimonials.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                        <MessageSquareQuote className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 dark:text-slate-400 font-medium">No testimonials yet</p>
                    </div>
                ) : (
                    testimonials.map(t => (
                        <div key={t.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col relative group hover:shadow-lg transition-all">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                    {(t.author || 'A').charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 dark:text-white">{t.author}</h4>
                                    <div className="flex text-amber-400 text-xs">
                                        {'★'.repeat(t.rating || 5)}
                                    </div>
                                </div>
                            </div>

                            <p className="text-slate-600 dark:text-slate-300 text-sm italic mb-4 flex-1">"{t.content}"</p>

                            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-700 mt-auto">
                                <span className="text-xs text-slate-400">{new Date(t.created_at).toLocaleDateString()}</span>
                                <button
                                    onClick={() => handleDelete(t.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            {/* Status Indicator (Mock) */}
                            <div className="absolute top-4 right-4 text-emerald-500">
                                <CheckCircle size={16} />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TestimonialManager;
