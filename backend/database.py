import sqlite3
import pandas as pd
from datetime import datetime

DB_NAME = "finance.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    # Users table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            email TEXT PRIMARY KEY,
            password TEXT
        )
    ''')
    # Transactions table — with upload_month for monthly scoping
    c.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT,
            date TEXT,
            description TEXT,
            amount REAL,
            transaction_type TEXT,
            predicted_category TEXT,
            user_corrected_category TEXT,
            is_reviewed BOOLEAN DEFAULT 0,
            upload_month TEXT DEFAULT '',
            FOREIGN KEY (email) REFERENCES users (email)
        )
    ''')
    # Add upload_month column if it doesn't exist (migration for existing DBs)
    try:
        c.execute("ALTER TABLE transactions ADD COLUMN upload_month TEXT DEFAULT ''")
    except sqlite3.OperationalError:
        pass  # Column already exists
    conn.commit()
    conn.close()

def register_user(email, password):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    try:
        c.execute("INSERT INTO users (email, password) VALUES (?, ?)", (email, password))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def authenticate_user(email, password):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE email = ? AND password = ?", (email, password))
    user = c.fetchone()
    conn.close()
    return user is not None

def user_exists(email):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT 1 FROM users WHERE email = ?", (email,))
    exists = c.fetchone() is not None
    conn.close()
    return exists

def add_transactions_from_df(email, df, upload_month=""):
    """Insert transactions with an upload_month tag (format: 'YYYY-MM')."""
    conn = sqlite3.connect(DB_NAME)
    for _, row in df.iterrows():
        date_val = str(row.get('Date', datetime.now().strftime("%Y-%m-%d")))
        amount_val = float(row.get('Amount', 0.0))
        tx_type_val = str(row.get('Transaction Type', 'debit'))
        is_rev = int(row.get('is_reviewed', 0))
        conn.execute('''
            INSERT INTO transactions (email, date, description, amount, transaction_type, predicted_category, is_reviewed, upload_month)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (email, date_val, row['Description'], amount_val, tx_type_val, row.get('Predicted Category', 'Unknown'), is_rev, upload_month))
    conn.commit()
    conn.close()

def get_transactions_by_email(email, month=None):
    """Get transactions, optionally filtered by month (format: 'YYYY-MM')."""
    conn = sqlite3.connect(DB_NAME)
    if month:
        df = pd.read_sql_query(
            "SELECT * FROM transactions WHERE email = ? AND upload_month = ?",
            conn, params=(email, month)
        )
    else:
        df = pd.read_sql_query(
            "SELECT * FROM transactions WHERE email = ?",
            conn, params=(email,)
        )
    conn.close()
    return df

def get_available_months(email):
    """Get all distinct upload months for a user, sorted descending (newest first)."""
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("""
        SELECT DISTINCT upload_month FROM transactions 
        WHERE email = ? AND upload_month != '' 
        ORDER BY upload_month DESC
    """, (email,))
    months = [row[0] for row in c.fetchall()]
    conn.close()
    return months

def get_latest_month(email):
    """Get the most recently uploaded month for a user."""
    months = get_available_months(email)
    return months[0] if months else ""

def update_transaction_category(tx_id, corrected_category):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''
        UPDATE transactions 
        SET user_corrected_category = ?, is_reviewed = 1
        WHERE id = ?
    ''', (corrected_category, tx_id))
    conn.commit()
    conn.close()

def get_unreviewed_transactions(email, month=None):
    """Get unreviewed transactions, optionally filtered by month."""
    conn = sqlite3.connect(DB_NAME)
    if month:
        df = pd.read_sql_query('''
            SELECT * FROM transactions 
            WHERE email = ? AND is_reviewed = 0 AND upload_month = ?
        ''', conn, params=(email, month))
    else:
        df = pd.read_sql_query('''
            SELECT * FROM transactions 
            WHERE email = ? AND is_reviewed = 0
        ''', conn, params=(email,))
    conn.close()
    return df
