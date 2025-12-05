const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const https = require('https');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어 설정
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            scriptSrcAttr: ["'unsafe-inline'"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "data:"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
            upgradeInsecureRequests: []
        }
    },
    crossOriginOpenerPolicy: false,
    originAgentCluster: false,
    strictTransportSecurity: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false
}));
app.use(morgan('combined'));
app.use(cors({
    origin: '*', // 모든 도메인에서 접근 허용
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 정적 파일 서빙 (프론트엔드)
app.use(express.static(path.join(__dirname)));

// 파일 업로드를 위한 multer 설정
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB 제한
    },
    fileFilter: (req, file, cb) => {
        // 허용되는 파일 타입
        const allowedTypes = ['application/json', 'text/csv', 'text/plain'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('지원되지 않는 파일 형식입니다. JSON, CSV, TXT 파일만 업로드 가능합니다.'), false);
        }
    }
});

// 데이터 저장소 제거 - 단순 전달 서버로 변경

// 대시보드 데이터 API - 단순화
app.get('/api/dashboard', (req, res) => {
    try {
        res.json({
            success: true,
            message: 'HUB 시스템이 실행 중입니다.',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('대시보드 데이터 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '대시보드 데이터를 가져오는데 실패했습니다.'
        });
    }
});

// 서버 데이터 전송 API
app.post('/api/upload/server', upload.single('file'), async (req, res) => {
    try {
        const { ip, https, token } = req.body;
        const file = req.file;

        // 입력 검증
        if (!file) {
            return res.status(400).json({
                success: false,
                message: '파일이 필요합니다.'
            });
        }

        if (!ip || !token) {
            return res.status(400).json({
                success: false,
                message: 'IP 주소와 API Token이 필요합니다.'
            });
        }

        // 실제 API 호출
        const result = await callExternalAPI(`http${https === 'true' ? 's' : ''}://${ip}/api/server`, {
            file: file.buffer.toString('utf8'),
            filename: file.originalname,
            mimetype: file.mimetype
        }, token);

        res.json({
            success: result.success,
            message: result.success ? '서버 데이터가 성공적으로 전송되었습니다.' : '서버 데이터 전송에 실패했습니다.',
            error: result.error || null
        });

    } catch (error) {
        console.error('서버 데이터 업로드 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 데이터 업로드 중 오류가 발생했습니다.',
            failedItems: []
        });
    }
});

// DB 데이터 전송 API
app.post('/api/upload/database', upload.single('file'), async (req, res) => {
    try {
        const { ip, https, token } = req.body;
        const file = req.file;

        // 입력 검증
        if (!file) {
            return res.status(400).json({
                success: false,
                message: '파일이 필요합니다.'
            });
        }

        if (!ip || !token) {
            return res.status(400).json({
                success: false,
                message: 'IP 주소와 API Token이 필요합니다.'
            });
        }

        // 실제 API 호출
        const result = await callExternalAPI(`http${https === 'true' ? 's' : ''}://${ip}/api/database`, {
            file: file.buffer.toString('utf8'),
            filename: file.originalname,
            mimetype: file.mimetype
        }, token);

        res.json({
            success: result.success,
            message: result.success ? 'DB 데이터가 성공적으로 전송되었습니다.' : 'DB 데이터 전송에 실패했습니다.',
            error: result.error || null
        });

    } catch (error) {
        console.error('DB 데이터 업로드 오류:', error);
        res.status(500).json({
            success: false,
            message: 'DB 데이터 업로드 중 오류가 발생했습니다.',
            failedItems: []
        });
    }
});

// 사용자 데이터 전송 API
app.post('/api/upload/user', upload.single('file'), async (req, res) => {
    try {
        const { ip, https, token } = req.body;
        const file = req.file;

        // 입력 검증
        if (!file) {
            return res.status(400).json({
                success: false,
                message: '파일이 필요합니다.'
            });
        }

        if (!ip || !token) {
            return res.status(400).json({
                success: false,
                message: 'IP 주소와 API Token이 필요합니다.'
            });
        }

        // 실제 API 호출
        const result = await callExternalAPI(`http${https === 'true' ? 's' : ''}://${ip}/api/user`, {
            file: file.buffer.toString('utf8'),
            filename: file.originalname,
            mimetype: file.mimetype
        }, token);

        res.json({
            success: result.success,
            message: result.success ? '사용자 데이터가 성공적으로 전송되었습니다.' : '사용자 데이터 전송에 실패했습니다.',
            error: result.error || null
        });

    } catch (error) {
        console.error('사용자 데이터 업로드 오류:', error);
        res.status(500).json({
            success: false,
            message: '사용자 데이터 업로드 중 오류가 발생했습니다.',
            failedItems: []
        });
    }
});

// 사용자 등록 API
app.post('/api/users', async (req, res) => {
    try {
        const { email, loginId, name, password } = req.body;

        // 입력 검증
        if (!email || !loginId || !name || !password) {
            return res.status(400).json({
                success: false,
                message: '모든 필드(email, loginId, name, password)가 필요합니다.'
            });
        }

        // 실제 사용자 등록 API 호출
        const result = await callExternalAPI(`http://${req.headers.host}/api/external/v2/users`, {
            email: email,
            loginId: loginId,
            name: name,
            password: password
        }, req.headers.authorization);

        res.json({
            success: result.success,
            message: result.success ? '사용자가 성공적으로 등록되었습니다.' : '사용자 등록에 실패했습니다.',
            data: result.data || null,
            error: result.error || null
        });

    } catch (error) {
        console.error('사용자 등록 오류:', error);
        res.status(500).json({
            success: false,
            message: '사용자 등록 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// CSV 파일로 사용자 일괄 등록 API
app.post('/api/users/bulk', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        const { targetUrl, token } = req.body;

        if (!file) {
            return res.status(400).json({
                success: false,
                message: 'CSV 파일이 필요합니다.'
            });
        }

        if (!targetUrl || !token) {
            return res.status(400).json({
                success: false,
                message: '대상 URL과 API Token이 필요합니다.'
            });
        }

        // CSV 파일 파싱
        const csvData = file.buffer.toString('utf8');
        const users = parseCSV(csvData);

        if (users.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'CSV 파일에 유효한 사용자 데이터가 없습니다.'
            });
        }

        // 각 사용자에 대해 API 호출
        const results = [];
        for (const user of users) {
            const result = await callExternalAPI(`${targetUrl}/api/external/v2/users`, user, token);
            results.push({
                user: user,
                success: result.success,
                error: result.error
            });
        }

        const successCount = results.filter(r => r.success).length;
        const failCount = results.length - successCount;

        res.json({
            success: true,
            message: `${successCount}명 성공, ${failCount}명 실패`,
            results: results
        });

    } catch (error) {
        console.error('사용자 일괄 등록 오류:', error);
        res.status(500).json({
            success: false,
            message: '사용자 일괄 등록 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// CSV 파싱 함수
function parseCSV(csvData) {
    const lines = csvData.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const users = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length >= 4) {
            const user = {};
            headers.forEach((header, index) => {
                if (values[index]) {
                    switch (header) {
                        case 'email':
                            user.email = values[index];
                            break;
                        case 'loginid':
                        case 'login_id':
                            user.loginId = values[index];
                            break;
                        case 'name':
                            user.name = values[index];
                            break;
                        case 'password':
                            user.password = values[index];
                            break;
                    }
                }
            });
            
            if (user.email && user.loginId && user.name && user.password) {
                users.push(user);
            }
        }
    }

    return users;
}

// 시뮬레이션 함수들 제거 - 실제 API 호출만 사용

// 실제 외부 API 호출 함수 (예시)
async function callExternalAPI(targetUrl, data, token) {
    try {
        const response = await axios.post(targetUrl, data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000 // 30초 타임아웃
        });
        
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('외부 API 호출 오류:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// 에러 핸들링 미들웨어
app.use((error, req, res, next) => {
    console.error('서버 오류:', error);
    
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: '파일 크기가 너무 큽니다. 10MB 이하의 파일을 업로드해주세요.'
            });
        }
    }
    
    res.status(500).json({
        success: false,
        message: '서버 내부 오류가 발생했습니다.'
    });
});

// 404 핸들러
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: '요청한 리소스를 찾을 수 없습니다.'
    });
});

// SSL 인증서 로드
const options = {
    key: fs.readFileSync(path.join(__dirname, 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'cert.pem'))
};

// HTTPS 서버 시작
https.createServer(options, app).listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 HUB 시스템 서버가 포트 ${PORT}에서 HTTPS로 실행 중입니다.`);
    console.log(`📱 프론트엔드: https://172.22.0.139:${PORT}`);
    console.log(`🔧 API 엔드포인트: https://172.22.0.139:${PORT}/api`);
    console.log(`📊 대시보드: https://172.22.0.139:${PORT}/api/dashboard`);
    console.log(`⚠️  자체 서명 인증서를 사용합니다. 브라우저에서 보안 경고를 무시하고 진행하세요.`);
});

module.exports = app;
