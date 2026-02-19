import os
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Tuple
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai

# ==========================================
# 0. LOAD ENVIRONMENT
# ==========================================
load_dotenv()

# ==========================================
# 1. API CONFIG & AI SAFETY GUARD
# ==========================================
app = FastAPI(title="PharmaGuard PGx API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

genai.configure(api_key=os.getenv("GEMINI_API_KEY", "YOUR_API_KEY_HERE"))
llm_model = genai.GenerativeModel('gemini-2.5-flash')

# ==========================================
# 2. DTOs: EXACT JSON SCHEMA ENFORCEMENT
# ==========================================
class DetectedVariantDto(BaseModel):
    rsid: str

class PharmacogenomicProfileDto(BaseModel):
    primary_gene: str
    diplotype: str
    phenotype: str
    detected_variants: List[DetectedVariantDto]

class RiskAssessmentDto(BaseModel):
    risk_label: str
    confidence_score: float
    severity: str

class ClinicalRecommendationDto(BaseModel):
    recommendation: str

class LlmExplanationDto(BaseModel):
    summary: str

class QualityMetricsDto(BaseModel):
    vcf_parsing_success: bool

class PgxAnalysisResponseDto(BaseModel):
    patient_id: str
    drug: str
    timestamp: str
    risk_assessment: RiskAssessmentDto
    pharmacogenomic_profile: PharmacogenomicProfileDto
    clinical_recommendation: ClinicalRecommendationDto
    llm_generated_explanation: LlmExplanationDto
    quality_metrics: QualityMetricsDto


# ==========================================
# 3. CPIC STAR ALLELE FUNCTION TABLES
# ==========================================

# CYP2D6 Activity Scores (CPIC guideline)
CYP2D6_ACTIVITY = {
    "*1":  1.0,   # Normal function
    "*2":  1.0,   # Normal function
    "*3":  0.0,   # No function
    "*4":  0.0,   # No function
    "*5":  0.0,   # No function (gene deletion)
    "*6":  0.0,   # No function
    "*7":  0.0,   # No function
    "*8":  0.0,   # No function
    "*9":  0.5,   # Decreased function
    "*10": 0.25,  # Decreased function
    "*14": 1.0,   # Normal function
    "*17": 0.5,   # Decreased function
    "*29": 0.5,   # Decreased function
    "*41": 0.5,   # Decreased function
}

# CYP2C19 Function Scores (CPIC guideline)
CYP2C19_ACTIVITY = {
    "*1":  1.0,   # Normal function
    "*2":  0.0,   # No function (splice defect)
    "*3":  0.0,   # No function (stop gained)
    "*4":  0.0,   # No function (start lost)
    "*5":  0.0,   # No function
    "*6":  0.0,   # No function (frameshift)
    "*7":  0.0,   # No function
    "*8":  0.0,   # No function
    "*9":  0.5,   # Decreased function
    "*10": 0.5,   # Decreased function
    "*17": 1.5,   # Increased function (promoter variant)
}

# CYP2C9 Function Scores (CPIC guideline)
CYP2C9_ACTIVITY = {
    "*1":  1.0,   # Normal function
    "*2":  0.5,   # Decreased function
    "*3":  0.0,   # No function
    "*5":  0.0,   # No function
    "*6":  0.0,   # No function
    "*8":  0.5,   # Decreased function
    "*11": 0.5,   # Decreased function
    "*12": 0.5,   # Decreased function
}

# SLCO1B1 Function (CPIC guideline)
SLCO1B1_ACTIVITY = {
    "*1":  1.0,   # Normal function
    "*1B": 1.0,   # Normal function (benign)
    "*5":  0.0,   # Decreased function (521T>C, rs4149056)
    "*15": 0.5,   # Decreased function
    "*17": 0.0,   # Poor function
}

# DPYD Activity Score (CPIC guideline)
DPYD_ACTIVITY = {
    "*1":    1.0,   # Normal DPD activity
    "*2A":   0.0,   # No DPD activity (IVS14+1G>A)
    "*5":    0.5,   # Decreased activity
    "*6":    0.5,   # Decreased activity
    "*13":   0.5,   # Decreased activity
}

# TPMT Activity (CPIC guideline)
TPMT_ACTIVITY = {
    "*1":   1.0,   # Normal
    "*2":   0.0,   # No function
    "*3A":  0.0,   # No function
    "*3B":  0.0,   # No function
    "*3C":  0.0,   # No function
    "*4":   0.0,   # No function
}

# Master gene→activity table
GENE_ACTIVITY_TABLES = {
    "CYP2D6":  CYP2D6_ACTIVITY,
    "CYP2C19": CYP2C19_ACTIVITY,
    "CYP2C9":  CYP2C9_ACTIVITY,
    "SLCO1B1": SLCO1B1_ACTIVITY,
    "DPYD":    DPYD_ACTIVITY,
    "TPMT":    TPMT_ACTIVITY,
}


# ==========================================
# 4. VCF PARSER — FULL CLINICAL EXTRACTION
# ==========================================

def parse_vcf_in_memory(vcf_content: bytes) -> Dict:
    """Parse a clinical-grade VCF file completely in RAM.
    Extracts structured variant data per gene including genotype, star allele,
    functional consequence, CPIC level, and clinical significance."""

    vcf_text = vcf_content.decode('utf-8', errors='ignore')
    gene_variants: Dict[str, list] = {}
    all_variants: List[dict] = []

    for line in vcf_text.splitlines():
        if line.startswith("#"):
            continue

        parts = line.split('\t')
        if len(parts) < 10:
            continue

        chrom = parts[0]
        pos = parts[1]
        rsid = parts[2]
        ref = parts[3]
        alt = parts[4]
        qual = parts[5]
        filt = parts[6]
        info_str = parts[7]
        fmt = parts[8]
        sample = parts[9]

        # ── Parse INFO field ──
        info = {}
        for token in info_str.split(';'):
            if '=' in token:
                k, v = token.split('=', 1)
                info[k] = v
            else:
                info[token] = True

        # ── Parse FORMAT + SAMPLE fields ──
        fmt_keys = fmt.split(':')
        sample_vals = sample.split(':')
        gt_data = dict(zip(fmt_keys, sample_vals))

        genotype = gt_data.get('GT', '.')
        read_depth = int(gt_data.get('DP', '0'))
        geno_quality = int(gt_data.get('GQ', '0'))

        # ── Extract key annotations ──
        gene = info.get('GENE', info.get('gene', 'UNKNOWN'))
        star = info.get('STAR', info.get('star', ''))
        func = info.get('FUNC', info.get('func', ''))
        cpic = info.get('CPIC', info.get('cpic', ''))
        af_str = info.get('AF', '0')
        clnsig = info.get('CLNSIG', info.get('clnsig', ''))

        # Normalize star allele (ensure * prefix)
        if star and not star.startswith('*'):
            star = f'*{star}'

        variant = {
            'chrom': chrom,
            'pos': pos,
            'rsid': rsid if rsid != '.' else '',
            'ref': ref,
            'alt': alt,
            'qual': qual,
            'filter': filt,
            'gene': gene,
            'star': star,
            'func': func,
            'cpic': cpic,
            'af': af_str,
            'clnsig': clnsig,
            'genotype': genotype,
            'read_depth': read_depth,
            'geno_quality': geno_quality,
        }

        # Group by gene
        if gene not in gene_variants:
            gene_variants[gene] = []
        gene_variants[gene].append(variant)
        all_variants.append(variant)

    return {
        'gene_variants': gene_variants,
        'all_variants': all_variants,
        'genes_found': list(gene_variants.keys()),
        'total_count': len(all_variants),
    }


# ==========================================
# 5. DIPLOTYPE CALLER — GENOTYPE-AWARE
# ==========================================

def _is_alt(gt: str) -> str:
    """Classify genotype: 'hom_ref', 'het', 'hom_alt', or 'unknown'."""
    gt_clean = gt.replace('|', '/')
    if gt_clean in ('0/0', '0'):
        return 'hom_ref'
    elif gt_clean in ('0/1', '1/0'):
        return 'het'
    elif gt_clean in ('1/1',):
        return 'hom_alt'
    return 'unknown'


def call_diplotype(gene: str, variants: list) -> Tuple[str, str, float]:
    """Determine the diplotype for a gene from its observed variants.

    Uses the star allele annotations and genotypes from the VCF.
    Returns (diplotype_string, phenotype_string, activity_score).
    """

    activity_table = GENE_ACTIVITY_TABLES.get(gene, {})

    # Collect non-reference star alleles
    alt_alleles = []   # list of (star_allele, zygosity)
    for v in variants:
        zyg = _is_alt(v['genotype'])
        star = v.get('star', '')
        if not star:
            continue

        if zyg == 'het':
            alt_alleles.append((star, 'het'))
        elif zyg == 'hom_alt':
            alt_alleles.append((star, 'hom'))

    # ── Build diplotype ──
    if not alt_alleles:
        # All wild-type
        allele1, allele2 = '*1', '*1'
    else:
        # Prioritize highest-impact (lowest activity) alleles
        def allele_priority(item):
            star, _ = item
            return activity_table.get(star, 0.5)

        alt_alleles_sorted = sorted(alt_alleles, key=allele_priority)

        allele1 = '*1'
        allele2 = '*1'

        for star, zyg in alt_alleles_sorted:
            if zyg == 'hom':
                allele1 = star
                allele2 = star
                break  # Homozygous alt dominates
            elif zyg == 'het':
                if allele1 == '*1':
                    allele1 = star
                elif allele2 == '*1':
                    allele2 = star
                # Compound het — both already filled

    # ── Calculate activity score ──
    score1 = activity_table.get(allele1, 1.0)
    score2 = activity_table.get(allele2, 1.0)
    total_score = score1 + score2

    # ── Determine phenotype from activity score ──
    phenotype = _score_to_phenotype(gene, total_score)

    diplotype_str = f"{allele1}/{allele2}"
    return diplotype_str, phenotype, total_score


def _score_to_phenotype(gene: str, score: float) -> str:
    """Map total activity score to CPIC phenotype abbreviation.
    PM=Poor Metabolizer, IM=Intermediate, NM=Normal, RM=Rapid, URM=Ultra-rapid."""

    if gene == "CYP2D6":
        if score > 2.25:
            return "URM"
        elif score >= 1.25:
            return "NM"
        elif score > 0:
            return "IM"
        else:
            return "PM"

    elif gene == "CYP2C19":
        if score > 2.0:
            return "URM"
        elif score == 2.0:
            return "RM"
        elif score >= 1.0:
            return "NM"
        elif score > 0:
            return "IM"
        else:
            return "PM"

    elif gene in ("CYP2C9", "SLCO1B1", "DPYD", "TPMT"):
        if score >= 2.0:
            return "NM"
        elif score > 0:
            return "IM"
        else:
            return "PM"

    # Fallback
    if score >= 2.0:
        return "NM"
    elif score > 0:
        return "IM"
    return "PM"


# ==========================================
# 6. DRUG-GENE RISK ENGINE (CPIC-ALIGNED)
# ==========================================

# Maps drug → primary gene it's affected by
DRUG_GENE_MAP = {
    "WARFARIN":      "CYP2C9",
    "CLOPIDOGREL":   "CYP2C19",
    "OMEPRAZOLE":    "CYP2C19",
    "SERTRALINE":    "CYP2C19",
    "CODEINE":       "CYP2D6",
    "TAMOXIFEN":     "CYP2D6",
    "ONDANSETRON":   "CYP2D6",
    "SIMVASTATIN":   "SLCO1B1",
    "FLUOROURACIL":  "DPYD",
    "CAPECITABINE":  "DPYD",
}

def assess_drug_risk(drug: str, gene: str, phenotype: str, diplotype: str, activity_score: float):
    """CPIC-aligned risk assessment based on drug + actual patient phenotype.
    Phenotype codes: PM=Poor, IM=Intermediate, NM=Normal, RM=Rapid, URM=Ultra-rapid.
    Returns (risk_label, severity, confidence, recommendation)."""

    drug_upper = drug.upper().strip()

    # ── WARFARIN / CYP2C9 ──
    if drug_upper == "WARFARIN":
        if phenotype == "PM":
            return ("Toxic", "critical", 0.98,
                    f"Patient is CYP2C9 {diplotype} (Poor Metabolizer). S-warfarin clearance reduced ~90%. "
                    "Initiate at ≤ 1 mg/day. Monitor INR every 48h for 2 weeks. "
                    "Consider Apixaban or Rivaroxaban. CPIC Grade A recommendation.")
        elif phenotype == "IM":
            return ("Adjust Dosage", "high", 0.94,
                    f"Patient is CYP2C9 {diplotype} (Intermediate Metabolizer). S-warfarin clearance reduced ~40%. "
                    "Reduce initial dose by 25-50%. Intensify INR monitoring for first 2 weeks. "
                    "Target INR may be achieved at lower maintenance doses.")
        else:
            return ("Safe", "none", 0.92,
                    f"Patient is CYP2C9 {diplotype} (Normal Metabolizer). Standard warfarin metabolism expected. "
                    "Follow standard dosing nomogram. Routine INR monitoring applies.")

    # ── CLOPIDOGREL / CYP2C19 ──
    if drug_upper == "CLOPIDOGREL":
        if phenotype == "PM":
            return ("Toxic", "critical", 0.97,
                    f"Patient is CYP2C19 {diplotype} (Poor Metabolizer). Active metabolite formation < 5%. "
                    "Drug is therapeutically useless. Switch to Prasugrel 10mg or Ticagrelor 90mg BID. "
                    "MACE risk elevated ~3.5× on standard clopidogrel.")
        elif phenotype == "IM":
            return ("Adjust Dosage", "high", 0.93,
                    f"Patient is CYP2C19 {diplotype} (Intermediate Metabolizer). Reduced clopidogrel activation. "
                    "Consider alternative P2Y12 inhibitor (Prasugrel or Ticagrelor). "
                    "If clopidogrel is continued, consider higher loading dose with platelet function testing.")
        elif phenotype in ("URM", "RM"):
            return ("Safe", "none", 0.90,
                    f"Patient is CYP2C19 {diplotype} (Rapid/Ultra-rapid Metabolizer). Enhanced clopidogrel activation. "
                    "Standard or potentially enhanced antiplatelet effect. Monitor for bleeding signs.")
        else:
            return ("Safe", "none", 0.91,
                    f"Patient is CYP2C19 {diplotype} (Normal Metabolizer). Normal clopidogrel metabolism. "
                    "Standard 75mg daily dosing appropriate. No pharmacogenomic adjustment needed.")

    # ── OMEPRAZOLE / CYP2C19 ──
    if drug_upper == "OMEPRAZOLE":
        if phenotype in ("URM", "RM"):
            return ("Adjust Dosage", "moderate", 0.91,
                    f"Patient is CYP2C19 {diplotype} (Rapid/Ultra-rapid Metabolizer). Omeprazole cleared ~40% faster. "
                    "Increase dose to 40mg BID or switch to rabeprazole (less CYP2C19-dependent). "
                    "Verify H. pylori eradication with urea breath test at 4 weeks.")
        elif phenotype == "IM":
            return ("Safe", "none", 0.89,
                    f"Patient is CYP2C19 {diplotype} (Intermediate Metabolizer). Mildly increased omeprazole exposure. "
                    "Standard dosing appropriate. May see slightly enhanced acid suppression.")
        elif phenotype == "PM":
            return ("Adjust Dosage", "moderate", 0.93,
                    f"Patient is CYP2C19 {diplotype} (Poor Metabolizer). Omeprazole AUC increased 3-7×. "
                    "Consider 50% dose reduction for long-term use. Monitor for hypomagnesemia.")
        else:
            return ("Safe", "none", 0.88,
                    f"Patient is CYP2C19 {diplotype} (Normal Metabolizer). Standard omeprazole metabolism. "
                    "No dosage adjustment required.")

    # ── SERTRALINE / CYP2C19 ──
    if drug_upper == "SERTRALINE":
        if phenotype == "PM":
            return ("Adjust Dosage", "moderate", 0.87,
                    f"Patient is CYP2C19 {diplotype} (Poor Metabolizer). Sertraline exposure increased ~40%. "
                    "Consider 50% dose reduction. Monitor for serotonergic side effects. "
                    "Escitalopram is an alternative with less CYP2C19 dependence.")
        elif phenotype in ("URM", "RM"):
            return ("Adjust Dosage", "low", 0.85,
                    f"Patient is CYP2C19 {diplotype} (Rapid/Ultra-rapid Metabolizer). Faster sertraline clearance. "
                    "May need dose increase if subtherapeutic response. Monitor at 4-6 weeks.")
        else:
            return ("Safe", "none", 0.92,
                    f"Patient is CYP2C19 {diplotype} (Normal Metabolizer). Standard sertraline metabolism. "
                    "No dosage adjustment required. Standard prescribing guidelines apply.")

    # ── CODEINE / CYP2D6 ──
    if drug_upper == "CODEINE":
        if phenotype == "URM":
            return ("Toxic", "critical", 0.96,
                    f"Patient is CYP2D6 {diplotype} (Ultra-rapid Metabolizer). Ultra-rapid O-demethylation produces "
                    "dangerously high morphine levels (50-75% above expected). Avoid codeine entirely. "
                    "Use non-opioid analgesics. FDA Black Box Warning applies.")
        elif phenotype == "PM":
            return ("Adjust Dosage", "high", 0.95,
                    f"Patient is CYP2D6 {diplotype} (Poor Metabolizer). Cannot convert codeine to morphine. "
                    "Drug is therapeutically ineffective for analgesia. "
                    "Use alternative analgesics (tramadol is also CYP2D6-dependent — avoid).")
        elif phenotype == "IM":
            return ("Adjust Dosage", "moderate", 0.90,
                    f"Patient is CYP2D6 {diplotype} (Intermediate Metabolizer). Reduced morphine formation. "
                    "May experience suboptimal analgesia. Consider non-opioid alternatives. "
                    "If codeine used, monitor effectiveness closely.")
        else:
            return ("Safe", "none", 0.89,
                    f"Patient is CYP2D6 {diplotype} (Normal Metabolizer). Normal codeine-to-morphine conversion. "
                    "Standard dosing appropriate. Monitor for standard opioid side effects.")

    # ── TAMOXIFEN / CYP2D6 ──
    if drug_upper == "TAMOXIFEN":
        if phenotype == "PM":
            return ("Toxic", "high", 0.94,
                    f"Patient is CYP2D6 {diplotype} (Poor Metabolizer). Cannot convert tamoxifen to endoxifen. "
                    "Therapeutic efficacy severely compromised. Switch to aromatase inhibitor "
                    "(anastrozole, letrozole) in postmenopausal patients.")
        elif phenotype == "IM":
            return ("Adjust Dosage", "moderate", 0.89,
                    f"Patient is CYP2D6 {diplotype} (Intermediate Metabolizer). Reduced endoxifen formation (~40% of normal). "
                    "Standard dose acceptable with therapeutic drug monitoring. "
                    "Measure endoxifen at 3 months; if < 5.97 ng/mL, consider aromatase inhibitor switch.")
        else:
            return ("Safe", "none", 0.87,
                    f"Patient is CYP2D6 {diplotype} (Normal Metabolizer). Normal tamoxifen-to-endoxifen conversion. "
                    "Standard dosing appropriate. Routine endoxifen monitoring optional.")

    # ── ONDANSETRON / CYP2D6 ──
    if drug_upper == "ONDANSETRON":
        if phenotype == "URM":
            return ("Adjust Dosage", "moderate", 0.85,
                    f"Patient is CYP2D6 {diplotype} (Ultra-rapid Metabolizer). May have reduced ondansetron efficacy. "
                    "Consider increased dose or alternative anti-emetic (granisetron).")
        else:
            return ("Safe", "none", 0.85,
                    f"Patient is CYP2D6 {diplotype} ({phenotype}). Ondansetron exposure within therapeutic window. "
                    "Anti-emetic efficacy preserved. Standard 4-8mg dosing appropriate.")

    # ── SIMVASTATIN / SLCO1B1 ──
    if drug_upper == "SIMVASTATIN":
        if phenotype == "PM":
            return ("Toxic", "high", 0.95,
                    f"Patient is SLCO1B1 {diplotype} (Poor Function). Plasma simvastatin acid AUC increased ~3-fold. "
                    "High risk of myopathy/rhabdomyolysis. Avoid simvastatin or limit to ≤ 20 mg/day. "
                    "Prefer Rosuvastatin or Pravastatin (OATP1B1-independent).")
        elif phenotype == "IM":
            return ("Adjust Dosage", "moderate", 0.94,
                    f"Patient is SLCO1B1 {diplotype} (Intermediate Function). Reduced hepatic uptake transporter activity. "
                    "Limit simvastatin to ≤ 20 mg/day. Monitor CK levels at 4 and 12 weeks. "
                    "Consider alternative statins if higher doses needed.")
        else:
            return ("Safe", "none", 0.90,
                    f"Patient is SLCO1B1 {diplotype} (Normal Function). Normal hepatic statin uptake. "
                    "Standard simvastatin dosing appropriate up to 40-80 mg/day.")

    # ── FLUOROURACIL / DPYD ──
    if drug_upper == "FLUOROURACIL":
        if phenotype == "PM":
            return ("Toxic", "critical", 0.99,
                    f"Patient is DPYD {diplotype} (DPD Deficient). CONTRAINDICATED. Zero DPD activity causes "
                    "fatal 5-FU accumulation with grade 4 mucositis, neutropenia, and neurotoxicity. "
                    "Use irinotecan-based or platinum-based alternatives. Refer to oncology PGx board.")
        elif phenotype == "IM":
            return ("Adjust Dosage", "high", 0.96,
                    f"Patient is DPYD {diplotype} (Intermediate DPD Activity). Reduced DPD activity increases 5-FU toxicity risk. "
                    "Reduce starting dose by 25-50%. Intensive monitoring for toxicity required. "
                    "Dose escalation only if tolerated after first cycle.")
        else:
            return ("Safe", "none", 0.93,
                    f"Patient is DPYD {diplotype} (Normal DPD Activity). Normal DPD-mediated 5-FU catabolism. "
                    "Standard dosing per BSA-based nomogram. Routine toxicity monitoring applies.")

    # ── CAPECITABINE / DPYD ──
    if drug_upper == "CAPECITABINE":
        if phenotype == "PM":
            return ("Toxic", "critical", 0.99,
                    f"Patient is DPYD {diplotype} (DPD Deficient). CONTRAINDICATED. Capecitabine is a 5-FU prodrug. "
                    "Zero DPD activity produces identical lethal toxicity profile as direct 5-FU. "
                    "Use alternative chemotherapy regimens. Discuss with oncology tumor board.")
        elif phenotype == "IM":
            return ("Adjust Dosage", "high", 0.96,
                    f"Patient is DPYD {diplotype} (Intermediate DPD Activity). Reduced DPD activity. "
                    "Reduce capecitabine starting dose by 25-50%. Monitor closely for hand-foot syndrome, "
                    "diarrhea, and myelosuppression.")
        else:
            return ("Safe", "none", 0.93,
                    f"Patient is DPYD {diplotype} (Normal DPD Activity). Normal DPD activity confirmed. "
                    "Standard capecitabine dosing appropriate.")

    # ── DEFAULT ──
    return ("Safe", "none", 0.50,
            f"No CPIC guideline match for {drug} / {gene}. Standard dosing recommended. "
            "Consult clinical pharmacist if concerns exist.")


# ==========================================
# 7. CONTROLLER: API ENTRY POINT
# ==========================================

@app.post("/api/v1/pgx/analyze", response_model=PgxAnalysisResponseDto)
async def analyze_patient_data(
    file: Optional[UploadFile] = File(None),
    drug: Optional[str] = Form(None)
):
    # ── Input validation ──
    if not file and not drug:
        return JSONResponse(status_code=400, content={"detail": "Both VCF file and drug name are required."})
    if not file:
        return JSONResponse(status_code=400, content={"detail": "Upload genome file."})
    if not drug:
        return JSONResponse(status_code=400, content={"detail": "Input drug name."})

    try:
        # ── 1. Parse VCF in memory ──
        file_content = await file.read()
        parsed = parse_vcf_in_memory(file_content)
        gene_variants = parsed['gene_variants']
        all_variants = parsed['all_variants']

        # ── 2. Identify the primary gene for this drug ──
        drug_upper = drug.upper().strip()
        primary_gene = DRUG_GENE_MAP.get(drug_upper, "UNKNOWN")

        # ── 3. Call diplotype from patient's actual genotype data ──
        if primary_gene in gene_variants:
            gene_vars = gene_variants[primary_gene]
            diplotype, phenotype, activity_score = call_diplotype(primary_gene, gene_vars)
        else:
            # Gene not found in VCF — assume wild-type
            diplotype = "*1/*1"
            phenotype = _score_to_phenotype(primary_gene, 2.0)
            activity_score = 2.0
            gene_vars = []

        # ── 4. Assess drug risk based on actual phenotype ──
        risk_label, severity, confidence, recommendation = assess_drug_risk(
            drug, primary_gene, phenotype, diplotype, activity_score
        )

        # ── 5. Build detected variants list (for the primary gene) ──
        detected_variants = []
        for v in gene_vars:
            detected_variants.append(DetectedVariantDto(
                rsid=v.get('rsid', '.'),
            ))

        # ── 6. Generate AI explanation using Gemini ──
        prompt = f"""Act as a Pharmacogenomics AI Assistant providing a clinical report.

Patient Pharmacogenomic Data:
- Drug: {drug}
- Primary Gene: {primary_gene}
- Diplotype: {diplotype}
- Phenotype: {phenotype}
- Activity Score: {activity_score}
- Risk Level: {risk_label} (Severity: {severity})
- Detected Variants (genotypes from VCF):
{chr(10).join(f"  - {v.get('rsid','.')} ({v.get('star','?')}) GT={v.get('genotype','.')} FUNC={v.get('func','?')} CLNSIG={v.get('clnsig','?')}" for v in gene_vars[:10])}

Clinical Recommendation: {recommendation}

Based on the above pharmacogenomic profile, provide a concise 3-sentence explanation:
- Sentence 1: Explain what the patient's {primary_gene} {diplotype} genotype means at the molecular level, referencing the activity score of {activity_score}.
- Sentence 2: Explain how this specific genotype affects {drug}'s metabolism, efficacy, or safety.
- Sentence 3: State the clinical action required.
Be precise. Reference the actual diplotype and phenotype. Do not invent data."""

        try:
            llm_response = llm_model.generate_content(prompt)
            llm_text = llm_response.text.strip() if llm_response and llm_response.text else "AI explanation unavailable."
        except Exception:
            llm_text = (
                f"The patient's {primary_gene} genotype is {diplotype}, classified as {phenotype} "
                f"with an activity score of {activity_score}. "
                f"For {drug}, this means: {recommendation}"
            )

        # ── 7. Return structured response ──
        patient_id = f"PG-{uuid.uuid4().hex[:8].upper()}"

        return PgxAnalysisResponseDto(
            patient_id=patient_id,
            drug=drug.strip(),
            timestamp=datetime.utcnow().isoformat() + "Z",
            risk_assessment=RiskAssessmentDto(
                risk_label=risk_label,
                confidence_score=confidence,
                severity=severity
            ),
            pharmacogenomic_profile=PharmacogenomicProfileDto(
                primary_gene=primary_gene,
                diplotype=diplotype,
                phenotype=phenotype,
                detected_variants=detected_variants
            ),
            clinical_recommendation=ClinicalRecommendationDto(
                recommendation=recommendation
            ),
            llm_generated_explanation=LlmExplanationDto(
                summary=llm_text
            ),
            quality_metrics=QualityMetricsDto(
                vcf_parsing_success=len(all_variants) > 0
            )
        )

    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})


# ==========================================
# 8. SCHEMA VERIFICATION PANEL
# ==========================================

EXPECTED_SCHEMA = {
    "patient_id": "PG-XXXXXXXX",
    "drug": "DRUG_NAME",
    "timestamp": "ISO8601_timestamp",
    "risk_assessment": {
        "risk_label": "Safe|Adjust Dosage|Toxic",
        "confidence_score": 0.0,
        "severity": "none|low|moderate|high|critical"
    },
    "pharmacogenomic_profile": {
        "primary_gene": "GENE_SYMBOL",
        "diplotype": "*X/*Y",
        "phenotype": "PM|IM|NM|RM|URM|Unknown",
        "detected_variants": [{"rsid": "rsXXXX"}]
    },
    "clinical_recommendation": {
        "recommendation": "..."
    },
    "llm_generated_explanation": {
        "summary": "..."
    },
    "quality_metrics": {
        "vcf_parsing_success": True
    }
}

VALID_RISK_LABELS = {"Safe", "Adjust Dosage", "Toxic"}
VALID_SEVERITIES = {"none", "low", "moderate", "high", "critical"}
VALID_PHENOTYPES = {"PM", "IM", "NM", "RM", "URM", "Unknown"}


@app.get("/api/v1/pgx/schema")
async def get_expected_schema():
    """Return the expected JSON response schema for reference."""
    return EXPECTED_SCHEMA


@app.post("/api/v1/pgx/verify")
async def verify_json_format(
    file: Optional[UploadFile] = File(None),
    drug: Optional[str] = Form(None)
):
    """Run analysis and then verify the JSON output matches the expected schema.
    Returns the analysis result plus a verification report."""

    # First run the actual analysis
    if not file or not drug:
        return JSONResponse(status_code=400, content={"detail": "Both VCF file and drug name are required."})

    file_content = await file.read()

    # Re-create an UploadFile-like object for the analyze function
    from io import BytesIO
    from starlette.datastructures import UploadFile as StarletteUpload
    from starlette.datastructures import Headers

    temp_file = StarletteUpload(
        filename=file.filename or "upload.vcf",
        file=BytesIO(file_content),
        headers=Headers({"content-type": "application/octet-stream"})
    )

    # Call the analyze endpoint logic
    result = await analyze_patient_data(file=temp_file, drug=drug)

    # Convert Pydantic model to dict
    if hasattr(result, 'model_dump'):
        result_dict = result.model_dump()
    elif hasattr(result, 'dict'):
        result_dict = result.dict()
    else:
        return JSONResponse(status_code=500, content={"detail": "Could not serialize response"})

    # ── VERIFY each field ──
    checks = []

    def check(name, passed, expected, actual):
        checks.append({
            "field": name,
            "status": "✅ PASS" if passed else "❌ FAIL",
            "expected": expected,
            "actual": str(actual)
        })

    # Top-level keys
    required_keys = ["patient_id", "drug", "timestamp", "risk_assessment",
                     "pharmacogenomic_profile", "clinical_recommendation",
                     "llm_generated_explanation", "quality_metrics"]
    for key in required_keys:
        check(f"top.{key}", key in result_dict, "present", "present" if key in result_dict else "MISSING")

    # patient_id format
    pid = result_dict.get("patient_id", "")
    check("patient_id.format", pid.startswith("PG-"), "PG-XXXXXXXX", pid)

    # risk_assessment
    ra = result_dict.get("risk_assessment", {})
    check("risk_assessment.risk_label", ra.get("risk_label") in VALID_RISK_LABELS,
          "Safe|Adjust Dosage|Toxic", ra.get("risk_label"))
    check("risk_assessment.confidence_score", isinstance(ra.get("confidence_score"), (int, float)),
          "float", type(ra.get("confidence_score")).__name__)
    check("risk_assessment.severity", ra.get("severity") in VALID_SEVERITIES,
          "none|low|moderate|high|critical", ra.get("severity"))

    # pharmacogenomic_profile
    pp = result_dict.get("pharmacogenomic_profile", {})
    check("profile.primary_gene", isinstance(pp.get("primary_gene"), str) and len(pp.get("primary_gene", "")) > 0,
          "GENE_SYMBOL", pp.get("primary_gene"))
    check("profile.diplotype", isinstance(pp.get("diplotype"), str) and "/" in pp.get("diplotype", ""),
          "*X/*Y", pp.get("diplotype"))
    check("profile.phenotype", pp.get("phenotype") in VALID_PHENOTYPES,
          "PM|IM|NM|RM|URM|Unknown", pp.get("phenotype"))

    # detected_variants
    dv = pp.get("detected_variants", [])
    check("profile.detected_variants", isinstance(dv, list) and len(dv) > 0,
          "non-empty list", f"list[{len(dv)}]")
    if dv:
        first = dv[0]
        check("variant[0].rsid", isinstance(first, dict) and "rsid" in first,
              '{"rsid": "rsXXXX"}', first)
        # Verify NO extra fields (should only have rsid)
        extra_fields = [k for k in first.keys() if k != "rsid"] if isinstance(first, dict) else []
        check("variant[0].no_extra_fields", len(extra_fields) == 0,
              "only rsid", f"extra: {extra_fields}" if extra_fields else "only rsid")

    # No activity_score in profile
    check("profile.no_activity_score", "activity_score" not in pp,
          "absent", "PRESENT" if "activity_score" in pp else "absent")

    # clinical_recommendation
    cr = result_dict.get("clinical_recommendation", {})
    check("recommendation.present", isinstance(cr.get("recommendation"), str) and len(cr.get("recommendation", "")) > 0,
          "non-empty string", f"{len(cr.get('recommendation', ''))} chars")

    # llm_generated_explanation
    le = result_dict.get("llm_generated_explanation", {})
    check("llm_explanation.summary", isinstance(le.get("summary"), str) and len(le.get("summary", "")) > 0,
          "non-empty string", f"{len(le.get('summary', ''))} chars")

    # quality_metrics
    qm = result_dict.get("quality_metrics", {})
    check("quality.vcf_parsing_success", isinstance(qm.get("vcf_parsing_success"), bool),
          "boolean", type(qm.get("vcf_parsing_success")).__name__)

    # No extra keys in quality_metrics
    qm_extra = [k for k in qm.keys() if k != "vcf_parsing_success"]
    check("quality.no_extra_fields", len(qm_extra) == 0,
          "only vcf_parsing_success", f"extra: {qm_extra}" if qm_extra else "only vcf_parsing_success")

    # Summary
    total = len(checks)
    passed = sum(1 for c in checks if "PASS" in c["status"])
    failed = total - passed

    return {
        "verification_summary": {
            "total_checks": total,
            "passed": passed,
            "failed": failed,
            "verdict": "✅ ALL CHECKS PASSED" if failed == 0 else f"❌ {failed} CHECK(S) FAILED"
        },
        "checks": checks,
        "actual_response": result_dict,
        "expected_schema": EXPECTED_SCHEMA
    }
