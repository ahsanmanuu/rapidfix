import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Send, ThumbsUp, MessageSquare, ArrowRight, ArrowLeft } from 'lucide-react';

const FeedbackModal = ({ job, onClose, onSubmit }) => {
    // Restored full state for all fields
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
    const [step, setStep] = useState(1); // 1: Performance, 2: Ethics, 3: Review

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

    const steps = {
        1: {
            title: "Performance",
            questions: [
                { id: 'timeliness', label: 'Timeliness', icon: '⏰' },
                { id: 'expertise', label: 'Expertise', icon: '🔧' },
                { id: 'professionalism', label: 'Professionalism', icon: '💼' },
                { id: 'knowledge', label: 'Knowledge', icon: '🧠' }
            ]
        },
        2: {
            title: "Experience",
            questions: [
                { id: 'behavior', label: 'Behavior', icon: '😊' },
                { id: 'honesty', label: 'Honesty', icon: '🤝' },
                { id: 'respect', label: 'Respect', icon: '🙏' },
                { id: 'overall', label: 'Overall', icon: '⭐' }
            ]
        }
    };

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
                        size={compact ? 22 : 26}
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
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl overflow-hidden flex flex-col relative"
                style={{ height: '520px' }} // Fixed height for consistency during transitions
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white/50 backdrop-blur-md">
                    <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {step === 3 ? "Final Thoughts" : `Rate ${steps[step]?.title}`}
                        </h2>
                        <div className="flex gap-1 mt-1">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i <= step ? 'w-6 bg-blue-500' : 'w-2 bg-slate-200'}`} />
                            ))}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden relative p-6">
                    <AnimatePresence mode="wait">
                        {step < 3 ? (
                            <motion.div
                                key={`step-${step}`}
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-4"
                            >
                                {steps[step].questions.map((q, idx) => (
                                    <motion.div
                                        key={q.id}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="bg-white/50 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-white transition-all shadow-sm"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{q.icon}</span>
                                                <span className="font-semibold text-slate-700 text-sm">{q.label}</span>
                                            </div>
                                            <StarRating value={survey[q.id]} onChange={(val) => handleRatingChange(q.id, val)} compact />
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="step-3"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-6 h-full"
                            >
                                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100">
                                    <div className="flex items-center gap-2 mb-4">
                                        <ThumbsUp size={18} className="text-indigo-600" />
                                        <span className="font-bold text-slate-700">Would you recommend us?</span>
                                        <span className="ml-auto bg-indigo-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">{recommend}/10</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="10"
                                        value={recommend}
                                        onChange={(e) => setRecommend(parseInt(e.target.value))}
                                        className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                                        <span>Not Likely</span>
                                        <span>Very Likely</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                                        <MessageSquare size={14} />
                                        Any comments? (Optional)
                                    </label>
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                                        placeholder="Tell us more about your experience..."
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-100 bg-white/50 backdrop-blur-md flex gap-3">
                    {step > 1 && (
                        <button
                            onClick={() => setStep(s => s - 1)}
                            className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}

                    {step < 3 ? (
                        <button
                            onClick={() => setStep(s => s + 1)}
                            className="flex-1 bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                        >
                            Next <ArrowRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>Submit Feedback <Send size={18} /></>
                            )}
                        </button>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default FeedbackModal;
