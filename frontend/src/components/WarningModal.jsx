import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useEffect } from 'react';

export default function WarningModal({ isOpen, onClose, message = "Please select at least one medication to analyse." }) {
    // Close on Escape key
    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onClose();
        if (isOpen) window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="warning-backdrop"
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ background: 'rgba(5, 5, 10, 0.8)', backdropFilter: 'blur(8px)' }}
                    onClick={onClose}
                >
                    <motion.div
                        key="warning-box"
                        onClick={(e) => e.stopPropagation()}
                        initial={{ scale: 0.5, opacity: 0, rotateX: 45 }}
                        animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                        exit={{ scale: 0.8, opacity: 0, rotateX: -45 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="relative w-full max-w-sm bg-[#0F1218] rounded-2xl border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.15)] overflow-hidden"
                    >
                        {/* Top decorative bar */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 animate-pulse" />

                        <div className="p-6 flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                                <AlertTriangle className="w-8 h-8 text-amber-500" />
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2">Selection Required</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                {message}
                            </p>

                            <button
                                onClick={onClose}
                                className="w-full py-3 rounded-xl bg-amber-500 text-black font-bold text-sm uppercase tracking-wide
                           shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]
                           hover:bg-amber-400 hover:scale-[1.02] transition-all duration-200 active:scale-95"
                            >
                                Okay, I'll select one
                            </button>
                        </div>

                        {/* Close X */}
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
