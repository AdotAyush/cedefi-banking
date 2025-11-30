const express = require('express');
const router = express.Router();
const controller = require('../controllers/transactionController');

router.post('/', controller.createTransaction);
router.post('/:transactionId/vote', controller.voteOnTransaction);
router.post('/:transactionId/claim', controller.claimTransaction);
router.post('/:transactionId/bank-approval', controller.bankApproval);
router.post('/faucet', controller.faucet);
router.get('/', controller.getTransactions);

module.exports = router;
