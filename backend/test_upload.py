import requests
import json

url = "http://localhost:8000/api/upload"

with open("data.csv", "rb") as f:
    files = {"file": ("data.csv", f, "text/csv")}
    data = {"email": "test@example.com"}
    response = requests.post(url, data=data, files=files)

print("Status Code:", response.status_code)
print("Response:", response.text)
