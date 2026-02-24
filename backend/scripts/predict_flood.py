import sys
import os
import json
import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split

# Paths
DATA_PATH = r'c:\Users\HP\Downloads\ai-disaster\model_training\Climate-Disasters-Warning-Systems-main\Flood Detection\kerala.csv'

def train_and_predict(monthly_rainfall_input=None):
    try:
        if not os.path.exists(DATA_PATH):
            return {"error": f"Dataset not found at {DATA_PATH}", "status": "error"}

        # Load data
        df = pd.read_csv(DATA_PATH)
        
        # Preprocessing
        # Map YES/NO to 1/0
        df['FLOODS'] = df['FLOODS'].map({'YES': 1, 'NO': 0})
        
        # Features: Monthly rainfall columns (JAN to DEC)
        feature_cols = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
        X = df[feature_cols]
        y = df['FLOODS']
        
        # Logistic Regression
        model = LogisticRegression(max_iter=1000)
        model.fit(X, y)
        
        # If no input provided, use the last row as a "current" prediction example
        if monthly_rainfall_input is None:
            latest_data = X.iloc[-1].values.reshape(1, -1)
            year = int(df.iloc[-1]['YEAR'])
        else:
            # Expected input: comma separated values for 12 months
            latest_data = np.array([float(x) for x in monthly_rainfall_input.split(',')]).reshape(1, -1)
            year = "Custom"

        prediction_prob = model.predict_proba(latest_data)[0][1]
        prediction = "High Risk" if prediction_prob > 0.5 else "Low Risk"
        
        result = {
            "prediction": prediction,
            "probability": round(float(prediction_prob), 4),
            "year_reference": year,
            "status": "success",
            "model": "Logistic Regression"
        }
        return result
        
    except Exception as e:
        return {"error": str(e), "status": "error"}

if __name__ == "__main__":
    # If an argument is passed, it should be 12 comma-separated rainfall values
    input_data = sys.argv[1] if len(sys.argv) > 1 else None
    print(json.dumps(train_and_predict(input_data)))
