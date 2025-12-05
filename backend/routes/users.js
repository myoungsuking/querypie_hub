const express = require('express');
const router = express.Router();
const multer = require('multer');
const UserController = require('../controllers/userController');

// Multer 설정
const upload = multer({ storage: multer.memoryStorage() });

// 사용자 라우트
router.post('/', UserController.registerUser);
router.post('/bulk', upload.single('file'), UserController.registerUsersBulk);

module.exports = router;
