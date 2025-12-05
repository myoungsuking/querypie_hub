# Docker 빠른 시작 가이드

## 실행 경로

### 방법 1: docker run (어디서든 실행 가능)

이미지가 빌드되어 있으면 **어느 경로에서든** 실행 가능합니다:

```bash
# 어느 경로에서든 실행 가능
docker run -d \
  --name qp-hub \
  -p 3000:3000 \
  -e HOST=192.168.10.123 \
  -e PORT=3000 \
  -e USE_HTTPS=true \
  myoungsu-hub:latest
```

### 방법 2: docker-compose (프로젝트 루트에서 실행)

**프로젝트 루트 디렉토리** (`/home/qp_hub`)에서 실행해야 합니다:

```bash
# 1. 프로젝트 루트로 이동
cd /home/qp_hub

# 2. compose-env 파일 생성 (첫 실행 시)
cp compose-env.example compose-env
# compose-env 파일에서 HOST를 자신의 IP로 수정

# 3. 실행
docker-compose up -d
```

## 현재 프로젝트 위치

```
/home/qp_hub/          ← 여기서 docker-compose 실행
├── docker-compose.yml
├── compose-env.example
├── Dockerfile
└── ...
```

## 다른 서버에서 사용하기

### 이미지가 이미 있는 경우
```bash
# 어느 경로에서든 실행 가능
docker run -d --name qp-hub -p 3000:3000 \
  -e HOST=YOUR_IP \
  myoungsu-hub:latest
```

### 처음부터 시작하는 경우
```bash
# 1. 프로젝트 클론
git clone https://github.com/myoungsuking/querypie_hub.git
cd querypie_hub

# 2. 이미지 빌드
docker build -t myoungsu-hub:latest .

# 3. 실행 (어느 경로에서든)
docker run -d --name qp-hub -p 3000:3000 \
  -e HOST=YOUR_IP \
  myoungsu-hub:latest
```

## 요약

- **docker run**: 어디서든 실행 가능 (이미지만 있으면 됨)
- **docker-compose**: 프로젝트 루트(`/home/qp_hub`)에서 실행 필요

