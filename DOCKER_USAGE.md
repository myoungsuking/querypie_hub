# Docker 이미지 사용 가이드

QP Hub는 단일 Docker 이미지로 백엔드와 프론트엔드를 모두 포함합니다.

## 빠른 시작

### 1. Docker 이미지 빌드

```bash
docker build -t qp-hub:latest .
```

### 2. Docker 이미지 실행

#### 기본 실행 (환경 변수로 설정)
```bash
docker run -d \
  --name qp-hub \
  -p 3000:3000 \
  -e HOST=192.168.10.123 \
  -e PORT=3000 \
  -e USE_HTTPS=true \
  -e NODE_ENV=production \
  qp-hub:latest
```

#### compose-env 파일 사용
```bash
# compose-env 파일 생성
cp compose-env.example compose-env
# compose-env 파일 수정 (HOST, PORT 등)

# Docker Compose로 실행
docker-compose up -d
```

#### 볼륨 마운트 (로그, 데이터 영구 저장)
```bash
docker run -d \
  --name qp-hub \
  -p 3000:3000 \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/data:/app/data \
  -e HOST=192.168.10.123 \
  -e PORT=3000 \
  -e USE_HTTPS=true \
  qp-hub:latest
```

## 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `HOST` | `0.0.0.0` | 서버 바인딩 IP (0.0.0.0은 모든 인터페이스) |
| `PORT` | `3000` | 서버 포트 |
| `USE_HTTPS` | `true` | HTTPS 사용 여부 |
| `NODE_ENV` | `production` | Node.js 환경 |

## Docker 이미지 특징

✅ **의존성 없음**: Node.js, npm 등 모든 의존성이 이미지에 포함됨  
✅ **단일 이미지**: 백엔드와 프론트엔드 모두 포함  
✅ **자동 SSL**: SSL 인증서가 없으면 자동 생성  
✅ **즉시 실행**: 빌드 후 바로 실행 가능  

## 이미지 빌드 및 배포

### 로컬에서 빌드
```bash
docker build -t qp-hub:latest .
```

### Docker Hub에 푸시
```bash
# 로그인
docker login

# 태그 지정
docker tag qp-hub:latest your-username/qp-hub:latest

# 푸시
docker push your-username/qp-hub:latest
```

### 다른 서버에서 사용
```bash
# Docker Hub에서 가져오기
docker pull your-username/qp-hub:latest

# 실행
docker run -d \
  --name qp-hub \
  -p 3000:3000 \
  -e HOST=YOUR_IP \
  your-username/qp-hub:latest
```

## Docker Compose 사용

### 설정 파일 생성
```bash
cp compose-env.example compose-env
# compose-env 파일에서 HOST, PORT 등 수정
```

### 실행
```bash
docker-compose up -d
```

### 중지
```bash
docker-compose down
```

### 로그 확인
```bash
docker-compose logs -f
```

## 문제 해결

### 포트가 이미 사용 중
```bash
# 다른 포트 사용
docker run -d --name qp-hub -p 8080:3000 -e PORT=3000 qp-hub:latest
```

### SSL 인증서 오류
```bash
# HTTP 모드로 실행
docker run -d --name qp-hub -p 3000:3000 -e USE_HTTPS=false qp-hub:latest
```

### 로그 확인
```bash
docker logs qp-hub
docker logs -f qp-hub  # 실시간 로그
```

### 컨테이너 내부 접속
```bash
docker exec -it qp-hub sh
```

