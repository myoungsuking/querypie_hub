const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');

// 대시보드 라우트
router.get('/', DashboardController.getDashboard);

module.exports = router;
