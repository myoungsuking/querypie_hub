# 배포 설정 가이드

## GitHub Secrets 설정

GitHub 저장소의 Settings → Secrets and variables → Actions에서 다음 Secrets를 추가하세요:

### 필수 Secrets

1. **DEPLOY_HOST**
   ```
   172.22.0.139
   ```
   (또는 실제 서버 IP 주소)

2. **DEPLOY_USER**
   ```
   root
   ```
   (또는 SSH 접속 사용자명)

3. **DEPLOY_SSH_KEY**
   ```
   [아래 SSH 개인 키 전체 내용을 복사]
   ```

4. **DEPLOY_PORT** (선택)
   ```
   22
   ```

## SSH 키 정보

SSH 키가 생성되었습니다. 개인 키는 아래와 같습니다:

**중요:** 이 키는 한 번만 표시됩니다. GitHub Secrets에 추가한 후에는 안전하게 보관하세요.

## 배포 테스트

배포가 제대로 작동하는지 테스트하려면:

1. GitHub 저장소의 Actions 탭으로 이동
2. "Deploy QP Hub" 워크플로우 선택
3. "Run workflow" 버튼 클릭
4. 배포 진행 상황 확인

## 문제 해결

### SSH 연결 실패
- 서버의 방화벽에서 포트 22가 열려있는지 확인
- SSH 서비스가 실행 중인지 확인: `systemctl status sshd`

### 배포 후 서버가 시작되지 않음
- 서버 로그 확인: `tail -f /home/qp_hub/server.log`
- PM2가 설치되어 있는지 확인: `pm2 --version`
- Node.js가 설치되어 있는지 확인: `node --version`

