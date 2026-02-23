const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const aiController = require('../controllers/aiController');

// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Routes
router.get('/live-status', aiController.getLiveStatus);
router.post('/fetch-live', aiController.fetchLiveEarthquake);
router.post('/flood', upload.single('image'), aiController.detectFlood);
router.post('/fire', upload.single('image'), aiController.detectFire);
router.post('/earthquake', upload.single('data'), aiController.predictEarthquake);
router.get('/slr', aiController.getSLRData);

module.exports = router;
