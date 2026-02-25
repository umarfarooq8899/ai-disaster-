import sys
import os
import json
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder

# Paths
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
        # Label encode month and day
        le_month = LabelEncoder()
        df['month'] = le_month.fit_transform(df['month'])
        le_day = LabelEncoder()
        df['day'] = le_day.fit_transform(df['day'])
        
        # Features: Everything except 'area'
        X = df.drop('area', axis=1)
        y = df['area']
        
        # Random Forest Regressor (predicting area of fire/impact)
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X, y)
        
        # LOGIC GUARDS
        if features_input and ',' in features_input:
            vals = features_input.split(',')
            if len(vals) == 4:
                temp, rhino, wind, rain = [float(x) for x in vals]
                # Pakistan specific: High heat and low rain are primary drivers
                if rain > 1.0: # Even light rain significantly reduces risk in PK
                     return {
                        "prediction": "Low",
                        "impact_index": 0.0,
                        "description": f"Rain detected ({rain}mm). Fire risk inhibited in regional foliage.",
                        "status": "success",
                        "model": "Logic Guard (PK Context)"
                    }
                if temp < 15 and rhino > 70:
                    return {
                        "prediction": "Low",
                        "impact_index": 0.0,
                        "description": "Cool and humid conditions. High fuel moisture in forests like Margalla.",
                        "status": "success",
                        "model": "Logic Guard (PK Context)"
                    }
        
        # If no input provided, use the last row as a "current" prediction example
        if features_input is None:
            latest_data = X.iloc[-1].values.reshape(1, -1)
            desc = "Historical baseline"
        elif ',' in features_input:
            vals = features_input.split(',')
            if len(vals) == 4:
                row = X.mean().values
                row[8] = float(vals[0])  # temp
                row[9] = float(vals[1])  # RH
                row[10] = float(vals[2]) # wind
                row[11] = float(vals[3]) # rain
                latest_data = row.reshape(1, -1)
                desc = f"PK Regional Forecast: {vals[0]}°C, {vals[1]}% RH"
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

        prediction_area = model.predict(latest_data)[0]
        
        # HYBRID DECISION: Pakistan Meteorological Thresholds
        vals = [0, 0, 0, 0]
        if features_input and ',' in features_input and len(features_input.split(',')) == 4:
            vals = [float(x) for x in features_input.split(',')]
        
        temp, rhino, wind, rain = vals
        
        # ACCURACY ENHANCEMENT: Heat-Wind Spread Index (HWSI)
        # Formula: (Temp * Wind) / (Humidity + 1)
        hwsi = (temp * wind) / (rhino + 1)
        
        # Pakistan Extreme Heat/Wind combinations
        if temp > 40 and rhino < 15:
            risk = "High"
            desc += " (Critical: Extreme heatwave fire danger)"
        elif hwsi > 15: # High spread potential
            risk = "High"
            desc += f" | Spread Alert: HWSI is {round(hwsi, 1)} (Exponential spread risk detected)."
        elif prediction_area > 5:
            risk = "High"
        elif prediction_area > 0.5 or (temp > 35 and rhino < 25) or hwsi > 8:
            risk = "Medium"
            if hwsi > 8: desc += " | Note: Moderate spread potential detected."
        else:
            risk = "Low"
            
        result = {
            "prediction": risk,
            "impact_index": round(float(prediction_area), 2),
            "hwsi": round(hwsi, 2),
            "description": desc,
            "status": "success",
            "model": "Hybrid (HWSI-Enhanced RF)"
        }
        return result
        
    except Exception as e:
        return {"error": str(e), "status": "error"}

if __name__ == "__main__":
    # If an argument is passed, it should be comma-separated feature values
    input_data = sys.argv[1] if len(sys.argv) > 1 else None
    print(json.dumps(train_and_predict(input_data)))
