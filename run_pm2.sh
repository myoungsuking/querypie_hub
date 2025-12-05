#!/bin/bash

# QP Hub PM2 백그라운드 실행 스크립트
# 사용법: ./run_pm2.sh [start|stop|restart|status|logs|monitor]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PM2_CONFIG="$SCRIPT_DIR/ecosystem.config.js"
APP_NAME="qp-hub"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# PM2 설치 확인
check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        error "PM2가 설치되어 있지 않습니다."
        echo "PM2를 설치하려면 다음 명령어를 실행하세요:"
        echo "npm install -g pm2"
        return 1
    fi
    return 0
}

# 로그 디렉토리 생성
create_log_dir() {
    if [ ! -d "$SCRIPT_DIR/logs" ]; then
        mkdir -p "$SCRIPT_DIR/logs"
        log "로그 디렉토리를 생성했습니다: $SCRIPT_DIR/logs"
    fi
}

# PM2로 서비스 시작
start_service() {
    if ! check_pm2; then
        return 1
    fi
    
    create_log_dir
    
    # 이미 실행 중인지 확인
    if pm2 list | grep -q "$APP_NAME"; then
        warning "QP Hub가 이미 PM2에서 실행 중입니다."
        pm2 show "$APP_NAME"
        return 1
    fi
    
    log "QP Hub를 PM2로 시작합니다..."
    
    # PM2로 앱 시작
    pm2 start "$PM2_CONFIG"
    
    if [ $? -eq 0 ]; then
        success "QP Hub가 PM2로 성공적으로 시작되었습니다."
        log "PM2 상태를 확인하려면: pm2 status"
        log "로그를 보려면: pm2 logs $APP_NAME"
    else
        error "QP Hub 시작에 실패했습니다."
        return 1
    fi
}

# PM2로 서비스 중지
stop_service() {
    if ! check_pm2; then
        return 1
    fi
    
    if ! pm2 list | grep -q "$APP_NAME"; then
        warning "QP Hub가 PM2에서 실행 중이지 않습니다."
        return 1
    fi
    
    log "QP Hub를 PM2에서 중지합니다..."
    
    pm2 stop "$APP_NAME"
    
    if [ $? -eq 0 ]; then
        success "QP Hub가 PM2에서 중지되었습니다."
    else
        error "QP Hub 중지에 실패했습니다."
        return 1
    fi
}

# PM2로 서비스 재시작
restart_service() {
    if ! check_pm2; then
        return 1
    fi
    
    log "QP Hub를 PM2에서 재시작합니다..."
    
    pm2 restart "$APP_NAME"
    
    if [ $? -eq 0 ]; then
        success "QP Hub가 PM2에서 재시작되었습니다."
    else
        error "QP Hub 재시작에 실패했습니다."
        return 1
    fi
}

# PM2로 서비스 삭제
delete_service() {
    if ! check_pm2; then
        return 1
    fi
    
    if ! pm2 list | grep -q "$APP_NAME"; then
        warning "QP Hub가 PM2에서 실행 중이지 않습니다."
        return 1
    fi
    
    log "QP Hub를 PM2에서 삭제합니다..."
    
    pm2 delete "$APP_NAME"
    
    if [ $? -eq 0 ]; then
        success "QP Hub가 PM2에서 삭제되었습니다."
    else
        error "QP Hub 삭제에 실패했습니다."
        return 1
    fi
}

# PM2 상태 확인
status_service() {
    if ! check_pm2; then
        return 1
    fi
    
    echo -e "${BLUE}=== PM2 상태 ===${NC}"
    pm2 status
    
    if pm2 list | grep -q "$APP_NAME"; then
        echo -e "\n${BLUE}=== QP Hub 상세 정보 ===${NC}"
        pm2 show "$APP_NAME"
    else
        warning "QP Hub가 PM2에서 실행 중이지 않습니다."
    fi
}

# PM2 로그 보기
view_logs() {
    if ! check_pm2; then
        return 1
    fi
    
    if ! pm2 list | grep -q "$APP_NAME"; then
        warning "QP Hub가 PM2에서 실행 중이지 않습니다."
        return 1
    fi
    
    echo -e "${BLUE}=== QP Hub 로그 (마지막 100줄) ===${NC}"
    pm2 logs "$APP_NAME" --lines 100
}

# PM2 실시간 로그 보기
follow_logs() {
    if ! check_pm2; then
        return 1
    fi
    
    if ! pm2 list | grep -q "$APP_NAME"; then
        warning "QP Hub가 PM2에서 실행 중이지 않습니다."
        return 1
    fi
    
    echo -e "${BLUE}=== QP Hub 실시간 로그 (Ctrl+C로 종료) ===${NC}"
    pm2 logs "$APP_NAME" --follow
}

# PM2 모니터링
monitor_service() {
    if ! check_pm2; then
        return 1
    fi
    
    echo -e "${BLUE}=== PM2 모니터링 (Ctrl+C로 종료) ===${NC}"
    pm2 monit
}

# PM2 자동 시작 설정
setup_autostart() {
    if ! check_pm2; then
        return 1
    fi
    
    log "PM2 자동 시작을 설정합니다..."
    
    pm2 startup
    pm2 save
    
    success "PM2 자동 시작이 설정되었습니다."
    log "시스템 재부팅 시 QP Hub가 자동으로 시작됩니다."
}

# PM2 자동 시작 해제
disable_autostart() {
    if ! check_pm2; then
        return 1
    fi
    
    log "PM2 자동 시작을 해제합니다..."
    
    pm2 unstartup
    pm2 save
    
    success "PM2 자동 시작이 해제되었습니다."
}

# 도움말
show_help() {
    echo -e "${BLUE}QP Hub PM2 백그라운드 실행 스크립트${NC}"
    echo ""
    echo "사용법: $0 [명령어]"
    echo ""
    echo "명령어:"
    echo "  start       - QP Hub를 PM2로 시작"
    echo "  stop        - QP Hub를 PM2에서 중지"
    echo "  restart     - QP Hub를 PM2에서 재시작"
    echo "  delete      - QP Hub를 PM2에서 삭제"
    echo "  status      - PM2 상태 확인"
    echo "  logs        - 로그 보기 (마지막 100줄)"
    echo "  follow      - 실시간 로그 보기"
    echo "  monitor     - PM2 모니터링"
    echo "  autostart   - 자동 시작 설정"
    echo "  no-autostart- 자동 시작 해제"
    echo "  help        - 이 도움말 표시"
    echo ""
    echo "PM2 명령어:"
    echo "  pm2 status                    - 모든 앱 상태 확인"
    echo "  pm2 logs $APP_NAME            - 앱 로그 보기"
    echo "  pm2 restart $APP_NAME        - 앱 재시작"
    echo "  pm2 stop $APP_NAME            - 앱 중지"
    echo "  pm2 delete $APP_NAME          - 앱 삭제"
    echo "  pm2 monit                     - 모니터링"
    echo ""
    echo "설정 파일: $PM2_CONFIG"
}

# 메인 로직
case "${1:-help}" in
    start)
        start_service
        ;;
    stop)
        stop_service
        ;;
    restart)
        restart_service
        ;;
    delete)
        delete_service
        ;;
    status)
        status_service
        ;;
    logs)
        view_logs
        ;;
    follow)
        follow_logs
        ;;
    monitor)
        monitor_service
        ;;
    autostart)
        setup_autostart
        ;;
    no-autostart)
        disable_autostart
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        error "알 수 없는 명령어: $1"
        show_help
        exit 1
        ;;
esac
