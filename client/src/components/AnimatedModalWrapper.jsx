import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.3, ease: 'easeOut' }
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.2, ease: 'easeIn' }
    }
};

const modalVariants = {
    hidden: { scale: 0.9, opacity: 0, y: 20 },
    visible: {
        scale: 1,
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 25,
            mass: 0.5
        }
    },
    exit: {
        scale: 0.95,
        opacity: 0,
        y: 10,
        transition: { duration: 0.2 }
    }
};

const AnimatedModalWrapper = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) => {
    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                        variants={backdropVariants}
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        className={`relative w-full ${maxWidth} bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden`}
                        variants={modalVariants}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        {title && (
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                    {title}
                                </h3>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        )}

                        {/* Body */}
                        <div className="p-6 overflow-y-auto max-h-[85vh]">
                            {children}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AnimatedModalWrapper;
