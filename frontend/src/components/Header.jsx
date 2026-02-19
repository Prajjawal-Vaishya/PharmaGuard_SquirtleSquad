import { motion } from 'framer-motion';
import { Dna, Radio, ScanSearch } from 'lucide-react';

export default function Header({ onScan, isScanning }) {
    return (
        <header className="glass-card px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
            {/* Logo */}
            <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center border border-teal/20">
                    <Dna className="w-5 h-5 text-teal" />
                </div>
                <div>
                    <h1 className="text-lg font-bold tracking-tight text-text-primary">
                        PharmaGuard
                    </h1>
                    <p className="text-[11px] text-text-secondary tracking-widest uppercase">
                        Pharmacogenomics AI Terminal
                    </p>
                </div>
            </motion.div>

            {/* AI Status */}
            <motion.div
                className="flex items-center gap-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                {/* Live indicator */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal/20 bg-teal/5">
                    <div className="w-2 h-2 rounded-full bg-teal pulse-dot" />
                    <span className="text-xs text-teal font-medium tracking-wide">
                        AI Live
                    </span>
                    <Radio className="w-3.5 h-3.5 text-teal animate-pulse" />
                </div>

                {/* Scan button */}
                <button
                    id="scan-genome-btn"
                    onClick={onScan}
                    disabled={isScanning}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm
                     bg-teal text-midnight hover:shadow-[0_0_30px_rgba(0,242,173,0.3)]
                     transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                     cursor-pointer active:scale-95"
                >
                    <ScanSearch className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                    {isScanning ? 'Scanning…' : 'Scan Genome'}
                </button>
            </motion.div>
        </header>
    );
}
