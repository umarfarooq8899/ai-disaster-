import sys
import os
import json
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_PATH = os.path.join(BASE_DIR, 'backend', 'data', 'pakistan_rainfall.csv')

def train_and_predict(input_data=None):
    try:
        if not os.path.exists(DATA_PATH):
            return {"error": f"Dataset not found at {DATA_PATH}", "status": "error"}

        # Load data
        df = pd.read_csv(DATA_PATH)
        df['FLOODS'] = df['FLOODS'].map({'YES': 1, 'NO': 0})
        
        feature_cols = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
        X = df[feature_cols]
        y = df['FLOODS']
        
        # Use a more advanced ensemble model
        model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight="balanced")
        model.fit(X, y)
        
        from datetime import datetime
        current_month_idx = datetime.now().month - 1
        
        if not input_data:
            latest_data = X.iloc[-1].values.reshape(1, -1)
            year = int(df.iloc[-1]['YEAR'])
            desc = "Historical baseline"
        elif ',' in input_data and len(input_data.split(',')) == 12:
            # Full 12 month input
            latest_data = np.array([float(x) for x in input_data.split(',')]).reshape(1, -1)
            year = "Custom"
            desc = "Full monthly profile used for prediction."
        else:
            # Single value or buffer forecast:
            # The input buffer from monitoringService contains up to 7 days of rainfall sum
            vals = [float(x) for x in input_data.split(',')] if ',' in input_data else [float(input_data)]
            recent_sum = sum(vals) # Total rain in the recent buffer
            input_rain = vals[-1] # Today's rain
            
            # Map recent rain realistically into the monthly feature for the AI
            row = X.median().values
            # Assume to scale the short term rain to monthly impact (rough scaling for the ML)
            row[current_month_idx] = recent_sum * 4  
            latest_data = row.reshape(1, -1)
            year = "Real-time Forecast"
            desc = f"AI evaluating {len(vals)}-day rainfall accumulation ({round(recent_sum, 1)}mm)."

        # Let the AI make the prediction natively
        prediction_prob = model.predict_proba(latest_data)[0][1]
        
        # We define severity boundaries based directly on the model's output probabilities
        if prediction_prob >= 0.70:
            prediction = "High Risk"
        elif prediction_prob >= 0.40:
            prediction = "Medium Risk"
        else:
            prediction = "Low Risk"

        # Threat Zones
        threat_zones = []
        if prediction in ["High Risk", "Medium Risk"]:
            # Depending on rain severity, assign to Indus Basin and secondary basins
            threat_zones.append({
                "latitude": 33.1391,
                "longitude": 73.6501,
                "title": "Mangla Dam Catchment",
                "severity": "high" if prediction == "High Risk" else "medium",
                "type": "flood",
                "dangerRadius": 40 if prediction == "High Risk" else 20,
                "description": desc
            })
            if prediction == "High Risk" or prediction_prob > 0.55:
                # Add another basin
                threat_zones.append({
                    "latitude": 34.0884,
                    "longitude": 72.8226,
                    "title": "Tarbela Dam Catchment",
                    "severity": "medium",
                    "type": "flood",
                    "dangerRadius": 30,
                    "description": "Secondary flood wave expected"
                })

        result = {
            "prediction": prediction,
            "probability": round(float(prediction_prob), 4),
            "reference": year,
            "description": desc,
            "status": "success",
            "model": "RandomForest Classifier (AI)",
            "threat_zones": threat_zones
        }
        return result
        
    except Exception as e:
        return {"error": str(e), "status": "error"}

if __name__ == "__main__":
    # If an argument is passed, it should be comma-separated rainfall values
    input_data = sys.argv[1] if len(sys.argv) > 1 else None
    print(json.dumps(train_and_predict(input_data)))

