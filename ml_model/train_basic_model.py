import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib
from features import extract_features

# Example dataset (replace with real phishing dataset)
data = [
    {"url": "http://example.com", "label": 0},
    {"url": "http://free-money.ru", "label": 1},
    {"url": "https://google.com", "label": 0},
    {"url": "http://paypal-login-security-update.com", "label": 1}
]

df = pd.DataFrame(data)

# Extract features
X = pd.concat([extract_features(row.url) for row in df.itertuples()], ignore_index=True)
y = df["label"]

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train RandomForest
model = RandomForestClassifier(n_estimators=200, random_state=42)
model.fit(X_train, y_train)

# Save model
joblib.dump(model, "../backend/phishing_model.pkl")
print("✅ Model trained & saved to backend/phishing_model.pkl")
