const express = require('express');
const router = express.Router();
const multer = require('multer');
const DatabaseController = require('../controllers/databaseController');

// Multer 설정
const upload = multer({ storage: multer.memoryStorage() });

// 데이터베이스 라우트
router.post('/upload', upload.single('file'), DatabaseController.uploadDatabase);
router.post('/', DatabaseController.createDBConnection);
router.post('/clusters', DatabaseController.createCluster);

module.exports = router;
