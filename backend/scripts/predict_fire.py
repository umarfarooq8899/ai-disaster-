import sys
import os
import json
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder

# Paths
DATA_PATH = r'c:\Users\HP\Downloads\ai-disaster\model_training\Climate-Disasters-Warning-Systems-main\Fire Detection\forestfires.csv'

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
        
        # If no input provided, use the last row as a "current" prediction example
        if features_input is None:
            latest_data = X.iloc[-1].values.reshape(1, -1)
            desc = "Latest recorded data"
        else:
            # Expected input: comma separated values for all feature columns
            # Column order: X,Y,month,day,FFMC,DMC,DC,ISI,temp,RH,wind,rain
            vals = features_input.split(',')
            # Encode month/day if they are strings in input
            try:
                vals[2] = le_month.transform([vals[2]])[0]
                vals[3] = le_day.transform([vals[3]])[0]
            except:
                pass # Assume already numeric if transform fails
                
            latest_data = np.array([float(x) for x in vals]).reshape(1, -1)
            desc = "Custom input"

        prediction_area = model.predict(latest_data)[0]
        
        # Determine risk level based on area
        if prediction_area > 10:
            risk = "High"
        elif prediction_area > 1:
            risk = "Medium"
        else:
            risk = "Low"
            
        result = {
            "prediction": risk,
            "predicted_area": round(float(prediction_area), 2),
            "description": desc,
            "status": "success",
            "model": "Random Forest Regressor"
        }
        return result
        
    except Exception as e:
        return {"error": str(e), "status": "error"}

if __name__ == "__main__":
    # If an argument is passed, it should be comma-separated feature values
    input_data = sys.argv[1] if len(sys.argv) > 1 else None
    print(json.dumps(train_and_predict(input_data)))
