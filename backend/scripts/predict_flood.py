import sys
import os
import json
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_PATH = os.path.join(BASE_DIR, 'backend', 'data', 'pakistan_historical_floods.csv')

def train_and_predict(input_data=None):
    try:
        if not os.path.exists(DATA_PATH):
            return {"error": f"Dataset not found at {DATA_PATH}", "status": "error"}

        df = pd.read_csv(DATA_PATH)
        df.dropna(inplace=True)
        
        feature_cols = ['precipitation', 'rain_7d_sum', 'rain_14d_sum']
        X = df[feature_cols]
        y = df['FLOODS']
        
        model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight="balanced")
        model.fit(X, y)
        
        if not input_data:
            latest_data = X.iloc[-1].values.reshape(1, -1)
            desc = "Historical baseline"
        else:
            # input_data from monitoringService is a comma-separated string of the last ~7 days of rain
            vals = [float(x) for x in input_data.split(',')] if ',' in input_data else [float(input_data)]
            today_rain = vals[-1]
            rain_7d = sum(vals)
            # Estimate 14d rain safely based on 7 days (extrapolating or just using the 7d sum as a floor)
            rain_14d = rain_7d * 1.5 
            
            latest_data = np.array([[today_rain, rain_7d, rain_14d]])
            desc = f"AI evaluating {len(vals)}-day rainfall accumulation ({round(rain_7d, 1)}mm)."

        # Predict probability of class 1 (FLOODS = 1)
        prediction_prob = model.predict_proba(latest_data)[0][1]
        
        # We define severity boundaries based directly on the model's output probabilities
        if prediction_prob >= 0.70:
            prediction = "High Risk"
            confidence_score = round(prediction_prob * 100, 1)
        elif prediction_prob >= 0.40:
            prediction = "Medium Risk"
            confidence_score = round(prediction_prob * 100, 1)
        else:
            prediction = "Low Risk"
            confidence_score = round((1 - prediction_prob) * 100, 1)

        threat_zones = []
        if prediction in ["High Risk", "Medium Risk"]:
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
            "confidence_score": float(confidence_score),
            "probability": round(float(prediction_prob), 4),
            "reference": "Real-time Forecast",
            "description": desc,
            "status": "success",
            "model": "RandomForest Classifier (AI Phase 2)",
            "threat_zones": threat_zones
        }
        return result
        
    except Exception as e:
        return {"error": str(e), "status": "error"}

if __name__ == "__main__":
    input_data = sys.argv[1] if len(sys.argv) > 1 else None
    print(json.dumps(train_and_predict(input_data)))
