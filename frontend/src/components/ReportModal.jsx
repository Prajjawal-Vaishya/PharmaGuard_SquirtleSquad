import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Copy, Check, Dna, Sparkles, Lightbulb, FileJson } from 'lucide-react';

/* ─── Mock AI Content ─── */
const MOCK_INSIGHTS = {
    summary: "The patient carries two non-functional alleles (Poor Metabolizer). This genotype results in significantly reduced enzyme activity, leading to elevated plasma drug concentrations and a 3-4x increased risk of toxicity or adverse drug reactions. Standard dosing is likely to be unsafe.",
    suggestion: "Consider alternative therapeutic agents that are not metabolized by this pathway. If this drug is necessary, initiate at 50% of the standard starting dose and monitor plasma levels/biomarkers closely for the first 4 weeks."
};

export default function ReportModal({ data, onClose }) {
    /* Data: { drug, gene, risk, badge } */
    const [copied, setCopied] = useState(false);

    /* Keyboard Close */
    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    /* Copy Action */
    const handleCopy = () => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    /* Download Action */
    const handleDownload = () => {
        /* Mock download */
        console.log("Downloading JSON...");
    };

    /* Colors based on Risk */
    const accentColor = data.risk === 'HIGH' ? 'text-crimson' : data.risk === 'MODERATE' ? 'text-amber' : 'text-teal';
    const borderColor = data.risk === 'HIGH' ? 'border-crimson' : data.risk === 'MODERATE' ? 'border-amber' : 'border-teal';
    const bgGlow = data.risk === 'HIGH' ? 'shadow-crimson/10' : data.risk === 'MODERATE' ? 'shadow-amber/10' : 'shadow-teal/10';

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ background: 'rgba(5, 5, 5, 0.6)', backdropFilter: 'blur(12px)' }}
                onClick={onClose}
            >
                <motion.div
                    onClick={(e) => e.stopPropagation()}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className={`
            w-full max-w-2xl bg-midnight-card border ${borderColor}/30 rounded-2xl 
            shadow-2xl ${bgGlow} overflow-hidden flex flex-col max-h-[90vh]
          `}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/50">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center border border-slate-700`}>
                                <Dna className={`w-5 h-5 ${accentColor}`} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    {data.drug}
                                    <span className="text-slate-500 font-normal">/</span>
                                    <span className={`${accentColor}`}>{data.gene}</span>
                                </h3>
                                <span className={`text-[10px] font-bold tracking-widest px-2 py-0.5 rounded ml-px border ${borderColor}/30 bg-white/5 ${accentColor}`}>
                                    {data.risk} RISK
                                </span>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-6 overflow-y-auto">

                        {/* Gemini Insights Box */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-teal" />
                                Gemini Clinical Summary
                            </h4>
                            <div className="p-4 rounded-xl bg-gradient-to-br from-teal/5 to-transparent border-l-2 border-teal relative">
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    {MOCK_INSIGHTS.summary}
                                </p>
                                <div className="absolute top-0 right-0 p-2 opacity-20">
                                    <Dna className="w-12 h-12 text-teal" />
                                </div>
                            </div>
                        </div>

                        {/* Actionable Suggestions */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                                <Lightbulb className="w-4 h-4 text-amber" />
                                Actionable AI Suggestions
                            </h4>
                            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                                <ul className="list-disc list-inside space-y-2 text-sm text-slate-400">
                                    <li>{MOCK_INSIGHTS.suggestion}</li>
                                    <li>Monitor INR every 48 hours.</li>
                                </ul>
                            </div>
                        </div>

                    </div>

                    {/* Footer */}
                    <div className="p-5 border-t border-slate-800/50 bg-slate-900/30 flex gap-4">
                        <button
                            onClick={handleDownload}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-teal text-midnight font-bold hover:bg-teal/90 hover:scale-[1.02] transition-all active:scale-95"
                        >
                            <Download className="w-4 h-4" />
                            Download JSON Report
                        </button>
                        <button
                            onClick={handleCopy}
                            className="px-6 flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-700 text-slate-300 font-medium hover:border-slate-500 hover:text-white transition-colors bg-midnight"
                        >
                            {copied ? <Check className="w-4 h-4 text-teal" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    </div>

                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
