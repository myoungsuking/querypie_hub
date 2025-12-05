const express = require('express');
const router = express.Router();
const multer = require('multer');
const ServerController = require('../controllers/serverController');

// Multer 설정
const upload = multer({ storage: multer.memoryStorage() });

// 서버 라우트
router.post('/upload', upload.single('file'), ServerController.uploadServer);
router.post('/', ServerController.createServer);

module.exports = router;
