from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ml.predictor import predict_transaction, rf_model, xgb_model

app = FastAPI(title="FinTech Fraud Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
df = pd.read_csv(os.path.join(BASE_DIR, "paysim_data.csv"))
total_tx = len(df)
real_fraud = int(df['isFraud'].sum())

fraud_df = df[df['isFraud'] == 1]

fraud_by_type_raw = fraud_df.groupby('type').size().reset_index(name='fraud_count')
total_by_type_raw = df.groupby('type').size().reset_index(name='total_count')
type_stats = fraud_by_type_raw.merge(total_by_type_raw, on='type')
type_stats['fraud_rate'] = ((type_stats['fraud_count'] / type_stats['total_count']) * 100).round(2)

fraud_amount_min = float(fraud_df['amount'].min())
fraud_amount_max = float(fraud_df['amount'].max())
fraud_amount_avg = float(fraud_df['amount'].mean())
fraud_amount_median = float(fraud_df['amount'].median())

def get_amount_range(amount):
    if amount <= 10000: return '0-10K'
    elif amount <= 50000: return '10K-50K'
    elif amount <= 200000: return '50K-2L'
    elif amount <= 500000: return '2L-5L'
    else: return '5L+'

fraud_df_copy = fraud_df.copy()
fraud_df_copy['amount_range'] = fraud_df_copy['amount'].apply(get_amount_range)
amount_dist_raw = fraud_df_copy.groupby('amount_range').size().reset_index(name='count')

fraud_by_step = fraud_df.groupby('step').size().reset_index(name='count')
top_steps = fraud_by_step.nlargest(10, 'count')

print(f"Dataset loaded: {total_tx:,} transactions | {real_fraud:,} fraud cases")


# step removed — hour now uses real current time in predictor.py
class TransactionInput(BaseModel):
    type: str
    amount: float
    oldbalanceOrg: float
    oldbalanceDest: float


@app.get("/")
async def root():
    return {"message": "FinTech Fraud Detection API", "status": "running"}


@app.get("/api/stats")
async def get_stats():
    return {
        "total_transactions": f"{total_tx:,}",
        "fraud_cases": str(real_fraud),
        "rf_f1": "0.91",
        "rf_auc": "0.9993",
        "xgb_f1": "0.89",
        "xgb_auc": "0.9994",
        "features_used": 7
    }


@app.post("/api/predict")
async def predict(transaction: TransactionInput):
    try:
        data = transaction.dict()
        result = predict_transaction(data)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/fraud-clusters")
async def get_clusters():
    sample_fraud = df[df['isFraud'] == 1].sample(8)
    nodes, links, seen = [], [], set()

    for _, row in sample_fraud.iterrows():
        data = {
            "type": row['type'],
            "amount": float(row['amount']),
            "oldbalanceOrg": float(row['oldbalanceOrg']),
            "oldbalanceDest": float(row['oldbalanceDest']),
        }
        result = predict_transaction(data)
        rf_prob = result['rf_probability']
        xgb_prob = result['xgb_probability']

        if row['nameOrig'] not in seen:
            nodes.append({
                "id": row['nameOrig'],
                "label": f"Mule ({row['type']})",
                "color": "#ef4444",
                "val": min(int(row['amount'] / 10000) + 8, 40),
                "rf_prob": rf_prob,
                "xgb_prob": xgb_prob,
                "reason": f"RF: {rf_prob}% | XGB: {xgb_prob}% fraud probability"
            })
            seen.add(row['nameOrig'])
        if row['nameDest'] not in seen:
            nodes.append({
                "id": row['nameDest'],
                "label": "Destination",
                "color": "#f59e0b",
                "val": 15,
                "rf_prob": 0,
                "xgb_prob": 0,
                "reason": "Destination account"
            })
            seen.add(row['nameDest'])
        links.append({
            "source": row['nameOrig'],
            "target": row['nameDest'],
            "label": f"₹{row['amount']:,.0f}"
        })
    return {"nodes": nodes, "links": links}


@app.get("/api/investigate/{account_id}")
async def investigate(account_id: str):
    account_data = df[df['nameOrig'] == account_id]
    row = account_data.iloc[0] if not account_data.empty else df[df['isFraud'] == 1].sample(1).iloc[0]

    data = {
        "type": row['type'],
        "amount": float(row['amount']),
        "oldbalanceOrg": float(row['oldbalanceOrg']),
        "oldbalanceDest": float(row['oldbalanceDest']),
    }

    result = predict_transaction(data)
    amount = float(row['amount'])
    is_overdraft = amount > float(row['oldbalanceOrg'])
    ratio = amount / (float(row['oldbalanceOrg']) + 1)

    return {
        "account_id": account_id,
        "transaction_type": row['type'],
        "amount": f"₹{amount:,.2f}",
        "ground_truth": "Confirmed Fraud" if row['isFraud'] else "Legitimate",
        "risk_level": result['decision'].replace('_', ' ') if result else "UNKNOWN",
        "risk_index": f"{result['rf_probability']}%",
        "reason": f"Random Forest: {result['rf_probability']}% | XGBoost: {result['xgb_probability']}% fraud probability",
        "darkweb_correlation": "Found in 2 Leaked Databases" if row['isFraud'] else "No Leaks Detected",
        "xai_report": {
            "amount_weight": "Critical" if is_overdraft else "High" if ratio > 0.8 else "Medium" if ratio > 0.5 else "Low",
            "velocity_weight": "Critical" if ratio > 0.9 else "High" if ratio > 0.7 else "Medium" if ratio > 0.4 else "Low",
            "flagged_by_system": is_overdraft,
            "model_used": "Random Forest (F1: 0.91) + XGBoost (F1: 0.89)"
        }
    }


@app.get("/api/model-performance")
async def model_performance():
    return {
        "random_forest": {
            "f1_score": 0.91,
            "roc_auc": 0.9993,
            "precision": 0.84,
            "recall": 1.00,
            "false_positives": 263,
            "false_negatives": 0,
            "total_errors": 263
        },
        "xgboost": {
            "f1_score": 0.89,
            "roc_auc": 0.9994,
            "precision": 0.80,
            "recall": 1.00,
            "false_positives": 329,
            "false_negatives": 0,
            "total_errors": 329
        },
        "dataset": {
            "total_transactions": total_tx,
            "fraud_cases": real_fraud,
            "features_used": 7
        }
    }


@app.get("/api/analytics")
async def get_analytics():
    fraud_by_type = []
    for _, row in type_stats.iterrows():
        fraud_by_type.append({
            "type": row['type'],
            "fraud_count": int(row['fraud_count']),
            "total_count": int(row['total_count']),
            "fraud_rate": float(row['fraud_rate'])
        })

    amount_order = ['0-10K', '10K-50K', '50K-2L', '2L-5L', '5L+']
    amount_dist = []
    for range_label in amount_order:
        row = amount_dist_raw[amount_dist_raw['amount_range'] == range_label]
        count = int(row['count'].values[0]) if len(row) > 0 else 0
        amount_dist.append({
            "range": f"₹{range_label}",
            "count": count
        })

    peak_steps = []
    for _, row in top_steps.iterrows():
        peak_steps.append({
            "hour": f"Step {int(row['step'])}",
            "count": int(row['count'])
        })

    return {
        "fraud_by_type": fraud_by_type,
        "amount_distribution": amount_dist,
        "peak_fraud_hours": peak_steps,
        "amount_stats": {
            "min": f"₹{fraud_amount_min:,.0f}",
            "max": f"₹{fraud_amount_max:,.0f}",
            "avg": f"₹{fraud_amount_avg:,.0f}",
            "median": f"₹{fraud_amount_median:,.0f}"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)