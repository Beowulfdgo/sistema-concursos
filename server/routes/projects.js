const router = require('express').Router();
const { getProjects, getProject, createProject, updateProject, getProjectFile, deleteProject } = require('../controllers/projectController');
const { verifyJWT, checkRole } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

router.use(verifyJWT);
router.get('/', getProjects);
router.get('/:id', getProject);
router.get('/:id/file', getProjectFile);
router.post('/', checkRole('student'), upload.single('file'), createProject);
router.put('/:id', upload.single('file'), updateProject);
router.delete('/:id', checkRole('admin'), deleteProject);

module.exports = router;
