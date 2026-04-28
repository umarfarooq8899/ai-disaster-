import sys
import os
import json
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_PATH = os.path.join(BASE_DIR, 'backend', 'data', 'pakistan_historical_fires.csv')

def train_and_predict(features_input=None):
    try:
        if not os.path.exists(DATA_PATH):
            return {"error": f"Dataset not found at {DATA_PATH}", "status": "error"}

        df = pd.read_csv(DATA_PATH)
        df.dropna(inplace=True)
        
        feature_cols = ['temp_max', 'humidity_mean', 'wind_speed', 'days_since_rain']
        X = df[feature_cols]
        y = np.log1p(df['area']) # Log transform target
        
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X, y)
        
        if not features_input or features_input.strip() == "":
            latest_data = X.iloc[-1].values.reshape(1, -1)
            desc = "Historical baseline fallback"
        else:
            try:
                parts = [float(x) for x in features_input.split(',')]
                if len(parts) != 4:
                    raise ValueError("Expected 4 feature values")
                temp, humidity, wind, rain = parts
                
                # Estimate days since last rain (if raining today it's 0, else assume a typical dry period of 10 days for worst case logic or neutral 5)
                days_dry = 0 if rain >= 1.0 else 10 
                
                latest_data = np.array([[temp, humidity, wind, days_dry]])
                desc = f"AI evaluating real-time atmospheric conditions: {temp}°C, {humidity}% RH, {wind}km/h Wind"
            except Exception as e:
                latest_data = X.iloc[-1].values.reshape(1, -1)
                desc = f"Historical baseline fallback (parsing error: {str(e)})"

        log_prediction = model.predict(latest_data)[0]
        prediction_area = np.expm1(log_prediction)
        
        # Evaluate severity
        if prediction_area > 50.0:
            risk = "High Risk"
            desc += " (Critical: High spread potential based on atmospheric conditions)"
            confidence_score = min(99.0, 70.0 + prediction_area / max(100.0, prediction_area) * 20)
        elif prediction_area > 20.0:
            risk = "Medium Risk"
            confidence_score = min(88.0, 50.0 + prediction_area / 50.0 * 20)
        else:
            risk = "Low Risk"
            confidence_score = min(95.0, 100.0 - prediction_area)
            if float(features_input.split(',')[3]) > 0.5:
                desc += " (Rain actively suppressing risk)"
                confidence_score = min(99.0, confidence_score + 10)
                
        threat_zones = []
        if risk in ["High Risk", "Medium Risk"]:
            threat_zones.append({
                "latitude": 33.7463,
                "longitude": 73.0566,
                "title": "Margalla Hills",
                "severity": "high" if risk == "High Risk" else "medium",
                "type": "fire",
                "dangerRadius": 25 if risk == "High Risk" else 15,
                "description": desc
            })
            if risk == "High Risk":
                 threat_zones.append({
                    "latitude": 30.1798,
                    "longitude": 66.9750,
                    "title": "Balochistan Scrub Forests",
                    "severity": "medium",
                    "type": "fire",
                    "dangerRadius": 40,
                    "description": "Extreme heat and low humidity flagged."
                })
            
        result = {
            "prediction": risk,
            "confidence_score": round(float(confidence_score), 2),
            "impact_index": round(float(prediction_area), 2),
            "description": desc,
            "status": "success",
            "model": "RandomForest Regressor (AI Phase 2)",
            "threat_zones": threat_zones
        }
        return result
        
    except Exception as e:
        return {"error": str(e), "status": "error"}

if __name__ == "__main__":
    input_data = sys.argv[1] if len(sys.argv) > 1 else None
    print(json.dumps(train_and_predict(input_data)))
