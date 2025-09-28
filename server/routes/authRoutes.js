const express = require('express');
const { register, login, requestEmailVerification, verifyEmail } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);


router.post('/login', login);

// Email verification
router.post('/request-verify-email', requestEmailVerification);
router.get('/verify-email', verifyEmail);


module.exports = router;


