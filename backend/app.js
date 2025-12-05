const express = require('express');
const path = require('path');
const morgan = require('morgan');
const { securityMiddleware, corsMiddleware } = require('./middleware/security');

// 라우터 import
const dashboardRoutes = require('./routes/dashboard');
const serverRoutes = require('./routes/server');
const databaseRoutes = require('./routes/database');
const userRoutes = require('./routes/users');

const app = express();

// 미들웨어 설정
app.use(morgan('combined'));
app.use(corsMiddleware);
app.use(securityMiddleware);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// favicon 명시적 처리 (정적 파일 서빙보다 먼저)
app.get('/favicon.ico', (req, res) => {
    res.setHeader('Content-Type', 'image/x-icon');
    res.sendFile(path.join(__dirname, '../frontend/favicon.ico'));
});

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, '../frontend')));

// API 라우트
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/upload/server', serverRoutes);
app.use('/api/upload/database', databaseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/databases', databaseRoutes);

// 페이지별 라우트
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/pages/server', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/server.html'));
});

app.get('/pages/database', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/database.html'));
});

app.get('/pages/user', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/user.html'));
});

// 404 처리
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: '요청한 리소스를 찾을 수 없습니다.'
    });
});

// 에러 처리 미들웨어
app.use((error, req, res, next) => {
    console.error('서버 오류:', error);
    res.status(500).json({
        success: false,
        message: '서버 내부 오류가 발생했습니다.'
    });
});

module.exports = app;
