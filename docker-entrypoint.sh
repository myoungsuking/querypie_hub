#!/bin/sh
set -e

# 환경 변수 기본값 설정
HOST=${HOST:-0.0.0.0}
PORT=${PORT:-3000}
USE_HTTPS=${USE_HTTPS:-true}
NODE_ENV=${NODE_ENV:-production}

echo "🚀 QP Hub 시작 중..."
echo "📋 환경 설정:"
echo "   - HOST: $HOST"
echo "   - PORT: $PORT"
echo "   - USE_HTTPS: $USE_HTTPS"
echo "   - NODE_ENV: $NODE_ENV"

# SSL 인증서가 없으면 생성
if [ "$USE_HTTPS" = "true" ] && [ ! -f /app/key.pem ] || [ ! -f /app/cert.pem ]; then
    echo "🔐 SSL 인증서 생성 중..."
    
    # HOST가 0.0.0.0이면 localhost 사용
    CN=${HOST}
    if [ "$CN" = "0.0.0.0" ]; then
        CN="localhost"
    fi
    
    openssl req -x509 -newkey rsa:2048 -nodes \
        -keyout /app/key.pem \
        -out /app/cert.pem \
        -days 365 \
        -subj "/CN=$CN" \
        2>/dev/null || {
        echo "⚠️  SSL 인증서 생성 실패, HTTP 모드로 실행합니다."
        export USE_HTTPS=false
    }
    
    if [ -f /app/key.pem ] && [ -f /app/cert.pem ]; then
        chmod 644 /app/key.pem /app/cert.pem
        echo "✅ SSL 인증서 생성 완료 (CN: $CN)"
    fi
fi

# 로그 디렉토리 확인
mkdir -p /app/logs /app/data

# 애플리케이션 실행
echo "🚀 서버 시작..."
exec "$@"

