import pickle
import pandas as pd

model, vectorizer = pickle.load(open("finance_model.pkl", "rb"))
df = pd.read_csv("data.csv")

X = vectorizer.transform(df["Description"].fillna(""))
probs = model.predict_proba(X)
max_probs = probs.max(axis=1)

for desc, max_p, pred in zip(df["Description"], max_probs, model.classes_[probs.argmax(axis=1)]):
    print(f"Desc: {desc:20s} | Pred: {pred:20s} | MaxProb: {max_p:.4f}")
