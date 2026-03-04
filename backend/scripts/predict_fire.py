import sys
import os
import json
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from datetime import datetime

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_PATH = os.path.join(BASE_DIR, 'model_training', 'Climate-Disasters-Warning-Systems-main', 'Fire Detection', 'forestfires.csv')

def train_and_predict(features_input=None):
    try:
        if not os.path.exists(DATA_PATH):
            return {"error": f"Dataset not found at {DATA_PATH}", "status": "error"}

        # Load data
        df = pd.read_csv(DATA_PATH)
        
        # Preprocessing
        le_month = LabelEncoder()
        df['month'] = le_month.fit_transform(df['month'])
        le_day = LabelEncoder()
        df['day'] = le_day.fit_transform(df['day'])
        
        # Features: Everything except 'area'
        X = df.drop('area', axis=1)
        y = np.log1p(df['area']) # Use log transform for target to handle skewed fire areas better
        
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X, y)
        
        current_month = datetime.now().strftime('%b').lower()
        current_day = datetime.now().strftime('%a').lower()
        
        if features_input is None:
            latest_data = X.iloc[-1].values.reshape(1, -1)
            desc = "Historical baseline"
        elif ',' in features_input:
            vals = features_input.split(',')
            if len(vals) == 4:
                # Live Open-Meteo payload: Temp, RH, Wind, Rain
                temp, rhino, wind, rain = [float(x) for x in vals]
                
                # Base row off average conditions
                row = X.mean().values
                
                # Set dynamic time
                try:
                    row[2] = le_month.transform([current_month])[0]  # month
                    row[3] = le_day.transform([current_day])[0]      # day
                except:
                    pass
                
                row[8] = temp  # temp
                row[9] = rhino  # RH
                row[10] = wind # wind
                row[11] = rain # rain
                latest_data = row.reshape(1, -1)
                desc = f"AI evaluating real-time weather: {temp}°C, {rhino}% RH, {wind}km/h Wind"
            else:
                # Full feature input
                try:
                    vals[2] = le_month.transform([vals[2]])[0]
                    vals[3] = le_day.transform([vals[3]])[0]
                except:
                    pass
                latest_data = np.array([float(x) for x in vals]).reshape(1, -1)
                desc = "Custom entry"
        else:
            latest_data = X.iloc[-1].values.reshape(1, -1)
            desc = "Fallback to baseline"

        # Predict log(area)
        log_prediction = model.predict(latest_data)[0]
        # Transform back to actual area
        prediction_area = np.expm1(log_prediction)
        
        # The AI predicts the impacted area directly based heavily on temps, wind, and RH.
        # Adjusted thresholds to prevent false positives and keep baseline risk low
        if prediction_area > 50.0:
            risk = "High Risk"
            desc += " (Critical: High spread potential based on atmospheric conditions)"
        elif prediction_area > 25.0:
            risk = "Medium Risk"
        else:
            risk = "Low Risk"
            if features_input and isinstance(features_input, str) and len(features_input.split(',')) == 4 and float(features_input.split(',')[3]) > 0.5:
                desc += " (Rain actively suppressing risk)"
                
        # Threat Zones
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
            "impact_index": round(float(prediction_area), 2),
            "description": desc,
            "status": "success",
            "model": "RandomForest Regressor (AI)",
            "threat_zones": threat_zones
        }
        return result
        
    except Exception as e:
        return {"error": str(e), "status": "error"}

if __name__ == "__main__":
    input_data = sys.argv[1] if len(sys.argv) > 1 else None
    print(json.dumps(train_and_predict(input_data)))

