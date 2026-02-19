import { useCallback, useState } from 'react';
import { UploadCloud, FileText, X, CheckCircle2, ChevronDown } from 'lucide-react';

const MEDICATIONS = [
    'Warfarin', 'Clopidogrel', 'Simvastatin',
    'Tamoxifen', 'Fluorouracil', 'Capecitabine',
    'Codeine', 'Sertraline', 'Omeprazole',
    'Ondansetron'
];

export default function InputPanel({ file, setFile, drugs, setDrugs, onRun, isScanning }) {
    const [dragging, setDragging] = useState(false);
    const [dropOpen, setDropOpen] = useState(false);

    const handleDragIn = (e) => { e.preventDefault(); setDragging(true); };
    const handleDragOut = (e) => { e.preventDefault(); setDragging(false); };
    const handleDrag = (e) => e.preventDefault();
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) setFile(f);
    }, [setFile]);

    const toggleDrug = (d) =>
        setDrugs(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]);

    return (
        <section aria-label="Input Panel" className="space-y-5">
            {/* Upload zone */}
            <label
                onDragEnter={handleDragIn}
                onDragLeave={handleDragOut}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center gap-4 p-8 rounded-xl border-2 border-dashed cursor-pointer
          transition-all duration-300 overflow-hidden group
          ${dragging
                        ? 'border-teal bg-teal/10 shadow-[inner_0_0_20px_rgba(0,242,173,0.1)]'
                        : (file ? 'border-teal/50 bg-teal/5' : 'border-slate-700 bg-slate-900/30 hover:border-teal/50 hover:bg-slate-800/50')
                    }`}
            >
                <input type="file" accept=".vcf" className="hidden" id="vcf-input"
                    onChange={e => setFile(e.target.files?.[0] || null)} />

                {/* Icon */}
                <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300
          ${dragging || file ? 'bg-teal/20 text-teal scale-110' : 'bg-slate-800 text-slate-400 group-hover:text-teal group-hover:bg-teal/10'} float-anim`}>
                    {file ? <CheckCircle2 className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
                </div>

                <div className="text-center">
                    <p className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">
                        {file ? 'File Uploaded Successfully' : (dragging ? 'Drop VCF here' : 'Select Genome File')}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{file ? file.name : 'Supports .vcf, .vcf.gz'}</p>
                </div>

                {/* File badge (Remove button) */}
                {file && (
                    <button
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-800/80 text-slate-400 hover:text-crimson hover:bg-slate-800 transition-colors"
                        onClick={e => { e.preventDefault(); setFile(null); }}
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </label>

            {/* Medication dropdown */}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setDropOpen(o => !o)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/50 rounded-xl border border-slate-700
                     text-sm text-slate-300 hover:border-teal/50 hover:text-white transition-colors"
                >
                    <span>
                        {drugs.length ? `${drugs.length} drugs selected` : 'Select Medications...'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setDropOpen(false)} />
                        <div className="absolute z-20 mt-2 w-full bg-midnight-card border border-slate-700 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                            {MEDICATIONS.map(d => (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => toggleDrug(d)}
                                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-slate-300
                            hover:bg-teal/10 hover:text-teal transition-colors text-left"
                                >
                                    {d}
                                    {drugs.includes(d) && <CheckCircle2 className="w-4 h-4 text-teal" />}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Selected pills */}
            {drugs.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {drugs.map(d => (
                        <span key={d} className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-slate-700 bg-slate-800/50 text-slate-300 text-xs">
                            {d}
                            <button onClick={() => toggleDrug(d)} className="hover:text-crimson"><X className="w-3 h-3" /></button>
                        </span>
                    ))}
                </div>
            )}

            {/* Run button */}
            <button
                onClick={onRun}
                disabled={isScanning}
                className="w-full py-4 rounded-xl text-sm font-bold uppercase tracking-wider
                   bg-gradient-to-r from-teal to-[#00C28A] text-midnight shadow-[0_0_20px_rgba(0,242,173,0.15)]
                   hover:shadow-[0_0_30px_rgba(0,242,173,0.3)] hover:scale-[1.02] transition-all duration-200
                   active:scale-95 disabled:opacity-50 disabled:grayscale cursor-pointer"
            >
                {isScanning ? 'P A R S I N G ...' : 'Analyze Interaction Risk'}
            </button>
        </section>
    );
}
