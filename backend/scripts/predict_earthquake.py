import sys
import os
import json
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def generate_baseline_data():
    # Simulate normal background tectonic activity features for Pakistan region
    # Features: [weekly_count, max_magnitude, mean_magnitude]
    np.random.seed(42)
    normal_counts = np.random.normal(15, 5, 200) # ~15 quakes a week
    normal_max_mags = np.random.normal(3.5, 0.5, 200) # Max mag ~3.5
    normal_mean_mags = np.random.normal(2.5, 0.3, 200) # Mean mag ~2.5
    
    data = np.column_stack((normal_counts, normal_max_mags, normal_mean_mags))
    # Ensure no negative counts or unrealistic things
    data = np.clip(data, [0, 1.0, 1.0], [50, 7.0, 5.0])
    return data

def predict_from_telemetry(usgs_mag_string):
    try:
        if not usgs_mag_string or not isinstance(usgs_mag_string, str) or usgs_mag_string == '0':
            mags = []
        else:
            try:
                mags = [float(x) for x in usgs_mag_string.split(',')]
            except ValueError:
                return {"error": "Invalid USGS data format", "status": "error"}

        count = len(mags)
        max_mag = max(mags) if count > 0 else 0
        mean_mag = sum(mags)/count if count > 0 else 0

        # Risk Weighting for Pakistan
        risk_data = {}
        risk_file = os.path.join(BASE_DIR, 'backend', 'data', 'pakistan_seismic_risk.json')
        if os.path.exists(risk_file):
            with open(risk_file, 'r') as f:
                risk_data = json.load(f)
        
        weight = risk_data.get("Quetta", {}).get("weight", 1.5)
        loc_desc = "Pakistan Regional Fault Zones (Live USGS Monitoring)"

        # Train Isolation Forest on normal baseline tectonic behavior
        baseline_X = generate_baseline_data()
        
        # Adjust contamination (expected anomaly rate)
        clf = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
        clf.fit(baseline_X)
        
        # Predict on current live data
        current_X = np.array([[count, max_mag, mean_mag]])
        anomaly_score = clf.decision_function(current_X)[0] # Lower score = more anomalous
        prediction_label = "Low Risk"
        
        # Combine model anomaly detection with threshold heuristics for earthquake safety
        # Anomaly score < 0 means it's an outlier.
        if anomaly_score < -0.1 or max_mag >= 5.5 or count > 40:
            prediction_label = "High Risk"
            est_ttf = max(0.5, 24.0 / (weight * (max_mag + 0.1)))
        elif anomaly_score < 0.05 or max_mag >= 4.5 or count > 25:
            prediction_label = "Medium Risk"
            est_ttf = max(12.0, 72.0 / weight)
        else:
            prediction_label = "Low Risk"
            est_ttf = 999.0
            
        # Threat Zones
        threat_zones = []
        if prediction_label in ["High Risk", "Medium Risk"]:
            # Assign risk to Quetta fault line or Islamabad depending on recent event history
            # (For this dashboard, we map High Risk to specific fault regions)
            threat_zones.append({
                "latitude": 30.1798,
                "longitude": 66.9750,
                "title": "Chaman Fault Zone (Quetta)",
                "severity": "high" if prediction_label == "High Risk" else "medium",
                "type": "earthquake",
                "dangerRadius": 50 if prediction_label == "High Risk" else 25,
                "description": f"Seismic anomaly detected (Score: {round(anomaly_score,3)}). Elevated swarm activity."
            })
            if count > 20:
                 threat_zones.append({
                    "latitude": 33.7294,
                    "longitude": 73.0931,
                    "title": "Main Boundary Thrust (Islamabad)",
                    "severity": "medium",
                    "type": "earthquake",
                    "dangerRadius": 30,
                    "description": "Secondary increased stress from regional tectonic pressure."
                })
        
        result = {
            "prediction": prediction_label,
            "anomaly_score": round(float(anomaly_score), 3),
            "time_to_failure": round(float(est_ttf), 2) if prediction_label != "Low Risk" else None,
            "unit": "hours",
            "location_context": loc_desc,
            "source": f"USGS live data ({count} events)",
            "status": "success",
            "model": "Isolation Forest (Anomaly Detection)",
            "threat_zones": threat_zones
        }
        return result
    except Exception as e:
        return {"error": str(e), "status": "error"}

if __name__ == "__main__":
    input_path = sys.argv[1] if len(sys.argv) > 1 else None
    print(json.dumps(predict_from_telemetry(input_path)))
