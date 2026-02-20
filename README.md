<div align="center">

# 🧬 PharmaGuard

**Pharmacogenomics AI Tool for Precision Medicine & Safer Dosing.**

[![RIFT '26](https://img.shields.io/badge/Hackathon-RIFT_'26-7224ff.svg?style=for-the-badge)](https://rift.hackathon.com)
[![Team](https://img.shields.io/badge/Team-Squirtle_Squad-00cba9.svg?style=for-the-badge)]()
[![Python](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)]()
[![React](https://img.shields.io/badge/Frontend-React_Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)]()
[![Gemini](https://img.shields.io/badge/AI-Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)]()

<br />

> **PharmaGuard bridges the gap between complex genetic data and clinical decision-making.** It analyses patient DNA against specific drug profiles to predict adverse reactions and provide explainable, guideline-aligned dosing recommendations using Google Gemini.

### 🔗 Important Links
**[Live Demo URL]**([Insert Live Demo URL Here]) · **[LinkedIn Video Link]**([Insert LinkedIn Video Link Here])

</div>

---

## 📸 Project UI/UX Showcase

| **1. Genetic Data Input** | **2. AI-Powered Dosing Analysis** |
| :---: | :---: |
| _Upload patient data and specify the target medication._ | _Gemini-generated summaries of genetic risks aligned with CPIC guidelines._ |
| ![Input Screen Placeholder](./assets/demo (4).png) | ![Results Screen Placeholder](./assets/demo (1).png) |

---

## ✨ Key Features

* **🧬 Genetic Parsing:** Efficiently processes patient genetic profiles and variant data utilizing a robust **Python** backend.
* **🎯 Targeted Analysis:** Focuses on critical pharmacokinetic genes responsible for metabolizing medications.
* **🧠 Explainable AI (XAI):** Powered by the **Google Gemini API** to generate clear, natural language explanations for *why* a specific dose is recommended based on the patient's unique genetics.
* **✅ Guideline Integration:** Dosing recommendations are mapped to established clinical safety guidelines.

---

## 🛠️ Local Setup

Follow these instructions to get PharmaGuard running on your local machine.

### ⚡ Quick Start

**Backend (Python/FastAPI):**
```bash
# 1. Clone the repo
git clone <repo_url>
cd PharmaGuard_SquirtleSquad

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set up Environment
# Create a .env file and add your GEMINI_API_KEY

# 4. Run Server
uvicorn main:app --reload
```

**Frontend (React/Vite):**
```bash
cd frontend
npm install
npm run dev
```

---

### 🐢 The Squirtle Squad
Built with caffeine and code for RIFT '26.

* **Prajjawal Vaishya** - Team Leader & Frontend Development
* **Rudra Tomar** - Backend & API Architecture
* **Vivek Jaiswal** - AI Integration & Prompt Engineering

<div align="center">
<sub>Not for actual clinical use—this is a hackathon prototype.</sub>
</div>