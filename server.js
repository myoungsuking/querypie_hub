const https = require('https');
const fs = require('fs');
const path = require('path');
const app = require('./backend/app');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const USE_HTTPS = process.env.USE_HTTPS !== 'false'; // 기본값: true

// HTTPS 또는 HTTP 서버 시작
if (USE_HTTPS && fs.existsSync(path.join(__dirname, 'key.pem')) && fs.existsSync(path.join(__dirname, 'cert.pem'))) {
    // SSL 인증서 로드
    const options = {
        key: fs.readFileSync(path.join(__dirname, 'key.pem')),
        cert: fs.readFileSync(path.join(__dirname, 'cert.pem'))
    };
    
    https.createServer(options, app).listen(PORT, HOST, () => {
        console.log(`🚀 HUB 시스템 서버가 포트 ${PORT}에서 HTTPS로 실행 중입니다.`);
        console.log(`📱 프론트엔드: https://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
        console.log(`🔧 API 엔드포인트: https://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/api`);
        console.log(`📊 대시보드: https://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/api/dashboard`);
        console.log('⚠️  자체 서명 인증서를 사용합니다. 브라우저에서 보안 경고를 무시하고 진행하세요.');
    });
} else {
    // HTTP 서버 (클라우드 호스팅용)
    const http = require('http');
    http.createServer(app).listen(PORT, HOST, () => {
        console.log(`🚀 HUB 시스템 서버가 포트 ${PORT}에서 HTTP로 실행 중입니다.`);
        console.log(`📱 프론트엔드: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
        console.log(`🔧 API 엔드포인트: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/api`);
        console.log(`📊 대시보드: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/api/dashboard`);
    });
}
