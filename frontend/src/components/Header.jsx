import { Dna, ScanLine, Loader2 } from 'lucide-react';

export default function Header({ onRun, isScanning }) {
    return (
        <header className="bg-midnight/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center shadow-[0_0_15px_rgba(0,242,173,0.1)]">
                    <Dna className="w-5 h-5 text-teal" />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                        PharmaGuard <span className="text-teal">.AI</span>
                    </h1>
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Precision Medicine Terminal</p>
                </div>
            </div>

            {/* Button */}
            <button
                id="run-ai-btn"
                onClick={onRun}
                disabled={isScanning}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold
                   bg-teal text-midnight shadow-[0_0_20px_rgba(0,242,173,0.2)]
                   hover:bg-teal/90 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,242,173,0.4)]
                   transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
                {isScanning
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing Genome...</>
                    : <><ScanLine className="w-4 h-4" /> Run Analysis</>
                }
            </button>
        </header>
    );
}
