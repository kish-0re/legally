# ⚖️ Legally (Hackathon Prototype)

A web-based AI assistant that **demystifies legal documents**.  
Upload or scan a document → OCR extracts text → Gemini AI summarizes and highlights risks.  
Also includes a **Learn with cases** for gamified legal learning.  

---

## 🚀 Features
- 📂 Upload or scan PDF/images  
- 🔎 Extracts text using **Google Document AI (OCR)**  
- 🤖 Analyzes content with **Vertex AI – Gemini model**  
- ⚠️ Detects risky clauses (red flags)  
- 🎚️ Multi-perspective readability toggle *(planned)*  
- 💬 Ask follow-up questions *(planned)*  
- 🎮 **Learn with cases** → real-world cases simplified for everyone  

---

## 🛠️ Tech Stack
- **Frontend:** HTML, CSS, JavaScript  
- **Backend:** Node.js + Express, Multer, Axios, dotenv  
- **Google Cloud:** Document AI, Vertex AI (Gemini)  
- **Other:** Git/GitHub, PowerPoint (demo presentation)  

---

## ⚡ Setup Instructions

### 1. Clone repo
```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>/backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
- Copy `.env.example` → `.env`  
- Fill in your Google Cloud values:
```
PROJECT_ID=your-project-id
LOCATION=us
PROCESSOR_ID=your-processor-id
API_KEY=your-vertex-ai-api-key
GOOGLE_APPLICATION_CREDENTIALS=./gcloud-key.json
```

⚠️ Note: Add your own **gcloud-key.json** (service account key).  
This file is **NOT included** in the repo for security.  

### 4. Run backend
```bash
node server.js
```
Visit: [http://localhost:3000] 

---

## 📌 Disclaimer
This is a **hackathon demo project**, not a production app.  
- The AI outputs are currently in **raw text** format.  
- Some features (follow-up Q&A, JSON formatting, gamified quizzes) are **work-in-progress**.  
- Credentials/secrets are hidden in `.env` for safety.  

---

## 👥 Team
- Raj Kishore (Team Leader)  
- Team: Holy-Knights  
- Built for **GenAI Exchange Hackathon**  
