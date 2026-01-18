import React, { useState, useEffect } from 'react';
import {
    Search, Filter, ChevronDown, ChevronUp, Star,
    MessageSquare, ThumbsUp, Calendar, User, Wrench
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../services/api';
import { useSocket } from '../../../context/SocketContext';

const FeedbackTable = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRow, setExpandedRow] = useState(null);
    const socket = useSocket();

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    useEffect(() => {
        if (socket) {
            socket.on('admin_feedback_update', (newFeedback) => {
                setFeedbacks(prev => [newFeedback, ...prev]);
            });
            return () => socket.off('admin_feedback_update');
        }
    }, [socket]);

    const fetchFeedbacks = async () => {
        try {
            const res = await api.get('/feedback');
            if (res.data.success) {
                setFeedbacks(res.data.feedbacks.reverse()); // Newest first
            }
        } catch (error) {
            console.error("Failed to fetch feedbacks", error);
        }
    };

    const toggleRow = (id) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    // Filter logic
    const filteredFeedbacks = feedbacks.filter(fb =>
        fb.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fb.technicianId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fb.jobId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Helper for Rating Grid
    const RatingMetric = ({ label, value, icon }) => (
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center gap-2 text-slate-600 font-medium">
                <span>{icon}</span>
                <span>{label}</span>
            </div>
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                    <Star
                        key={star}
                        size={14}
                        className={star <= value ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}
                    />
                ))}
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header / Filter */}
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Star className="text-amber-500" size={20} />
                    Customer Feedback
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">{feedbacks.length}</span>
                </h3>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by User, Tech, or Job ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
                            <th className="p-4">User</th>
                            <th className="p-4">Technician</th>
                            <th className="p-4">Job Info</th>
                            <th className="p-4 text-center">Overall</th>
                            <th className="p-4 text-center">Recommend</th>
                            <th className="p-4 text-right">Date</th>
                            <th className="p-4 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredFeedbacks.length > 0 ? filteredFeedbacks.map((fb) => (
                            <React.Fragment key={fb.id}>
                                <tr className="hover:bg-slate-50/80 transition-colors cursor-pointer group" onClick={() => toggleRow(fb.id)}>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                {fb.userName ? fb.userName.charAt(0) : <User size={14} />}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-700 text-sm">{fb.userName || 'Unknown User'}</div>
                                                <div className="text-xs text-slate-400">{fb.userPhone || 'N/A'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Wrench size={14} className="text-slate-400" />
                                            {/* Ideally fetch tech name or store it in metadata. For now ID */}
                                            <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                                                {fb.technicianId?.slice(0, 8)}...
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                                            {fb.jobId ? `#${fb.jobId.slice(0, 6)}` : 'N/A'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-full text-xs font-bold border border-amber-100">
                                            <Star size={12} className="fill-amber-500 text-amber-500" />
                                            {fb.ratings?.overall || 0}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border ${fb.recommendationScore >= 8 ? 'bg-green-50 text-green-700 border-green-100' :
                                                fb.recommendationScore >= 5 ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                                    'bg-red-50 text-red-700 border-red-100'
                                            }`}>
                                            <ThumbsUp size={12} />
                                            {fb.recommendationScore}/10
                                        </div>
                                    </td>
                                    <td className="p-4 text-right text-xs text-slate-400">
                                        {format(new Date(fb.createdAt), 'MMM d, h:mm a')}
                                    </td>
                                    <td className="p-4 text-center text-slate-400">
                                        {expandedRow === fb.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </td>
                                </tr>
                                {/* Expanded Details */}
                                <AnimatePresence>
                                    {expandedRow === fb.id && (
                                        <tr>
                                            <td colSpan="7" className="p-0 border-b border-blue-50/50">
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="bg-slate-50/30 overflow-hidden"
                                                >
                                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {/* Metrics Grid */}
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            <RatingMetric label="Timeliness" icon="⏰" value={fb.ratings.timeliness} />
                                                            <RatingMetric label="Expertise" icon="🔧" value={fb.ratings.expertise} />
                                                            <RatingMetric label="Professionalism" icon="💼" value={fb.ratings.professionalism} />
                                                            <RatingMetric label="Knowledge" icon="🧠" value={fb.ratings.knowledge} />
                                                            <RatingMetric label="Behavior" icon="😊" value={fb.ratings.behavior} />
                                                            <RatingMetric label="Honesty" icon="🤝" value={fb.ratings.honesty} />
                                                            <RatingMetric label="Respect" icon="🙏" value={fb.ratings.respect} />
                                                            <RatingMetric label="Overall" icon="⭐" value={fb.ratings.overall} />
                                                        </div>

                                                        {/* Comment Section */}
                                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                                                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                                                                <MessageSquare size={14} /> User Comment
                                                            </h4>
                                                            <p className="text-slate-600 text-sm italic leading-relaxed flex-1">
                                                                "{fb.comment || 'No additional comments provided.'}"
                                                            </p>
                                                            {fb.recommendationScore < 5 && (
                                                                <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 font-medium">
                                                                    ⚠️ Low recommendation score. Follow up required.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </td>
                                        </tr>
                                    )}
                                </AnimatePresence>
                            </React.Fragment>
                        )) : (
                            <tr>
                                <td colSpan="7" className="p-8 text-center text-slate-400">
                                    No feedback records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FeedbackTable;
