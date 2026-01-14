import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Send, ThumbsUp } from 'lucide-react';

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

        const payload = {
            ...survey,
            recommendationScore: recommend
        };

        await onSubmit(job.id, payload, comment);
        setIsSubmitting(false);
    };

    const handleRatingChange = (key, value) => {
        setSurvey(prev => ({ ...prev, [key]: value }));
    };

    const questions = [
        { id: 'timeliness', label: 'Timeliness', question: 'Was the technician punctual?', icon: '⏰' },
        { id: 'expertise', label: 'Expertise', question: 'Did they show good technical skills?', icon: '🔧' },
        { id: 'professionalism', label: 'Professionalism', question: 'Was the interaction professional?', icon: '💼' },
        { id: 'honesty', label: 'Honesty', question: 'Was the pricing and service honest?', icon: '🤝' },
        { id: 'behavior', label: 'Behavior', question: 'Was their behavior appropriate?', icon: '😊' },
        { id: 'knowledge', label: 'Knowledge', question: 'Did they answer your questions well?', icon: '🧠' },
        { id: 'respect', label: 'Respect', question: 'Did they treat you with respect?', icon: '🙏' },
        { id: 'overall', label: 'Overall', question: 'Your overall satisfaction?', icon: '⭐' },
    ];

    const StarRating = ({ value, onChange }) => {
        return (
            <div className="flex gap-1 md:gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        className="transition-all duration-200 hover:scale-110 focus:outline-none touch-action-manipulation"
                    >
                        <Star
                            size={28}
                            className={`md:w-7 md:h-7 ${star <= value
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'fill-none text-slate-300 hover:text-amber-200'
                                }`}
                        />
                    </button>
                ))}
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-end md:items-center justify-center bg-slate-900/70 backdrop-blur-sm p-0 md:p-4"
        >
            <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-white w-full md:max-w-3xl max-h-[95vh] md:max-h-[90vh] overflow-hidden rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col relative"
            >
                {/* Header */}
                <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-purple-600 px-4 md:px-6 py-4 md:py-5 flex justify-between items-center shadow-lg">
                    <div className="flex-1">
                        <h2 className="text-white text-lg md:text-xl font-bold">Service Feedback</h2>
                        <p className="text-blue-100 text-xs md:text-sm mt-0.5">
                            {job.serviceType} • Job #{job.id.slice(-6).toUpperCase()}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all duration-200 hover:rotate-90"
                    >
                        <X size={20} className="md:w-6 md:h-6" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-5">
                    {/* Rating Questions Grid */}
                    <div className="space-y-3 md:space-y-4">
                        {questions.map((q) => (
                            <motion.div
                                key={q.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: questions.indexOf(q) * 0.05 }}
                                className="bg-slate-50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-200 hover:border-blue-300 transition-all"
                            >
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="flex items-center gap-2 flex-1">
                                        <span className="text-2xl md:text-3xl">{q.icon}</span>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-sm md:text-base">{q.label}</h4>
                                            <p className="text-xs md:text-sm text-slate-500 mt-0.5">{q.question}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end mt-2">
                                    <StarRating
                                        value={survey[q.id]}
                                        onChange={(val) => handleRatingChange(q.id, val)}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Recommendation Score */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 md:p-5 rounded-xl md:rounded-2xl border-2 border-blue-200">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <ThumbsUp className="text-blue-600" size={20} />
                                <h4 className="font-bold text-slate-800 text-sm md:text-base">Would you recommend us?</h4>
                            </div>
                            <span className="text-xs md:text-sm font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                                {recommend}/10
                            </span>
                        </div>
                        <div className="flex flex-wrap justify-center gap-1.5 md:gap-2">
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => setRecommend(num)}
                                    className={`min-w-[36px] md:min-w-[40px] h-9 md:h-10 px-2 md:px-3 rounded-lg flex items-center justify-center text-xs md:text-sm font-bold transition-all duration-200 touch-action-manipulation ${recommend === num
                                            ? 'bg-blue-600 text-white shadow-lg scale-110 ring-2 ring-blue-300'
                                            : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-blue-300 hover:shadow-md'
                                        }`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-between text-[10px] md:text-xs text-slate-500 mt-2 px-1 font-medium">
                            <span>Not Likely</span>
                            <span>Very Likely</span>
                        </div>
                    </div>

                    {/* Comments */}
                    <div>
                        <label className="block text-sm md:text-base font-bold text-slate-700 mb-2">
                            Additional Comments (Optional)
                        </label>
                        <textarea
                            className="w-full px-3 md:px-4 py-2 md:py-3 rounded-xl bg-slate-50 border-2 border-slate-200 text-slate-700 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                            rows="3"
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            placeholder="Share any additional thoughts..."
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 md:py-3.5 rounded-xl border-2 border-slate-300 text-slate-700 font-bold text-sm md:text-base hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-[2] px-4 py-3 md:py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-sm md:text-base hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send size={18} />
                                    Submit Feedback
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default FeedbackModal;
