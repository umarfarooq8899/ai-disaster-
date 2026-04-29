import sys
import os
import json
import numpy as np
import joblib

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_DIR = os.path.join(BASE_DIR, 'backend', 'ml_models')

def predict_cyclone(input_data=None):
    clf_path = os.path.join(MODEL_DIR, 'cyclone_clf.pkl')
    use_pretrained = os.path.exists(clf_path)
    
    if input_data and ',' in input_data:
        try:
            parts = [float(x) for x in input_data.split(',')]
            wind_speed = parts[0]
            pressure = parts[1]
            
            # Estimate SST from pressure (rough proxy if not available)
            # Lower pressure typically correlates with warmer SST in cyclone-forming regions
            sst_est = max(24, min(32, 35 - (pressure - 960) * 0.05))
            
            from datetime import datetime
            current_month = datetime.now().month
            
            # Is the storm strengthening? Check if pressure is below climatological mean
            is_strengthening = 1 if pressure < 1005 and wind_speed > 50 else 0
            
            if use_pretrained:
                model = joblib.load(clf_path)
                # 5-feature vector matching training
                current_conditions = np.array([[wind_speed, pressure, sst_est, current_month, is_strengthening]])
                
                risk_class = model.predict(current_conditions)[0]
                probabilities = model.predict_proba(current_conditions)[0]
                
                if risk_class == 2:
                    prediction = "High Risk"
                    intensity = "Category 3+"
                    risk_score = round(float(probabilities[2]), 2)
                elif risk_class == 1:
                    prediction = "Medium Risk"
                    intensity = "Tropical Storm / Cat 1-2"
                    risk_score = round(float(probabilities[1]), 2)
                else:
                    prediction = "Low Risk"
                    intensity = "Tropical Depression / Normal"
                    risk_score = round(float(probabilities[0]) * 0.3, 2)
            else:
                # Legacy KNN fallback
                from sklearn.neighbors import KNeighborsClassifier
                X_train = np.array([
                    [20, 1010], [40, 1005], [55, 1000],
                    [75, 995], [95, 985], [110, 980],
                    [130, 975], [145, 965], [165, 955],
                    [190, 945], [200, 935], [220, 920],
                    [240, 910], [260, 890], [300, 880]
                ])
                y_train = np.array([0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2])
                knn = KNeighborsClassifier(n_neighbors=3)
                knn.fit(X_train, y_train)
                
                current_conditions = np.array([[wind_speed, pressure]])
                risk_class = knn.predict(current_conditions)[0]
                probabilities = knn.predict_proba(current_conditions)[0]
                
                if risk_class == 2:
                    prediction = "High Risk"
                    intensity = "Category 3+"
                    risk_score = probabilities[2]
                elif risk_class == 1:
                    prediction = "Medium Risk"
                    intensity = "Tropical Storm / Cat 1-2"
                    risk_score = 0.4 + (probabilities[1] * 0.3)
                else:
                    prediction = "Low Risk"
                    intensity = "Tropical Depression / Normal"
                    risk_score = 0.1 + (probabilities[0] * 0.2)
                risk_score = round(risk_score, 2)
            
            status = "actual"
            msg = f"AI analysis of live coastal telemetry (Wind: {wind_speed}km/h, Pressure: {pressure}hPa, Est. SST: {sst_est}°C)"
                
        except Exception as e:
            msg = f"Error evaluating data: {str(e)}"
            return {"error": msg, "status": "error"}
    else:
        risk_score = 0.1
        prediction = "Low Risk"
        intensity = "Tropical Depression / Normal"
        status = "baseline"
        msg = "No live storm telemetry detected."

    # Threat Zones
    threat_zones = []
    if prediction in ["High Risk", "Medium Risk"]:
        threat_zones.append({
            "latitude": 24.8607,
            "longitude": 67.0011,
            "title": "Karachi Coastline",
            "severity": "high" if prediction == "High Risk" else "medium",
            "type": "cyclone",
            "dangerRadius": 100 if prediction == "High Risk" else 50,
            "description": f"{intensity} approaching."
        })
        if prediction == "High Risk":
            threat_zones.append({
                "latitude": 25.1216,
                "longitude": 62.3254,
                "title": "Gwadar Port",
                "severity": "medium",
                "type": "cyclone",
                "dangerRadius": 80,
                "description": "Secondary coastal impacts expected."
            })

    result = {
        "prediction": prediction,
        "risk_score": round(risk_score, 2),
        "estimated_intensity": intensity,
        "status": status,
        "message": msg,
        "model": "CalibratedGBM (5-feature)" if use_pretrained else "KNN (Legacy)",
        "threat_zones": threat_zones
    }
    return result

if __name__ == "__main__":
    input_val = sys.argv[1] if len(sys.argv) > 1 else None
    print(json.dumps(predict_cyclone(input_val)))
