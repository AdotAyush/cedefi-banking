const express = require('express');
const router = express.Router();
const controller = require('../controllers/nodeController');

router.post('/register', controller.registerNode);
router.get('/', controller.getNodes);

module.exports = router;
