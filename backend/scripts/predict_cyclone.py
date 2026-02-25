import sys
import json
import random
from datetime import datetime

def predict_cyclone(input_data=None):
    # If live data is provided (wind_speed, pressure)
    if input_data and ',' in input_data:
        try:
            wind_speed, pressure = [float(x) for x in input_data.split(',')]
            # Simple heuristic risk assessment
            # Category 1 starts at ~119 km/h
            risk_score = (wind_speed / 120.0) * 0.5 + ((1013 - pressure) / 50.0) * 0.5
            risk_score = max(0, min(1, risk_score))
            status = "actual"
            msg = f"Analysis based on live telemetry (Wind: {wind_speed}km/h, Pressure: {pressure}hPa)"
        except:
            risk_score = 0.1
            status = "fallback"
            msg = "Data parsing failed, using baseline."
    else:
        # Default baseline
        risk_score = 0.1
        status = "baseline"
        msg = "No live storm data detected."

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
        "status": status,
        "message": msg,
        "model": "Meteorological Risk Model"
    }
    return result

if __name__ == "__main__":
    input_val = sys.argv[1] if len(sys.argv) > 1 else None
    print(json.dumps(predict_cyclone(input_val)))
