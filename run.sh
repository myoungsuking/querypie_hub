#!/bin/bash

# QP Hub 통합 백그라운드 실행 스크립트
# 사용법: ./run.sh [method] [command]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# 로그 함수
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${PURPLE}[INFO]${NC} $1"
}

# 도움말 표시
show_help() {
    echo -e "${BLUE}QP Hub 통합 백그라운드 실행 스크립트${NC}"
    echo ""
    echo "사용법: $0 [실행방법] [명령어]"
    echo ""
    echo -e "${YELLOW}실행 방법:${NC}"
    echo "  native     - 기본 Node.js 백그라운드 실행"
    echo "  pm2        - PM2 프로세스 매니저 사용"
    echo "  docker     - Docker 컨테이너 사용"
    echo "  systemd    - systemd 서비스 사용"
    echo ""
    echo -e "${YELLOW}명령어:${NC}"
    echo "  start      - 서비스 시작"
    echo "  stop       - 서비스 중지"
    echo "  restart    - 서비스 재시작"
    echo "  status     - 서비스 상태 확인"
    echo "  logs       - 로그 보기"
    echo "  follow     - 실시간 로그 보기"
    echo "  install    - 서비스 설치 (systemd만)"
    echo "  uninstall  - 서비스 제거 (systemd만)"
    echo ""
    echo -e "${YELLOW}예시:${NC}"
    echo "  $0 native start      # 기본 방법으로 시작"
    echo "  $0 pm2 start         # PM2로 시작"
    echo "  $0 docker start      # Docker로 시작"
    echo "  $0 systemd install   # systemd 서비스 설치"
    echo ""
    echo -e "${YELLOW}각 방법별 특징:${NC}"
    echo "  native  - 간단하고 빠름, 재시작 시 수동 관리 필요"
    echo "  pm2     - 자동 재시작, 모니터링, 로그 관리"
    echo "  docker  - 격리된 환경, 확장성, 배포 용이"
    echo "  systemd - 시스템 서비스, 부팅 시 자동 시작"
}

# 기본 Node.js 백그라운드 실행
run_native() {
    local command="$1"
    log "기본 Node.js 방법으로 실행합니다..."
    
    case "$command" in
        start|stop|restart|status|logs|follow)
            "$SCRIPT_DIR/run_background.sh" "$command"
            ;;
        *)
            error "알 수 없는 명령어: $command"
            echo "사용 가능한 명령어: start, stop, restart, status, logs, follow"
            return 1
            ;;
    esac
}

# PM2 실행
run_pm2() {
    local command="$1"
    log "PM2 방법으로 실행합니다..."
    
    case "$command" in
        start|stop|restart|status|logs|follow|monitor|autostart|no-autostart)
            "$SCRIPT_DIR/run_pm2.sh" "$command"
            ;;
        *)
            error "알 수 없는 명령어: $command"
            echo "사용 가능한 명령어: start, stop, restart, status, logs, follow, monitor, autostart, no-autostart"
            return 1
            ;;
    esac
}

# Docker 실행
run_docker() {
    local command="$1"
    log "Docker 방법으로 실행합니다..."
    
    case "$command" in
        build|start|stop|restart|status|logs|follow|exec|clean|update)
            "$SCRIPT_DIR/run_docker.sh" "$command"
            ;;
        *)
            error "알 수 없는 명령어: $command"
            echo "사용 가능한 명령어: build, start, stop, restart, status, logs, follow, exec, clean, update"
            return 1
            ;;
    esac
}

# systemd 실행
run_systemd() {
    local command="$1"
    log "systemd 방법으로 실행합니다..."
    
    case "$command" in
        install)
            log "systemd 서비스를 설치합니다..."
            
            # 서비스 파일 복사
            sudo cp "$SCRIPT_DIR/qp-hub.service" /etc/systemd/system/
            
            # systemd 리로드
            sudo systemctl daemon-reload
            
            # 서비스 활성화
            sudo systemctl enable qp-hub
            
            success "systemd 서비스가 설치되었습니다."
            info "서비스를 시작하려면: sudo systemctl start qp-hub"
            info "서비스 상태 확인: sudo systemctl status qp-hub"
            ;;
        uninstall)
            log "systemd 서비스를 제거합니다..."
            
            # 서비스 중지 및 비활성화
            sudo systemctl stop qp-hub 2>/dev/null
            sudo systemctl disable qp-hub 2>/dev/null
            
            # 서비스 파일 제거
            sudo rm -f /etc/systemd/system/qp-hub.service
            
            # systemd 리로드
            sudo systemctl daemon-reload
            
            success "systemd 서비스가 제거되었습니다."
            ;;
        start)
            sudo systemctl start qp-hub
            ;;
        stop)
            sudo systemctl stop qp-hub
            ;;
        restart)
            sudo systemctl restart qp-hub
            ;;
        status)
            sudo systemctl status qp-hub
            ;;
        logs)
            sudo journalctl -u qp-hub -f
            ;;
        follow)
            sudo journalctl -u qp-hub -f
            ;;
        *)
            error "알 수 없는 명령어: $command"
            echo "사용 가능한 명령어: install, uninstall, start, stop, restart, status, logs, follow"
            return 1
            ;;
    esac
}

# 실행 방법별 특징 설명
show_method_info() {
    local method="$1"
    
    case "$method" in
        native)
            echo -e "${YELLOW}기본 Node.js 방법:${NC}"
            echo "  ✓ 간단하고 빠른 실행"
            echo "  ✓ 추가 도구 불필요"
            echo "  ✗ 프로세스 크래시 시 수동 재시작 필요"
            echo "  ✗ 시스템 재부팅 시 자동 시작 안됨"
            ;;
        pm2)
            echo -e "${YELLOW}PM2 방법:${NC}"
            echo "  ✓ 자동 재시작 및 모니터링"
            echo "  ✓ 로그 로테이션 및 관리"
            echo "  ✓ 클러스터 모드 지원"
            echo "  ✗ PM2 설치 필요"
            ;;
        docker)
            echo -e "${YELLOW}Docker 방법:${NC}"
            echo "  ✓ 격리된 실행 환경"
            echo "  ✓ 확장성 및 배포 용이"
            echo "  ✓ 리소스 제한 및 보안"
            echo "  ✗ Docker 설치 필요"
            echo "  ✗ 메모리 사용량 증가"
            ;;
        systemd)
            echo -e "${YELLOW}systemd 방법:${NC}"
            echo "  ✓ 시스템 서비스로 관리"
            echo "  ✓ 부팅 시 자동 시작"
            echo "  ✓ 시스템 레벨 모니터링"
            echo "  ✗ root 권한 필요"
            echo "  ✗ Linux 시스템에서만 사용 가능"
            ;;
    esac
}

# 메인 로직
main() {
    local method="${1:-help}"
    local command="${2:-help}"
    
    case "$method" in
        native)
            show_method_info "native"
            echo ""
            run_native "$command"
            ;;
        pm2)
            show_method_info "pm2"
            echo ""
            run_pm2 "$command"
            ;;
        docker)
            show_method_info "docker"
            echo ""
            run_docker "$command"
            ;;
        systemd)
            show_method_info "systemd"
            echo ""
            run_systemd "$command"
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            error "알 수 없는 실행 방법: $method"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 스크립트 실행
main "$@"
