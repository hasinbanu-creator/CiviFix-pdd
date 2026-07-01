import json
import urllib.request

url = "http://127.0.0.1:8000/api/v1/auth/login"
data = json.dumps({
    "email": "hasinbanukadharbasha161214@gmail.com"
}).encode("utf-8")

req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        print("Body:", response.read().decode("utf-8"))
except Exception as e:
    print("Error:", e)
    if hasattr(e, 'read'):
        print("Body:", e.read().decode('utf-8'))
