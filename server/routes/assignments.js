const router = require('express').Router();
const { getAssignments, createAssignment, updateAssignment, deleteAssignment } = require('../controllers/assignmentController');
const { verifyJWT, checkRole } = require('../middlewares/auth');

router.use(verifyJWT);
router.get('/', getAssignments);
router.post('/', checkRole('admin'), createAssignment);
router.put('/:id', checkRole('admin'), updateAssignment);
router.delete('/:id', checkRole('admin'), deleteAssignment);

module.exports = router;
