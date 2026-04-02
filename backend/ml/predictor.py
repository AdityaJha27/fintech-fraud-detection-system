import joblib
import json
import numpy as np
import os
import pandas as pd  
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

rf_model  = joblib.load(os.path.join(BASE_DIR, 'fintech_rf_model.pkl'))
xgb_model = joblib.load(os.path.join(BASE_DIR, 'fintech_xgb_model.pkl'))
le        = joblib.load(os.path.join(BASE_DIR, 'fintech_label_encoder.pkl'))
scaler    = joblib.load(os.path.join(BASE_DIR, 'fintech_scaler.pkl'))

with open(os.path.join(BASE_DIR, 'fintech_features.json'), 'r') as f:
    FEATURES = json.load(f)

def predict_transaction(data_input: dict) -> dict:
    processed_data = data_input.copy()
    
    # 1. Label Encoding
    processed_data['type'] = int(le.transform([str(processed_data['type'])])[0])

    # 2. Key Values
    amount = float(processed_data.get('amount', 0))
    old_orig = float(processed_data.get('oldbalanceOrg', 0))
    old_dest = float(processed_data.get('oldbalanceDest', 0)) 

    # 3. Feature Engineering (Training logic matching)
    processed_data['hour'] = datetime.now().hour 
    processed_data['amount_to_balance_ratio'] = amount / (old_orig + 1)
    processed_data['is_overdraft'] = 1 if amount > old_orig else 0
    processed_data['oldbalanceDest'] = old_dest 

    # 4. Final Row Preparation (Strict Order)
    try:
        row_values = [processed_data[f] for f in FEATURES]
        row_df = pd.DataFrame([row_values], columns=FEATURES) 
    except KeyError as e:
        raise ValueError(f"Missing feature: {e}. Check if frontend sends all fields.")

    # 5. Scale & Predict
    row_scaled = scaler.transform(row_df) 
    
    # Probabilities
    rf_prob  = float(rf_model.predict_proba(row_scaled)[0][1])
    xgb_prob = float(xgb_model.predict_proba(row_scaled)[0][1])
    ensemble_prob = (rf_prob + xgb_prob) / 2

    # Predictions (0 or 1)
    rf_pred  = int(rf_model.predict(row_scaled)[0])
    xgb_pred = int(xgb_model.predict(row_scaled)[0])

    #  Step 6: Ensemble Decision Logic
    if rf_pred == 1 and xgb_pred == 1:
        decision, risk_level = "CONFIRMED_FRAUD", "CRITICAL"
    elif rf_pred == 0 and xgb_pred == 0:
        decision, risk_level = "LEGITIMATE", "LOW"
    else:
        decision, risk_level = "SUSPICIOUS", "HIGH"

    return {
        "rf_probability": round(rf_prob * 100, 2),
        "xgb_probability": round(xgb_prob * 100, 2),
        "ensemble_probability": round(ensemble_prob * 100, 2),
        "rf_prediction": rf_pred,
        "xgb_prediction": xgb_pred,
        "decision": decision,
        "risk_level": risk_level,
        "models_agree": rf_pred == xgb_pred
    }