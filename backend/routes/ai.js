const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// Routes
router.get('/live-status', aiController.getLiveStatus);
router.post('/fetch-live', aiController.fetchLiveEarthquake);
router.get('/cyclone', aiController.predictCyclone);
router.get('/flood', aiController.predictFlood);
router.get('/fire', aiController.predictFire);
router.get('/earthquake', aiController.predictEarthquake);
router.get('/slr', aiController.getSLRData);
router.get('/dams', aiController.getDamStatus);

module.exports = router;
