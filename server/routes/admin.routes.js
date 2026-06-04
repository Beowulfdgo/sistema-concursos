const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { checkRole } = require('../middlewares/auth');

router.get('/export-project/:projectId', checkRole('admin'), adminController.exportProjectZip);

module.exports = router;
