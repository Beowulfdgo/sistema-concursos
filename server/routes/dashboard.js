const router = require('express').Router();
const {
  getAdminDashboard,
  getContestRanking,
  getContestRankingGrouped,
  exportContestExcel,
  getStudentDashboard,
  getReviewerDashboard
} = require('../controllers/dashboardController');
const { verifyJWT, checkRole } = require('../middlewares/auth');

router.use(verifyJWT);
router.get('/admin', checkRole('admin'), getAdminDashboard);
router.get('/rankings/:contestId', checkRole('admin'), getContestRanking);
router.get('/rankings-grouped/:contestId', checkRole('admin'), getContestRankingGrouped);
router.get('/export/:contestId', checkRole('admin'), exportContestExcel);
router.get('/student', checkRole('student'), getStudentDashboard);
router.get('/reviewer', checkRole('reviewer'), getReviewerDashboard);

module.exports = router;