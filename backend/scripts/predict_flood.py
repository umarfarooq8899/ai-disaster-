import sys
import os
import json
import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split

# Paths
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
        
        model = LogisticRegression(max_iter=1000)
        model.fit(X, y)
        
        from datetime import datetime
        current_month_idx = datetime.now().month - 1
        
        # HYBRID LOGIC: Meteorological Overrides + AI Probability
        input_rain = 0.0
        if input_data is not None and not ',' in input_data:
            input_rain = float(input_data)
        
        if input_data is None:
            latest_data = X.iloc[-1].values.reshape(1, -1)
            year = int(df.iloc[-1]['YEAR'])
            desc = "Historical baseline"
        elif ',' in input_data and len(input_data.split(',')) == 12:
            # Full 12 month input
            latest_data = np.array([float(x) for x in input_data.split(',')]).reshape(1, -1)
            year = "Custom"
            desc = "Full monthly profile"
        else:
            # Single value or buffer forecast:
            # Use current month or median baseline
            vals = [float(x) for x in input_data.split(',')] if ',' in input_data else [float(input_data)]
            input_rain = vals[-1] # Today's rain
            
            row = X.median().values
            row[current_month_idx] = input_rain * 30 
            latest_data = row.reshape(1, -1)
            year = "Forecast 24h"
            desc = f"Analysis of {input_rain}mm forecast"

        prediction_prob = model.predict_proba(latest_data)[0][1]
        
        # ACCURACY ENHANCEMENT: Saturated Soil / Cumulative Risk
        cumulative_modifier = 0.0
        if input_data and ',' in input_data:
            vals = [float(x) for x in input_data.split(',')]
            if len(vals) >= 3: # Multi-day detection
                recent_sum = sum(vals[-7:]) # Last 7 days max
                if recent_sum > 100: # Significant saturation
                    cumulative_modifier = 0.3
                    desc += f" | WARNING: High 7-day accumulation ({round(recent_sum,1)}mm) suggests soil saturation."

        prediction_prob = min(prediction_prob + cumulative_modifier, 1.0)

        # FINAL DECISION: Hybrid of Thresholds and AI
        if input_rain >= 50 or (cumulative_modifier > 0 and input_rain > 20):
            prediction = "High Risk"
            desc += " (Extreme rainfall or saturated soil threshold reached)"
            prediction_prob = max(prediction_prob, 0.85)
        elif input_rain >= 20 or cumulative_modifier > 0:
            prediction = "Medium Risk"
            desc += " (Significant rainfall or accumulation detected)"
            prediction_prob = max(prediction_prob, 0.55)
        elif input_rain < 1.0 and cumulative_modifier == 0:
            prediction = "Low Risk"
            prediction_prob = min(prediction_prob, 0.1)
            desc = "0mm rain forecast. Status: Safe."
        else:
            # Respect the model for intermediate values
            prediction = "High Risk" if prediction_prob > 0.7 else ("Medium Risk" if prediction_prob > 0.4 else "Low Risk")

        result = {
            "prediction": prediction,
            "probability": round(float(prediction_prob), 4),
            "reference": year,
            "description": desc,
            "status": "success",
            "model": "Hybrid (Temporal PK + AI)"
        }
        return result
        
    except Exception as e:
        return {"error": str(e), "status": "error"}

if __name__ == "__main__":
    # If an argument is passed, it should be 12 comma-separated rainfall values
    input_data = sys.argv[1] if len(sys.argv) > 1 else None
    print(json.dumps(train_and_predict(input_data)))
