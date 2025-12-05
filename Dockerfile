# QP Hub 통합 Docker 이미지 (백엔드 + 프론트엔드)
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# 시스템 패키지 설치 (OpenSSL, curl 등)
RUN apk add --no-cache \
    openssl \
    curl \
    && rm -rf /var/cache/apk/*

# 패키지 파일 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production && npm cache clean --force

# 애플리케이션 코드 복사 (백엔드 + 프론트엔드)
COPY . .

# SSL 인증서 생성 스크립트
RUN chmod +x /app/scripts/generate-ssl.sh || true

# 포트 노출
EXPOSE 3000

# 사용자 생성 (보안)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S qphub -u 1001

# 로그 및 데이터 디렉토리 생성
RUN mkdir -p /app/logs /app/data && \
    chown -R qphub:nodejs /app

# 파일 소유권 변경
USER qphub

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:${PORT:-3000}/api/dashboard', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

# 진입점 스크립트
COPY --chown=qphub:nodejs docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

# 애플리케이션 실행
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]
