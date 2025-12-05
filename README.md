# 서버 관리 HUB 시스템

API로 데이터를 밀어넣는 HUB 시스템입니다. 서버, DB, 사용자 데이터를 관리할 수 있는 웹 인터페이스를 제공합니다.

## 주요 기능

### 📋 페이지 구성
- **서버 관리**: 서버 관련 데이터 업로드 및 관리
- **DB 관리**: 데이터베이스 정보 업로드 및 관리  
- **사용자 관리**: 사용자 정보 업로드 및 관리

### 🔧 각 페이지 기능
- **파일 업로드**: 드래그 앤 드롭 또는 클릭으로 파일 선택
- **대상 IP 주소**: 전송할 서버의 IP 주소 입력 (포트 포함 가능)
- **HTTPS 사용**: 보안 연결을 위한 체크박스 옵션
- **API Token**: 인증을 위한 API 토큰 입력
- **추가하기 버튼**: 데이터 전송 실행

### 📊 결과 처리
- **성공/실패 모달**: 전송 결과를 팝업으로 표시
- **실패 항목 목록**: 실패한 항목들을 상세히 표시
- **재전송 기능**: 실패한 항목들을 다시 전송할 수 있는 기능

## 파일 구조

```
qp_hub/
├── frontend/           # 프론트엔드 파일
│   ├── index.html      # 메인 HTML 파일
│   ├── css/            # CSS 스타일시트
│   └── js/             # JavaScript 파일
├── backend/            # 백엔드 파일
│   ├── server.js       # Node.js 백엔드 서버
│   └── routes/         # API 라우트
├── run.sh              # 통합 실행 스크립트 (권장)
├── run_background.sh   # 기본 Node.js 백그라운드 실행
├── run_pm2.sh         # PM2 프로세스 매니저 실행
├── run_docker.sh       # Docker 컨테이너 실행
├── package.json        # Node.js 의존성 관리
├── docker-compose.yml  # Docker Compose 설정
├── ecosystem.config.js # PM2 설정
├── qp-hub.service      # systemd 서비스 파일
└── README.md           # 프로젝트 설명서
```

## 설치 및 실행

### 1. 의존성 설치
```bash
cd qp_hub
npm install
```

### 2. 서버 시작

#### 통합 스크립트 사용 (권장)
```bash
# 기본 Node.js 백그라운드 실행
./run.sh native start

# PM2 프로세스 매니저 사용 (자동 재시작, 모니터링)
./run.sh pm2 start

# Docker 컨테이너 사용
./run.sh docker start

# systemd 서비스로 설치 (부팅 시 자동 시작)
./run.sh systemd install
sudo systemctl start qp-hub
```

#### 기타 실행 방법
```bash
# npm 스크립트 사용 (개발용)
npm start

# 개발 모드 (nodemon 사용, 자동 재시작)
npm run dev

# 기본 백그라운드 실행 (직접 호출)
./run_background.sh start

# PM2 실행 (직접 호출)
./run_pm2.sh start

# Docker 실행 (직접 호출)
./run_docker.sh start
```

#### 서비스 관리
```bash
# 상태 확인
./run.sh [method] status

# 중지
./run.sh [method] stop

# 재시작
./run.sh [method] restart

# 로그 보기
./run.sh [method] logs

# 실시간 로그 보기
./run.sh [method] follow
```

### 3. 웹 브라우저에서 접속
- **프론트엔드**: https://172.22.0.139:3000
- **API 엔드포인트**: https://172.22.0.139:3000/api
- **대시보드 API**: https://172.22.0.139:3000/api/dashboard

## 사용법

1. **웹 브라우저에서 `https://172.22.0.139:3000`으로 접속하세요.**

2. **사이드바에서 원하는 관리 페이지를 선택하세요:**
   - 서버: 서버 관련 데이터 관리
   - DB: 데이터베이스 정보 관리
   - 사용자: 사용자 정보 관리

3. **각 페이지에서 다음 정보를 입력하세요:**
   - 파일 업로드 (필수): JSON, CSV, TXT 파일 지원
   - 대상 IP 주소 (필수): 예) 192.168.1.100:8080
   - HTTPS 사용 (선택): 보안 연결 여부
   - API Token (필수): 인증 토큰

4. **"추가하기" 버튼을 클릭하여 데이터를 전송하세요.**

5. **결과 모달에서 전송 결과를 확인하세요:**
   - 성공 시: 성공 메시지 표시
   - 실패 시: 실패 항목 목록과 재전송 버튼 제공

## 기술 스택

### 프론트엔드
- **HTML5**: 시맨틱 마크업
- **CSS3**: 모던 스타일링, 그라디언트, 애니메이션
- **JavaScript (ES6+)**: 모듈화된 기능 구현
- **Font Awesome**: 아이콘 라이브러리

### 백엔드
- **Node.js**: 서버 런타임
- **Express.js**: 웹 프레임워크
- **Multer**: 파일 업로드 처리
- **Axios**: HTTP 클라이언트
- **Helmet**: 보안 미들웨어
- **Morgan**: 로깅 미들웨어
- **CORS**: Cross-Origin Resource Sharing

## 주요 특징

### 🎨 UI/UX
- 반응형 디자인 (모바일, 태블릿, 데스크톱 지원)
- 모던하고 직관적인 인터페이스
- 부드러운 애니메이션과 전환 효과
- 접근성을 고려한 디자인

### 🔒 보안
- HTTPS 연결 옵션
- API Token 기반 인증
- 입력 데이터 검증

### ⚡ 성능
- 비동기 API 호출
- 로딩 상태 표시
- 에러 처리 및 복구

### 🛠️ 개발자 친화적
- 모듈화된 코드 구조
- 상세한 주석
- 확장 가능한 아키텍처

## API 엔드포인트

### 대시보드
- `GET /api/dashboard` - 대시보드 데이터 조회

### 데이터 업로드
- `POST /api/upload/server` - 서버 데이터 업로드
- `POST /api/upload/database` - DB 데이터 업로드
- `POST /api/upload/user` - 사용자 데이터 업로드

### 재전송
- `POST /api/retry` - 실패한 항목 재전송

## 시스템 요구사항

### 서버
- Node.js 14.0.0 이상
- npm 6.0.0 이상
- 512MB RAM 이상
- 100MB 디스크 공간

### 클라이언트
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 등록해주세요.
