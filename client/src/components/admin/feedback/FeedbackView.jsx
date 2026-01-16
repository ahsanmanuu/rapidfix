
import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, MessageCircle } from 'lucide-react';
import api from '../../../services/api';
import { useSocket } from '../../../context/SocketContext';

const FeedbackView = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const socket = useSocket();

    const fetchFeedback = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/feedbacks');
            setFeedbacks(res.data.feedbacks || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedback();
        if (socket) {
            socket.on('new_feedback', fetchFeedback);
            return () => {
                socket.off('new_feedback', fetchFeedback);
            };
        }
    }, [socket]);

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-8 flex items-center gap-3">
                <Star className="text-amber-500" /> User Feedback
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-10 text-slate-400">Loading feedback...</div>
                ) : feedbacks.length === 0 ? (
                    <div className="col-span-full py-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200">
                        <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No feedback received yet</p>
                    </div>
                ) : (
                    feedbacks.map(f => (
                        <div key={f.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                    {f.userId ? f.userId.slice(0, 2).toUpperCase() : 'U'}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">Job #{f.jobId?.slice(0, 6)}</p>
                                    <p className="text-[10px] text-slate-400">Tech: {f.technicianId}</p>
                                </div>
                                <div className="ml-auto flex items-center gap-1 text-amber-500 text-sm font-bold">
                                    <Star size={14} fill="currentColor" />
                                    {/* Average rating from details if available, else generic */}
                                    {f.ratings ? (Object.values(f.ratings).reduce((a, b) => a + b, 0) / Object.values(f.ratings).length).toFixed(1) : 5.0}
                                </div>
                            </div>

                            <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 italic">"{f.comment || 'No comment'}"</p>

                            <div className="text-xs text-slate-400 pt-3 border-t border-slate-50 dark:border-slate-700 flex justify-between">
                                <span>{new Date(f.createdAt || Date.now()).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default FeedbackView;
