const router = require('express').Router();
const c = require('../controllers/assignment.controller');
const { verifyJWT, checkRole } = require('../middlewares/auth.middleware');
router.use(verifyJWT);
router.get('/', c.getAssignments);
router.post('/', checkRole('admin'), c.createAssignment);
router.put('/:id', checkRole('admin'), c.updateAssignment);
router.delete('/:id', checkRole('admin'), c.deleteAssignment);
module.exports = router;
