const router = require('express').Router();
const { getProjectEvaluations, getEvaluation, createOrUpdateEvaluation, submitEvaluation } = require('../controllers/evaluationController');
const { verifyJWT, checkRole } = require('../middlewares/auth');

router.use(verifyJWT);
router.get('/project/:projectId', getProjectEvaluations);
router.get('/:id', getEvaluation);
router.post('/', checkRole('reviewer'), createOrUpdateEvaluation);
router.put('/:id', checkRole('reviewer'), createOrUpdateEvaluation);
router.patch('/:id/submit', checkRole('reviewer'), submitEvaluation);

module.exports = router;
