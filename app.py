import streamlit as st
import json
from backend.vcf_parser import parse_vcf
from backend.llm_engine import generate_risk_json

# Configure the page
st.set_page_config(
    page_title="PharmaGuard",
    page_icon="🧬",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for dark theme adjustments if needed, though config.toml handles base theme
st.markdown("""
<style>
    .stApp {
        background-color: #0E1117;
        color: #FAFAFA;
    }
</style>
""", unsafe_allow_html=True)

st.title("PharmaGuard 🧬")
st.markdown("### Pharmacogenomics AI Tool")

# Sidebar for inputs
with st.sidebar:
    st.header("Input Data")
    uploaded_file = st.file_uploader("Upload VCF File", type=["vcf"])
    
    # Multiselect for drugs
    drugs = st.multiselect(
        "Select Drugs for Analysis",
        ["Warfarin", "Clopidogrel", "Simvastatin", "Tamoxifen", "Fluorouracil", "Capecitabine"],
        help="Select one or more drugs to screen against the patient's genetic data."
    )
    
    analyze_btn = st.button("Analyze Risk", type="primary")

# Main content area
if uploaded_file and drugs and analyze_btn:
    st.divider()
    with st.spinner("Parsing VCF and generating risk assessment..."):
        # Read file content
        vcf_content = uploaded_file.getvalue().decode("utf-8")
        
        # 1. Parse VCF
        patient_data = parse_vcf(vcf_content)
        
        # 2. Generate Report for each drug
        results = []
        for drug in drugs:
            risk_info = generate_risk_json(patient_data, drug)
            results.append(risk_info)
            
        # Display results
        st.subheader("Risk Assessment Results")
        
        for res in results:
            # Color-coded result display
            if "status" in res:
                color = res.get("color", "gray")
                st.markdown(f"#### {res.get('drug', 'Unknown Drug')}")
                st.info(f"**Risk Level:** {res.get('status', 'Unknown')}")
                st.json(res)
            else:
                st.error(f"Failed to generate analysis for {res.get('drug', 'one of the selected drugs')}")

elif not uploaded_file:
    st.info("Please upload a VCF file to begin.")
elif not drugs:
    st.info("Please select at least one drug.")
