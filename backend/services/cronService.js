const cron = require('node-cron');
const { spawn } = require('child_process');
const path = require('path');

const PYTHON_PATH = path.join(__dirname, '..', '..', 'venv', 'Scripts', 'python.exe');
const SCRIPT_PATH = path.join(__dirname, '..', 'scripts', 'train_all_models.py');

const setupCronJobs = () => {
    // Run the training script every Sunday at 3:00 AM
    cron.schedule('0 3 * * 0', () => {
        console.log('[Cron] Starting scheduled model training...');
        
        const pythonProcess = spawn(PYTHON_PATH, [SCRIPT_PATH]);

        pythonProcess.stdout.on('data', (data) => {
            console.log(`[Cron Train] ${data}`);
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`[Cron Train Error] ${data}`);
        });

        pythonProcess.on('close', (code) => {
            if (code === 0) {
                console.log('[Cron] Model training completed successfully.');
            } else {
                console.error(`[Cron] Model training failed with code ${code}.`);
            }
        });
    });

    console.log('[Cron] Scheduled jobs initialized (Training models weekly at Sun 3:00 AM).');
};

module.exports = { setupCronJobs };
