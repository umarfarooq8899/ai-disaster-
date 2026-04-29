import sys
import os
import json
import numpy as np
import pandas as pd
import joblib

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_DIR = os.path.join(BASE_DIR, 'backend', 'ml_models')
DATA_PATH = os.path.join(BASE_DIR, 'backend', 'data', 'pakistan_historical_earthquakes.csv')

def load_historical_baseline():
    if os.path.exists(DATA_PATH):
        df = pd.read_csv(DATA_PATH)
        return df[['count', 'max_mag', 'mean_mag']].values
    else:
        np.random.seed(42)
        normal_counts = np.random.normal(15, 5, 200)
        normal_max_mags = np.random.normal(3.5, 0.5, 200)
        normal_mean_mags = np.random.normal(2.5, 0.3, 200)
        data = np.column_stack((normal_counts, normal_max_mags, normal_mean_mags))
        return np.clip(data, [0, 1.0, 1.0], [50, 7.0, 5.0])

def compute_enhanced_features(mags, baseline_df=None):
    """Compute the 9-feature vector matching the trained model."""
    count = len(mags)
    max_mag = max(mags) if count > 0 else 0
    mean_mag = sum(mags) / count if count > 0 else 0
    std_mag = float(np.std(mags)) if count > 2 else 0.0
    
    # Normalize count against historical max
    hist_max_count = 50.0
    if baseline_df is not None and len(baseline_df) > 0:
        hist_max_count = max(baseline_df[:, 0].max(), 1.0)
    count_norm = count / hist_max_count
    
    # Rate change vs historical average
    hist_avg_count = 15.0
    if baseline_df is not None and len(baseline_df) > 0:
        hist_avg_count = baseline_df[:, 0].mean()
    rate_change = (count - hist_avg_count) / max(hist_avg_count, 1) if hist_avg_count > 0 else 0
    rate_change = np.clip(rate_change, -5, 5)
    
    rolling_4wk_avg = count  # Single observation, use itself
    mag_range = max_mag - mean_mag if count > 0 else 0
    
    # Energy proxy (normalized)
    energy = 10 ** (1.5 * max_mag) if max_mag > 0 else 0
    energy_max = 10 ** (1.5 * 7.0)  # max expected
    energy_proxy = energy / energy_max
    
    return np.array([[count, max_mag, mean_mag, std_mag, count_norm,
                      rate_change, rolling_4wk_avg, mag_range, energy_proxy]])

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

        # Load historical baseline for feature computation
        baseline_X = load_historical_baseline()
        
        # Compute enhanced 9-feature vector
        current_X = compute_enhanced_features(mags, baseline_X)

        # Try loading pre-trained models (Phase 1 upgrade)
        iso_path = os.path.join(MODEL_DIR, 'earthquake_iso.pkl')
        clf_path = os.path.join(MODEL_DIR, 'earthquake_clf.pkl')
        
        use_pretrained = os.path.exists(iso_path) and os.path.exists(clf_path)
        
        if use_pretrained:
            iso_model = joblib.load(iso_path)
            clf_model = joblib.load(clf_path)
            
            anomaly_score = iso_model.decision_function(current_X)[0]
            clf_proba = clf_model.predict_proba(current_X)[0]
            # clf_proba[1] = probability of M>=5.0 event next week
            high_risk_prob = float(clf_proba[1]) if len(clf_proba) > 1 else 0.0
            
            # Combine anomaly detection + classifier probability
            # Also factor in direct magnitude/count heuristics for robustness
            is_anomaly = anomaly_score < -0.05
            
            if high_risk_prob >= 0.6 or (is_anomaly and max_mag >= 5.5) or max_mag >= 6.0 or count > 40:
                prediction_label = "High Risk"
                confidence_score = round(min(99.0, 70 + high_risk_prob * 30), 1)
                est_ttf = max(0.5, 24.0 / (weight * (max_mag + 0.1)))
            elif high_risk_prob >= 0.25 or is_anomaly or max_mag >= 4.5 or count > 25:
                prediction_label = "Medium Risk"
                confidence_score = round(min(88.0, 55 + high_risk_prob * 40), 1)
                est_ttf = max(12.0, 72.0 / weight)
            else:
                prediction_label = "Low Risk"
                confidence_score = round(min(99.0, 80 + (1 - high_risk_prob) * 19), 1)
                est_ttf = 999.0
        else:
            # Fallback: train on the fly (legacy behavior)
            from sklearn.ensemble import IsolationForest
            clf = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
            clf.fit(baseline_X)
            simple_X = np.array([[count, max_mag, mean_mag]])
            anomaly_score = clf.decision_function(simple_X)[0]
            high_risk_prob = 0.0
            
            if count < 10 and max_mag < 4.0:
                prediction_label = "Low Risk"
                est_ttf = 999.0
                confidence_score = min(99.0, 85.0 + (10 - count))
            elif anomaly_score < -0.1 or max_mag >= 5.5 or count > 40:
                prediction_label = "High Risk"
                est_ttf = max(0.5, 24.0 / (weight * (max_mag + 0.1)))
                confidence_score = min(99.0, 75.0 + abs(anomaly_score) * 50)
            elif anomaly_score < 0.05 or max_mag >= 4.5 or count > 25:
                prediction_label = "Medium Risk"
                est_ttf = max(12.0, 72.0 / weight)
                confidence_score = min(88.0, 60.0 + abs(anomaly_score) * 100)
            else:
                prediction_label = "Low Risk"
                est_ttf = 999.0
                confidence_score = min(95.0, 70.0 + anomaly_score * 50)
            
        # Threat Zones
        threat_zones = []
        if prediction_label in ["High Risk", "Medium Risk"]:
            threat_zones.append({
                "latitude": 30.1798,
                "longitude": 66.9750,
                "title": "Chaman Fault Zone (Quetta)",
                "severity": "high" if prediction_label == "High Risk" else "medium",
                "type": "earthquake",
                "dangerRadius": 50 if prediction_label == "High Risk" else 25,
                "description": f"Seismic anomaly detected (Score: {round(anomaly_score,3)}). ML probability: {round(high_risk_prob*100,1)}%"
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
            "confidence_score": round(float(confidence_score), 2),
            "anomaly_score": round(float(anomaly_score), 3),
            "ml_probability": round(float(high_risk_prob), 4),
            "time_to_failure": round(float(est_ttf), 2) if prediction_label != "Low Risk" else None,
            "unit": "hours",
            "location_context": loc_desc,
            "source": f"USGS live data ({count} events)",
            "status": "success",
            "model": "IsolationForest + CalibratedXGBoost" if use_pretrained else "Isolation Forest (Legacy)",
            "threat_zones": threat_zones
        }
        return result
    except Exception as e:
        return {"error": str(e), "status": "error"}

if __name__ == "__main__":
    input_path = sys.argv[1] if len(sys.argv) > 1 else None
    print(json.dumps(predict_from_telemetry(input_path)))
