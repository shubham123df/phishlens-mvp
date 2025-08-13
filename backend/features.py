import re
import pandas as pd

def extract_features(url):
    features = {}
    features["url_length"] = len(url)
    features["has_https"] = 1 if "https" in url else 0
    features["num_digits"] = sum(c.isdigit() for c in url)
    features["num_special"] = len(re.findall(r'[^a-zA-Z0-9]', url))
    return pd.DataFrame([features])


