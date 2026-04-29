import sys
import os
import json
import pandas as pd
import numpy as np
import joblib

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_DIR = os.path.join(BASE_DIR, 'backend', 'ml_models')
DATA_PATH = os.path.join(BASE_DIR, 'backend', 'data', 'pakistan_historical_fires.csv')

def compute_fwi_proxy(temp, humidity, wind, days_dry):
    """Fire Weather Index proxy based on Canadian FWI system."""
    return (
        (temp / 45.0) * 0.3 +
        ((100 - humidity) / 100.0) * 0.25 +
        (wind / 40.0) * 0.2 +
        (min(days_dry, 30) / 30.0) * 0.25
    )

def train_and_predict(features_input=None):
    try:
        clf_path = os.path.join(MODEL_DIR, 'fire_clf.pkl')
        area_path = os.path.join(MODEL_DIR, 'fire_area_reg.pkl')
        use_pretrained = os.path.exists(clf_path)
        
        if not use_pretrained:
            # Legacy fallback
            if not os.path.exists(DATA_PATH):
                return {"error": f"Dataset not found at {DATA_PATH}", "status": "error"}
            from sklearn.ensemble import RandomForestRegressor
            df = pd.read_csv(DATA_PATH)
            df.dropna(inplace=True)
            X = df[['temp_max', 'humidity_mean', 'wind_speed', 'days_since_rain']]
            y = np.log1p(df['area'])
            model = RandomForestRegressor(n_estimators=100, random_state=42)
            model.fit(X, y)
        
        if not features_input or features_input.strip() == "":
            if os.path.exists(DATA_PATH):
                df = pd.read_csv(DATA_PATH)
                row = df.iloc[-1]
                temp, humidity, wind, rain = row['temp_max'], row['humidity_mean'], row['wind_speed'], 0
                days_dry = int(row['days_since_rain'])
            else:
                temp, humidity, wind, rain, days_dry = 30, 50, 10, 0, 5
            desc = "Historical baseline fallback"
        else:
            try:
                parts = [float(x) for x in features_input.split(',')]
                if len(parts) != 4:
                    raise ValueError("Expected 4 feature values")
                temp, humidity, wind, rain = parts
                days_dry = 0 if rain >= 1.0 else 10
                desc = f"AI evaluating real-time atmospheric conditions: {temp}°C, {humidity}% RH, {wind}km/h Wind"
            except Exception as e:
                temp, humidity, wind, rain, days_dry = 30, 50, 10, 0, 5
                desc = f"Historical baseline fallback (parsing error: {str(e)})"
        
        from datetime import datetime
        current_month = datetime.now().month
        is_fire_season = 1 if current_month in [4, 5, 6, 10] else 0
        heat_index = temp * (1 - humidity / 100)
        dryness_score = days_dry * temp / (humidity + 1)
        wind_drought = wind * days_dry
        fwi = compute_fwi_proxy(temp, humidity, wind, days_dry)
        
        if use_pretrained:
            fire_model = joblib.load(clf_path)
            # 10-feature vector matching training
            latest_data = np.array([[temp, humidity, wind, days_dry,
                                     current_month, is_fire_season, heat_index,
                                     dryness_score, wind_drought, fwi]])
            
            fire_prob = fire_model.predict_proba(latest_data)[0][1]
            
            # Also get area estimate if available
            impact_index = 0.0
            if os.path.exists(area_path):
                area_model = joblib.load(area_path)
                log_pred = area_model.predict(latest_data)[0]
                impact_index = round(float(np.expm1(log_pred)), 2)
            
            if fire_prob >= 0.70:
                risk = "High Risk"
                confidence_score = round(fire_prob * 100, 1)
                desc += " (Critical: High spread potential based on atmospheric conditions)"
            elif fire_prob >= 0.35:
                risk = "Medium Risk"
                confidence_score = round(fire_prob * 100, 1)
            else:
                risk = "Low Risk"
                confidence_score = round((1 - fire_prob) * 100, 1)
                if rain > 0.5:
                    desc += " (Rain actively suppressing risk)"
        else:
            # Legacy regressor path
            latest_data = np.array([[temp, humidity, wind, days_dry]])
            log_prediction = model.predict(latest_data)[0]
            prediction_area = np.expm1(log_prediction)
            impact_index = round(float(prediction_area), 2)
            fire_prob = 0.0
            
            if prediction_area > 50.0:
                risk = "High Risk"
                confidence_score = min(99.0, 70.0 + prediction_area / max(100.0, prediction_area) * 20)
            elif prediction_area > 20.0:
                risk = "Medium Risk"
                confidence_score = min(88.0, 50.0 + prediction_area / 50.0 * 20)
            else:
                risk = "Low Risk"
                confidence_score = min(95.0, 100.0 - prediction_area)
                
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
            "impact_index": impact_index,
            "fwi_index": round(fwi, 3),
            "fire_probability": round(float(fire_prob), 4) if use_pretrained else None,
            "description": desc,
            "status": "success",
            "model": "CalibratedXGBoost + FWI" if use_pretrained else "RandomForest Regressor (Legacy)",
            "threat_zones": threat_zones
        }
        return result
        
    except Exception as e:
        return {"error": str(e), "status": "error"}

if __name__ == "__main__":
    input_data = sys.argv[1] if len(sys.argv) > 1 else None
    print(json.dumps(train_and_predict(input_data)))
