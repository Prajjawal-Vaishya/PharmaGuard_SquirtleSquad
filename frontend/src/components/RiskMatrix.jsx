import { motion } from 'framer-motion';
import {
    ShieldAlert, ShieldCheck, ShieldQuestion,
    Sparkles, ChevronRight, Activity, Ban
} from 'lucide-react';

/* ─── Mock Data for Matrix ─── */
const GENES = ['CYP2D6', 'CYP2C19', 'CYP2C9', 'SLCO1B1', 'DPYD', 'TPMT'];
const MOCK_DRUGS_FALLBACK = [
    'Warfarin', 'Clopidogrel', 'Simvastatin',
    'Tamoxifen', 'Fluorouracil', 'Capecitabine',
    'Codeine', 'Ondansetron'
];

/* Deterministic mock data generator */
function getCellData(drug, gene) {
    const key = `${drug}-${gene}`;
    const mockTable = {
        'Warfarin-CYP2C9': { risk: 'HIGH', badge: 'High Risk' },
        'Clopidogrel-CYP2C19': { risk: 'HIGH', badge: 'High Risk' },
        'Simvastatin-SLCO1B1': { risk: 'MODERATE', badge: 'Moderate' },
        'Tamoxifen-CYP2D6': { risk: 'LOW', badge: 'Low Risk' },
        'Fluorouracil-DPYD': { risk: 'HIGH', badge: 'Contraindicated' },
        'Codeine-CYP2D6': { risk: 'MODERATE', badge: 'Monitor' },
        'Capecitabine-DPYD': { risk: 'HIGH', badge: 'Contraindicated' },
        'Ondansetron-CYP2D6': { risk: 'LOW', badge: 'Normal' },
        'Sertraline-CYP2D6': { risk: 'LOW', badge: 'Monitor' },
        'Sertraline-CYP2C19': { risk: 'LOW', badge: 'Normal' },
        'Omeprazole-CYP2C19': { risk: 'MODERATE', badge: 'Dose Adjust' },
    };
    return mockTable[key] || null;
}

const RISK_STYLES = {
    HIGH: { bg: 'bg-crimson/10', border: 'border-crimson/40', text: 'text-crimson', icon: ShieldAlert, shadow: 'shadow-crimson/20' },
    MODERATE: { bg: 'bg-amber/10', border: 'border-amber/40', text: 'text-amber', icon: ShieldQuestion, shadow: 'shadow-amber/20' },
    LOW: { bg: 'bg-teal/10', border: 'border-teal/40', text: 'text-teal', icon: ShieldCheck, shadow: 'shadow-teal/20' },
};

export default function RiskMatrix({ onOpenModal, selectedDrugs }) {
    // STRICT MODE: Only display selected drugs. If empty, display nothing (or message).
    // The App.jsx validation should prevent empty selectedDrugs from reaching here ideally, 
    // but if it does (e.g. valid empty run?), we show nothing.
    // HOWEVER, previously we used MOCK_DRUGS_FALLBACK. The user wants to prevent showing results if nothing selected.
    // So we REMOVE the fallback logic.

    const displayDrugs = (selectedDrugs && selectedDrugs.length > 0)
        ? selectedDrugs
        : []; // No drugs selected -> Empty list

    if (displayDrugs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                <Ban className="w-8 h-8 text-slate-700 mb-2" />
                <p className="text-slate-500 text-sm">No analysis data available. Please select medications.</p>
            </div>
        );
    }

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
                    <Activity className="text-teal w-5 h-5" />
                    Clinical Risk Matrix
                </h2>
                <div className="flex gap-4 text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-crimson"></span>High Risk</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber"></span>Moderate</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-teal"></span>Low/Normal</span>
                </div>
            </div>

            <div className="overflow-x-auto pb-4">
                <div className="min-w-[800px] grid"
                    style={{ gridTemplateColumns: `140px repeat(${GENES.length}, 1fr)` }}>

                    {/* Header Row: Genes */}
                    <div className="sticky left-0 z-10 bg-midnight p-3 border-b border-slate-800/50"></div>
                    {GENES.map(gene => (
                        <div key={gene} className="p-3 text-center border-b border-slate-800/50">
                            <span className="text-xs font-bold text-teal tracking-wider font-mono">{gene}</span>
                        </div>
                    ))}

                    {/* Data Rows */}
                    {displayDrugs.map((drug, rowIdx) => (
                        <div key={drug} className="contents group/row">
                            {/* Row Header: Drug */}
                            <div className="sticky left-0 z-10 bg-midnight p-3 border-b border-slate-800/30 flex items-center">
                                <span className="text-sm font-semibold text-slate-300 group-hover/row:text-white transition-colors">
                                    {drug}
                                </span>
                            </div>

                            {/* Cells */}
                            {GENES.map((gene, colIdx) => {
                                const data = getCellData(drug, gene);

                                if (!data) {
                                    /* ─── NULL STATE ─── */
                                    return (
                                        <div key={`${drug}-${gene}`} className="p-2 border-b border-slate-800/30">
                                            <div className="h-full rounded-lg border border-dashed border-slate-800 flex items-center justify-center gap-2 opacity-30 select-none cursor-not-allowed bg-slate-900/20">
                                                <Ban className="w-3 h-3 text-slate-600" />
                                                <span className="text-[10px] text-slate-600 font-mono">N/A</span>
                                            </div>
                                        </div>
                                    );
                                }

                                /* ─── ACTIVE STATE ─── */
                                const style = RISK_STYLES[data.risk];
                                const Icon = style.icon;

                                return (
                                    <div key={`${drug}-${gene}`} className="p-2 border-b border-slate-800/30">
                                        <motion.button
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: (rowIdx * 0.05) + (colIdx * 0.05) }}
                                            onClick={() => onOpenModal({ drug, gene, ...data })}
                                            className={`
                        w-full h-full min-h-[56px] rounded-lg border flex items-center justify-between px-3 py-2 relative overflow-hidden
                        ${style.bg} ${style.border} group hover:scale-[1.03] hover:ring-1 hover:ring-current hover:z-20
                        transition-all duration-300 cursor-pointer text-left
                      `}
                                        >
                                            {/* Hover Tooltip */}
                                            <div title="View AI Report" className="absolute inset-0" />

                                            <div className="flex flex-col gap-0.5 z-10">
                                                <span className={`text-[10px] font-bold tracking-wider ${style.text} flex items-center gap-1.5`}>
                                                    <Icon className="w-3 h-3" />
                                                    {data.risk}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-mono opacity-80 group-hover:opacity-100 transition-opacity">
                                                    {data.badge}
                                                </span>
                                            </div>

                                            {/* Interaction Icon */}
                                            <div className={`
                        opacity-0 group-hover:opacity-100 transition-all duration-300 
                        transform translate-x-2 group-hover:translate-x-0
                        ${style.text} bg-midnight/80 rounded-full p-1
                      `}>
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </div>

                                            {/* Sparkle effect on hover */}
                                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                                <Sparkles className={`w-2.5 h-2.5 ${style.text} animate-pulse`} />
                                            </div>
                                        </motion.button>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
