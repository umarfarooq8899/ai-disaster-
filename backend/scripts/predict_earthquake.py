import sys
import os
import json
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from scipy import stats

# Paths
DATA_PATH = r'c:\Users\HP\Downloads\ai-disaster\test_earthquake.csv'

def create_features(seg):
    xc = pd.Series(seg)
    features = {}
    
    # Statistical features
    features['mean'] = xc.mean()
    features['std'] = xc.std()
    features['max'] = xc.max()
    features['min'] = xc.min()
    features['mad'] = np.mean(np.abs(xc - np.mean(xc)))
    features['kurt'] = xc.kurtosis()
    features['skew'] = xc.skew()
    features['med'] = xc.median()
    features['abs_mean'] = np.abs(xc).mean()
    features['abs_std'] = np.abs(xc).std()
    
    # Simple trend
    idx = np.array(range(len(xc)))
    slope, _, _, _, _ = stats.linregress(idx, xc)
    features['trend'] = slope
    
    return pd.DataFrame([features])

def train_and_predict(csv_path=None):
    try:
        # Earthquake prediction requires a segment of acoustic samples
        # For training a "dummy" RF on the fly since full data is missing
        if not os.path.exists(DATA_PATH):
            return {"error": f"Internal training sample {DATA_PATH} not found", "status": "error"}
            
        df_train = pd.read_csv(DATA_PATH)
        # Simulate some training data by splitting the available CSV into chunks
        # Each chunk is 1000 samples for the sake of speed in this demo
        chunk_size = 100
        n_chunks = len(df_train) // chunk_size
        
        feature_list = []
        # We need a target to train. We'll simulate a 'time_to_failure' that decreases
        y_train = []
        
        for i in range(min(n_chunks, 10)): # Just a few chunks to train quickly
            seg = df_train['acoustic_data'].values[i*chunk_size : (i+1)*chunk_size]
            feature_list.append(create_features(seg))
            y_train.append(10.0 - (i * 0.5)) # Simulated time to failure
            
        X = pd.concat(feature_list)
        y = y_train
        
        # Random Forest
        model = RandomForestRegressor(n_estimators=10, random_state=42)
        model.fit(X, y)
        
        # Prediction
        if csv_path is None or not os.path.exists(csv_path):
            # Predict on the last chunk of the training file
            seg_test = df_train['acoustic_data'].values[-chunk_size:]
            source = "internal sample"
        else:
            df_test = pd.read_csv(csv_path)
            seg_test = df_test['acoustic_data'].values[:chunk_size]
            source = "uploaded data"
            
        features_test = create_features(seg_test)
        prediction = model.predict(features_test)[0]
        
        result = {
            "prediction": "High Risk" if prediction < 3.0 else ("Medium Risk" if prediction < 7.0 else "Low Risk"),
            "time_to_failure": round(float(prediction), 2),
            "unit": "seconds",
            "source": source,
            "status": "success",
            "model": "Random Forest Regressor"
        }
        return result
    except Exception as e:
        return {"error": str(e), "status": "error"}

if __name__ == "__main__":
    input_path = sys.argv[1] if len(sys.argv) > 1 else None
    print(json.dumps(train_and_predict(input_path)))
