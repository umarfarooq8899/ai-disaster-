const axios = require('axios');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const Alert = require('../models/Alert');
const { getDamGaugeData } = require('./damGaugeService');

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
// If in production, use global python3 or python. If local, use the local Windows venv.
const isProduction = process.env.NODE_ENV === 'production';
const PYTHON_PATH = process.env.PYTHON_PATH || (isProduction ? 'python3' : path.join(__dirname, '..', '..', 'venv', 'Scripts', 'python.exe'));
const PREDICT_EARTHQUAKE_SCRIPT = path.join(__dirname, '..', 'scripts', 'predict_earthquake.py');

const NodeCache = require('node-cache');
const predictionCache = new NodeCache({ stdTTL: 600 }); // 10 minutes default TTL

// Cache for live status
let liveStatus = {
    earthquake: { risk: 'stable', lastChecked: null, detail: 'Systems scanning Pakistan seismic zones (Quetta, Islamabad, etc).', threatZones: [] },
    flood: { risk: 'stable', lastChecked: null, detail: 'Indus river basin & dam catchment monitoring active. Levels normal.', threatZones: [] },
    fire: { risk: 'stable', lastChecked: null, detail: 'Forest monitoring (Margalla, Murree, Juniper forests) active.', threatZones: [] },
    slr: { risk: 'stable', lastChecked: null, detail: 'Coastal monitoring (Karachi, Gwadar) stable.', threatZones: [] },
    dams: { lastChecked: null, mangla: null, tarbela: null, detail: 'Fetching dam gauge estimates for Mangla & Tarbela...' }
};

// Accuracy Enhancements: Data Buffers
let rainfallBuffer = []; // Last 7 readings

const runPythonScript = async (scriptName, arg = '') => {
    const cacheKey = `${scriptName}_${arg}`;
    const cachedResult = predictionCache.get(cacheKey);
    if (cachedResult) {
        console.log(`[Monitoring] Using cached prediction for ${scriptName}`);
        return cachedResult;
    }

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
                if (result.error) {
                    return reject(new Error(result.error));
                }
                predictionCache.set(cacheKey, result); // Cache the successful result
                resolve(result);
            } catch (e) {
                reject(new Error(`Failed to parse Python output: ${dataString}`));
            }
        });
    });
};

const checkEarthquakeRisk = async () => {
    try {
        console.log('[Monitoring] Fetching real-time USGS earthquake data for Pakistan region...');

        // Bounding box for Pakistan: lat 23.6 to 37.1, lon 60.8 to 77.8
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000); // Past 7 days

        const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startTime.toISOString()}&endtime=${endTime.toISOString()}&minlatitude=23.6&maxlatitude=37.1&minlongitude=60.8&maxlongitude=77.8`;

        let events = predictionCache.get("usgs_events");
        if (!events) {
            const response = await axios.get(url, { timeout: 10000 });
            events = response.data.features;
            predictionCache.set("usgs_events", events, 900); // Cache USGS for 15 mins
        } else {
            console.log('[Monitoring] Using cached USGS earthquake data.');
        }

        const count = events.length;
        const maxMag = events.reduce((max, eq) => Math.max(max, eq.properties.mag || 0), 0);

        // Pass recent magnitudes to Python as a buffer
        let bufferString = '0';
        if (events.length > 0) {
            const mags = events.map(e => parseFloat(e.properties.mag || 0).toFixed(1));
            // Let's pass up to 50 latest magnitudes
            bufferString = mags.slice(0, 50).join(',');
        }

        liveStatus.earthquake.lastChecked = new Date();

        // Run AI prediction using real USGS data
        const result = await runPythonScript('predict_earthquake.py', bufferString);
        
        // Pass prediction and time_to_failure to liveStatus for frontend
        liveStatus.earthquake.prediction = result.prediction;
        liveStatus.earthquake.time_to_failure = result.time_to_failure;
        liveStatus.earthquake.confidence = result.confidence_score;
        liveStatus.earthquake.ml_probability = result.ml_probability;

        if (result.prediction.toLowerCase().includes('high')) {
            liveStatus.earthquake.risk = 'high';
            const detail = `DANGER: Anomalous seismic swarms detected. AI Status: ${result.prediction}. Context: ${result.location_context}.`;
            liveStatus.earthquake.detail = detail;
            liveStatus.earthquake.threatZones = result.threat_zones || [];
            triggerAutomatedAlert('Earthquake', detail);
        } else if (result.prediction.toLowerCase().includes('medium')) {
            liveStatus.earthquake.risk = 'medium';
            liveStatus.earthquake.detail = `WARNING: Elevated seismic activity. Region: ${result.location_context}.`;
            liveStatus.earthquake.threatZones = result.threat_zones || [];
        } else {
            liveStatus.earthquake.risk = 'stable';
            liveStatus.earthquake.detail = `Seismic monitoring stable. ${count} quakes past 7 days (Max mag: ${maxMag}). Region: ${result.location_context}.`;
            liveStatus.earthquake.threatZones = [];
        }
    } catch (error) {
        console.error('[Monitoring] Error in earthquake scan:', error.message);
    }
};

/**
 * PMD-equivalent: Fetches real-time weather for 6 Pakistani city grid-points in parallel
 * and returns a regional aggregate. Cities: Islamabad, Lahore, Karachi, Peshawar, Quetta, Gilgit.
 */
const PMD_CITY_POINTS = [
    { name: 'Islamabad', lat: 33.68, lon: 73.04 },
    { name: 'Lahore', lat: 31.55, lon: 74.35 },
    { name: 'Karachi', lat: 24.86, lon: 67.00 },
    { name: 'Peshawar', lat: 34.01, lon: 71.58 },
    { name: 'Quetta', lat: 30.19, lon: 67.01 },
    { name: 'Gilgit', lat: 35.92, lon: 74.31 },
];

let weatherCache = { data: null, fetchedAt: null };
const WEATHER_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const getPMDWeatherData = async () => {
    if (weatherCache.data && weatherCache.fetchedAt && (Date.now() - weatherCache.fetchedAt < WEATHER_CACHE_TTL)) {
        return weatherCache.data;
    }
    try {
        console.log('[Monitoring] Fetching PMD-equivalent multi-city weather (6 grid-points)...');
        const fetchCity = ({ lat, lon }) =>
            axios.get(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
                `&daily=precipitation_sum,temperature_2m_max,relative_humidity_2m_max,wind_speed_10m_max&timezone=auto`,
                { timeout: 8000 }
            ).then(r => r.data.daily);

        const cityResults = await Promise.allSettled(PMD_CITY_POINTS.map(fetchCity));

        // Use fulfilled results only
        const valid = cityResults
            .filter(r => r.status === 'fulfilled')
            .map(r => r.value);

        if (valid.length === 0) return null;

        // Regional average of today's values
        const avg = (key) => valid.reduce((sum, d) => sum + (d[key][0] || 0), 0) / valid.length;

        const result = {
            temp: parseFloat(avg('temperature_2m_max').toFixed(1)),
            humidity: parseFloat(avg('relative_humidity_2m_max').toFixed(1)) || 50,
            wind: parseFloat(avg('wind_speed_10m_max').toFixed(1)),
            rain: parseFloat(avg('precipitation_sum').toFixed(2)),
            cities: valid.length
        };
        weatherCache = { data: result, fetchedAt: Date.now() };
        return result;
    } catch (error) {
        if (error.response && error.response.status === 429) {
            // Suppress verbose error on 429
            console.log('[Monitoring] PMD weather fetch rate-limited (429). Using fallback.');
        } else {
            console.error('[Monitoring] PMD weather fetch failed:', error.message);
        }
        if (weatherCache.data) return weatherCache.data;
        return { temp: 30, humidity: 50, wind: 10, rain: 0, cities: PMD_CITY_POINTS.length }; // Absolute fallback
    }
};

const checkFloodRisk = async () => {
    try {
        const forecast = await getPMDWeatherData();
        if (!forecast) throw new Error('No weather data available');

        // Update rainfall buffer for temporal accuracy
        rainfallBuffer.push(forecast.rain);
        if (rainfallBuffer.length > 7) rainfallBuffer.shift();

        console.log(`[Monitoring] Running AI Flood Prediction (${forecast.cities} PMD cities | Buffer: ${rainfallBuffer.join(',')}mm)...`);

        const result = await runPythonScript('predict_flood.py', rainfallBuffer.join(','));

        liveStatus.flood.lastChecked = new Date();
        const isHighRisk = result.prediction.toLowerCase().includes('high');
        liveStatus.flood.risk = isHighRisk ? 'high' : (result.prediction.toLowerCase().includes('medium') ? 'medium' : 'low');
        liveStatus.flood.confidence = result.confidence_score;
        liveStatus.flood.ml_probability = result.probability;

        const detail = `AI Regional Analysis (${forecast.cities} PMD cities): ${result.prediction}. ${result.description}`;
        liveStatus.flood.detail = detail;
        liveStatus.flood.threatZones = result.threat_zones || [];

        if (isHighRisk) triggerAutomatedAlert('Flood', detail);
    } catch (error) {
        console.error('[Monitoring] Error in flood prediction:', error.message);
    }
};

const checkFireRisk = async () => {
    try {
        const forecast = await getPMDWeatherData();
        if (!forecast) throw new Error('No weather data available');

        console.log(`[Monitoring] Running AI Fire Prediction (${forecast.cities} PMD cities | ${forecast.temp}°C, ${forecast.wind}km/h wind)...`);

        const inputData = `${forecast.temp},${forecast.humidity},${forecast.wind},${forecast.rain}`;
        const result = await runPythonScript('predict_fire.py', inputData);

        liveStatus.fire.lastChecked = new Date();
        const isHighRisk = result.prediction.toLowerCase().includes('high');
        liveStatus.fire.risk = isHighRisk ? 'high' : (result.prediction.toLowerCase().includes('medium') ? 'medium' : 'low');
        liveStatus.fire.confidence = result.confidence_score;
        liveStatus.fire.ml_probability = result.fire_probability;

        const detail = `AI Forestry Scan (${forecast.cities} PMD cities): ${result.prediction} Risk (${result.impact_index} impact). Conditions: ${forecast.temp}°C avg, ${forecast.wind}km/h wind.`;
        liveStatus.fire.detail = detail;
        liveStatus.fire.threatZones = result.threat_zones || [];

        if (isHighRisk) triggerAutomatedAlert('Fire', detail);
    } catch (error) {
        console.error('[Monitoring] Error in fire prediction:', error.message);
    }
};

let cycloneCache = { data: null, fetchedAt: null };
const CYCLONE_CACHE_TTL = 15 * 60 * 1000; // 15 mins

const checkCycloneRisk = async () => {
    try {
        let current;
        if (cycloneCache.data && cycloneCache.fetchedAt && (Date.now() - cycloneCache.fetchedAt < CYCLONE_CACHE_TTL)) {
            current = cycloneCache.data;
        } else {
            console.log('[Monitoring] Fetching coastal weather for cyclone analysis...');
            const response = await axios.get('https://api.open-meteo.com/v1/forecast?latitude=24.86&longitude=67.00&current=surface_pressure,wind_speed_10m&timezone=auto', { timeout: 8000 });
            current = response.data.current;
            cycloneCache = { data: current, fetchedAt: Date.now() };
        }
        
        const inputData = `${current.wind_speed_10m},${current.surface_pressure}`;
        const result = await runPythonScript('predict_cyclone.py', inputData);

        liveStatus.slr.lastChecked = new Date(); // Using SLR card for coastal data
        const isHighRisk = result.prediction.toLowerCase().includes('high');
        // Note: We don't have a cyclone card in liveStatus initially, but let's map it or add it
        // Since the UI uses 'slr' tab for sea level, we can combine them or stick to what's there
        liveStatus.slr.risk = isHighRisk ? 'high' : (result.prediction.toLowerCase().includes('medium') ? 'medium' : 'low');
        liveStatus.slr.confidence = result.confidence_score || result.risk_score * 100;
        liveStatus.slr.ml_probability = result.risk_score;
        liveStatus.slr.detail = `Coastal Analysis: ${result.prediction} (${result.message})`;
        liveStatus.slr.threatZones = result.threat_zones || [];

        if (isHighRisk) triggerAutomatedAlert('Cyclone', liveStatus.slr.detail);
    } catch (error) {
        if (error.response && error.response.status === 429) {
            console.log('[Monitoring] Cyclone analysis fetch rate-limited (429). Will retry later.');
        } else {
            console.error('[Monitoring] Error in cyclone analysis:', error.message);
        }
    }
};

/**
 * Checks Mangla & Tarbela dam gauge estimates and updates liveStatus.dams
 */
const checkDamGauges = async () => {
    try {
        console.log('[Monitoring] Updating Mangla & Tarbela dam gauge estimates...');
        const data = await getDamGaugeData();
        liveStatus.dams.mangla = data.mangla;
        liveStatus.dams.tarbela = data.tarbela;
        liveStatus.dams.lastChecked = new Date();
        liveStatus.dams.detail = `Mangla: ${data.mangla.levelM}m (${data.mangla.capacityPct}% capacity) | Tarbela: ${data.tarbela.levelM}m (${data.tarbela.capacityPct}% capacity)`;

        // Auto-alert if either dam hits critical fill
        [data.mangla, data.tarbela].forEach(dam => {
            if (dam.statusColor === 'high') {
                triggerAutomatedAlert('Flood', `DAM ALERT – ${dam.name}: ${dam.status} (${dam.capacityPct}% capacity, inflow ${dam.inflowCumecs} cumecs)`);
            }
        });
    } catch (error) {
        console.error('[Monitoring] Error in dam gauge check:', error.message);
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
    checkDamGauges();

    // Run every 5 minutes
    setInterval(() => {
        checkEarthquakeRisk();
        checkFloodRisk();
        checkFireRisk();
        checkCycloneRisk();
        checkDamGauges();
    }, 300000);
};

const getLiveStatus = () => liveStatus;

module.exports = {
    startMonitoring,
    getLiveStatus,
    checkEarthquakeRisk,
    checkFloodRisk,
    checkFireRisk,
    checkDamGauges
};
