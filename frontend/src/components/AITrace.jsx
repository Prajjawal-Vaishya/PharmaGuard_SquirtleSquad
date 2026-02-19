import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Search, BookOpen, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';

const TRACE_STEPS = [
    {
        icon: Search,
        title: 'VCF Parse Complete',
        detail: 'Extracted 6 pharmacogenes from patient VCF input.',
        color: 'text-teal',
        borderColor: 'border-teal/30',
        bgColor: 'bg-teal/10',
        time: '0.12s',
    },
    {
        icon: BookOpen,
        title: 'CPIC Guideline Match',
        detail: 'Matched CYP2D6 *4/*4 → Poor Metabolizer phenotype.',
        color: 'text-teal',
        borderColor: 'border-teal/30',
        bgColor: 'bg-teal/10',
        time: '0.34s',
    },
    {
        icon: AlertTriangle,
        title: 'Interaction Flagged',
        detail: 'Tamoxifen efficacy significantly reduced with CYP2D6 PM.',
        color: 'text-orange',
        borderColor: 'border-orange/30',
        bgColor: 'bg-orange/10',
        time: '0.51s',
    },
    {
        icon: BrainCircuit,
        title: 'LLM Reasoning',
        detail: 'Gemini generated clinical explanation and alternative therapy suggestions.',
        color: 'text-teal',
        borderColor: 'border-teal/30',
        bgColor: 'bg-teal/10',
        time: '1.20s',
    },
    {
        icon: CheckCircle,
        title: 'Risk Classification',
        detail: 'Assigned HIGH risk to Tamoxifen, MODERATE to Clopidogrel.',
        color: 'text-danger',
        borderColor: 'border-danger/30',
        bgColor: 'bg-danger/10',
        time: '1.22s',
    },
    {
        icon: Sparkles,
        title: 'Report Generated',
        detail: 'Clinical risk matrix and recommendation report ready.',
        color: 'text-teal',
        borderColor: 'border-teal/30',
        bgColor: 'bg-teal/10',
        time: '1.45s',
    },
];

export default function AITrace({ isScanning }) {
    return (
        <aside aria-label="Explainable AI Trace" className="glass-card p-5 relative overflow-hidden h-full flex flex-col">
            {/* Scan overlay */}
            <AnimatePresence>
                {isScanning && (
                    <motion.div
                        className="absolute inset-0 z-10 pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="absolute inset-0 bg-teal/5" />
                        <div className="scan-line absolute left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-teal to-transparent shadow-[0_0_15px_var(--color-teal)]" />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex items-center gap-2 mb-4">
                <BrainCircuit className="w-4 h-4 text-teal" />
                <h2 className="text-sm font-semibold text-text-primary tracking-wide">AI Reasoning Trace</h2>
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-0">
                {TRACE_STEPS.map((step, i) => {
                    const Icon = step.icon;
                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 * i, duration: 0.4 }}
                            className="flex gap-3 relative"
                        >
                            {/* Vertical line */}
                            {i < TRACE_STEPS.length - 1 && (
                                <div className="absolute left-[15px] top-[36px] w-px h-[calc(100%-20px)] bg-border" />
                            )}

                            {/* Dot / Icon */}
                            <div className={`shrink-0 w-[31px] h-[31px] rounded-lg ${step.bgColor} border ${step.borderColor} flex items-center justify-center z-[1] mt-1`}>
                                <Icon className={`w-3.5 h-3.5 ${step.color}`} />
                            </div>

                            {/* Content */}
                            <div className="pb-5 flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <h3 className="text-xs font-semibold text-text-primary">{step.title}</h3>
                                    <span className="text-[10px] font-mono text-text-secondary">{step.time}</span>
                                </div>
                                <p className="text-[11px] text-text-secondary leading-relaxed">{step.detail}</p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </aside>
    );
}
