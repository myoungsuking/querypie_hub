# GitHub Actions 워크플로우

이 디렉토리에는 자동 배포를 위한 GitHub Actions 워크플로우가 포함되어 있습니다.

## 워크플로우 파일

### 1. `deploy.yml` - SSH 직접 배포
- `main` 브랜치에 푸시 시 자동 실행
- 서버에 SSH로 접속하여 코드 배포
- PM2 또는 systemd로 서비스 재시작
- Docker Hub에 이미지 푸시 (선택)

### 2. `docker-deploy.yml` - Docker 이미지 배포
- Docker 이미지를 빌드하여 서버에 배포
- Docker 컨테이너로 실행

## 필요한 GitHub Secrets

배포를 위해 다음 Secrets를 GitHub 저장소 설정에 추가해야 합니다:

### 필수 (SSH 배포)
- `DEPLOY_HOST`: 배포할 서버 IP 주소 (예: `172.22.0.139`)
- `DEPLOY_USER`: SSH 사용자명 (예: `root`)
- `DEPLOY_SSH_KEY`: SSH 개인 키 (전체 내용)
- `DEPLOY_PORT`: SSH 포트 (기본값: `22`, 선택)

### 선택 (Docker Hub)
- `DOCKER_USERNAME`: Docker Hub 사용자명
- `DOCKER_PASSWORD`: Docker Hub 비밀번호 또는 Access Token

## SSH 키 생성 방법

```bash
# 서버에서 SSH 키 생성
ssh-keygen -t rsa -b 4096 -C "github-actions"

# 공개 키를 authorized_keys에 추가
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys

# 개인 키를 GitHub Secrets에 추가 (DEPLOY_SSH_KEY)
cat ~/.ssh/id_rsa
```

## 사용 방법

1. GitHub 저장소의 Settings → Secrets and variables → Actions에서 Secrets 추가
2. `main` 브랜치에 코드를 푸시하면 자동으로 배포됩니다
3. 또는 GitHub Actions 탭에서 수동으로 워크플로우를 실행할 수 있습니다

