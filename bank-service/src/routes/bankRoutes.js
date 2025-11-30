const express = require('express');
const router = express.Router();
const controller = require('../controllers/bankController');

router.get('/info', controller.getInfo);
router.post('/approve', controller.approveTransaction);
router.post('/reject', controller.rejectTransaction);
router.get('/settings', controller.getSettings);
router.post('/settings', controller.updateSettings);
router.post('/transfer', controller.initiateTransfer);
router.post('/request-funds', controller.requestFunds);
router.get('/health', controller.healthCheck);

module.exports = router;
