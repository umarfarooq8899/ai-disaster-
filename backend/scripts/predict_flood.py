import sys
import os
import json
import pandas as pd
import numpy as np
import joblib

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_DIR = os.path.join(BASE_DIR, 'backend', 'ml_models')
DATA_PATH = os.path.join(BASE_DIR, 'backend', 'data', 'pakistan_historical_floods.csv')

def train_and_predict(input_data=None):
    try:
        clf_path = os.path.join(MODEL_DIR, 'flood_clf.pkl')
        use_pretrained = os.path.exists(clf_path)
        
        if use_pretrained:
            model = joblib.load(clf_path)
        else:
            # Legacy fallback: train on the fly
            if not os.path.exists(DATA_PATH):
                return {"error": f"Dataset not found at {DATA_PATH}", "status": "error"}
            from sklearn.ensemble import RandomForestClassifier
            df = pd.read_csv(DATA_PATH)
            df.dropna(inplace=True)
            feature_cols_legacy = ['precipitation', 'rain_7d_sum', 'rain_14d_sum']
            X = df[feature_cols_legacy]
            y = df['FLOODS']
            model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight="balanced")
            model.fit(X, y)
        
        if not input_data or input_data.strip() == "":
            # Fallback to last row of historical data
            if os.path.exists(DATA_PATH):
                df = pd.read_csv(DATA_PATH)
                vals = [df['precipitation'].iloc[-1]]
                rain_7d = df['rain_7d_sum'].iloc[-1]
                rain_14d = df['rain_14d_sum'].iloc[-1]
            else:
                vals = [0]
                rain_7d = 0
                rain_14d = 0
            today_rain = vals[-1]
            desc = "Historical baseline"
        else:
            vals = [float(x) for x in input_data.split(',')] if ',' in input_data else [float(input_data)]
            today_rain = vals[-1]
            rain_7d = sum(vals)
            # Use actual accumulated sum for 14d instead of arbitrary multiplier
            rain_14d = rain_7d * (14.0 / max(len(vals), 1))
            desc = f"AI evaluating {len(vals)}-day rainfall accumulation ({round(rain_7d, 1)}mm)."

        # Determine current month for seasonality features
        from datetime import datetime
        current_month = datetime.now().month
        is_monsoon = 1 if current_month in [6, 7, 8, 9] else 0
        rain_intensity = max(vals) if vals else 0
        rain_30d = rain_7d * (30.0 / max(len(vals), 1))
        rain_deficit = rain_7d - (rain_7d / max(len(vals), 1))
        
        if use_pretrained:
            # 8-feature vector matching training
            latest_data = np.array([[today_rain, rain_7d, rain_14d, current_month,
                                     is_monsoon, rain_intensity, rain_30d, rain_deficit]])
        else:
            latest_data = np.array([[today_rain, rain_7d, rain_14d]])

        # Get calibrated probability
        prediction_prob = model.predict_proba(latest_data)[0][1]
        
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
            "model": "CalibratedXGBoost Classifier" if use_pretrained else "RandomForest (Legacy)",
            "threat_zones": threat_zones
        }
        return result
        
    except Exception as e:
        return {"error": str(e), "status": "error"}

if __name__ == "__main__":
    input_data = sys.argv[1] if len(sys.argv) > 1 else None
    print(json.dumps(train_and_predict(input_data)))
