const express = require('express');
const router = express.Router();
const controller = require('../controllers/transactionController');

router.post('/', controller.createTransaction);
router.post('/:transactionId/vote', controller.voteOnTransaction);
router.get('/', controller.getTransactions);

module.exports = router;
