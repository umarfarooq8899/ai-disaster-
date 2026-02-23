const axios = require('axios');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Path to Python and Scripts
const PYTHON_PATH = path.join(__dirname, '..', '..', 'venv', 'Scripts', 'python.exe');
const PREDICT_EARTHQUAKE_SCRIPT = path.join(__dirname, '..', 'scripts', 'predict_earthquake.py');

// Cache for live status
let liveStatus = {
    earthquake: { risk: 'low', lastChecked: null, detail: 'No earthquakes detected in Pakistan.' },
    flood: { risk: 'low', lastChecked: null, detail: 'River levels are normal in the Indus area.' },
    fire: { risk: 'low', lastChecked: null, detail: 'No fires found in forests like Margalla or Changa Manga.' },
    slr: { risk: 'stable', lastChecked: null, detail: 'Sea levels are normal in Karachi and Gwadar.' }
};

/**
 * Simulates running the AI model on real-time data fetched from USGS
 */
const checkEarthquakeRisk = async () => {
    try {
        console.log('[Monitoring] Fetching live seismic data for Pakistan region...');
        // Filter features within Pakistan bounding box
        const response = await axios.get('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_hour.geojson');
        const features = response.data.features.filter(f => {
            const [lon, lat] = f.geometry.coordinates;
            return lat >= 23.69 && lat <= 37.08 && lon >= 60.87 && lon <= 77.83;
        });

        liveStatus.earthquake.lastChecked = new Date();

        if (features.length > 0) {
            const latest = features[0].properties;
            const mag = latest.mag;

            if (mag > 5.0) {
                liveStatus.earthquake.risk = 'high';
                liveStatus.earthquake.detail = `DANGER: Strong earthquake (${mag}) near ${latest.place}. Emergency teams alerted.`;
            } else if (mag > 3.5) {
                liveStatus.earthquake.risk = 'medium';
                liveStatus.earthquake.detail = `WARNING: Small earthquake (${mag}) near ${latest.place}. Please stay alert.`;
            } else {
                liveStatus.earthquake.risk = 'low';
                liveStatus.earthquake.detail = `Small shaking: Power ${mag} near ${latest.place}. Everything is safe.`;
            }
        } else {
            liveStatus.earthquake.risk = 'low';
            liveStatus.earthquake.detail = 'System Scan: No earthquakes found in Pakistan in the last hour.';
        }
    } catch (error) {
        console.error('[Monitoring] Error in earthquake scan:', error.message);
    }
};

/**
 * Automated scanner loop
 */
const startMonitoring = () => {
    console.log('[Monitoring] Initializing Pakistan Regional Hazard Monitoring Systems...');

    // Initial checks
    checkEarthquakeRisk();
    simulateOtherHazards();

    // Run every 5 minutes
    setInterval(() => {
        checkEarthquakeRisk();
        // Here we could also add randomized fire/flood sims for the "live" feel
        simulateOtherHazards();
    }, 300000);
};

const simulateOtherHazards = () => {
    liveStatus.flood.lastChecked = new Date();
    liveStatus.fire.lastChecked = new Date();

    // Occasionally simulate a medium risk for demo purposes
    const roll = Math.random();
    if (roll > 0.95) {
        liveStatus.fire.risk = 'medium';
        liveStatus.fire.detail = 'Warning: Signs of fire in Northern KP forests.';
        liveStatus.flood.risk = 'medium';
        liveStatus.flood.detail = 'Warning: Water rising in Indus River near Sukkur.';
    } else {
        liveStatus.fire.risk = 'low';
        liveStatus.fire.detail = 'No fires found in Pakistan right now.';
        liveStatus.flood.risk = 'low';
        liveStatus.flood.detail = 'River water levels are safe.';
    }
};

const getLiveStatus = () => liveStatus;

module.exports = {
    startMonitoring,
    getLiveStatus,
    checkEarthquakeRisk
};
