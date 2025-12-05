# QP Hub Docker 이미지
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production && npm cache clean --force

# 애플리케이션 코드 복사
COPY . .

# 포트 노출
EXPOSE 3000

# 사용자 생성 (보안)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S qphub -u 1001

# 파일 소유권 변경
RUN chown -R qphub:nodejs /app
USER qphub

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# 애플리케이션 실행
CMD ["node", "server.js"]
