const router = require('express').Router();
const { register, verifyEmail, resendCode, login, refresh, logout } = require('../controllers/authController');
const { verifyJWT } = require('../middlewares/auth');

router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/resend-code', resendCode);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', verifyJWT, logout);

module.exports = router;
