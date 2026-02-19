import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, ShieldCheck, ShieldQuestion, Activity } from 'lucide-react';
import MatrixRain from './MatrixRain';

const GENES = ['CYP2D6', 'CYP2C19', 'CYP2C9', 'SLCO1B1', 'TPMT', 'DPYD'];
const DRUGS = ['Warfarin', 'Clopidogrel', 'Simvastatin', 'Tamoxifen', 'Fluorouracil', 'Capecitabine'];

/* Deterministic mock risk based on name hash */
function getRisk(drug, gene) {
    const hash = (drug.length * gene.length + drug.charCodeAt(0) + gene.charCodeAt(gene.length - 1)) % 4;
    return ['normal', 'low', 'moderate', 'high'][hash];
}

const riskConfig = {
    high: { color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/30', icon: ShieldAlert, label: 'HIGH' },
    moderate: { color: 'text-orange', bg: 'bg-orange/10', border: 'border-orange/30', icon: ShieldQuestion, label: 'MOD' },
    low: { color: 'text-teal', bg: 'bg-teal/10', border: 'border-teal/30', icon: ShieldCheck, label: 'LOW' },
    normal: { color: 'text-text-secondary', bg: 'bg-surface', border: 'border-border', icon: ShieldCheck, label: 'NRM' },
};

export default function RiskMatrix({ isScanning }) {
    return (
        <article aria-label="Clinical Risk Matrix" className="glass-card p-5 relative overflow-hidden h-full flex flex-col">
            {/* Matrix rain overlay */}
            <AnimatePresence>
                {isScanning && (
                    <motion.div
                        className="absolute inset-0 z-20 pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <MatrixRain />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Title */}
            <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-orange" />
                <h2 className="text-sm font-semibold text-text-primary tracking-wide">Clinical Risk Matrix</h2>
            </div>

            {/* Matrix grid */}
            <div className="flex-1 overflow-auto">
                <div className="min-w-[500px]">
                    {/* Column headers (genes) */}
                    <div className="grid gap-1.5" style={{ gridTemplateColumns: `120px repeat(${GENES.length}, 1fr)` }}>
                        <div /> {/* empty corner */}
                        {GENES.map((gene, i) => (
                            <motion.div
                                key={gene}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="text-center py-2 px-1"
                            >
                                <span className="text-[11px] font-mono font-bold text-teal tracking-wider">{gene}</span>
                            </motion.div>
                        ))}

                        {/* Rows (drugs) */}
                        {DRUGS.map((drug, di) => (
                            <>
                                <motion.div
                                    key={`label-${drug}`}
                                    initial={{ opacity: 0, x: -15 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: di * 0.06 }}
                                    className="flex items-center py-2 px-2"
                                >
                                    <span className="text-xs font-semibold text-text-primary truncate">{drug}</span>
                                </motion.div>
                                {GENES.map((gene, gi) => {
                                    const risk = getRisk(drug, gene);
                                    const cfg = riskConfig[risk];
                                    const Icon = cfg.icon;
                                    return (
                                        <motion.div
                                            key={`${drug}-${gene}`}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: di * 0.06 + gi * 0.03 }}
                                            className={`
                        flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-lg border
                        ${cfg.bg} ${cfg.border}
                        hover:scale-105 transition-transform duration-200 cursor-default
                      `}
                                            title={`${drug} × ${gene}: ${risk} risk`}
                                        >
                                            <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                                            <span className={`text-[10px] font-mono font-bold ${cfg.color}`}>{cfg.label}</span>
                                        </motion.div>
                                    );
                                })}
                            </>
                        ))}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border flex-wrap">
                {Object.entries(riskConfig).map(([key, cfg]) => (
                    <div key={key} className="flex items-center gap-1.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${cfg.bg} border ${cfg.border}`} />
                        <span className="text-[10px] text-text-secondary uppercase tracking-wider">{key}</span>
                    </div>
                ))}
            </div>
        </article>
    );
}
