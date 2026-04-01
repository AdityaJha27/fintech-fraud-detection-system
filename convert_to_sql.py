import pandas as pd
import sqlite3
import os

def create_sqlite_db():
    csv_path = os.path.join('backend', 'paysim_data.csv')
    db_path = os.path.join('backend', 'paysim.db')

    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found.")
        return

    # Delete old DB if exists
    if os.path.exists(db_path):
        os.remove(db_path)
        print("Old DB deleted.")

    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    conn.execute("PRAGMA temp_store = MEMORY;")
    conn.execute("PRAGMA cache_size = 100000;")

    # Sirf zaruri columns — no leakage, no heavy IDs
    conn.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            step        INTEGER,
            type        TEXT,
            amount      REAL,
            nameOrig    TEXT,
            nameDest   TEXT,
            oldbalanceOrg  REAL,
            oldbalanceDest REAL,
            isFraud     INTEGER
        )
    """)

    processed_rows = 0
    chunk_size = 100000

    # Sirf zaruri columns load karo
    usecols = [
        'step', 'type', 'amount',
        'nameOrig', 'nameDest',
        'oldbalanceOrg', 'oldbalanceDest',
        'isFraud'
    ]

    dtypes = {
        'step': 'int16',
        'type': 'category',
        'amount': 'float32',
        'nameOrig': 'string',
        'nameDest': 'string',
        'oldbalanceOrg': 'float32',
        'oldbalanceDest': 'float32',
        'isFraud': 'int8',
    }

    print("Converting CSV to SQLite — only required columns...")

    for chunk in pd.read_csv(
        csv_path,
        chunksize=chunk_size,
        usecols=usecols,
        dtype=dtypes
    ):
        chunk.to_sql(
            'transactions', conn,
            if_exists='append',
            index=False
        )
        processed_rows += len(chunk)
        print(f"Processed: {processed_rows:,} rows")

    # Indexes
    print("Building indexes...")
    conn.execute("CREATE INDEX idx_isFraud  ON transactions(isFraud)")
    conn.execute("CREATE INDEX idx_nameOrig ON transactions(nameOrig)")
    conn.execute("CREATE INDEX idx_type     ON transactions(type)")
    conn.execute("CREATE INDEX idx_step     ON transactions(step)")

    # Compress
    print("Compressing database...")
    conn.execute("VACUUM;")
    conn.commit()
    conn.close()

    size_mb = os.path.getsize(db_path) / (1024 * 1024)
    print(f"Done! paysim.db size: {size_mb:.1f} MB")

if __name__ == "__main__":
    create_sqlite_db()