const axios = require('axios');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const Alert = require('../models/Alert');

/**
 * Creates an automated system alert if risk is detected
 */
const triggerAutomatedAlert = async (type, detail) => {
    try {
        const existingAlert = await Alert.findOne({
            type: type,
            status: 'Active',
            title: { $regex: 'AI AUTO-ALERT' }
        }).sort({ createdAt: -1 });

        // Don't spam alerts if one was created in the last hour
        if (existingAlert && (new Date() - existingAlert.createdAt < 3600000)) {
            return;
        }

        await Alert.create({
            title: `AI AUTO-ALERT: High ${type} risk detected!`,
            type: type,
            target: 'Regional Authorities / Responders',
            status: 'Active',
            detail: detail // Note: Added detail to help users, though model might need it
        });
        console.log(`[Monitoring] Automated alert triggered for ${type}`);
    } catch (err) {
        console.error(`[Monitoring] Failed to create automated alert:`, err.message);
    }
};

// Path to Python and Scripts
const PYTHON_PATH = path.join(__dirname, '..', '..', 'venv', 'Scripts', 'python.exe');
const PREDICT_EARTHQUAKE_SCRIPT = path.join(__dirname, '..', 'scripts', 'predict_earthquake.py');

// Cache for live status
let liveStatus = {
    earthquake: { risk: 'low', lastChecked: null, detail: 'Systems scanning Pakistan seismic zones (Quetta, Islamabad, etc).' },
    flood: { risk: 'low', lastChecked: null, detail: 'Indus river basin monitoring active. Levels normal.' },
    fire: { risk: 'low', lastChecked: null, detail: 'Forest monitoring (Margalla, Murree, Juniper forests) active.' },
    slr: { risk: 'stable', lastChecked: null, detail: 'Coastal monitoring (Karachi, Gwadar) stable.' }
};

// Accuracy Enhancements: Data Buffers
let rainfallBuffer = []; // Last 7 readings

const runPythonScript = (scriptName, arg = '') => {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '..', 'scripts', scriptName);
        const pythonProcess = spawn(PYTHON_PATH, [scriptPath, arg]);

        let dataString = '';
        let errorString = '';

        pythonProcess.stdout.on('data', (data) => {
            dataString += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorString += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`[Monitoring] Python script ${scriptName} exited with code ${code}`);
                return reject(new Error(errorString || `Script exited with code ${code}`));
            }
            try {
                const result = JSON.parse(dataString);
                resolve(result);
            } catch (e) {
                reject(new Error(`Failed to parse Python output: ${dataString}`));
            }
        });
    });
};

/**
 * Simulates running the AI model on real-time data fetched from USGS
 */
const checkEarthquakeRisk = async () => {
    try {
        console.log('[Monitoring] Fetching live seismic data for Pakistan region...');
        const response = await axios.get('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_hour.geojson');
        const features = response.data.features.filter(f => {
            const [lon, lat] = f.geometry.coordinates;
            return lat >= 23.69 && lat <= 37.08 && lon >= 60.87 && lon <= 77.83;
        });

        liveStatus.earthquake.lastChecked = new Date();

        if (features.length > 0) {
            const latest = features[0].properties;
            const mag = latest.mag;

            // Run AI script with city context if available in 'place'
            const result = await runPythonScript('predict_earthquake.py', latest.place);

            if (mag > 5.0 || result.prediction.toLowerCase().includes('high')) {
                liveStatus.earthquake.risk = 'high';
                const detail = `DANGER: Strong tectonic activity (${mag}) near ${latest.place}. AI Status: ${result.prediction}. Context: ${result.location_context}`;
                liveStatus.earthquake.detail = detail;
                triggerAutomatedAlert('Earthquake', detail);
            } else if (mag > 3.5 || result.prediction.toLowerCase().includes('medium')) {
                liveStatus.earthquake.risk = 'medium';
                liveStatus.earthquake.detail = `WARNING: Seismic activity (${mag}) near ${latest.place}. Region: ${result.location_context}.`;
            } else {
                liveStatus.earthquake.risk = 'low';
                liveStatus.earthquake.detail = `Minor tremors detected near ${latest.place}. System status safe.`;
            }
        } else {
            liveStatus.earthquake.risk = 'low';
            liveStatus.earthquake.detail = 'Nationwide Scan: No seismic events detected in Pakistan territory in the last hour.';
        }
    } catch (error) {
        console.error('[Monitoring] Error in earthquake scan:', error.message);
    }
};

/**
 * Fetches real-time weather forecast for Pakistan (Islamabad) from Open-Meteo
 */
const getWeatherForecast = async () => {
    try {
        console.log('[Monitoring] Fetching live weather forecast for Pakistan regions...');
        // Using Islamabad as primary indicator for flood/fire models in this demo
        const response = await axios.get('https://api.open-meteo.com/v1/forecast?latitude=33.68&longitude=73.04&daily=precipitation_sum,temperature_2m_max,relative_humidity_2m_max,wind_speed_10m_max&timezone=auto');

        const daily = response.data.daily;
        return {
            temp: daily.temperature_2m_max[0],
            humidity: daily.relative_humidity_2m_max[0] || 50,
            wind: daily.wind_speed_10m_max[0],
            rain: daily.precipitation_sum[0]
        };
    } catch (error) {
        console.error('[Monitoring] Weather API fetch failed:', error.message);
        return null;
    }
};

const checkFloodRisk = async () => {
    try {
        const forecast = await getWeatherForecast();
        if (!forecast) throw new Error('No weather data available');

        // Update rainfall buffer for temporal accuracy
        rainfallBuffer.push(forecast.rain);
        if (rainfallBuffer.length > 7) rainfallBuffer.shift();

        console.log(`[Monitoring] Running AI Flood Prediction (Buffer: ${rainfallBuffer.join(',')}mm)...`);

        const result = await runPythonScript('predict_flood.py', rainfallBuffer.join(','));

        liveStatus.flood.lastChecked = new Date();
        const isHighRisk = result.prediction.toLowerCase().includes('high');
        liveStatus.flood.risk = isHighRisk ? 'high' : (result.prediction.toLowerCase().includes('medium') ? 'medium' : 'low');

        const detail = `AI Regional Analysis: ${result.prediction}. ${result.description}`;
        liveStatus.flood.detail = detail;

        if (isHighRisk) triggerAutomatedAlert('Flood', detail);
    } catch (error) {
        console.error('[Monitoring] Error in flood prediction:', error.message);
    }
};

const checkFireRisk = async () => {
    try {
        const forecast = await getWeatherForecast();
        if (!forecast) throw new Error('No weather data available');

        console.log(`[Monitoring] Running AI Fire Prediction (Forecast: ${forecast.temp}°C, ${forecast.wind}km/h wind)...`);

        const inputData = `${forecast.temp},${forecast.humidity},${forecast.wind},${forecast.rain}`;
        const result = await runPythonScript('predict_fire.py', inputData);

        liveStatus.fire.lastChecked = new Date();
        const isHighRisk = result.prediction.toLowerCase().includes('high');
        liveStatus.fire.risk = isHighRisk ? 'high' : (result.prediction.toLowerCase().includes('medium') ? 'medium' : 'low');

        const detail = `AI Forestry Scan: ${result.prediction} Risk (${result.impact_index} impact). Monitoring Margalla & North forests (Conditions: ${forecast.temp}°C, ${forecast.wind}km/h wind).`;
        liveStatus.fire.detail = detail;

        if (isHighRisk) triggerAutomatedAlert('Fire', detail);
    } catch (error) {
        console.error('[Monitoring] Error in fire prediction:', error.message);
    }
};

const checkCycloneRisk = async () => {
    try {
        console.log('[Monitoring] Fetching coastal weather for cyclone analysis...');
        // Karachi coordinates for coastal monitoring
        const response = await axios.get('https://api.open-meteo.com/v1/forecast?latitude=24.86&longitude=67.00&current=surface_pressure,wind_speed_10m&timezone=auto');

        const current = response.data.current;
        const inputData = `${current.wind_speed_10m},${current.surface_pressure}`;
        const result = await runPythonScript('predict_cyclone.py', inputData);

        liveStatus.slr.lastChecked = new Date(); // Using SLR card for coastal data
        const isHighRisk = result.prediction.toLowerCase().includes('high');
        // Note: We don't have a cyclone card in liveStatus initially, but let's map it or add it
        // Since the UI uses 'slr' tab for sea level, we can combine them or stick to what's there
        liveStatus.slr.risk = isHighRisk ? 'high' : (result.prediction.toLowerCase().includes('medium') ? 'medium' : 'low');
        liveStatus.slr.detail = `Coastal Analysis: ${result.prediction} (${result.message})`;

        if (isHighRisk) triggerAutomatedAlert('Cyclone', liveStatus.slr.detail);
    } catch (error) {
        console.error('[Monitoring] Error in cyclone analysis:', error.message);
    }
};

/**
 * Automated scanner loop
 */
const startMonitoring = () => {
    console.log('[Monitoring] Initializing Pakistan Regional Hazard Monitoring Systems...');

    // Initial checks
    checkEarthquakeRisk();
    checkFloodRisk();
    checkFireRisk();
    checkCycloneRisk();

    // Run every 5 minutes
    setInterval(() => {
        checkEarthquakeRisk();
        checkFloodRisk();
        checkFireRisk();
        checkCycloneRisk();
    }, 300000);
};

const getLiveStatus = () => liveStatus;

module.exports = {
    startMonitoring,
    getLiveStatus,
    checkEarthquakeRisk,
    checkFloodRisk,
    checkFireRisk
};
