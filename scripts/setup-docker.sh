#!/bin/bash

# Docker Compose 설정 스크립트

set -e

echo "🐳 Docker Compose 설정 시작..."

# compose-env 파일이 없으면 생성
if [ ! -f compose-env ]; then
    echo "📝 compose-env 파일이 없습니다. compose-env.example에서 생성합니다..."
    cp compose-env.example compose-env
    
    # 사용자에게 IP 주소 입력 요청
    echo ""
    echo "서버 IP 주소를 입력하세요 (예: 172.22.0.139):"
    read -r SERVER_IP
    
    if [ -z "$SERVER_IP" ]; then
        SERVER_IP="172.22.0.139"
        echo "기본값 사용: $SERVER_IP"
    fi
    
    # IP 주소 업데이트
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/HOST=.*/HOST=$SERVER_IP/" compose-env
    else
        # Linux
        sed -i "s/HOST=.*/HOST=$SERVER_IP/" compose-env
    fi
    
    echo "✅ compose-env 파일이 생성되었습니다."
    echo "📝 필요시 compose-env 파일을 직접 수정하여 설정을 변경할 수 있습니다."
else
    echo "ℹ️  compose-env 파일이 이미 존재합니다."
fi

# SSL 인증서 확인
if [ ! -f key.pem ] || [ ! -f cert.pem ]; then
    echo "🔐 SSL 인증서가 없습니다. Docker Compose가 자동으로 생성합니다."
else
    echo "✅ SSL 인증서가 이미 존재합니다."
fi

echo ""
echo "🚀 Docker Compose 시작:"
echo "   docker-compose up -d"
echo ""
echo "📋 설정 확인:"
echo "   cat compose-env"
echo ""

