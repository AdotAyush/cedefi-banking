const express = require('express');
const router = express.Router();
const {
    initiateRegistration,
    handleExistingUserChoice,
    verifyAndCompleteRegistration,
    login,
    register
} = require('../controllers/authController');

// New multi-step registration endpoints
router.post('/register/initiate', initiateRegistration);
router.post('/register/handle-existing', handleExistingUserChoice);
router.post('/register/verify-complete', verifyAndCompleteRegistration);

// Existing endpoints
router.post('/login', login);

// Deprecated - kept for backwards compatibility
router.post('/register', register);

module.exports = router;
