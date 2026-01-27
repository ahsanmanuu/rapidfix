import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

const LocationAuthModal = ({ isOpen, onConfirm }) => {
    const [isChecked, setIsChecked] = useState(false);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                >
                    {/* Background Effects */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative z-10 p-8 text-center space-y-6">
                        <div className="size-20 bg-gradient-to-br from-rose-500/20 to-pink-600/20 rounded-2xl flex items-center justify-center mx-auto ring-1 ring-rose-500/30 shadow-lg shadow-rose-500/10">
                            <MapPin size={40} className="text-rose-400" strokeWidth={1.5} />
                        </div>

                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
                                Location Access Required
                            </h2>
                            <p className="text-sm font-medium text-slate-400 mt-3 leading-relaxed">
                                Please register from your <strong className="text-rose-400">Original Work Place</strong>.
                                Accurate location is mandatory for job assignments.
                            </p>
                        </div>

                        <div
                            onClick={() => setIsChecked(!isChecked)}
                            className={`
                                cursor-pointer group rounded-xl p-4 border transition-all duration-300 text-left flex gap-3
                                ${isChecked
                                    ? 'bg-rose-500/10 border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.1)]'
                                    : 'bg-slate-800/50 border-white/5 hover:border-white/10'
                                }
                            `}
                        >
                            <div className={`
                                shrink-0 size-6 rounded-full border-2 flex items-center justify-center transition-all duration-300
                                ${isChecked ? 'bg-rose-500 border-rose-500' : 'border-slate-600 group-hover:border-slate-500'}
                            `}>
                                {isChecked && <CheckCircle2 size={14} className="text-white" strokeWidth={3} />}
                            </div>
                            <p className={`text-xs font-bold leading-relaxed transition-colors ${isChecked ? 'text-slate-200' : 'text-slate-500 group-hover:text-slate-400'}`}>
                                I agree to the Partner Terms & Conditions and certify that I am currently at my base of operations.
                            </p>
                        </div>

                        <button
                            onClick={() => isChecked && onConfirm()}
                            disabled={!isChecked}
                            className={`
                                w-full py-4 rounded-xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300
                                ${isChecked
                                    ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg shadow-rose-600/20 hover:shadow-rose-600/30 transform hover:scale-[1.02] active:scale-[0.98]'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                            `}
                        >
                            <ShieldCheck size={18} />
                            Enable & Proceed
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default LocationAuthModal;
