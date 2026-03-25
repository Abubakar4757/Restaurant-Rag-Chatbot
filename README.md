# 🍽️ Restaurant RAG Chatbot (Luigi's Assistant)

A full-stack, AI-powered customer service chatbot featuring Retrieval-Augmented Generation (RAG). Built horizontally from scratch, this system allows restaurant owners to effortlessly upload menus, policy documents, and training manuals into a local vector database, granting the AI perfect context to flawlessly answer any specific customer query.

## 🌟 Features
- **Smart Context Retrieval (RAG):** Answers are grounded strictly in your uploaded PDF or DOCX files.
- **Real-Time Database Management:** Upload or delete menus straight from the Admin Panel; the Vector Database auto-updates.
- **Fallback Intelligence:** Smoothly admits when it doesn't know an out-of-scope answer instead of hallucinating.
- **Premium Glassmorphic UI:** A top-tier, responsive React application styled deeply with Tailwind CSS, Markdown formatting, sliding Toasts, and custom typing physics.

## 🛠️ Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, Axios, React Markdown, Hot Toast
- **Backend:** Python, FastAPI, Uvicorn 
- **AI/Vector:** Langchain, ChromaDB, HuggingFace (`all-MiniLM-L6-v2`), Groq LLM (`llama-3.1-8b-instant`)

---

## ⚡ Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/restaurant-rag-chatbot.git
cd restaurant-rag-chatbot
```

### 2. Configure the Backend (FastAPI)
```bash
cd backend
# Create a virtual environment (optional but recommended)
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Create your `.env` file containing your Groq API key:
echo GROQ_API_KEY=your_key_here > .env

# Run the FastAPI server
uvicorn main:app --reload
```
*The backend runs at `http://127.0.0.1:8000`*

### 3. Configure the Frontend (React)
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*The React app runs at `http://localhost:5173`*

---

## 🚀 Cloud Deployment

### Step 1: Push to GitHub
Upload this codebase to your GitHub account (the `.gitignore` automatically prevents your API key and vector databases from uploading).

### Step 2: Deploy React Frontend to Vercel
1. Log in to [Vercel](https://vercel.com/) and click **Add New Project**.
2. Import your GitHub repository.
3. Because the React App is housed inside the `frontend` folder, change the **Root Directory** to `frontend`.
4. Click **Deploy**. Vercel will auto-detect Vite and publish your beautiful UI in seconds!

### Step 3: Deploy FastAPI Backend to Render
Because our RAG pipeline runs *ChromaDB* (which writes vectorized data directly to the disk), we cannot use serverless platforms like Vercel for the backend. We use Render.com instead.

1. Log in to [Render.com](https://render.com/) and go to the **Blueprints** tab.
2. Click **New Blueprint Instance** and connect your GitHub repository.
3. Render will instantly read the `render.yaml` file provided in this repository and automatically provision a server alongside a mapped Persistent Disk (`/data`) for your documents.
4. Go to your new backend service's **Environment** tab on Render and paste your `GROQ_API_KEY`.
5. Once deployed, copy your Render server URL (e.g., `https://restaurant-rag-backend.onrender.com`).

### Step 4: Final Connection
Return to your frontend code (`frontend/src/api.js`) and replace `http://127.0.0.1:8000` with your new Render URL. Push that tiny change to GitHub, and Vercel will instantly re-sync your app! You're completely live! 🎉
