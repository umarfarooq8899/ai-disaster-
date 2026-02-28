import sys
import json
import numpy as np
from sklearn.neighbors import KNeighborsClassifier

def get_cyclone_baseline_data():
    # Saffir-Simpson Hurricane Wind Scale mappings for Wind (km/h) and typical pressures
    # Classes: 0: Low Risk/Depression, 1: Medium Risk/Cat 1-2, 2: High Risk/Cat 3+
    
    # [wind_speed, pressure]
    X = np.array([
        [20, 1010], [40, 1005], [55, 1000],  # Tropical Depression (Low Risk)
        [75, 995], [95, 985], [110, 980],    # Tropical Storm (Medium-Low)
        [130, 975], [145, 965],              # Cat 1 (Medium Risk)
        [165, 955],                          # Cat 2 (Medium Risk)
        [190, 945], [200, 935],              # Cat 3 (High Risk)
        [220, 920], [240, 910],              # Cat 4 (High Risk)
        [260, 890], [300, 880]               # Cat 5 (High Risk)
    ])
    
    y = np.array([0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2])
    return X, y

def predict_cyclone(input_data=None):
    # Train the basic classification model
    X_train, y_train = get_cyclone_baseline_data()
    knn = KNeighborsClassifier(n_neighbors=3)
    knn.fit(X_train, y_train)

    if input_data and ',' in input_data:
        try:
            wind_speed, pressure = [float(x) for x in input_data.split(',')]
            
            # Predict using the model
            current_conditions = np.array([[wind_speed, pressure]])
            risk_class = knn.predict(current_conditions)[0]
            probabilities = knn.predict_proba(current_conditions)[0]
            
            status = "actual"
            msg = f"AI analysis of live coastal telemetry (Wind: {wind_speed}km/h, Pressure: {pressure}hPa)"
            
            # Mapping class to output
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
                
        except Exception as e:
            msg = f"Error evaluating data: {str(e)}"
            return {"error": msg, "status": "error"}
    else:
        # Default baseline
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
        "model": "K-Nearest Neighbors Classifier (AI)",
        "threat_zones": threat_zones
    }
    return result

if __name__ == "__main__":
    input_val = sys.argv[1] if len(sys.argv) > 1 else None
    print(json.dumps(predict_cyclone(input_val)))
