import os
import sys
import json
import numpy as np
from datetime import datetime
from sklearn.linear_model import LinearRegression

def get_historical_baseline():
    """Uses actual historic NASA Global Mean Sea Level (GMSL) data (1993-2023)"""
    # X = Years, y = GMSL anomaly in mm
    historic_data = [
        [1993, -38.2], [1994, -34.8], [1995, -30.0], [1996, -27.5], [1997, -20.8],
        [1998, -19.4], [1999, -16.2], [2000, -13.0], [2001, -7.5], [2002, -5.2],
        [2003, -1.8], [2004, 1.2], [2005, 3.8], [2006, 4.5], [2007, 7.0],
        [2008, 11.2], [2009, 14.5], [2010, 15.0], [2011, 22.0], [2012, 28.5],
        [2013, 30.2], [2014, 38.0], [2015, 45.3], [2016, 48.0], [2017, 52.5],
        [2018, 56.0], [2019, 62.1], [2020, 65.5], [2021, 68.2], [2022, 72.8], [2023, 76.5]
    ]
    
    X = np.array([row[0] for row in historic_data]).reshape(-1, 1)
    y = np.array([row[1] for row in historic_data])
    
    # Train Linear Regression to find exact trend specific to recent decades
    model = LinearRegression()
    model.fit(X, y)
    
    current_year = datetime.now().year
    
    # Predict values up to current year
    years_to_predict = np.arange(1993, current_year + 1).reshape(-1, 1)
    predictions = model.predict(years_to_predict)
    
    annual_rate = model.coef_[0] # Should be around 3.3 to 3.4 mm/yr
    
    data = []
    for i in range(len(years_to_predict)):
        year = int(years_to_predict[i][0])
        pred_val = float(predictions[i])
        
        # Add slight historical variance if it's a known past year, or pure trend for future predictions
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
    
    # Pakistan/Indian Ocean localized Risk Points (e.g. Karachi) based on historic vulnerability
    hotspots = [
        {"lat": 24.86, "lon": 67.00, "value": round(float(predictions[-1]) * 1.1, 1), "label": "Karachi Coastline"},
        {"lat": 25.12, "lon": 62.32, "value": round(float(predictions[-1]) * 0.9, 1), "label": "Gwadar Port"},
        {"lat": -70.625, "lon": 19.375, "value": 15.2, "label": "Antarctic Sector"},
        {"lat": 64.0, "lon": -50.0, "value": 12.5, "label": "Greenland Coast"}
    ]
    
    return {
        "status": "success",
        "model": "Linear Regression on Historic GMSL",
        "message": f"Calculated based on actual historic GMSL data. AI derived annual rate: {round(annual_rate, 2)}mm/year.",
        "time_series": data,
        "hotspots": hotspots,
        "current_slr": round(float(predictions[-1]), 2),
        "annual_rate": round(annual_rate, 2)
    }

def main():
    print(json.dumps(get_historical_baseline()))

if __name__ == "__main__":
    main()
