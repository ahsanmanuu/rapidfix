import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const SuccessModal = ({ isOpen, onComplete }) => {
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onComplete();
            }, 2500); // Auto redirect after 2.5s
            return () => clearTimeout(timer);
        }
    }, [isOpen, onComplete]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md"
                    />

                    {/* Content */}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", damping: 15 }}
                        className="relative z-10 text-center"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                            className="w-24 h-24 rounded-full bg-emerald-500 mx-auto flex items-center justify-center shadow-2xl shadow-emerald-500/40 mb-6"
                        >
                            <CheckCircle size={50} className="text-white" strokeWidth={3} />
                        </motion.div>

                        <motion.h2
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white mb-4 tracking-tight"
                        >
                            Welcome Aboard!
                        </motion.h2>

                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-lg text-slate-500 dark:text-slate-400 font-medium"
                        >
                            Registration Successful.<br />Redirecting to Dashboard...
                        </motion.p>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default SuccessModal;
