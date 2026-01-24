import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

const toastVariants = {
    initial: { opacity: 0, y: -20, scale: 0.9 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};

const ToastItem = ({ id, message, type, onClose }) => {
    const bgColors = {
        success: 'bg-emerald-500',
        error: 'bg-red-500',
        warning: 'bg-amber-500',
        info: 'bg-blue-500'
    };

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
        error: <AlertCircle className="w-5 h-5 text-red-500" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />
    };

    return (
        <motion.div
            layout
            variants={toastVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex items-center w-full max-w-sm w-96 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 pointer-events-auto overflow-hidden mb-3"
            role="alert"
        >
            <div className={`w-2 self-stretch ${bgColors[type]}`} />
            <div className="flex-1 p-4 flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{icons[type]}</div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white leading-5">
                        {message}
                    </p>
                </div>
                <button
                    onClick={() => onClose(id)}
                    className="shrink-0 ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                    <X size={18} />
                </button>
            </div>
        </motion.div>
    );
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);

        if (duration) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const success = (msg, duration) => addToast(msg, 'success', duration);
    const error = (msg, duration) => addToast(msg, 'error', duration);
    const warning = (msg, duration) => addToast(msg, 'warning', duration);
    const info = (msg, duration) => addToast(msg, 'info', duration);

    return (
        <ToastContext.Provider value={{ success, error, warning, info }}>
            {children}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col items-end pointer-events-none p-4 gap-2">
                <AnimatePresence mode='popLayout'>
                    {toasts.map(toast => (
                        <ToastItem
                            key={toast.id}
                            {...toast}
                            onClose={removeToast}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};
