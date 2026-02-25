# 🛡️ CyberShield — Cyberbullying Detection & ML Analysis

A full-stack web app for cyberbullying detection using comparative machine learning. Trains and compares 6 model configurations (TF-IDF / Word Embeddings × Naive Bayes / SVM / Logistic Regression), provides real-time prediction with alert popups, and supports email notifications.

---

## 📁 Project Structure

```
project/
├── backend/                    # FastAPI backend
│   ├── main.py                 # App entry point
│   ├── routes.py               # API endpoints
│   ├── ml_pipeline.py          # ML model training & prediction
│   ├── data_loader.py          # Dataset loading & preprocessing
│   ├── email_service.py        # SMTP email alert service
│   └── requirements.txt        # Python dependencies
├── frontend/                   # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx             # Main app with routing
│   │   ├── api.js              # API client functions
│   │   ├── index.css           # Design system & styles
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx   # Overview & dataset stats
│   │   │   ├── Training.jsx    # Model training interface
│   │   │   ├── Comparison.jsx  # Charts & leaderboard
│   │   │   ├── Predict.jsx     # Live prediction + all-model comparison
│   │   │   └── Settings.jsx    # Email configuration
│   │   └── components/
│   │       └── AlertModal.jsx  # Cyberbullying alert popup
│   └── package.json
├── cyberbullying_dataset_1.csv # Dataset 1
└── cyberbullying_dataset_2.csv # Dataset 2
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.9+**
- **Node.js 18+**

### 1. Backend Setup

```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the backend server
python main.py
```

The API will be running at **http://localhost:8000**  
API docs available at **http://localhost:8000/docs**

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be running at **http://localhost:5173**

---

## 🧪 How to Use

### Step 1 — Train Models
1. Open http://localhost:5173
2. Go to **Training** page (🧠 in sidebar)
3. Select a dataset (Combined recommended)
4. Click **🚀 Train All Models**
5. Wait for all 6 models to finish training

### Step 2 — Compare Models
- Go to **Comparison** page (📈) to see:
  - 🏆 Leaderboard ranked by F1 Score
  - 📊 Bar chart, 🕸️ radar, and ⚡ efficiency plots

### Step 3 — Live Prediction
1. Go to **Predict** page (🔍)
2. Type or select a sample text
3. Choose a trained model → click **Analyze**
4. If cyberbullying is detected → **🚨 Alert popup** appears
5. An **all-models comparison table** shows results from every trained model

### Step 4 — Email Alerts (Optional)
1. Go to **Settings** page (⚙️)
2. Fill in SMTP details:
   - **Gmail**: Host = `smtp.gmail.com`, Port = `587`, TLS = ✅
   - Use a [Gmail App Password](https://myaccount.google.com/apppasswords)
3. Click **Save Configuration**
4. When a cyberbullying alert popup appears, click **📧 Send Email Alert**

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/datasets` | Dataset statistics |
| GET | `/api/models` | Available model configurations |
| POST | `/api/train` | Train a single model |
| POST | `/api/train-all` | Train all 6 models |
| POST | `/api/predict` | Predict with one model |
| POST | `/api/predict-all` | Predict with all trained models |
| GET | `/api/results` | Cached comparison results |
| GET | `/api/email/config` | Get email config (masked) |
| POST | `/api/email/config` | Save SMTP email config |
| POST | `/api/email/send-alert` | Send cyberbullying alert email |

---

## 🤖 Model Configurations

| # | Model | Feature Method | Description |
|---|-------|---------------|-------------|
| 1 | Naive Bayes | TF-IDF | Multinomial NB — fast probabilistic baseline |
| 2 | SVM | TF-IDF | Linear SVM — strong margin classifier |
| 3 | Logistic Regression | TF-IDF | Interpretable linear model |
| 4 | Naive Bayes | Word Embeddings (LSA) | Gaussian NB with dense semantic vectors |
| 5 | SVM | Word Embeddings (LSA) | SVM with semantic embeddings |
| 6 | Logistic Regression | Word Embeddings (LSA) | LR with semantic embeddings |

---

## 🛠️ Tech Stack

- **Backend**: Python, FastAPI, scikit-learn, pandas, NumPy
- **Frontend**: React 19, Vite 6, Recharts
- **ML**: TF-IDF, LSA/SVD embeddings, MultinomialNB, GaussianNB, LinearSVC, LogisticRegression
