from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import pickle
import io
import os
import database as db
from dotenv import load_dotenv
load_dotenv()

app = FastAPI()

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

db.init_db()

try:
    if os.path.exists("finance_model.pkl"):
        model, vectorizer = pickle.load(open("finance_model.pkl", "rb"))
    else:
        model, vectorizer = None, None
except Exception as e:
    model, vectorizer = None, None

class AuthRequest(BaseModel):
    email: str
    password: str

@app.post("/api/login")
def login(req: AuthRequest):
    email = req.email.strip()
    if not db.user_exists(email):
        db.register_user(email, req.password)
        return {"message": "Account created and logged in", "email": email}
    if not db.authenticate_user(email, req.password):
        raise HTTPException(status_code=401, detail="Invalid password for this email")
    return {"message": "Success", "email": email}

@app.post("/api/register")
def register(req: AuthRequest):
    email = req.email.strip()
    if not db.register_user(email, req.password):
        raise HTTPException(status_code=400, detail="Account already exists for this email")
    return {"message": "Created", "email": email}

# ──────────────────────────────────────────────────
#  MONTHS API — list available months for user
# ──────────────────────────────────────────────────
@app.get("/api/months")
def get_months(email: str):
    """Return all uploaded months and the latest (active) one."""
    months = db.get_available_months(email)
    latest = months[0] if months else ""
    return {"months": months, "activeMonth": latest}

# ──────────────────────────────────────────────────
#  TRANSACTIONS — scoped by month
# ──────────────────────────────────────────────────
# Categories that are NOT expenses (excluded from spending calculations)
NON_EXPENSE_CATEGORIES = {'Income', 'Transfer'}

@app.get("/api/transactions")
def get_transactions(email: str, month: str = ""):
    """Get transactions for a specific month. If month is empty, use latest."""
    if not month:
        month = db.get_latest_month(email)
    
    df = db.get_transactions_by_email(email, month=month if month else None)
    if df.empty:
        return {
            "transactions": [], "totalSpent": 0, "totalAmount": 0, "savings": 0,
            "topCategory": "N/A", "categoryBreakdown": {},
            "activeMonth": month, "monthLabel": _format_month(month)
        }
    
    df['Final Category'] = df['user_corrected_category'].combine_first(df['predicted_category'])
    
    # Separate income from expenses
    income_df = df[df['Final Category'].isin(NON_EXPENSE_CATEGORIES)]
    expense_df = df[~df['Final Category'].isin(NON_EXPENSE_CATEGORIES)]
    
    total_income = float(income_df['amount'].sum()) if not income_df.empty else 0
    total_spent = float(expense_df['amount'].sum()) if not expense_df.empty else 0
    
    # Total amount = income if available, otherwise estimate
    total_amount = total_income if total_income > 0 else total_spent * 1.3
    savings = total_amount - total_spent
    
    # Category breakdown — expenses only
    expense_cat_sum = expense_df.groupby('Final Category')['amount'].sum() if not expense_df.empty else pd.Series(dtype=float)
    top_category = "N/A" if expense_cat_sum.empty else expense_cat_sum.idxmax()
    
    df = df.fillna('')
    return {
        "transactions": df.to_dict(orient="records"),
        "totalSpent": total_spent,
        "totalAmount": round(total_amount, 2),
        "savings": round(savings, 2),
        "topCategory": top_category,
        "categoryBreakdown": expense_cat_sum.to_dict() if not expense_cat_sum.empty else {},
        "activeMonth": month,
        "monthLabel": _format_month(month)
    }

def _format_month(month_str):
    """Convert 'YYYY-MM' to 'January 2025' etc."""
    if not month_str:
        return "No Data"
    try:
        from datetime import datetime
        dt = datetime.strptime(month_str, "%Y-%m")
        return dt.strftime("%B %Y")
    except:
        return month_str

# ──────────────────────────────────────────────────
#  UPLOAD — user selects month via form field
# ──────────────────────────────────────────────────
@app.post("/api/upload")
async def upload_csv(
    email: str = Form(...),
    file: UploadFile = File(...),
    month: str = Form("")  # User-selected month (YYYY-MM)
):
    if not model or not vectorizer:
        raise HTTPException(status_code=500, detail="Model not loaded")
        
    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid CSV file")
        
    # --- SMART BANK STATEMENT MAPPER ---
    desc_aliases = ["Description", "Narration", "Remarks", "Details", "Particulars", "Transaction Remarks"]
    amt_aliases = ["Amount", "Debit", "Withdrawal", "Credit", "Deposit", "Amount (INR)"]
    date_aliases = ["Date", "Txn Date", "Value Date", "Transaction Date"]
    
    col_lower = {str(c).lower().strip(): c for c in df.columns}
    
    found_desc = next((col_lower[d.lower()] for d in desc_aliases if d.lower() in col_lower), None)
    found_amt = next((col_lower[a.lower()] for a in amt_aliases if a.lower() in col_lower), None)
    found_date = next((col_lower[d.lower()] for d in date_aliases if d.lower() in col_lower), None)
    
    if found_desc: df.rename(columns={found_desc: "Description"}, inplace=True)
    if found_amt: df.rename(columns={found_amt: "Amount"}, inplace=True)
    if found_date: df.rename(columns={found_date: "Date"}, inplace=True)
    
    if "Description" not in df.columns:
        raise HTTPException(status_code=400, detail="Could not identify any Transaction Description or Narration column.")
    
    # --- USE USER-SELECTED MONTH ---
    upload_month = month.strip() if month else ""
    
    if not upload_month:
        # Fallback: try to detect from dates
        if "Date" in df.columns:
            try:
                dates = pd.to_datetime(df["Date"], dayfirst=True, errors='coerce')
                valid_dates = dates.dropna()
                if not valid_dates.empty:
                    month_years = valid_dates.dt.to_period('M')
                    most_common = month_years.mode()
                    if len(most_common) > 0:
                        upload_month = str(most_common[0])
                df["Date"] = dates.dt.strftime("%Y-%m-%d").fillna(df["Date"])
            except Exception:
                pass
    
    if not upload_month:
        from datetime import datetime
        upload_month = datetime.now().strftime("%Y-%m")
    
    # --- CLASSIFY ---
    X = vectorizer.transform(df["Description"].fillna(""))
    
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(X)
        max_probs = probs.max(axis=1)
        preds = model.classes_[probs.argmax(axis=1)]
        df["Predicted Category"] = preds
        df["is_reviewed"] = (max_probs >= 0.40).astype(int)
    else:
        df["Predicted Category"] = model.predict(X)
        df["is_reviewed"] = 0
    
    db.add_transactions_from_df(email, df, upload_month=upload_month)
    
    return {
        "message": "Upload successful",
        "uploadMonth": upload_month,
        "monthLabel": _format_month(upload_month),
        "recordCount": len(df)
    }

# ──────────────────────────────────────────────────
#  MONTHLY TREND — spending totals per month
# ──────────────────────────────────────────────────
@app.get("/api/monthly-trend")
def get_monthly_trend(email: str):
    """Return total spending (excluding income/transfers) per month for the line graph."""
    all_months = db.get_available_months(email)  # sorted newest first
    trend = []
    for m in reversed(all_months):  # oldest to newest for chart
        df = db.get_transactions_by_email(email, month=m)
        if not df.empty:
            df['Final Category'] = df['user_corrected_category'].combine_first(df['predicted_category'])
            expense_df = df[~df['Final Category'].isin(NON_EXPENSE_CATEGORIES)]
            total = float(expense_df['amount'].sum()) if not expense_df.empty else 0
        else:
            total = 0
        trend.append({"month": m, "label": _format_month(m), "totalSpent": round(total, 2)})
    return {"trend": trend}

# ──────────────────────────────────────────────────
#  UNREVIEWED TRANSACTIONS
# ──────────────────────────────────────────────────
@app.get("/api/unreviewed")
def get_unreviewed(email: str, month: str = ""):
    if not month:
        month = db.get_latest_month(email)
    df = db.get_unreviewed_transactions(email, month=month if month else None)
    df = df.fillna('')
    categories = model.classes_.tolist() if (model and hasattr(model, 'classes_')) else []
    return {
        "transactions": df.to_dict(orient="records"),
        "allCategories": categories
    }

# ──────────────────────────────────────────────────
#  CORRECTION / RETRAINING
# ──────────────────────────────────────────────────
class CorrectionRequest(BaseModel):
    transactionId: int
    correctedCategory: str

@app.post("/api/update")
def update_transaction(req: CorrectionRequest):
    global model, vectorizer
    if not model or not vectorizer:
        raise HTTPException(status_code=500, detail="Model not loaded")
        
    conn = db.sqlite3.connect(db.DB_NAME)
    c = conn.cursor()
    c.execute("SELECT description FROM transactions WHERE id = ?", (req.transactionId,))
    res = c.fetchone()
    conn.close()
    
    if not res:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    db.update_transaction_category(req.transactionId, req.correctedCategory)
    
    try:
        x_new = vectorizer.transform([res[0]])
        model.partial_fit(x_new, [req.correctedCategory])
        with open("finance_model.pkl", "wb") as f:
            pickle.dump((model, vectorizer), f)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Retraining failed")
        
    return {"message": "Updated successfully"}

# ──────────────────────────────────────────────────
#  AI INSIGHTS — monthly + cross-month patterns
# ──────────────────────────────────────────────────
@app.get("/api/insights")
def get_insights(email: str, month: str = ""):
    """Generate AI insights for active month, comparing with historical patterns."""
    if not month:
        month = db.get_latest_month(email)
    
    # Get current month data
    df_current = db.get_transactions_by_email(email, month=month if month else None)
    
    if df_current.empty:
        return {
            "insights": ["Upload a bank statement to get personalized AI insights about your spending patterns."],
            "recommendation": "Start by uploading your first statement in the Upload section."
        }
    
    df_current['Final Category'] = df_current['user_corrected_category'].combine_first(df_current['predicted_category'])
    
    # Separate income/transfers from actual expenses
    expense_df = df_current[~df_current['Final Category'].isin(NON_EXPENSE_CATEGORIES)]
    income_df = df_current[df_current['Final Category'].isin(NON_EXPENSE_CATEGORIES)]
    
    total_spent = float(expense_df['amount'].sum()) if not expense_df.empty else 0
    total_income = float(income_df['amount'].sum()) if not income_df.empty else 0
    cat_sum = expense_df.groupby('Final Category')['amount'].sum().sort_values(ascending=False) if not expense_df.empty else pd.Series(dtype=float)
    top_cat = cat_sum.idxmax() if not cat_sum.empty else "N/A"
    top_cat_amount = float(cat_sum.iloc[0]) if not cat_sum.empty else 0
    
    # Get ALL historical data for pattern analysis
    df_all = db.get_transactions_by_email(email)
    df_all['Final Category'] = df_all['user_corrected_category'].combine_first(df_all['predicted_category'])
    
    # Build monthly summaries for pattern detection (expenses only)
    all_months = db.get_available_months(email)
    monthly_summaries = []
    for m in all_months:
        df_m = db.get_transactions_by_email(email, month=m)
        if not df_m.empty:
            df_m['Final Category'] = df_m['user_corrected_category'].combine_first(df_m['predicted_category'])
            exp_m = df_m[~df_m['Final Category'].isin(NON_EXPENSE_CATEGORIES)]
            m_total = float(exp_m['amount'].sum()) if not exp_m.empty else 0
            monthly_summaries.append(f"{_format_month(m)}: ₹{m_total:,.2f}")
    
    pattern_text = "\n".join(monthly_summaries) if monthly_summaries else "Only one month of data available."
    
    api_key = os.environ.get("GEMINI_API_KEY")
    
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        
        # Only send expense transactions to the AI (exclude income/transfers)
        context_data = expense_df[['amount', 'description', 'Final Category']].to_string(index=False) if not expense_df.empty else "No expense transactions"
        income_note = f"\nTotal Income This Month: ₹{total_income:,.2f}" if total_income > 0 else ""
        prompt = f"""You are finAI, a financial advisor. Analyze the user's EXPENSE spending for {_format_month(month)}.

IMPORTANT: "Income" and "Transfer" are NOT spending categories. Do NOT treat them as expenses. Only analyze actual expense categories below.

CURRENT MONTH ({_format_month(month)}) EXPENSE Transactions:
{context_data}

Total Expenses This Month: ₹{total_spent:,.2f}{income_note}
Top Expense Category: {top_cat} (₹{top_cat_amount:,.2f})

MONTHLY EXPENSE HISTORY (excluding income/transfers):
{pattern_text}

Based on this data:
1. Provide EXACTLY 2 short spending insights about THIS month's expenses (1 line each)
2. If multiple months exist, compare with previous months and note patterns
3. Give 1 actionable recommendation to reduce expenses and save money

Use Indian Rupees (₹). Be specific with numbers. Never suggest "reducing Income" — Income is money earned, not spent.

Respond in this exact JSON format:
{{"insights": ["insight1", "insight2"], "recommendation": "recommendation text"}}"""
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        
        import json
        text = response.text.strip()
        if text.startswith('```'):
            text = text.split('\n', 1)[1].rsplit('```', 1)[0].strip()
        result = json.loads(text)
        return result
    except Exception as e:
        # Fallback insights (expenses only)
        insights = [
            f"In {_format_month(month)}, you spent the most on {top_cat} — ₹{top_cat_amount:,.2f}.",
            f"Your total expenses for {_format_month(month)} are ₹{total_spent:,.2f}."
        ]
        if len(all_months) > 1:
            prev_month = all_months[1] if len(all_months) > 1 else None
            if prev_month:
                df_prev = db.get_transactions_by_email(email, month=prev_month)
                if not df_prev.empty:
                    df_prev['Final Category'] = df_prev['user_corrected_category'].combine_first(df_prev['predicted_category'])
                    prev_exp = df_prev[~df_prev['Final Category'].isin(NON_EXPENSE_CATEGORIES)]
                    prev_total = float(prev_exp['amount'].sum()) if not prev_exp.empty else 0
                else:
                    prev_total = 0
                diff = total_spent - prev_total
                pct = (diff / prev_total * 100) if prev_total > 0 else 0
                direction = "increased" if diff > 0 else "decreased"
                insights[1] = f"Expenses {direction} by {abs(pct):.1f}% compared to {_format_month(prev_month)}."
        
        recommendation = f"Consider reducing {top_cat} spending to save approximately ₹{top_cat_amount * 0.15:,.0f}/month."
        return {"insights": insights, "recommendation": recommendation}

# ──────────────────────────────────────────────────
#  UPLOAD QUERIES — month-scoped
# ──────────────────────────────────────────────────
@app.get("/api/upload-queries")
def get_upload_queries(email: str, month: str = ""):
    if not month:
        month = db.get_latest_month(email)
    df = db.get_unreviewed_transactions(email, month=month if month else None)
    if df.empty:
        return {"queries": [], "allCategories": []}
    
    df = df.fillna('')
    categories = model.classes_.tolist() if (model and hasattr(model, 'classes_')) else []
    queries = []
    for _, row in df.iterrows():
        queries.append({
            "id": int(row['id']),
            "description": row['description'],
            "amount": float(row['amount']),
            "predictedCategory": row['predicted_category'],
            "date": row.get('date', '')
        })
    return {"queries": queries, "allCategories": categories}

# ──────────────────────────────────────────────────
#  CHATBOT — context includes current month focus
# ──────────────────────────────────────────────────
class ChatRequest(BaseModel):
    email: str
    prompt: str
    month: str = ""

@app.post("/api/chat")
def chat(req: ChatRequest):
    month = req.month or db.get_latest_month(req.email)
    
    # Get current month data
    df = db.get_transactions_by_email(req.email, month=month if month else None)
    
    if df.empty:
        return {"response": "I don't see any transactions for this month yet. Please upload a statement first so I can analyze your spending!"}
        
    df['Final Category'] = df['user_corrected_category'].combine_first(df['predicted_category'])
    
    # Also get all historical data for context
    api_key = os.environ.get("GEMINI_API_KEY", "AIzaSyDQfsd2Z6e9MsbK0mAbPon37Nddjn8YAS0")
    if not api_key:
        total_spent = float(df['amount'].sum())
        cat_sum = df.groupby('Final Category')['amount'].sum()
        top_cat = cat_sum.idxmax() if not cat_sum.empty else "N/A"
        return {"response": f"For {_format_month(month)}, you've spent ₹{total_spent:,.2f}. Top category: **{top_cat}**."}
        
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        
        current_data = df[['amount', 'description', 'Final Category']].to_string(index=False)
        
        # Build historical summary
        all_months = db.get_available_months(req.email)
        history = []
        for m in all_months[:6]:  # Last 6 months
            df_m = db.get_transactions_by_email(req.email, month=m)
            if not df_m.empty:
                history.append(f"{_format_month(m)}: ₹{float(df_m['amount'].sum()):,.2f}")
        
        combined_prompt = f"""You are finAI, a helpful financial assistant. The user is viewing {_format_month(month)}.

CURRENT MONTH ({_format_month(month)}) Transactions:
{current_data}

SPENDING HISTORY:
{chr(10).join(history)}

Answer the user's question concisely. Use Indian Rupees (₹). If they ask about patterns or trends, use the historical data.

User Question: {req.prompt}"""
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=combined_prompt
        )
        
        return {"response": response.text}
    except Exception as e:
        return {"response": f"AI Error: {str(e)}"}
