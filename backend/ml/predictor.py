import joblib
import json
import numpy as np
import os
from datetime import datetime

# Load models
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

rf_model  = joblib.load(os.path.join(BASE_DIR, 'fintech_rf_model.pkl'))
xgb_model = joblib.load(os.path.join(BASE_DIR, 'fintech_xgb_model.pkl'))
le        = joblib.load(os.path.join(BASE_DIR, 'fintech_label_encoder.pkl'))
scaler    = joblib.load(os.path.join(BASE_DIR, 'fintech_scaler.pkl'))

with open(os.path.join(BASE_DIR, 'fintech_features.json'), 'r') as f:
    FEATURES = json.load(f)

print("Models loaded successfully!")
print(f"Features: {FEATURES}")

def predict_transaction(data: dict) -> dict:

    # 1. Encode transaction type
    data['type'] = int(le.transform([data['type']])[0])

    # 2. Engineer features — same as training
    # hour — real current time (not step-based)
    # Real bank system mein transaction abhi ho raha hai
    data['hour'] = datetime.now().hour  # 0-23 real time

    data['amount_to_balance_ratio'] = data['amount'] / (data['oldbalanceOrg'] + 1)
    data['is_overdraft'] = 1 if data['amount'] > data['oldbalanceOrg'] else 0

    # 3. Prepare feature vector — same order as training
    row = [data[f] for f in FEATURES]

    # 4. Scale — same scaler as training
    row_scaled = scaler.transform([row])

    # 5. Predictions
    rf_prob  = float(rf_model.predict_proba(row_scaled)[0][1])
    xgb_prob = float(xgb_model.predict_proba(row_scaled)[0][1])
    ensemble_prob = (rf_prob + xgb_prob) / 2

    rf_pred  = int(rf_model.predict(row_scaled)[0])
    xgb_pred = int(xgb_model.predict(row_scaled)[0])

    # 6. Ensemble decision
    if rf_pred == 1 and xgb_pred == 1:
        decision   = "CONFIRMED_FRAUD"
        risk_level = "CRITICAL"
    elif rf_pred == 0 and xgb_pred == 0:
        decision   = "LEGITIMATE"
        risk_level = "LOW"
    else:
        decision   = "SUSPICIOUS"
        risk_level = "HIGH"

    return {
        "rf_probability":       round(rf_prob * 100, 2),
        "xgb_probability":      round(xgb_prob * 100, 2),
        "ensemble_probability": round(ensemble_prob * 100, 2),
        "rf_prediction":        rf_pred,
        "xgb_prediction":       xgb_pred,
        "decision":             decision,
        "risk_level":           risk_level,
        "models_agree":         rf_pred == xgb_pred
    }