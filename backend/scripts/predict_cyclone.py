import sys
import json
import random
from datetime import datetime

def predict_cyclone():
    # Simulated logic based on "seasonal" patterns and random noise
    # Since we have no NOAA CSV, we provide a realistic-looking response
    
    month = datetime.now().month
    # Typical cyclone season in some regions
    base_risk = 0.2
    if 5 <= month <= 11: # May to November
        base_risk = 0.6
        
    risk_score = random.uniform(base_risk - 0.2, base_risk + 0.3)
    risk_score = max(0, min(1, risk_score))
    
    if risk_score > 0.7:
        prediction = "High Risk"
        intensity = "Category 3+"
    elif risk_score > 0.4:
        prediction = "Medium Risk"
        intensity = "Category 1-2"
    else:
        prediction = "Low Risk"
        intensity = "Tropical Depression"
        
    result = {
        "prediction": prediction,
        "risk_score": round(risk_score, 2),
        "estimated_intensity": intensity,
        "wind_speed_kmh": round(random.uniform(50, 200 * risk_score + 50), 1),
        "status": "simulated",
        "message": "Actual NOAA dataset not found. Using seasonal simulation model.",
        "model": "Seasonal Probability Model"
    }
    return result

if __name__ == "__main__":
    print(json.dumps(predict_cyclone()))
