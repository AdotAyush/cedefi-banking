const express = require('express');
const router = express.Router();
const controller = require('../controllers/nodeController');

router.post('/register', controller.registerNode);
router.post('/:publicKey/verify', controller.verifyNode);
router.get('/', controller.getNodes);
router.get('/reputations', controller.getNodeReputations);

module.exports = router;
