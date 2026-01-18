import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Send, ThumbsUp, MessageSquare } from 'lucide-react';

const FeedbackModal = ({ job, onClose, onSubmit }) => {
    const [survey, setSurvey] = useState({
        timeliness: 0,
        expertise: 0,
        professionalism: 0,
        honesty: 0,
        behavior: 0,
        knowledge: 0,
        respect: 0,
        overall: 0
    });

    const [recommend, setRecommend] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const payload = { ...survey, recommendationScore: recommend };
        await onSubmit(job.id, payload, comment);
        setIsSubmitting(false);
    };

    const handleRatingChange = (key, value) => {
        setSurvey(prev => ({ ...prev, [key]: value }));
    };

    const questions = [
        { id: 'timeliness', label: 'Punctuality', icon: '⏰' },
        { id: 'expertise', label: 'Expertise', icon: '🔧' },
        { id: 'professionalism', label: 'Professionalism', icon: '💼' },
        { id: 'behavior', label: 'Behavior', icon: '😊' },
        { id: 'overall', label: 'Satisfaction', icon: '⭐' },
    ];

    const StarRating = ({ value, onChange, compact = false }) => (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    className="transition-all duration-200 hover:scale-125 focus:outline-none"
                >
                    <Star
                        size={compact ? 20 : 24}
                        className={`${star <= value ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-300'}`}
                    />
                </button>
            ))}
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                // Reduced Width: max-w-lg (standard) -> max-w-md (approx 50% visual weight compared to 3xl)
                className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[85vh] relative"
            >
                {/* Glass Header */}
                <div className="bg-white/50 backdrop-blur-md px-6 py-4 border-b border-white/20 flex justify-between items-center z-10 sticky top-0">
                    <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Rate Experience
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">#{job.id.slice(-6).toUpperCase()} • {job.serviceType}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100/50 text-slate-400 hover:text-red-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Compact Question Grid */}
                        <div className="space-y-3">
                            {questions.map((q, idx) => (
                                <motion.div
                                    key={q.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="flex items-center justify-between group p-2 hover:bg-white/50 rounded-xl transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl group-hover:scale-110 transition-transform">{q.icon}</span>
                                        <span className="font-semibold text-slate-700 text-sm">{q.label}</span>
                                    </div>
                                    <StarRating value={survey[q.id]} onChange={(val) => handleRatingChange(q.id, val)} compact />
                                </motion.div>
                            ))}
                        </div>

                        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                        {/* Recommendation - Compact Slider Style */}
                        <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
                            <div className="flex items-center gap-2 mb-3">
                                <ThumbsUp size={16} className="text-indigo-600" />
                                <span className="text-sm font-bold text-slate-700">Would you recommend us?</span>
                                <span className="ml-auto bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{recommend}/10</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="10"
                                value={recommend}
                                onChange={(e) => setRecommend(parseInt(e.target.value))}
                                className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium px-1">
                                <span>No</span>
                                <span>Definitely</span>
                            </div>
                        </div>

                        {/* Comment Area */}
                        <div className="relative">
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Any additional comments?"
                                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all resize-none h-20"
                            />
                            <MessageSquare size={14} className="absolute right-3 bottom-3 text-slate-300" />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
                        >
                            {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={18} />}
                            Submit Feedback
                        </button>

                    </form>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default FeedbackModal;
