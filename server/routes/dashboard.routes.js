const router = require('express').Router();
const c = require('../controllers/dashboard.controller');
const { verifyJWT, checkRole } = require('../middlewares/auth.middleware');
router.use(verifyJWT);
router.get('/admin', checkRole('admin'), c.adminDashboard);
router.get('/rankings/:contestId', checkRole('admin'), c.contestRankings);
router.get('/student', checkRole('student'), c.studentDashboard);
router.get('/reviewer', checkRole('reviewer'), c.reviewerDashboard);
module.exports = router;
