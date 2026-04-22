"""
Comprehensive training script for the FinAI expense categorization model.
Trains a MultinomialNB classifier with a large, diverse training dataset
covering common Indian and international transaction descriptions.
"""

import pandas as pd
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.model_selection import cross_val_score
import numpy as np

# ============================================================
# COMPREHENSIVE TRAINING DATA — Indian + International context
# ============================================================
training_data = [
    # ===== FOOD & DINING =====
    ("Zomato Order", "Food & Dining"),
    ("Swiggy Order", "Food & Dining"),
    ("Swiggy Delivery", "Food & Dining"),
    ("Zomato Delivery", "Food & Dining"),
    ("Dominos Pizza", "Food & Dining"),
    ("Pizza Hut", "Food & Dining"),
    ("McDonalds", "Food & Dining"),
    ("KFC Order", "Food & Dining"),
    ("Burger King", "Food & Dining"),
    ("Subway Sandwich", "Food & Dining"),
    ("Thai Restaurant", "Food & Dining"),
    ("Chinese Restaurant", "Food & Dining"),
    ("Italian Restaurant", "Food & Dining"),
    ("Fine Dining", "Food & Dining"),
    ("Restaurant Bill", "Food & Dining"),
    ("Dinner at Hotel", "Food & Dining"),
    ("Lunch at Restaurant", "Food & Dining"),
    ("Food Court", "Food & Dining"),
    ("Haldiram", "Food & Dining"),
    ("Barbeque Nation", "Food & Dining"),
    ("Hotel Meal", "Food & Dining"),
    ("Biryani House", "Food & Dining"),
    ("Dhaba Food", "Food & Dining"),
    ("Street Food", "Food & Dining"),
    ("Tiffin Service", "Food & Dining"),
    ("Mess Bill", "Food & Dining"),
    ("Canteen Food", "Food & Dining"),
    ("Food Order", "Food & Dining"),
    ("Eat Out", "Food & Dining"),
    ("Dining Out", "Food & Dining"),
    ("Take Away Food", "Food & Dining"),
    ("Parcel Food", "Food & Dining"),
    ("Catering Service", "Food & Dining"),
    ("Online Food Order", "Food & Dining"),
    ("Bakery Items", "Food & Dining"),
    ("Cake Shop", "Food & Dining"),
    ("Sweet Shop", "Food & Dining"),
    ("Ice Cream Parlour", "Food & Dining"),
    ("Baskin Robbins", "Food & Dining"),
    ("Starbucks", "Food & Dining"),
    ("Cafe Coffee Day", "Food & Dining"),
    ("Coffee Shop", "Food & Dining"),
    ("Tea Stall", "Food & Dining"),
    ("Chaayos", "Food & Dining"),
    ("Third Wave Coffee", "Food & Dining"),
    ("Dunkin Donuts", "Food & Dining"),
    ("Nandos", "Food & Dining"),
    ("Chilis", "Food & Dining"),
    ("TGIF", "Food & Dining"),
    ("Freshmenu", "Food & Dining"),
    ("Box8", "Food & Dining"),
    ("EatFit", "Food & Dining"),
    ("FreshMenu Order", "Food & Dining"),

    # ===== GROCERIES =====
    ("Grocery Store", "Groceries"),
    ("Big Bazaar", "Groceries"),
    ("DMart", "Groceries"),
    ("D Mart", "Groceries"),
    ("Reliance Fresh", "Groceries"),
    ("More Supermarket", "Groceries"),
    ("Spencer's", "Groceries"),
    ("Star Bazaar", "Groceries"),
    ("Nature's Basket", "Groceries"),
    ("BigBasket", "Groceries"),
    ("Big Basket Order", "Groceries"),
    ("Blinkit", "Groceries"),
    ("Blinkit Order", "Groceries"),
    ("Zepto Order", "Groceries"),
    ("Zepto Delivery", "Groceries"),
    ("Instamart", "Groceries"),
    ("Swiggy Instamart", "Groceries"),
    ("JioMart", "Groceries"),
    ("Vegetables", "Groceries"),
    ("Fruits Purchase", "Groceries"),
    ("Milk Purchase", "Groceries"),
    ("Daily Needs", "Groceries"),
    ("Kirana Store", "Groceries"),
    ("Provision Store", "Groceries"),
    ("Supermarket Purchase", "Groceries"),
    ("Weekly Grocery", "Groceries"),
    ("Monthly Grocery", "Groceries"),
    ("Ration Purchase", "Groceries"),
    ("Food Supplies", "Groceries"),
    ("Kitchen Supplies", "Groceries"),
    ("Household Supplies", "Groceries"),
    ("Licious Order", "Groceries"),
    ("FreshToHome", "Groceries"),
    ("Country Delight", "Groceries"),
    ("Milk Subscription", "Groceries"),

    # ===== SHOPPING =====
    ("Amazon", "Shopping"),
    ("Amazon Purchase", "Shopping"),
    ("Amazon Order", "Shopping"),
    ("Flipkart", "Shopping"),
    ("Flipkart Order", "Shopping"),
    ("Flipkart Purchase", "Shopping"),
    ("Myntra", "Shopping"),
    ("Myntra Order", "Shopping"),
    ("Ajio", "Shopping"),
    ("Meesho", "Shopping"),
    ("Nykaa", "Shopping"),
    ("Nykaa Order", "Shopping"),
    ("Apple Store", "Shopping"),
    ("Croma Electronics", "Shopping"),
    ("Reliance Digital", "Shopping"),
    ("Vijay Sales", "Shopping"),
    ("Clothing Store", "Shopping"),
    ("Zara", "Shopping"),
    ("H&M", "Shopping"),
    ("Pantaloons", "Shopping"),
    ("Lifestyle Store", "Shopping"),
    ("Shoppers Stop", "Shopping"),
    ("Central Mall", "Shopping"),
    ("Mall Shopping", "Shopping"),
    ("Online Shopping", "Shopping"),
    ("Shopping Mall", "Shopping"),
    ("Footwear Shop", "Shopping"),
    ("Shoe Store", "Shopping"),
    ("Nike Store", "Shopping"),
    ("Adidas Store", "Shopping"),
    ("Puma Store", "Shopping"),
    ("Decathlon", "Shopping"),
    ("Furniture Store", "Shopping"),
    ("IKEA", "Shopping"),
    ("Home Centre", "Shopping"),
    ("Pepperfry", "Shopping"),
    ("Urban Ladder", "Shopping"),
    ("Bookstore", "Shopping"),
    ("Book Purchase", "Shopping"),
    ("Snapdeal", "Shopping"),
    ("Tata Cliq", "Shopping"),
    ("FirstCry", "Shopping"),
    ("Accessories Purchase", "Shopping"),
    ("Jewellery Shop", "Shopping"),
    ("Watch Purchase", "Shopping"),
    ("Cosmetics Purchase", "Shopping"),
    ("Lenskart", "Shopping"),
    ("Titan Eye", "Shopping"),
    ("Gift Purchase", "Shopping"),

    # ===== TRANSPORT =====
    ("Uber Ride", "Transport"),
    ("Ola Ride", "Transport"),
    ("Ola Cab", "Transport"),
    ("Uber Cab", "Transport"),
    ("Rapido Ride", "Transport"),
    ("Auto Rickshaw", "Transport"),
    ("Auto Fare", "Transport"),
    ("Taxi Fare", "Transport"),
    ("Bus Ticket", "Transport"),
    ("Metro Ticket", "Transport"),
    ("Metro Card Recharge", "Transport"),
    ("Train Ticket", "Transport"),
    ("Railway Ticket", "Transport"),
    ("IRCTC Booking", "Transport"),
    ("IRCTC", "Transport"),
    ("Flight Ticket", "Transport"),
    ("Air India", "Transport"),
    ("IndiGo Flight", "Transport"),
    ("SpiceJet", "Transport"),
    ("MakeMyTrip", "Transport"),
    ("Goibibo", "Transport"),
    ("Yatra Booking", "Transport"),
    ("RedBus Ticket", "Transport"),
    ("Cab Fare", "Transport"),
    ("Commute Expense", "Transport"),
    ("Travel Fare", "Transport"),
    ("Local Transport", "Transport"),
    ("Parking Fee", "Transport"),
    ("Toll Charge", "Transport"),
    ("FASTag Recharge", "Transport"),
    ("Toll Payment", "Transport"),
    ("Airport Transfer", "Transport"),
    ("Shuttle Service", "Transport"),
    ("Ferry Ticket", "Transport"),

    # ===== FUEL =====
    ("Petrol Pump", "Fuel"),
    ("Petrol", "Fuel"),
    ("Diesel", "Fuel"),
    ("Fuel Station", "Fuel"),
    ("HP Petrol", "Fuel"),
    ("Indian Oil", "Fuel"),
    ("IOCL Fuel", "Fuel"),
    ("Bharat Petroleum", "Fuel"),
    ("BPCL", "Fuel"),
    ("Shell Petrol", "Fuel"),
    ("Gas Filling", "Fuel"),
    ("Fuel Refill", "Fuel"),
    ("CNG Filling", "Fuel"),
    ("CNG Station", "Fuel"),
    ("EV Charging", "Fuel"),
    ("Electric Vehicle Charge", "Fuel"),
    ("Petrol Purchase", "Fuel"),

    # ===== UTILITIES =====
    ("Electricity Bill", "Utilities"),
    ("Electric Bill Payment", "Utilities"),
    ("BESCOM Bill", "Utilities"),
    ("MSEDCL Bill", "Utilities"),
    ("Tata Power Bill", "Utilities"),
    ("Adani Electricity", "Utilities"),
    ("Water Bill", "Utilities"),
    ("Water Supply Bill", "Utilities"),
    ("Gas Bill", "Utilities"),
    ("Piped Gas Bill", "Utilities"),
    ("LPG Cylinder", "Utilities"),
    ("Gas Cylinder", "Utilities"),
    ("Indane Gas", "Utilities"),
    ("HP Gas", "Utilities"),
    ("Internet Bill", "Utilities"),
    ("WiFi Bill", "Utilities"),
    ("Broadband Bill", "Utilities"),
    ("Jio Fiber", "Utilities"),
    ("Airtel Broadband", "Utilities"),
    ("ACT Fibernet", "Utilities"),
    ("Mobile Recharge", "Utilities"),
    ("Phone Recharge", "Utilities"),
    ("Jio Recharge", "Utilities"),
    ("Airtel Recharge", "Utilities"),
    ("Vi Recharge", "Utilities"),
    ("BSNL Recharge", "Utilities"),
    ("Postpaid Bill", "Utilities"),
    ("Mobile Bill", "Utilities"),
    ("DTH Recharge", "Utilities"),
    ("Tata Sky", "Utilities"),
    ("Dish TV", "Utilities"),
    ("Maintenance Charges", "Utilities"),
    ("Society Maintenance", "Utilities"),
    ("Municipal Tax", "Utilities"),
    ("Property Tax", "Utilities"),

    # ===== RENT & HOUSING =====
    ("Rent Payment", "Rent"),
    ("House Rent", "Rent"),
    ("Monthly Rent", "Rent"),
    ("Room Rent", "Rent"),
    ("PG Rent", "Rent"),
    ("Flat Rent", "Rent"),
    ("Apartment Rent", "Rent"),
    ("Hostel Fees", "Rent"),
    ("Accommodation", "Rent"),
    ("Mortgage Payment", "Rent"),
    ("Home Loan EMI", "Rent"),
    ("Housing Loan", "Rent"),
    ("EMI Payment", "Rent"),
    ("Landlord Payment", "Rent"),

    # ===== ENTERTAINMENT =====
    ("Netflix", "Entertainment"),
    ("Netflix Subscription", "Entertainment"),
    ("Amazon Prime", "Entertainment"),
    ("Amazon Prime Video", "Entertainment"),
    ("Hotstar", "Entertainment"),
    ("Disney Plus", "Entertainment"),
    ("Disney Hotstar", "Entertainment"),
    ("Spotify", "Entertainment"),
    ("Spotify Subscription", "Entertainment"),
    ("YouTube Premium", "Entertainment"),
    ("Apple Music", "Entertainment"),
    ("Apple TV", "Entertainment"),
    ("JioCinema", "Entertainment"),
    ("SonyLIV", "Entertainment"),
    ("ZEE5", "Entertainment"),
    ("Zee5 Subscription", "Entertainment"),
    ("Movie Theater", "Entertainment"),
    ("Movie Ticket", "Entertainment"),
    ("PVR Cinemas", "Entertainment"),
    ("INOX Movies", "Entertainment"),
    ("BookMyShow", "Entertainment"),
    ("Concert Ticket", "Entertainment"),
    ("Event Ticket", "Entertainment"),
    ("Amusement Park", "Entertainment"),
    ("Theme Park", "Entertainment"),
    ("Gaming", "Entertainment"),
    ("PlayStation", "Entertainment"),
    ("Xbox Subscription", "Entertainment"),
    ("Steam Purchase", "Entertainment"),
    ("Audible", "Entertainment"),
    ("Kindle Unlimited", "Entertainment"),
    ("Music Subscription", "Entertainment"),
    ("OTT Subscription", "Entertainment"),

    # ===== HEALTH & MEDICAL =====
    ("Medical Store", "Health"),
    ("Medicine Purchase", "Health"),
    ("Pharmacy", "Health"),
    ("Apollo Pharmacy", "Health"),
    ("MedPlus", "Health"),
    ("Netmeds Order", "Health"),
    ("PharmEasy", "Health"),
    ("1mg Order", "Health"),
    ("Hospital Bill", "Health"),
    ("Doctor Visit", "Health"),
    ("Doctor Consultation", "Health"),
    ("Dental Checkup", "Health"),
    ("Eye Checkup", "Health"),
    ("Lab Test", "Health"),
    ("Blood Test", "Health"),
    ("Diagnostic Center", "Health"),
    ("Health Checkup", "Health"),
    ("Medical Test", "Health"),
    ("Gym Membership", "Health"),
    ("Fitness Center", "Health"),
    ("Yoga Class", "Health"),
    ("CultFit", "Health"),
    ("Cult Fit Membership", "Health"),
    ("Health Insurance", "Health"),
    ("Medical Insurance", "Health"),
    ("Practo Consultation", "Health"),
    ("Physiotherapy", "Health"),
    ("Vaccination", "Health"),
    ("Covid Test", "Health"),

    # ===== EDUCATION =====
    ("Tuition Fees", "Education"),
    ("College Fees", "Education"),
    ("School Fees", "Education"),
    ("University Fees", "Education"),
    ("Course Fee", "Education"),
    ("Udemy Course", "Education"),
    ("Coursera", "Education"),
    ("Unacademy", "Education"),
    ("BYJU's", "Education"),
    ("Byjus Subscription", "Education"),
    ("Coaching Fees", "Education"),
    ("Books Purchase", "Education"),
    ("Study Material", "Education"),
    ("Exam Fee", "Education"),
    ("Library Fee", "Education"),
    ("Online Course", "Education"),
    ("Skill Course", "Education"),
    ("Certification Fee", "Education"),
    ("Workshop Fee", "Education"),
    ("Seminar Registration", "Education"),
    ("EdTech Subscription", "Education"),
    ("LinkedIn Learning", "Education"),
    ("Skillshare", "Education"),

    # ===== TRANSFERS & PAYMENTS =====
    ("PhonePe Transfer", "Transfer"),
    ("GPay Transfer", "Transfer"),
    ("Google Pay Transfer", "Transfer"),
    ("Paytm Transfer", "Transfer"),
    ("UPI Transfer", "Transfer"),
    ("UPI Payment", "Transfer"),
    ("Bank Transfer", "Transfer"),
    ("NEFT Transfer", "Transfer"),
    ("IMPS Transfer", "Transfer"),
    ("RTGS Transfer", "Transfer"),
    ("Wire Transfer", "Transfer"),
    ("Money Transfer", "Transfer"),
    ("Fund Transfer", "Transfer"),
    ("Sent to Friend", "Transfer"),
    ("Paid to Contact", "Transfer"),
    ("ATM Withdrawal", "Transfer"),
    ("Cash Withdrawal", "Transfer"),
    ("Self Transfer", "Transfer"),
    ("Credit Card Payment", "Transfer"),
    ("Card Bill Payment", "Transfer"),
    ("Loan Payment", "Transfer"),
    ("Loan EMI", "Transfer"),
    ("Personal Loan EMI", "Transfer"),
    ("Car Loan EMI", "Transfer"),
    ("Education Loan EMI", "Transfer"),

    # ===== INCOME =====
    ("Salary Credit", "Income"),
    ("Salary Deposit", "Income"),
    ("Monthly Salary", "Income"),
    ("Paycheck", "Income"),
    ("Wages Credit", "Income"),
    ("Freelance Payment", "Income"),
    ("Freelance Income", "Income"),
    ("Client Payment", "Income"),
    ("Business Income", "Income"),
    ("Dividend Income", "Income"),
    ("Interest Credit", "Income"),
    ("Bank Interest", "Income"),
    ("FD Interest", "Income"),
    ("Cashback Received", "Income"),
    ("Refund Received", "Income"),
    ("Gift Received", "Income"),
    ("Rental Income", "Income"),
    ("Bonus Credit", "Income"),
    ("Incentive Credit", "Income"),
    ("Stipend Credit", "Income"),
    ("Pension Credit", "Income"),
    ("Commission Income", "Income"),

    # ===== INSURANCE =====
    ("Car Insurance", "Insurance"),
    ("Bike Insurance", "Insurance"),
    ("Vehicle Insurance", "Insurance"),
    ("Life Insurance", "Insurance"),
    ("Term Insurance", "Insurance"),
    ("LIC Premium", "Insurance"),
    ("LIC Payment", "Insurance"),
    ("HDFC Life", "Insurance"),
    ("ICICI Prudential", "Insurance"),
    ("SBI Life Insurance", "Insurance"),
    ("Max Life Insurance", "Insurance"),
    ("Travel Insurance", "Insurance"),
    ("General Insurance", "Insurance"),
    ("Insurance Premium", "Insurance"),
    ("Policy Premium", "Insurance"),

    # ===== INVESTMENT =====
    ("Mutual Fund SIP", "Investment"),
    ("SIP Payment", "Investment"),
    ("Stock Purchase", "Investment"),
    ("Zerodha", "Investment"),
    ("Groww Investment", "Investment"),
    ("Kuvera SIP", "Investment"),
    ("PPF Deposit", "Investment"),
    ("NPS Contribution", "Investment"),
    ("FD Deposit", "Investment"),
    ("Fixed Deposit", "Investment"),
    ("RD Payment", "Investment"),
    ("Recurring Deposit", "Investment"),
    ("Gold Purchase", "Investment"),
    ("Digital Gold", "Investment"),
    ("Bonds Purchase", "Investment"),
    ("Investment", "Investment"),
    ("ELSS Fund", "Investment"),
    ("Share Purchase", "Investment"),
    ("Crypto Purchase", "Investment"),

    # ===== PERSONAL CARE =====
    ("Haircut", "Personal Care"),
    ("Salon Visit", "Personal Care"),
    ("Parlour Bill", "Personal Care"),
    ("Beauty Salon", "Personal Care"),
    ("Spa Treatment", "Personal Care"),
    ("Massage", "Personal Care"),
    ("Skincare Products", "Personal Care"),
    ("Grooming", "Personal Care"),
    ("Laundry", "Personal Care"),
    ("Dry Cleaning", "Personal Care"),
    ("Tailor", "Personal Care"),

    # ===== TRAVEL & VACATION =====
    ("Hotel Booking", "Travel"),
    ("OYO Booking", "Travel"),
    ("Airbnb", "Travel"),
    ("Resort Booking", "Travel"),
    ("Travel Booking", "Travel"),
    ("Vacation Expense", "Travel"),
    ("Holiday Trip", "Travel"),
    ("Tour Package", "Travel"),
    ("Sightseeing", "Travel"),
    ("Travel Agent", "Travel"),
    ("Visa Fee", "Travel"),
    ("Passport Fee", "Travel"),
    ("Travel Expense", "Travel"),
    ("Trip Booking", "Travel"),
    ("MakeMyTrip Hotel", "Travel"),

    # ===== CHARITY & GIFTS =====
    ("Donation", "Charity"),
    ("Temple Donation", "Charity"),
    ("NGO Donation", "Charity"),
    ("Charity Payment", "Charity"),
    ("Gift Purchase", "Charity"),
    ("Wedding Gift", "Charity"),
    ("Birthday Gift", "Charity"),
    ("Shagun", "Charity"),
    ("Festival Gift", "Charity"),

    # ===== MISCELLANEOUS =====
    ("Stamp Paper", "Miscellaneous"),
    ("Legal Fee", "Miscellaneous"),
    ("Courier Charge", "Miscellaneous"),
    ("Printing", "Miscellaneous"),
    ("Xerox", "Miscellaneous"),
    ("Bank Charges", "Miscellaneous"),
    ("Late Fee", "Miscellaneous"),
    ("Penalty Charge", "Miscellaneous"),
    ("GST Payment", "Miscellaneous"),
    ("Tax Payment", "Miscellaneous"),
    ("Income Tax", "Miscellaneous"),
    ("Service Charge", "Miscellaneous"),
    ("Convenience Fee", "Miscellaneous"),
    ("Processing Fee", "Miscellaneous"),
]

# Build DataFrame
df = pd.DataFrame(training_data, columns=["Description", "Category"])

print(f"Total training samples: {len(df)}")
print(f"Categories ({df['Category'].nunique()}):")
for cat, count in df['Category'].value_counts().items():
    print(f"  {cat}: {count} samples")

# ============================================================
# TRAIN THE MODEL
# ============================================================

# Use TF-IDF with ngrams for better text matching
vectorizer = TfidfVectorizer(
    lowercase=True,
    ngram_range=(1, 2),      # Unigrams + bigrams for better matching
    max_features=5000,
    sublinear_tf=True,       # Logarithmic term frequency
    strip_accents='unicode',
)

X = vectorizer.fit_transform(df["Description"])
y = df["Category"]

# Using MultinomialNB with lower alpha for less smoothing (more confident)
model = MultinomialNB(alpha=0.1)
model.fit(X, y)

# Cross-validation
scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
print(f"\nCross-validation accuracy: {scores.mean():.2%} (+/- {scores.std():.2%})")

# ============================================================
# TEST PREDICTIONS
# ============================================================
test_descriptions = [
    "Amazon", "Netflix", "Uber Ride", "Electricity Bill", "Zomato Order",
    "Petrol Pump", "Salary Credit", "Swiggy", "Rent Payment", "Grocery Store",
    "ATM Withdrawal", "PhonePe transfer", "Gym Membership", "SIP Payment",
    "Movie Ticket", "Hospital Bill", "LIC Premium", "Flipkart Order",
    "Hotel Booking", "Airtel Recharge", "Dominos", "Coffee Shop",
    "Medical Store", "Bus Ticket", "Water Bill", "Big Bazaar",
    "College Fees", "Salon Visit", "Donation", "Bank Charges"
]

print("\n=== PREDICTION TEST ===")
X_test = vectorizer.transform(test_descriptions)
probs = model.predict_proba(X_test)
max_probs = probs.max(axis=1)
preds = model.classes_[probs.argmax(axis=1)]

low_conf_count = 0
for desc, pred, conf in zip(test_descriptions, preds, max_probs):
    flag = "✗ LOW" if conf < 0.40 else "✓"
    if conf < 0.40:
        low_conf_count += 1
    print(f"  {desc:25s} → {pred:20s} ({conf:.1%}) {flag}")

print(f"\nLow confidence predictions: {low_conf_count}/{len(test_descriptions)}")

# ============================================================
# SAVE THE MODEL
# ============================================================
with open("finance_model.pkl", "wb") as f:
    pickle.dump((model, vectorizer), f)

print(f"\n✅ Model saved to finance_model.pkl")
print(f"   Vocabulary size: {len(vectorizer.vocabulary_)}")
print(f"   Categories: {len(model.classes_)}")
print(f"   Classes: {model.classes_.tolist()}")
