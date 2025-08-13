import os
import json
import joblib
from flask import Flask, request, jsonify, render_template
from features import extract_features

app = Flask(__name__)

# Load ML Model
model_path = os.path.join(os.path.dirname(__file__), "phishing_model.pkl")
if os.path.exists(model_path):
    model = joblib.load(model_path)
    print("✅ Model loaded successfully!")
else:
    model = None
    print("⚠️ No ML model found — using dummy scoring function")

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/check", methods=["POST"])
def check():
    data = request.get_json(silent=True) or {}
    url = data.get("url", "")

    if not url:
        return jsonify({"error": "No URL provided"}), 400

    # Force suspicious if certain keywords appear
    suspicious_keywords = ["paypal", "bank", "secure", "login"]
    if any(word in url.lower() for word in suspicious_keywords):
        return jsonify({
            "url": url,
            "prediction": 1,
            "result": "Suspicious",
            "score": 0.95
        })

    # Otherwise run ML model
    if model is None:
        return jsonify({"result": "Error: No model loaded"}), 500

    features_df = extract_features(url)
    pred = int(model.predict(features_df)[0])
    score = None
    if hasattr(model, "predict_proba"):
        score = float(model.predict_proba(features_df)[0][1])

    return jsonify({
        "url": url,
        "prediction": pred,
        "result": "Suspicious" if pred == 1 else "Safe",
        "score": score
    })


@app.route("/reports", methods=["GET"])
def get_reports():
    report_file = "../data/reported_links.json"
    if os.path.exists(report_file):
        with open(report_file, "r") as f:
            reports = json.load(f)
    else:
        reports = []
    return jsonify(reports)

if __name__ == "__main__":
    app.run(debug=True)
