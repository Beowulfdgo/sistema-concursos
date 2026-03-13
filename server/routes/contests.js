const router = require('express').Router();
const c = require('../controllers/contestController');
const { verifyJWT, checkRole } = require('../middlewares/auth');

router.use(verifyJWT);
router.get('/', c.getContests);
router.get('/:id', c.getContest);
router.post('/', checkRole('admin'), c.createContest);
router.put('/:id', checkRole('admin'), c.updateContest);
router.patch('/:id/status', checkRole('admin'), c.updateStatus);
router.post('/:id/categories', checkRole('admin'), c.addCategory);
router.delete('/:id/categories/:catId', checkRole('admin'), c.deleteCategory);

module.exports = router;
