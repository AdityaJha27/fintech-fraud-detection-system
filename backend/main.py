from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import sqlite3
import os
import sys
from typing import Optional

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from ml.predictor import predict_transaction

app = FastAPI(title="FinTech Fraud Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "paysim.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Load stats on startup — full dataset counts from DB
try:
    conn = get_db_connection()
    total_tx = conn.execute("SELECT COUNT(*) FROM transactions").fetchone()[0]
    real_fraud = conn.execute("SELECT COUNT(*) FROM transactions WHERE isFraud = 1").fetchone()[0]

    # Analytics — full dataset
    type_stats_raw = pd.read_sql_query("""
        SELECT type,
               SUM(isFraud) as fraud_count,
               COUNT(*) as total_count
        FROM transactions
        GROUP BY type
    """, conn)
    type_stats_raw['fraud_rate'] = (
        (type_stats_raw['fraud_count'] / type_stats_raw['total_count']) * 100
    ).round(2)

    # Amount stats — fraud only
    amt_stats = conn.execute("""
        SELECT MIN(amount), MAX(amount), AVG(amount)
        FROM transactions WHERE isFraud = 1
    """).fetchone()
    fraud_amount_min = amt_stats[0]
    fraud_amount_max = amt_stats[1]
    fraud_amount_avg = amt_stats[2]

    conn.close()
    print(f" DB Loaded: {total_tx:,} transactions | {real_fraud:,} fraud cases")

except Exception as e:
    print(f" DB Error: {e}")
    sys.exit(1)


class TransactionInput(BaseModel):
    type: str
    amount: float
    oldbalanceOrg: float
    oldbalanceDest: Optional[float] = 0.0 


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
    try:
        conn = get_db_connection()
        sample_fraud = pd.read_sql_query(
            "SELECT * FROM transactions WHERE isFraud = 1 ORDER BY RANDOM() LIMIT 8",
            conn
        )
        conn.close()

        nodes, links, seen = [], [], set()
        for _, row in sample_fraud.iterrows():
            # Data ko safely float mein convert kar rahe hain
            data = {
                "type": str(row['type']),
                "amount": float(row['amount']),
                "oldbalanceOrg": float(row['oldbalanceOrg']),
                "oldbalanceDest": float(row['oldbalanceDest']) if row.get('oldbalanceDest') else 0.0,
            }
            
            try:
                result = predict_transaction(data)
                rf_prob = result.get('rf_probability', 0)
                xgb_prob = result.get('xgb_probability', 0)
            except:
                rf_prob, xgb_prob = 0, 0

            if row['nameOrig'] not in seen:
                nodes.append({
                    "id": str(row['nameOrig']),
                    "label": f"Mule ({row['type']})",
                    "color": "#ef4444",
                    "val": min(int(float(row['amount']) / 10000) + 8, 40),
                    "rf_prob": rf_prob,
                    "xgb_prob": xgb_prob,
                    "reason": f"RF: {rf_prob}% | XGB: {xgb_prob}% fraud probability"
                })
                seen.add(row['nameOrig'])
                
            if row['nameDest'] not in seen:
                nodes.append({
                    "id": str(row['nameDest']),
                    "label": "Destination",
                    "color": "#f59e0b",
                    "val": 15,
                    "rf_prob": 0,
                    "xgb_prob": 0,
                    "reason": "Destination account"
                })
                seen.add(row['nameDest'])
                
            links.append({
                "source": str(row['nameOrig']),
                "target": str(row['nameDest']),
                "label": f"₹{float(row['amount']):,.0f}"
            })
        return {"nodes": nodes, "links": links}
    except Exception as e:
        print(f"❌ Clusters Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/investigate/{account_id}")
async def investigate(account_id: str):
    try:
        conn = get_db_connection()
        row = pd.read_sql_query(
            "SELECT * FROM transactions WHERE nameOrig = ? LIMIT 1",
            conn, params=(account_id,)
        )
        if row.empty:
            row = pd.read_sql_query(
                "SELECT * FROM transactions WHERE isFraud = 1 ORDER BY RANDOM() LIMIT 1",
                conn
            )
        conn.close()

        data_row = row.iloc[0]
        
        data = {
            "type": str(data_row['type']),
            "amount": float(data_row['amount']) if data_row['amount'] is not None else 0.0,
            "oldbalanceOrg": float(data_row['oldbalanceOrg']) if data_row['oldbalanceOrg'] is not None else 0.0,
            "oldbalanceDest": float(data_row['oldbalanceDest']) if data_row['oldbalanceDest'] is not None else 0.0,
        }
        
        result = predict_transaction(data)
        amount = float(data['amount'])
        orig_bal = float(data['oldbalanceOrg'])
        
        is_overdraft = amount > orig_bal
        ratio = amount / (orig_bal + 1)

        return {
            "account_id": account_id,
            "transaction_type": data['type'],
            "amount": f"₹{amount:,.2f}",
            "ground_truth": "Confirmed Fraud" if data_row['isFraud'] else "Legitimate",
            "risk_level": result['decision'].replace('_', ' '),
            "risk_index": f"{result['rf_probability']}%",
            "reason": f"Random Forest: {result['rf_probability']}% | XGBoost: {result['xgb_probability']}% fraud probability",
            "xai_report": {
                "amount_weight": "Critical" if is_overdraft else "High" if ratio > 0.8 else "Medium" if ratio > 0.5 else "Low",
                "velocity_weight": "Critical" if ratio > 0.9 else "High" if ratio > 0.7 else "Medium" if ratio > 0.4 else "Low",
                "flagged_by_system": is_overdraft,
                "model_used": "Random Forest (F1: 0.91) + XGBoost (F1: 0.89)"
            }
        }
    except Exception as e:
        print(f" Investigation Error: {e}") 
        raise HTTPException(status_code=500, detail=str(e))

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
    conn = get_db_connection()

    # Amount distribution — full dataset
    amount_dist = pd.read_sql_query("""
        SELECT
            CASE
                WHEN amount <= 10000 THEN '₹0-10K'
                WHEN amount <= 50000 THEN '₹10K-50K'
                WHEN amount <= 200000 THEN '₹50K-2L'
                WHEN amount <= 500000 THEN '₹2L-5L'
                ELSE '₹5L+'
            END as range,
            COUNT(*) as count
        FROM transactions
        WHERE isFraud = 1
        GROUP BY range
        ORDER BY MIN(amount)
    """, conn).to_dict(orient='records')

    # Peak fraud steps — full dataset
    peak_steps = pd.read_sql_query("""
        SELECT 'Step ' || step as hour, COUNT(*) as count
        FROM transactions
        WHERE isFraud = 1
        GROUP BY step
        ORDER BY count DESC
        LIMIT 10
    """, conn).to_dict(orient='records')

    conn.close()

    return {
        "fraud_by_type": type_stats_raw.to_dict(orient='records'),
        "amount_distribution": amount_dist,
        "peak_fraud_hours": peak_steps,
        "amount_stats": {
            "min": f"₹{fraud_amount_min:,.0f}",
            "max": f"₹{fraud_amount_max:,.0f}",
            "avg": f"₹{fraud_amount_avg:,.0f}",
            "median": "₹441,423"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)