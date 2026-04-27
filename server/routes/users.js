const router = require('express').Router();
const { getUsers, getUser, createReviewer, updateUser, updateStatus, deleteUser, permanentDeleteUser, getMe } = require('../controllers/userController');
const { verifyJWT, checkRole } = require('../middlewares/auth');

router.use(verifyJWT);
router.get('/me', getMe);
router.get('/', checkRole('admin'), getUsers);
router.get('/:id', checkRole('admin'), getUser);
router.post('/reviewer', checkRole('admin'), createReviewer);
router.put('/:id', checkRole('admin'), updateUser);
router.patch('/:id/status', checkRole('admin'), updateStatus);
router.delete('/:id', checkRole('admin'), deleteUser);
router.delete('/:id/permanent', checkRole('admin'), permanentDeleteUser);

module.exports = router;
