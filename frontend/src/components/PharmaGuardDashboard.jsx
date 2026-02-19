import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Dna, Activity, ShieldAlert, ShieldCheck, ShieldQuestion,
    ChevronRight, Sparkles, Ban, X, Download, Copy, Check,
    Lightbulb, UploadCloud, FileText, CheckCircle2, ChevronDown,
    ScanLine, Loader2, AlertTriangle
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   ██  CPIC MOCK DATA                                            ██
   ═══════════════════════════════════════════════════════════════ */

const GENES = ['CYP2D6', 'CYP2C19', 'CYP2C9', 'SLCO1B1', 'DPYD', 'TPMT'];
const ALL_DRUGS = [
    'Warfarin', 'Clopidogrel', 'Simvastatin', 'Tamoxifen',
    'Fluorouracil', 'Capecitabine', 'Codeine', 'Sertraline',
    'Omeprazole', 'Ondansetron'
];

const DEFAULT_PHARMA_DATA = {
    schema_version: '1.0',
    cpic_version: 'CPIC v4.0',
    patient_id: 'ANON-2026-PG',
    interactions: {
        'Warfarin-CYP2C9': {
            drug: 'Warfarin', gene: 'CYP2C9', diplotype: '*3/*3',
            phenotype: 'Poor Metabolizer', risk: 'HIGH', badge: 'Contraindicated',
            summary: 'CYP2C9*3/*3 encodes a non-functional enzyme. S-warfarin clearance is reduced by ~90%, causing dangerous accumulation and severe bleeding risk. Maintenance dose must be reduced by 70–80% vs. wild-type. INR values will overshoot rapidly on standard dosing, creating a life-threatening haemorrhage window within the first 72 hours.',
            suggestion: 'Initiate at ≤ 1 mg/day. Monitor INR every 48h for the first 2 weeks. Consider switching to Apixaban or Rivaroxaban (no CYP2C9 metabolism). CPIC Grade A recommendation.',
            ai_confidence: 0.98,
        },
        'Clopidogrel-CYP2C19': {
            drug: 'Clopidogrel', gene: 'CYP2C19', diplotype: '*2/*2',
            phenotype: 'Poor Metabolizer', risk: 'HIGH', badge: 'Ineffective',
            summary: 'CYP2C19*2 creates a splicing defect abolishing enzyme function. Clopidogrel requires two CYP2C19-mediated oxidation steps for activation. In *2/*2 carriers, active thiol metabolite formation is <5%, rendering the drug therapeutically useless. MACE risk is elevated approximately 3.5× on standard clopidogrel dosing.',
            suggestion: 'Switch to Prasugrel 10mg or Ticagrelor 90mg BID immediately. Do NOT use standard clopidogrel dosing.',
            ai_confidence: 0.97,
        },
        'Simvastatin-SLCO1B1': {
            drug: 'Simvastatin', gene: 'SLCO1B1', diplotype: '*5/*5',
            phenotype: 'Decreased Function', risk: 'MODERATE', badge: 'Dose Adjust',
            summary: 'SLCO1B1*5 (c.521T>C) reduces OATP1B1 hepatic uptake transporter activity by ~70%. Plasma simvastatin acid AUC increases ~3-fold, strongly correlating with myopathy risk (OR 4.5 per allele). Rhabdomyolysis is a rare but serious outcome at higher doses.',
            suggestion: 'Limit simvastatin to ≤ 20 mg/day. Preferred alternatives: Rosuvastatin or Pravastatin (OATP1B1-independent). Monitor CK levels at 4 and 12 weeks.',
            ai_confidence: 0.94,
        },
        'Tamoxifen-CYP2D6': {
            drug: 'Tamoxifen', gene: 'CYP2D6', diplotype: '*4/*10',
            phenotype: 'Intermediate Metabolizer', risk: 'LOW', badge: 'Monitor',
            summary: 'CYP2D6 converts tamoxifen to its active metabolite endoxifen. *4/*10 carriers have reduced but not absent conversion capacity (~40% of normal). Endoxifen levels may be subtherapeutic in some patients but therapeutic in others.',
            suggestion: 'Standard dose acceptable with therapeutic drug monitoring. Measure endoxifen plasma level at 3 months. If < 5.97 ng/mL, consider aromatase inhibitor switch.',
            ai_confidence: 0.89,
        },
        'Fluorouracil-DPYD': {
            drug: 'Fluorouracil', gene: 'DPYD', diplotype: '*2A/*2A',
            phenotype: 'DPD Deficient', risk: 'HIGH', badge: 'Contraindicated',
            summary: 'DPYD*2A (IVS14+1G>A) abolishes dihydropyrimidine dehydrogenase via exon 14 skipping. DPD catalyses >80% of 5-FU catabolism; complete absence causes fatal 5-FU accumulation with grade 4 mucositis, profound neutropenia, and potentially irreversible neurotoxicity.',
            suggestion: 'CONTRAINDICATED. Do NOT administer fluorouracil or capecitabine. Explore irinotecan-based or platinum-based alternatives. Refer to oncology pharmacogenomics board.',
            ai_confidence: 0.99,
        },
        'Capecitabine-DPYD': {
            drug: 'Capecitabine', gene: 'DPYD', diplotype: '*2A/*2A',
            phenotype: 'DPD Deficient', risk: 'HIGH', badge: 'Contraindicated',
            summary: 'Capecitabine is a 5-FU prodrug. DPYD*2A/*2A carriers have zero DPD activity, leading to identical lethal toxicity profile as direct 5-FU administration. This interaction is an absolute contraindication.',
            suggestion: 'CONTRAINDICATED alongside fluorouracil. Use alternative chemotherapy regimens. Discuss with multidisciplinary tumor board.',
            ai_confidence: 0.99,
        },
        'Codeine-CYP2D6': {
            drug: 'Codeine', gene: 'CYP2D6', diplotype: '*1/*1xN',
            phenotype: 'Ultra-rapid Metabolizer', risk: 'MODERATE', badge: 'Toxicity Risk',
            summary: 'CYP2D6 *1/*1xN (gene duplication) causes ultra-rapid O-demethylation of codeine to morphine. Plasma morphine levels can be 50–75% higher than expected, increasing risk of respiratory depression, especially in pediatric patients and those with renal impairment.',
            suggestion: 'Avoid codeine. Use non-opioid analgesics (NSAIDs, acetaminophen) or morphine at reduced dose with close monitoring. FDA Black Box Warning applies.',
            ai_confidence: 0.96,
        },
        'Sertraline-CYP2D6': {
            drug: 'Sertraline', gene: 'CYP2D6', diplotype: '*4/*4',
            phenotype: 'Poor Metabolizer', risk: 'LOW', badge: 'Tolerable',
            summary: 'CYP2D6 plays a secondary role in sertraline metabolism (primary pathway: CYP2C19). In *4/*4 carriers, sertraline exposure increases ~40%, but the wide therapeutic index makes clinical impact modest.',
            suggestion: 'Initiate at standard dose. Monitor for side effects at 4 weeks. Dose reduction only if adverse effects reported. Consider escitalopram as alternative.',
            ai_confidence: 0.87,
        },
        'Sertraline-CYP2C19': {
            drug: 'Sertraline', gene: 'CYP2C19', diplotype: '*1/*1',
            phenotype: 'Normal Metabolizer', risk: 'LOW', badge: 'Normal',
            summary: 'CYP2C19 *1/*1 indicates wild-type function. No pharmacokinetic alteration expected for sertraline via this pathway. Standard metabolism confirmed.',
            suggestion: 'No dosage adjustment required. Standard prescribing guidelines apply.',
            ai_confidence: 0.92,
        },
        'Omeprazole-CYP2C19': {
            drug: 'Omeprazole', gene: 'CYP2C19', diplotype: '*17/*17',
            phenotype: 'Ultra-rapid Metabolizer', risk: 'MODERATE', badge: 'Dose Adjust',
            summary: 'CYP2C19*17 enhances promoter activity, increasing enzyme expression 2–3×. Omeprazole is cleared faster, reducing AUC by ~40% and potentially leading to therapeutic failure (incomplete acid suppression and H. pylori eradication failure).',
            suggestion: 'Increase dose to 40 mg BID or switch to rabeprazole (less CYP2C19 dependent). Verify H. pylori eradication with urea breath test at 4 weeks.',
            ai_confidence: 0.91,
        },
        'Ondansetron-CYP2D6': {
            drug: 'Ondansetron', gene: 'CYP2D6', diplotype: '*10/*10',
            phenotype: 'Intermediate Metabolizer', risk: 'LOW', badge: 'Normal',
            summary: 'CYP2D6*10 reduces enzyme activity by ~50%. Ondansetron exposure modestly increases but remains within the therapeutic window. Anti-emetic efficacy is fully preserved.',
            suggestion: 'No dose adjustment needed. Standard 4–8mg dosing is appropriate. Monitor only if concurrent CYP3A4 inhibitors are co-prescribed.',
            ai_confidence: 0.85,
        },
    },
};

/* ═══════════════════════════════════════════════════════════════
   ██  STYLE MAPS                                                ██
   ═══════════════════════════════════════════════════════════════ */

const RISK = {
    HIGH: { bg: 'pg-risk-high', text: 'text-[#FF4B4B]', icon: ShieldAlert },
    MODERATE: { bg: 'pg-risk-moderate', text: 'text-[#F59E0B]', icon: ShieldQuestion },
    LOW: { bg: 'pg-risk-low', text: 'text-[#00F2AD]', icon: ShieldCheck },
};

const SESSION_KEY = 'pharmaguard_data';

/* ═══════════════════════════════════════════════════════════════
   ██  MICRO-INTERACTION 3: TYPEWRITER TEXT                      ██
   ═══════════════════════════════════════════════════════════════ */

function TypewriterText({ text, speed = 15, className = '' }) {
    const [displayed, setDisplayed] = useState('');
    const [done, setDone] = useState(false);
    const idRef = useRef(null);

    useEffect(() => {
        setDisplayed('');
        setDone(false);
        let i = 0;
        idRef.current = setInterval(() => {
            i++;
            setDisplayed(text.slice(0, i));
            if (i >= text.length) {
                clearInterval(idRef.current);
                setDone(true);
            }
        }, speed);
        return () => clearInterval(idRef.current);
    }, [text, speed]);

    return (
        <span className={className}>
            {displayed}
            <span className={`pg-cursor ${done ? 'pg-cursor-blink' : ''}`} />
        </span>
    );
}

/* ═══════════════════════════════════════════════════════════════
   ██  SUB-COMPONENTS                                            ██
   ═══════════════════════════════════════════════════════════════ */

/* ── Null Cell ─────────────────────────────────────────────── */
function NullCell({ delay }) {
    return (
        <div className="p-1.5 pg-cell-reveal" style={{ animationDelay: `${delay}ms` }}>
            <div className="h-full min-h-[52px] rounded-lg border border-dashed border-[#1e293b] flex items-center justify-center gap-1.5 opacity-30 select-none cursor-not-allowed bg-[#0f172a]/20">
                <Ban className="w-3 h-3 text-[#475569]" />
                <span className="text-[10px] text-[#475569] font-mono">N/A</span>
            </div>
        </div>
    );
}

/* ── Active Cell ───────────────────────────────────────────── */
function ActiveCell({ data, style, delay, onClick }) {
    const Icon = style.icon;
    const isHigh = data.risk === 'HIGH';

    return (
        <div className="p-1.5 pg-cell-reveal" style={{ animationDelay: `${delay}ms` }}>
            <button
                onClick={onClick}
                title="View AI Report"
                className={`
          w-full min-h-[52px] rounded-lg border flex items-center justify-between px-2.5 py-2 relative overflow-hidden
          ${style.bg} group cursor-pointer text-left
          transition-transform duration-300 hover:scale-105 hover:z-20
          ${isHigh ? 'pg-breathe' : ''}
        `}
            >
                <div className="flex flex-col gap-0.5 z-10">
                    <span className={`text-[10px] font-bold tracking-wider ${style.text} flex items-center gap-1`}>
                        <Icon className="w-3 h-3" /> {data.risk}
                    </span>
                    <span className="text-[9px] text-[#94a3b8] font-mono truncate max-w-[80px]">{data.badge}</span>
                </div>
                <div className={`opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-1 group-hover:translate-x-0 ${style.text}`}>
                    <ChevronRight className="w-3.5 h-3.5" />
                </div>
                <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <Sparkles className={`w-2.5 h-2.5 ${style.text}`} style={{ animation: 'pulse 2s infinite' }} />
                </div>
            </button>
        </div>
    );
}

/* ── Warning Popup ─────────────────────────────────────────── */
function WarningPopup({ isOpen, onClose, message }) {
    useEffect(() => {
        const h = (e) => e.key === 'Escape' && onClose();
        if (isOpen) window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pg-overlay-in" style={{ background: 'rgba(5,5,5,0.8)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} className="w-full max-w-sm bg-[#0F1218] rounded-2xl border border-[#F59E0B]/30 shadow-[0_0_50px_rgba(245,158,11,0.15)] overflow-hidden pg-modal-pop">
                <div className="h-1.5 w-full bg-gradient-to-r from-[#F59E0B]/60 via-[#F59E0B] to-[#F59E0B]/60" style={{ animation: 'pulse 2s infinite' }} />
                <div className="p-6 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                        <AlertTriangle className="w-8 h-8 text-[#F59E0B]" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Input Required</h3>
                    <p className="text-[#94a3b8] text-sm leading-relaxed mb-6">{message}</p>
                    <button onClick={onClose} className="w-full py-3 rounded-xl bg-[#F59E0B] text-black font-bold text-sm uppercase tracking-wide hover:bg-[#F59E0B]/90 hover:scale-[1.02] transition-all active:scale-95 cursor-pointer">
                        Got It
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Report Modal ──────────────────────────────────────────── */
function ReportModal({ data, onClose }) {
    const [copied, setCopied] = useState(false);
    const style = RISK[data.risk] || RISK.LOW;
    const accentVia = data.risk === 'HIGH' ? 'via-[#FF4B4B]' : data.risk === 'MODERATE' ? 'via-[#F59E0B]' : 'via-[#00F2AD]';

    useEffect(() => {
        const h = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [onClose]);

    const jsonReport = JSON.stringify(data.rawData || {
        patient_id: 'PATIENT_XXX',
        drug: data.drug,
        timestamp: new Date().toISOString(),
        risk_assessment: {
            risk_label: data.risk === 'HIGH' ? 'Toxic' : data.risk === 'MODERATE' ? 'Adjust Dosage' : 'Safe',
            confidence_score: data.ai_confidence || 0.0,
            severity: data.risk.toLowerCase()
        },
        pharmacogenomic_profile: {
            primary_gene: data.gene,
            diplotype: data.diplotype,
            phenotype: data.phenotype,
            detected_variants: []
        },
        clinical_recommendation: {
            recommendation: data.suggestion
        },
        llm_generated_explanation: {
            summary: data.summary
        },
        quality_metrics: {
            vcf_parsing_success: true
        }
    }, null, 2);

    const handleDownload = useCallback(() => {
        const blob = new Blob([jsonReport], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `pharmaguard_${data.drug.toLowerCase()}_${data.gene}.json`;
        a.click(); URL.revokeObjectURL(url);
    }, [jsonReport, data]);

    const handleCopy = useCallback(async () => {
        await navigator.clipboard.writeText(jsonReport);
        setCopied(true); setTimeout(() => setCopied(false), 2500);
    }, [jsonReport]);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pg-overlay-in"
            style={{ background: 'rgba(5,5,5,0.7)', backdropFilter: 'blur(14px)' }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()}
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0a0a12] shadow-[0_0_80px_rgba(0,242,173,0.08)] flex flex-col pg-modal-pop">

                {/* Accent */}
                <div className={`h-0.5 w-full rounded-t-2xl bg-gradient-to-r from-transparent ${accentVia} to-transparent`} />

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#1e293b]/50 border border-[#334155] flex items-center justify-center">
                            <Dna className={`w-5 h-5 ${style.text}`} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                {data.drug} <span className="text-[#475569] font-normal">/</span> <span className={style.text}>{data.gene}</span>
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-xs font-mono text-[#94a3b8]">{data.diplotype}</span>
                                <span className="text-[#334155]">·</span>
                                <span className="text-xs text-[#94a3b8]">{data.phenotype}</span>
                                <span className={`text-[9px] font-bold tracking-widest px-2 py-0.5 rounded-full border border-current/30 ${style.text} bg-current/5 ml-1`}>
                                    {data.risk}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-[#94a3b8] hover:text-white transition-colors cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5 flex-1">
                    {/* ── MICRO-INTERACTION 3: Typewriter AI Summary ── */}
                    <div>
                        <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4 text-[#00F2AD]" /> Gemini Clinical Summary
                        </h4>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-[#00F2AD]/5 to-transparent border-l-2 border-[#00F2AD] relative">
                            <p className="text-[13px] text-[#cbd5e1] leading-relaxed font-mono">
                                <TypewriterText text={data.summary} speed={15} />
                            </p>
                            <div className="absolute top-2 right-2 opacity-10"><Dna className="w-14 h-14 text-[#00F2AD]" /></div>
                        </div>
                    </div>

                    {/* Suggestions */}
                    <div>
                        <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                            <Lightbulb className="w-4 h-4 text-[#F59E0B]" /> Actionable AI Suggestions
                        </h4>
                        <div className="p-4 rounded-xl bg-[#0f172a]/50 border border-[#1e293b]">
                            <p className="text-[13px] text-[#94a3b8] leading-relaxed">{data.suggestion}</p>
                        </div>
                    </div>

                    {/* Confidence */}
                    <div className="flex items-center gap-3 text-xs text-[#475569]">
                        <Activity className="w-3.5 h-3.5" />
                        <span>AI Confidence: <span className="text-[#00F2AD] font-bold">{(data.ai_confidence * 100).toFixed(0)}%</span></span>
                        <span className="text-[#1e293b]">|</span>
                        <span>CPIC v4.0</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-[#1e293b] bg-[#0f172a]/30 flex gap-3">
                    <button onClick={handleDownload}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#00F2AD] text-[#050505] font-bold text-sm
                       shadow-[0_0_20px_rgba(0,242,173,0.25)] hover:shadow-[0_0_35px_rgba(0,242,173,0.4)] hover:scale-[1.02]
                       transition-all active:scale-95 cursor-pointer">
                        <Download className="w-4 h-4" /> Download JSON Report
                    </button>
                    <button onClick={handleCopy}
                        className="px-5 flex items-center gap-2 py-3 rounded-xl border border-[#334155] text-sm font-medium text-[#94a3b8] bg-[#050505]
                       hover:border-[#00F2AD]/40 hover:text-[#00F2AD] transition-all cursor-pointer whitespace-nowrap">
                        {copied ? <><Check className="w-4 h-4 text-[#00F2AD]" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   ██  MAIN DASHBOARD                                            ██
   ═══════════════════════════════════════════════════════════════ */

export default function PharmaGuardDashboard() {

    /* ── Session-persisted CPIC data ─────────────────────────── */
    const [pharmaData, setPharmaData] = useState(() => {
        try {
            const s = sessionStorage.getItem(SESSION_KEY);
            return s ? JSON.parse(s) : DEFAULT_PHARMA_DATA;
        } catch { return DEFAULT_PHARMA_DATA; }
    });
    useEffect(() => { sessionStorage.setItem(SESSION_KEY, JSON.stringify(pharmaData)); }, [pharmaData]);

    /* ── App state ───────────────────────────────────────────── */
    const [status, setStatus] = useState('idle');
    const [activeModalData, setActiveModalData] = useState(null);
    const [file, setFile] = useState(null);
    const [selectedDrugs, setSelectedDrugs] = useState([]);
    const [dragging, setDragging] = useState(false);
    const [dropOpen, setDropOpen] = useState(false);
    const [warningOpen, setWarningOpen] = useState(false);
    const [warningMsg, setWarningMsg] = useState('');

    const getCellData = (drug, gene) => pharmaData.interactions[`${drug}-${gene}`] || null;
    const toggleDrug = (d) => setSelectedDrugs(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]);

    const handleDragIn = (e) => { e.preventDefault(); setDragging(true); };
    const handleDragOut = (e) => { e.preventDefault(); setDragging(false); };
    const handleDrag = (e) => e.preventDefault();
    const handleDrop = useCallback((e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) setFile(f); }, []);

    // ── API HELPERS ──────────────────────────────────────────
    const mapRiskLevel = (label) => {
        const l = (label || '').toUpperCase();
        if (l === 'TOXIC') return 'HIGH';
        if (l === 'ADJUST DOSAGE') return 'MODERATE';
        if (l === 'SAFE') return 'LOW';
        return 'LOW';
    };

    const mapBadge = (riskLabel, phenotype) => {
        const l = (riskLabel || '').toUpperCase();
        if (l === 'TOXIC') {
            if (phenotype === 'URM') return 'Toxicity Risk';
            if (phenotype === 'PM') return 'Contraindicated';
            return 'Contraindicated';
        }
        if (l === 'ADJUST DOSAGE') return 'Dose Adjust';
        if (l === 'SAFE') return 'Normal';
        return 'Monitor';
    };

    const handleRun = async () => {
        if (!file) { setWarningMsg('Please upload a VCF genome file before running analysis.'); setWarningOpen(true); return; }
        if (selectedDrugs.length === 0) { setWarningMsg('Please select at least one medication to screen.'); setWarningOpen(true); return; }
        if (status === 'scanning') return;

        setStatus('scanning');

        let newInteractions = {};

        // Process ONE drug at a time to protect the LLM rate limits
        for (const drugName of selectedDrugs) {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("drug", drugName);

            try {
                const response = await fetch("http://localhost:8000/api/v1/pgx/analyze", {
                    method: "POST",
                    body: formData
                    // Browser sets the multipart boundary automatically; do NOT set Content-Type header
                });

                if (response.ok) {
                    const data = await response.json();
                    const gene = data.pharmacogenomic_profile.primary_gene;
                    const risk = mapRiskLevel(data.risk_assessment.risk_label);
                    const phenotype = data.pharmacogenomic_profile.phenotype;

                    // Key is Drug-Gene to match getCellData lookup
                    newInteractions[`${drugName}-${gene}`] = {
                        drug: drugName,
                        gene: gene,
                        diplotype: data.pharmacogenomic_profile.diplotype,
                        phenotype: phenotype,
                        risk: risk,
                        badge: mapBadge(data.risk_assessment.risk_label, phenotype),
                        summary: data.llm_generated_explanation.summary,
                        suggestion: data.clinical_recommendation.recommendation,
                        ai_confidence: data.risk_assessment.confidence_score,
                        rawData: data // Store full verified response
                    };
                } else {
                    console.error(`API error for ${drugName}:`, await response.text());
                }
            } catch (error) {
                console.error(`Failed to analyze ${drugName}:`, error);
            }
        }

        // Update state with real results
        setPharmaData(prev => ({ ...prev, interactions: { ...prev.interactions, ...newInteractions } }));
        setStatus('done');
    };

    const displayDrugs = selectedDrugs.length > 0 ? selectedDrugs : [];

    return (
        <div className="min-h-screen pb-16" style={{ background: '#050505', color: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif" }}>

            {/* ═══ HEADER ═══ */}
            <header className="sticky top-0 z-40 px-6 py-4 flex items-center justify-between border-b border-[#1e293b]/50"
                style={{ background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(12px)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#00F2AD]/10 border border-[#00F2AD]/20 flex items-center justify-center shadow-[0_0_15px_rgba(0,242,173,0.1)]">
                        <Dna className="w-5 h-5 text-[#00F2AD]" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">PharmaGuard<span className="text-[#00F2AD]">.AI</span></h1>
                        <p className="text-[10px] text-[#475569] font-mono uppercase tracking-widest">Precision Medicine Terminal</p>
                    </div>
                </div>
                <button onClick={handleRun} disabled={status === 'scanning'}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold bg-[#00F2AD] text-[#050505]
                     shadow-[0_0_20px_rgba(0,242,173,0.2)] hover:shadow-[0_0_30px_rgba(0,242,173,0.4)] hover:scale-105
                     transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                    {status === 'scanning'
                        ? <><Loader2 className="w-4 h-4 pg-spin" /> Processing…</>
                        : <><ScanLine className="w-4 h-4" /> Run Analysis</>}
                </button>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-8 items-start">

                    {/* ═══ LEFT PANEL ═══ */}
                    <div className="sticky top-24 space-y-6">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold tracking-tight">Genomic Analysis</h2>
                            <p className="text-sm text-[#94a3b8]">Upload patient VCF and select drugs to screen against the CPIC database.</p>
                        </div>
                        <div className="bg-[#0F1218] border border-[#1e293b] rounded-2xl p-6 shadow-xl space-y-5">

                            {/* Upload */}
                            <label onDragEnter={handleDragIn} onDragLeave={handleDragOut} onDragOver={handleDrag} onDrop={handleDrop}
                                className={`relative flex flex-col items-center gap-4 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300 group
                  ${dragging ? 'border-[#00F2AD] bg-[#00F2AD]/10' : file ? 'border-[#00F2AD]/50 bg-[#00F2AD]/5' : 'border-[#334155] bg-[#0f172a]/30 hover:border-[#00F2AD]/50'}`}>
                                <input type="file" accept=".vcf" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${dragging || file ? 'bg-[#00F2AD]/20 text-[#00F2AD] scale-110' : 'bg-[#1e293b] text-[#475569] group-hover:text-[#00F2AD]'}`}>
                                    {file ? <CheckCircle2 className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-semibold text-[#cbd5e1]">{file ? 'File Ready' : dragging ? 'Drop here' : 'Upload Genome File'}</p>
                                    <p className="text-xs text-[#475569] mt-1 font-mono">{file ? file.name : '.vcf format'}</p>
                                </div>
                                {file && <button className="absolute top-3 right-3 p-1.5 rounded-full bg-[#1e293b]/80 text-[#475569] hover:text-[#FF4B4B] transition-colors" onClick={e => { e.preventDefault(); setFile(null); }}><X className="w-3.5 h-3.5" /></button>}
                            </label>

                            {/* Dropdown */}
                            <div className="relative">
                                <button type="button" onClick={() => setDropOpen(o => !o)}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-[#0f172a]/50 rounded-xl border border-[#334155] text-sm text-[#cbd5e1] hover:border-[#00F2AD]/50 transition-colors cursor-pointer">
                                    <span>{selectedDrugs.length ? `${selectedDrugs.length} drug${selectedDrugs.length > 1 ? 's' : ''} selected` : 'Select Medications…'}</span>
                                    <ChevronDown className={`w-4 h-4 text-[#475569] transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {dropOpen && <>
                                    <div className="fixed inset-0 z-10" onClick={() => setDropOpen(false)} />
                                    <div className="absolute z-20 mt-2 w-full bg-[#0F1218] border border-[#334155] rounded-xl shadow-2xl max-h-56 overflow-y-auto">
                                        {ALL_DRUGS.map(d => (
                                            <button key={d} type="button" onClick={() => toggleDrug(d)}
                                                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-[#cbd5e1] hover:bg-[#00F2AD]/10 hover:text-[#00F2AD] transition-colors text-left cursor-pointer">
                                                {d} {selectedDrugs.includes(d) && <CheckCircle2 className="w-4 h-4 text-[#00F2AD]" />}
                                            </button>
                                        ))}
                                    </div>
                                </>}
                            </div>

                            {/* Pills */}
                            {selectedDrugs.length > 0 && (
                                <div className="flex flex-wrap gap-2">{selectedDrugs.map(d => (
                                    <span key={d} className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#334155] bg-[#1e293b]/50 text-[#cbd5e1] text-xs">
                                        {d} <button onClick={() => toggleDrug(d)} className="hover:text-[#FF4B4B] cursor-pointer"><X className="w-3 h-3" /></button>
                                    </span>
                                ))}</div>
                            )}

                            {/* Run */}
                            <button onClick={handleRun} disabled={status === 'scanning'}
                                className="w-full py-4 rounded-xl text-sm font-bold uppercase tracking-wider cursor-pointer
                           bg-gradient-to-r from-[#00F2AD] to-[#00C28A] text-[#050505] shadow-[0_0_20px_rgba(0,242,173,0.15)]
                           hover:shadow-[0_0_30px_rgba(0,242,173,0.3)] hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 disabled:grayscale">
                                {status === 'scanning' ? 'P R O C E S S I N G …' : 'Analyze Interaction Risk'}
                            </button>
                        </div>
                    </div>

                    {/* ═══ RIGHT PANEL ═══ */}
                    <div className="min-h-[400px] relative">

                        {/* Idle */}
                        {status === 'idle' && (
                            <div className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed border-[#1e293b] rounded-2xl bg-[#0F1218]/50 pg-fade-in">
                                <Dna className="w-10 h-10 text-[#1e293b] mb-3" />
                                <p className="text-[#475569] font-mono text-sm">Awaiting Analysis…</p>
                            </div>
                        )}

                        {/* ── MICRO-INTERACTION 1: Biotech Scan Overlay ── */}
                        {status === 'scanning' && (
                            <div className="relative h-[400px] rounded-2xl bg-[#0F1218]/60 overflow-hidden pg-fade-in" style={{ backdropFilter: 'blur(4px)' }}>
                                {/* Laser sweep line */}
                                <div className="pg-laser" />
                                {/* Grid skeleton behind */}
                                <div className="absolute inset-0 p-6 opacity-20">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="flex gap-3 mb-3 items-center">
                                            <div className="w-20 h-4 rounded bg-[#1e293b]" />
                                            <div className="flex-1 grid grid-cols-6 gap-2">
                                                {Array.from({ length: 6 }).map((__, j) => (
                                                    <div key={j} className="h-12 rounded-lg bg-[#1e293b]/60" />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Center text */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                                    <div className="flex gap-1 mb-4">
                                        {[0, 1, 2].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full bg-[#00F2AD] pg-dot" style={{ animationDelay: `${i * 200}ms` }} />)}
                                    </div>
                                    <p className="font-mono text-sm text-[#00F2AD] tracking-[0.3em] uppercase pg-pulse-text">
                                        Sequencing Genome...
                                    </p>
                                    <p className="text-[10px] text-[#475569] mt-2 font-mono">Analyzing {selectedDrugs.length} drug interaction{selectedDrugs.length !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                        )}

                        {/* Results */}
                        {status === 'done' && (
                            <div className="pg-fade-in">
                                {displayDrugs.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 border border-dashed border-[#1e293b] rounded-xl bg-[#0f172a]/20">
                                        <Ban className="w-8 h-8 text-[#334155] mb-2" />
                                        <p className="text-[#475569] text-sm">No drugs selected.</p>
                                    </div>
                                ) : (
                                    <section className="space-y-5">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-xl font-bold bg-gradient-to-r from-white to-[#94a3b8] bg-clip-text text-transparent flex items-center gap-3">
                                                <Activity className="text-[#00F2AD] w-5 h-5" /> Clinical Risk Matrix
                                            </h2>
                                            <div className="flex gap-4 text-[10px] font-mono text-[#475569]">
                                                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#FF4B4B]" />High</span>
                                                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#F59E0B]" />Moderate</span>
                                                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#00F2AD]" />Low</span>
                                            </div>
                                        </div>

                                        {/* ── MICRO-INTERACTION 4: Staggered Grid ── */}
                                        <div className="overflow-x-auto pb-3">
                                            <div className="min-w-[780px] grid" style={{ gridTemplateColumns: `130px repeat(${GENES.length}, 1fr)` }}>
                                                <div className="p-2" />
                                                {GENES.map(g => (
                                                    <div key={g} className="p-2 text-center border-b border-[#1e293b]/50">
                                                        <span className="text-[11px] font-bold text-[#00F2AD] tracking-wider font-mono">{g}</span>
                                                    </div>
                                                ))}
                                                {displayDrugs.map((drug, ri) => (
                                                    <div key={drug} className="contents group/row">
                                                        <div className="p-2 border-b border-[#1e293b]/30 flex items-center sticky left-0 z-10" style={{ background: '#050505' }}>
                                                            <span className="text-sm font-semibold text-[#cbd5e1] group-hover/row:text-white transition-colors">{drug}</span>
                                                        </div>
                                                        {GENES.map((gene, ci) => {
                                                            const d = getCellData(drug, gene);
                                                            const delay = ri * 80 + ci * 60;
                                                            if (!d) return <NullCell key={`${drug}-${gene}`} delay={delay} />;
                                                            const s = RISK[d.risk] || RISK.LOW;
                                                            return <ActiveCell key={`${drug}-${gene}`} data={d} style={s} delay={delay} onClick={() => setActiveModalData(d)} />;
                                                        })}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </section>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Modals */}
            {activeModalData && <ReportModal data={activeModalData} onClose={() => setActiveModalData(null)} />}
            <WarningPopup isOpen={warningOpen} onClose={() => setWarningOpen(false)} message={warningMsg} />

            {/* ═══════════════════════════════════════════════════════
           CUSTOM KEYFRAMES — GPU-accelerated (transform/opacity)
         ═══════════════════════════════════════════════════════ */}
            <style>{`
        /* ── 1. Biotech Scan: Laser Sweep ── */
        .pg-laser {
          position: absolute; left: 0; right: 0; height: 2px; z-index: 5;
          background: #00F2AD;
          box-shadow: 0 0 12px 4px rgba(0,242,173,0.6), 0 0 40px 8px rgba(0,242,173,0.3), 0 0 80px 16px rgba(0,242,173,0.1);
          animation: pgLaserSweep 2.4s cubic-bezier(0.45, 0, 0.55, 1) infinite;
          will-change: transform;
        }
        @keyframes pgLaserSweep {
          0%   { transform: translateY(0); }
          100% { transform: translateY(400px); }
        }

        .pg-dot {
          animation: pgDotPulse 1.2s ease-in-out infinite;
          will-change: transform, opacity;
        }
        @keyframes pgDotPulse {
          0%, 100% { transform: scale(1);   opacity: 0.4; }
          50%      { transform: scale(1.6); opacity: 1; }
        }

        .pg-pulse-text {
          animation: pgTextPulse 2s ease-in-out infinite;
          will-change: opacity;
        }
        @keyframes pgTextPulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.5; }
        }

        /* ── 2. Clinical Alert: Breathe Effect (HIGH RISK) ── */
        .pg-breathe {
          animation: pgBreathe 2.8s ease-in-out infinite;
          will-change: box-shadow;
        }
        @keyframes pgBreathe {
          0%, 100% { box-shadow: 0 0 8px 0px rgba(255,75,75,0.15), inset 0 0 4px rgba(255,75,75,0.05); }
          50%      { box-shadow: 0 0 20px 6px rgba(255,75,75,0.35), inset 0 0 10px rgba(255,75,75,0.1); }
        }

        /* ── 3. Typewriter Cursor ── */
        .pg-cursor {
          display: inline-block; width: 8px; height: 14px;
          background: #00F2AD; margin-left: 2px; vertical-align: text-bottom;
          animation: pgCursorBlink 0.6s step-end infinite;
          will-change: opacity;
        }
        .pg-cursor-blink { animation: pgCursorBlink 1s step-end infinite; }
        @keyframes pgCursorBlink {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0; }
        }

        /* ── 4. Staggered Grid Cell Reveal ── */
        .pg-cell-reveal {
          opacity: 0;
          animation: pgCellIn 0.5s ease-out forwards;
          will-change: transform, opacity;
        }
        @keyframes pgCellIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Utility Animations ── */
        .pg-fade-in {
          animation: pgFadeIn 0.4s ease-out forwards;
          will-change: opacity;
        }
        @keyframes pgFadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }

        .pg-overlay-in {
          animation: pgOverlayIn 0.25s ease-out forwards;
          will-change: opacity;
        }
        @keyframes pgOverlayIn {
          from { opacity: 0; } to { opacity: 1; }
        }

        .pg-modal-pop {
          animation: pgModalPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          will-change: transform, opacity;
        }
        @keyframes pgModalPop {
          from { opacity: 0; transform: scale(0.88) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        .pg-spin { animation: pgSpin 1s linear infinite; }
        @keyframes pgSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* Risk cell backgrounds (consistent with existing classes) */
        .pg-risk-high     { background: rgba(255,75,75,0.1);  border-color: rgba(255,75,75,0.4); }
        .pg-risk-moderate { background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.4); }
        .pg-risk-low      { background: rgba(0,242,173,0.1);  border-color: rgba(0,242,173,0.4); }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #050505; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
        </div>
    );
}
