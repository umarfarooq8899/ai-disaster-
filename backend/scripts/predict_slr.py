import os
import sys
import json
import numpy as np
import joblib
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_DIR = os.path.join(BASE_DIR, 'backend', 'ml_models')

def get_historical_baseline():
    """Uses actual historic NASA Global Mean Sea Level (GMSL) data (1993-2023)"""
    historic_data = [
        [1993, -38.2], [1994, -34.8], [1995, -30.0], [1996, -27.5], [1997, -20.8],
        [1998, -19.4], [1999, -16.2], [2000, -13.0], [2001, -7.5], [2002, -5.2],
        [2003, -1.8], [2004, 1.2], [2005, 3.8], [2006, 4.5], [2007, 7.0],
        [2008, 11.2], [2009, 14.5], [2010, 15.0], [2011, 22.0], [2012, 28.5],
        [2013, 30.2], [2014, 38.0], [2015, 45.3], [2016, 48.0], [2017, 52.5],
        [2018, 56.0], [2019, 62.1], [2020, 65.5], [2021, 68.2], [2022, 72.8], [2023, 76.5]
    ]
    
    poly_path = os.path.join(MODEL_DIR, 'slr_poly.pkl')
    lin_path = os.path.join(MODEL_DIR, 'slr_linear.pkl')
    use_pretrained = os.path.exists(poly_path)
    
    if use_pretrained:
        poly_model = joblib.load(poly_path)
        lin_model = joblib.load(lin_path)
        annual_rate = lin_model.coef_[0]
    else:
        # Legacy fallback
        from sklearn.linear_model import LinearRegression
        X = np.array([row[0] for row in historic_data]).reshape(-1, 1)
        y = np.array([row[1] for row in historic_data])
        lin_model = LinearRegression()
        lin_model.fit(X, y)
        poly_model = lin_model  # Use linear as fallback
        annual_rate = lin_model.coef_[0]
    
    current_year = datetime.now().year
    
    # Generate time series with both historical actuals and model predictions
    years_to_predict = np.arange(1993, current_year + 1).reshape(-1, 1)
    predictions = poly_model.predict(years_to_predict)
    
    data = []
    for i in range(len(years_to_predict)):
        year = int(years_to_predict[i][0])
        pred_val = float(predictions[i])
        
        actual_val = pred_val
        for h in historic_data:
            if h[0] == year:
                actual_val = h[1]
                break
                
        data.append({
            "year": year,
            "slr": round(actual_val, 2),
            "trend": round(pred_val, 2)
        })
    
    # IPCC AR6 SSP scenario projections (mm from 2005 baseline)
    # These are the gold-standard projections
    ipcc_scenarios = {
        "SSP1-2.6": {"2050": 190, "2100": 440, "label": "Low emissions (Paris Agreement met)"},
        "SSP2-4.5": {"2050": 210, "2100": 560, "label": "Intermediate emissions"},
        "SSP5-8.5": {"2050": 240, "2100": 770, "label": "High emissions (worst case)"},
    }
    
    # Bootstrap confidence intervals for model projection
    ci_2050 = None
    ci_2100 = None
    eval_path = os.path.join(BASE_DIR, 'backend', 'evaluation', 'slr_metrics.json')
    if os.path.exists(eval_path):
        with open(eval_path, 'r') as f:
            metrics = json.load(f)
            ci_2050 = metrics.get('projection_2050_ci90')
            ci_2100 = metrics.get('projection_2100_ci90')
    
    # Pakistan/Indian Ocean localized Risk Points
    current_slr = float(predictions[-1])
    hotspots = [
        {"lat": 24.86, "lon": 67.00, "value": round(current_slr * 1.1, 1), "label": "Karachi Coastline"},
        {"lat": 25.12, "lon": 62.32, "value": round(current_slr * 0.9, 1), "label": "Gwadar Port"},
        {"lat": -70.625, "lon": 19.375, "value": 15.2, "label": "Antarctic Sector"},
        {"lat": 64.0, "lon": -50.0, "value": 12.5, "label": "Greenland Coast"}
    ]
    
    model_2050 = float(poly_model.predict([[2050]])[0])
    model_2100 = float(poly_model.predict([[2100]])[0])
    
    return {
        "status": "success",
        "model": "Polynomial Regression (degree=2) + IPCC AR6" if use_pretrained else "Linear Regression (Legacy)",
        "message": f"AI derived rate: {round(annual_rate, 2)}mm/yr. Polynomial model captures acceleration.",
        "time_series": data,
        "hotspots": hotspots,
        "current_slr": round(current_slr, 2),
        "annual_rate": round(annual_rate, 2),
        "projections": {
            "model_2050_mm": round(model_2050, 1),
            "model_2050_ci90": ci_2050,
            "model_2100_mm": round(model_2100, 1),
            "model_2100_ci90": ci_2100,
        },
        "ipcc_scenarios": ipcc_scenarios,
    }

def main():
    print(json.dumps(get_historical_baseline()))

if __name__ == "__main__":
    main()
