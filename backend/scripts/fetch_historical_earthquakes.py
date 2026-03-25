import requests
import pandas as pd
import json
import os
import time
from datetime import datetime, timedelta

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, 'data', 'pakistan_historical_earthquakes.csv')

def fetch_historical_earthquakes():
    print("Fetching historical earthquake data for Pakistan region (last 10 years)...")
    
    # Pakistan bounding box
    min_lat, max_lat = 23.6, 37.1
    min_lon, max_lon = 60.8, 77.8
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365 * 10) # 10 years
    
    records = []
    
    url = f"https://earthquake.usgs.gov/fdsnws/event/1/query"
    
    for year in range(10):
        chunk_start = start_date + timedelta(days=365 * year)
        chunk_end = start_date + timedelta(days=365 * (year + 1))
        
        print(f"Fetching {chunk_start.strftime('%Y')} to {chunk_end.strftime('%Y')}...")
        params = {
            'format': 'geojson',
            'starttime': chunk_start.strftime('%Y-%m-%d'),
            'endtime': chunk_end.strftime('%Y-%m-%d'),
            'minlatitude': min_lat,
            'maxlatitude': max_lat,
            'minlongitude': min_lon,
            'maxlongitude': max_lon,
            'minmagnitude': 2.5
        }
        
        try:
            response = requests.get(url, params=params, timeout=30)
            if response.status_code == 200:
                data = response.json()
                events = data.get('features', [])
                for event in events:
                    props = event['properties']
                    records.append({
                        'time': pd.to_datetime(props['time'], unit='ms'),
                        'mag': props['mag']
                    })
            time.sleep(1) # Be nice to USGS API
        except Exception as e:
            print(f"Error fetching chunk: {e}")
            continue
            
    if not records:
        print("Failed to fetch any records.")
        return
        
    df = pd.DataFrame(records)
    df.set_index('time', inplace=True)
    
    print("Resampling data into weekly aggregate features...")
    weekly_stats = df.resample('W').agg(
        count=pd.NamedAgg(column='mag', aggfunc='count'),
        max_mag=pd.NamedAgg(column='mag', aggfunc='max'),
        mean_mag=pd.NamedAgg(column='mag', aggfunc='mean')
    )
    
    weekly_stats['count'] = weekly_stats['count'].fillna(0)
    weekly_stats['max_mag'] = weekly_stats['max_mag'].fillna(0)
    weekly_stats['mean_mag'] = weekly_stats['mean_mag'].fillna(0)

    os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)
    weekly_stats.to_csv(DATA_PATH)
    print(f"Successfully saved historical baseline to {DATA_PATH}")

if __name__ == "__main__":
    fetch_historical_earthquakes()
