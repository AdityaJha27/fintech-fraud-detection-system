# FinTech Fraud Detection System

A production-level fraud detection platform built with ensemble ML models, explainable AI, and a full-stack React dashboard.

![Dashboard Preview](screenshots/dashboard.png)

## Live Demo
> Coming soon after deployment

## Features

- **Real-Time Fraud Detection** — Analyze any transaction using XGBoost + Random Forest ensemble
- **SHAP Explainability** — Every prediction explained using real SHAP values
- **Live Fraud Alerts** — Dashboard refreshes every 10s with real PaySim fraud accounts
- **Forensic PDF Reports** — Download professional investigation reports
- **JWT Authentication** — Secure login with bcrypt password hashing
- **Fraud Analytics** — Real business intelligence from PaySim dataset

## Model Performance

| Model | F1 Score | ROC-AUC | Recall | False Negatives |
|-------|----------|---------|--------|-----------------|
| Random Forest | **0.91** | 0.9993 | **1.00** | 0 |
| XGBoost | **0.89** | 0.9994 | **1.00** | 0 |

> Recall = 1.00 means **zero fraud cases missed**

## Model Improvements (v2.0)

| Issue | Fix Applied |
|-------|-------------|
| Class Imbalance (0.129% fraud) | SMOTE — balanced to 50/50 |
| Data Leakage | Removed all post-transaction features |
| Black Box Model | SHAP values for every prediction |
| Random Split | Stratified split with `stratify=y` |

## SHAP Feature Importance

| Feature | Random Forest | XGBoost |
|---------|--------------|---------|
| `is_overdraft` | 24% | **79%** |
| `amount_to_balance_ratio` | **42%** | 19% |
| `type` | 13% | ~0% |

## Tech Stack

**Frontend**
- React 18 + Vite
- Tailwind CSS
- Recharts
- React Router

**ML Backend**
- FastAPI (Python)
- scikit-learn — Random Forest
- XGBoost
- SHAP
- SMOTE (imbalanced-learn)
- joblib

**Auth Backend**
- Node.js + Express
- MongoDB Atlas
- JWT + bcrypt

**Dataset**
- [PaySim — Synthetic Financial Dataset](https://www.kaggle.com/datasets/ealaxi/paysim1)
- 6,362,620 transactions
- 8,213 confirmed fraud cases

## Project Structure
```
fintech_project/
├── backend/
│   ├── ml/
│   │   ├── predictor.py
│   │   ├── fintech_rf_model.pkl
│   │   ├── fintech_xgb_model.pkl
│   │   ├── fintech_scaler.pkl
│   │   ├── fintech_label_encoder.pkl
│   │   └── fintech_features.json
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   └── user.js
│   ├── routes/
│   │   └── auth.js
│   ├── main.py          ← FastAPI ML Backend
│   └── server.js        ← Node.js Auth Backend
├── src/
│   ├── pages/
│   │   ├── Landing.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Simulator.jsx
│   │   ├── Analytics.jsx
│   │   ├── MLModels.jsx
│   │   └── Reports.jsx
│   ├── components/
│   │   └── Sidebar.jsx
│   └── context/
│       └── AuthContext.jsx
└── README.md
```

## Setup & Installation

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB Atlas account

### 1. Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/fintech-fraud-detection.git
cd fintech-fraud-detection
```

### 2. Frontend Setup
```bash
npm install
```

### 3. Backend Setup
```bash
cd backend
pip install fastapi uvicorn pandas scikit-learn xgboost joblib imbalanced-learn shap
npm install express mongoose bcryptjs jsonwebtoken cors dotenv
```

### 4. Environment Variables
Create `backend/.env`:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
ML_API_URL=http://127.0.0.1:8000
```

### 5. Dataset
Download [PaySim dataset](https://www.kaggle.com/datasets/ealaxi/paysim1) and place `paysim_data.csv` in `backend/`

### 6. Run the Project

**Terminal 1 — FastAPI ML Backend:**
```bash
cd backend
python main.py
```

**Terminal 2 — Node.js Auth Backend:**
```bash
cd backend
node server.js
```

**Terminal 3 — React Frontend:**
```bash
npm run dev
```

Open `http://localhost:5173`

## API Endpoints

### ML Backend (Port 8000)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/predict` | POST | Predict fraud for a transaction |
| `/api/stats` | GET | Dataset and model statistics |
| `/api/fraud-clusters` | GET | Live fraud accounts sample |
| `/api/investigate/{id}` | GET | Deep dive into an account |
| `/api/analytics` | GET | Real PaySim business analytics |
| `/api/model-performance` | GET | Detailed model metrics |

### Auth Backend (Port 5000)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Register new analyst |
| `/auth/login` | POST | Login and get JWT token |
| `/auth/me` | GET | Get current user |

## Author

**Aditya Kumar Jha**
- 1st Year CS Student — Ramanujan College
- LinkedIn: [your-linkedin]
- GitHub: [your-github]

## License
MIT