# PharmaGuard 🧬

Pharmacogenomics AI Tool for Hackathon.

## Live Demo URL
[Insert Live Demo URL Here]

## LinkedIn Video Link
[Insert LinkedIn Video Link Here]

## Local Setup

1. **Clone the repository**
   ```bash
   git clone <repo_url>
   cd PharmaGuard_SquirtleSquad
   ```

2. **Install dependencies**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure Environment**
   - Copy `.env.example` to `.env`
   - Add your Gemini API key to `.env`:
     ```
     GEMINI_API_KEY=your_actual_api_key
     ```

4. **Run the Application**
   ```bash
   streamlit run app.py
   ```