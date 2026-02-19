<div align="center">

# 🧬 PharmaGuard

**Pharmacogenomics AI Tool for Precision Medicine & Safer Dosing.**

[![RIFT '26](https://img.shields.io/badge/Hackathon-RIFT_'26-7224ff.svg?style=for-the-badge)](https://rift.hackathon.com)
[![Team](https://img.shields.io/badge/Team-Squirtle_Squad-00cba9.svg?style=for-the-badge)]()
[![Java](https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)]()
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

* **🧬 Genetic Parsing:** Efficiently processes patient genetic profiles and variant data utilizing a robust Java backend.
* **🎯 Targeted Analysis:** Focuses on critical pharmacokinetic genes responsible for metabolizing medications.
* **🧠 Explainable AI (XAI):** Powered by the **Google Gemini API** to generate clear, natural language explanations for *why* a specific dose is recommended based on the patient's unique genetics.
* **✅ Guideline Integration:** Dosing recommendations are mapped to established clinical safety guidelines.

---

## 🛠️ Local Setup

Follow these instructions to get PharmaGuard running on your local machine. 

### ⚡ Quick Start (Windows)

For a fast, one-click setup, simply run the provided batch script:
1. Double-click `setup_project.bat`.
2. Wait for the success message.
3. Your isolated environment is ready!

### ⚙️ Manual Setup (Java/Maven)

If you prefer manual installation or are using a different OS, ensure you have Java (JDK 17+) and Maven installed:

**1. Clone the repository**
```bash
git clone <repo_url>
cd PharmaGuard_SquirtleSquad
```

**2. Configure Environment Variables**
Copy the example environment file to set up your API credentials.

```bash
cp .env.example .env
```

Open `.env` (or your `application.properties` file if using Spring Boot) and add your Google Gemini API key:

```env
GEMINI_API_KEY=your_actual_api_key_here
```

**3. Build the Project**
Use Maven to download dependencies and compile the application.

```bash
mvn clean install
```

**4. Run the Application**
Start the Java backend server.

```bash
# If using standard Java:
java -jar target/pharmaguard-1.0.jar

# If using Spring Boot:
mvn spring-boot:run
```

---

### 🐢 The Squirtle Squad
Built with caffeine and code for RIFT '26.

* **Prajjawal Vaishya** - [Role/Contribution]
* **[Member Name 2]** - Backend Logic & Java Architecture
* **[Member Name 3]** - AI Integration & Pharmacogenomics Research

<div align="center">
<sub>Not for actual clinical use—this is a hackathon prototype.</sub>
</div>