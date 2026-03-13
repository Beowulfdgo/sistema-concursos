const router = require('express').Router();
const { getRubrics, getRubric, createRubric, updateRubric, deleteRubric } = require('../controllers/rubricController');
const { verifyJWT, checkRole } = require('../middlewares/auth');

router.use(verifyJWT);
router.get('/', checkRole('admin'), getRubrics);
router.get('/:id', checkRole('admin', 'reviewer'), getRubric);
router.post('/', checkRole('admin'), createRubric);
router.put('/:id', checkRole('admin'), updateRubric);
router.delete('/:id', checkRole('admin'), deleteRubric);

module.exports = router;
