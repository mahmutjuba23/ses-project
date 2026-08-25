const express = require('express');
const multer = require('multer');
const { importStudents } = require('../controllers/students.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/import', authenticate, upload.single('file'), importStudents);

module.exports = router;
