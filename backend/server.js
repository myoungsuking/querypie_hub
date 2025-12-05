const https = require('https');
const fs = require('fs');
const path = require('path');
const app = require('./app');

const PORT = process.env.PORT || 3000;

// SSL 인증서 로드
const options = {
    key: fs.readFileSync(path.join(__dirname, '../key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '../cert.pem'))
};

// HTTPS 서버 시작
const HOST = '172.22.0.139';
https.createServer(options, app).listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 HUB 시스템 서버가 포트 ${PORT}에서 HTTPS로 실행 중입니다.`);
    console.log(`📱 프론트엔드: https://${HOST}:${PORT}`);
    console.log(`🔧 API 엔드포인트: https://${HOST}:${PORT}/api`);
    console.log(`📊 대시보드: https://${HOST}:${PORT}/api/dashboard`);
    console.log('⚠️  자체 서명 인증서를 사용합니다. 브라우저에서 보안 경고를 무시하고 진행하세요.');
});
