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
        // Now using weather-based prediction via kerala.csv inside the script
        // We can still pass an image if the user uploads one, but the current logic is data-driven
        const result = await runPythonScript('predict_flood.py', '');
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.detectFire = async (req, res) => {
    try {
        // Using weather-based prediction via forestfires.csv
        const result = await runPythonScript('predict_fire.py', '');
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.predictEarthquake = async (req, res) => {
    try {
        // Using seismic-based prediction via test_earthquake.csv
        const result = await runPythonScript('predict_earthquake.py', '');
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.predictCyclone = async (req, res) => {
    try {
        const result = await runPythonScript('predict_cyclone.py', '');
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
    try {
        const result = await runPythonScript('predict_slr.py', '');
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
