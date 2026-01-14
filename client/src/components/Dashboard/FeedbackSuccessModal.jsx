import { motion } from 'framer-motion';
import { CheckCircle, X, Star } from 'lucide-react';
import { useEffect } from 'react';

const FeedbackSuccessModal = ({ isOpen, onClose, rating }) => {
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 50 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-sm w-full relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50 opacity-50" />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center text-center">
                    {/* Success Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="mb-4"
                    >
                        <div className="relative">
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-40"
                            />
                            <div className="relative bg-gradient-to-br from-green-400 to-emerald-500 p-4 rounded-full">
                                <CheckCircle size={48} className="text-white" strokeWidth={2.5} />
                            </div>
                        </div>
                    </motion.div>

                    {/* Title */}
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-2xl md:text-3xl font-bold text-slate-800 mb-2"
                    >
                        Thank You!
                    </motion.h2>

                    {/* Message */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-slate-600 text-sm md:text-base mb-4"
                    >
                        Your feedback has been submitted successfully
                    </motion.p>

                    {/* Rating Display */}
                    {rating && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                            className="flex items-center gap-2 mb-6 bg-amber-50 px-4 py-2 rounded-full border-2 border-amber-200"
                        >
                            <Star className="text-amber-500 fill-amber-500" size={20} />
                            <span className="font-bold text-amber-700">{rating}/5 Stars</span>
                        </motion.div>
                    )}

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    {/* Auto-close indicator */}
                    <motion.div
                        initial={{ width: '100%' }}
                        animate={{ width: '0%' }}
                        transition={{ duration: 3, ease: 'linear' }}
                        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-green-400 to-blue-500"
                    />
                </div>
            </motion.div>
        </motion.div>
    );
};

export default FeedbackSuccessModal;
