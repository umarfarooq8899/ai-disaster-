const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const monitoringService = require('../services/monitoringService');

const PYTHON_PATH = path.join(__dirname, '..', '..', 'venv', 'Scripts', 'python.exe');

const runPythonScript = (scriptName, arg) => {
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
                console.error(`Python script ${scriptName} exited with code ${code}`);
                console.error(`Stderr: ${errorString}`);
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

exports.detectFlood = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image uploaded' });
        }
        const imagePath = req.file.path;
        const result = await runPythonScript('predict_flood.py', imagePath);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.detectFire = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image uploaded' });
        }
        const imagePath = req.file.path;
        const result = await runPythonScript('predict_fire.py', imagePath);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.predictEarthquake = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No CSV file uploaded' });
        }
        const csvPath = req.file.path;
        const result = await runPythonScript('predict_earthquake.py', csvPath);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getLiveStatus = async (req, res) => {
    try {
        const status = monitoringService.getLiveStatus();
        res.json(status);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.fetchLiveEarthquake = async (req, res) => {
    try {
        // This triggers a manual refresh of the live data
        await monitoringService.checkEarthquakeRisk(); // Note: making this public in service
        const status = monitoringService.getLiveStatus();
        res.json({
            message: "Live telemetry synchronized successfully",
            data: status.earthquake,
            status: "success"
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSLRData = async (req, res) => {
    // For now, return a mock success or metadata about the SLR component
    // In a real scenario, this would return points for a heatmap or similar
    res.json({
        message: "Sea-Level Rise visualization data",
        data: [
            { lat: -70.625, lon: 19.375, value: 12.5 },
            { lat: -72.625, lon: 17.375, value: 15.2 }
        ],
        status: "success"
    });
};
