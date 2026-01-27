import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

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
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="relative z-10 text-center"
                    >
                        <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none"></div>

                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                            className="relative size-24 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 mx-auto flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.4)] mb-8 ring-4 ring-emerald-500/20"
                        >
                            <CheckCircle2 size={48} className="text-white drop-shadow-md" strokeWidth={2.5} />
                        </motion.div>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative"
                        >
                            <h2 className="text-4xl font-black text-white mb-2 tracking-tight">
                                Welcome Aboard!
                            </h2>
                            <div className="h-1 w-20 bg-emerald-500/50 rounded-full mx-auto mb-4"></div>
                            <p className="text-lg text-slate-300 font-medium">
                                Registration Successful.<br />
                                <span className="text-emerald-400 text-sm font-bold uppercase tracking-widest mt-2 block animate-pulse">Redirecting to Dashboard...</span>
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default SuccessModal;
