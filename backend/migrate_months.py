"""Migration script: Add upload_month column and backfill from transaction dates."""
import sqlite3

conn = sqlite3.connect("finance.db")
c = conn.cursor()

# Add column if missing
try:
    c.execute("ALTER TABLE transactions ADD COLUMN upload_month TEXT DEFAULT ''")
    print("Added upload_month column")
except sqlite3.OperationalError as e:
    print(f"Column already exists: {e}")

conn.commit()

# Backfill from date column
c.execute("""
    UPDATE transactions 
    SET upload_month = substr(date, 1, 7)
    WHERE (upload_month = '' OR upload_month IS NULL)  
    AND date IS NOT NULL AND length(date) >= 7
""")
print(f"Backfilled {c.rowcount} rows")
conn.commit()

# Verify
c.execute("SELECT DISTINCT upload_month FROM transactions ORDER BY upload_month")
months = [m[0] for m in c.fetchall()]
print(f"Available months: {months}")

c.execute("SELECT COUNT(*) FROM transactions")
print(f"Total transactions: {c.fetchone()[0]}")

for m in months:
    c.execute("SELECT COUNT(*) FROM transactions WHERE upload_month = ?", (m,))
    print(f"  {m}: {c.fetchone()[0]} transactions")

conn.close()
print("\nMigration complete!")
