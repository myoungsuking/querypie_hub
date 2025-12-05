#!/bin/bash

# QP Hub 백그라운드 실행 스크립트
# 사용법: ./run_background.sh [start|stop|restart|status]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/qp_hub.pid"
LOG_FILE="$SCRIPT_DIR/qp_hub.log"
NODE_SCRIPT="$SCRIPT_DIR/server.js"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# 프로세스 시작
start_service() {
    # 기존 프로세스 확인 (PID 파일 또는 포트)
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        warning "QP Hub가 이미 실행 중입니다. (PID: $(cat $PID_FILE))"
        return 1
    fi
    
    # 포트로 실행 중인 프로세스 확인
    local PORT_PID=$(lsof -ti :3000 2>/dev/null)
    if [ -n "$PORT_PID" ]; then
        if ps -p "$PORT_PID" -o cmd= | grep -q "server.js"; then
            warning "포트 3000을 사용하는 QP Hub가 이미 실행 중입니다. (PID: $PORT_PID)"
            warning "재시작하려면 먼저 'stop' 명령을 실행하세요."
            return 1
        fi
    fi
    
    log "QP Hub 서버를 시작합니다..."
    
    # Node.js가 설치되어 있는지 확인
    if ! command -v node &> /dev/null; then
        error "Node.js가 설치되어 있지 않습니다."
        return 1
    fi
    
    # package.json이 있는지 확인
    if [ ! -f "$SCRIPT_DIR/package.json" ]; then
        error "package.json 파일을 찾을 수 없습니다."
        return 1
    fi
    
    # 의존성 설치 (필요한 경우)
    if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
        log "의존성을 설치합니다..."
        cd "$SCRIPT_DIR"
        npm install
    fi
    
    # 백그라운드에서 서버 실행
    cd "$SCRIPT_DIR"
    nohup node server.js > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    
    # 잠시 대기 후 프로세스 확인
    sleep 2
    if kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        success "QP Hub가 성공적으로 시작되었습니다. (PID: $(cat $PID_FILE))"
        log "로그 파일: $LOG_FILE"
        log "서버 URL: https://172.22.0.139:3000"
    else
        error "QP Hub 시작에 실패했습니다. 로그를 확인하세요: $LOG_FILE"
        rm -f "$PID_FILE"
        return 1
    fi
}

# 프로세스 중지
stop_service() {
    local PID=""
    
    # PID 파일이 있으면 사용
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            log "QP Hub를 중지합니다... (PID: $PID)"
            kill -TERM "$PID" 2>/dev/null
            sleep 2
            if ! kill -0 "$PID" 2>/dev/null; then
                success "QP Hub가 정상적으로 중지되었습니다."
                rm -f "$PID_FILE"
                return 0
            fi
            kill -KILL "$PID" 2>/dev/null
            rm -f "$PID_FILE"
            success "QP Hub가 강제 종료되었습니다."
            return 0
        fi
        rm -f "$PID_FILE"
    fi
    
    # PID 파일이 없거나 프로세스가 없으면 포트로 찾기
    local PORT_PID=$(lsof -ti :3000 2>/dev/null)
    if [ -n "$PORT_PID" ]; then
        log "포트 3000을 사용하는 프로세스를 찾았습니다. (PID: $PORT_PID)"
        # server.js를 실행하는 프로세스인지 확인
        if ps -p "$PORT_PID" -o cmd= | grep -q "server.js"; then
            log "QP Hub를 중지합니다... (PID: $PORT_PID)"
            kill -TERM "$PORT_PID" 2>/dev/null
            sleep 2
            if ! kill -0 "$PORT_PID" 2>/dev/null; then
                success "QP Hub가 정상적으로 중지되었습니다."
                return 0
            fi
            kill -KILL "$PORT_PID" 2>/dev/null
            success "QP Hub가 강제 종료되었습니다."
            return 0
        fi
    fi
    
    warning "실행 중인 QP Hub 프로세스를 찾을 수 없습니다."
    return 1
}

# 프로세스 재시작
restart_service() {
    log "QP Hub를 재시작합니다..."
    stop_service
    sleep 2
    start_service
}

# 프로세스 상태 확인
status_service() {
    if [ ! -f "$PID_FILE" ]; then
        warning "QP Hub가 실행 중이지 않습니다."
        return 1
    fi
    
    PID=$(cat "$PID_FILE")
    
    if kill -0 "$PID" 2>/dev/null; then
        success "QP Hub가 실행 중입니다. (PID: $PID)"
        
        # 프로세스 정보 출력
        echo -e "${BLUE}프로세스 정보:${NC}"
        ps -p "$PID" -o pid,ppid,cmd,etime,pcpu,pmem 2>/dev/null || echo "프로세스 정보를 가져올 수 없습니다."
        
        # 포트 사용 확인
        echo -e "${BLUE}포트 사용 현황:${NC}"
        netstat -tlnp 2>/dev/null | grep ":$PID" || lsof -i :3000 2>/dev/null || echo "포트 정보를 가져올 수 없습니다."
        
        return 0
    else
        warning "PID 파일은 있지만 프로세스 $PID가 실행 중이지 않습니다."
        rm -f "$PID_FILE"
        return 1
    fi
}

# 로그 보기
view_logs() {
    if [ -f "$LOG_FILE" ]; then
        echo -e "${BLUE}=== QP Hub 로그 (마지막 50줄) ===${NC}"
        tail -n 50 "$LOG_FILE"
    else
        warning "로그 파일이 없습니다: $LOG_FILE"
    fi
}

# 실시간 로그 보기
follow_logs() {
    if [ -f "$LOG_FILE" ]; then
        echo -e "${BLUE}=== QP Hub 실시간 로그 (Ctrl+C로 종료) ===${NC}"
        tail -f "$LOG_FILE"
    else
        warning "로그 파일이 없습니다: $LOG_FILE"
    fi
}

# 도움말
show_help() {
    echo -e "${BLUE}QP Hub 백그라운드 실행 스크립트${NC}"
    echo ""
    echo "사용법: $0 [명령어]"
    echo ""
    echo "명령어:"
    echo "  start     - QP Hub 서버 시작"
    echo "  stop      - QP Hub 서버 중지"
    echo "  restart   - QP Hub 서버 재시작"
    echo "  status    - QP Hub 서버 상태 확인"
    echo "  logs      - 로그 보기 (마지막 50줄)"
    echo "  follow    - 실시간 로그 보기"
    echo "  help      - 이 도움말 표시"
    echo ""
    echo "파일 위치:"
    echo "  PID 파일: $PID_FILE"
    echo "  로그 파일: $LOG_FILE"
    echo "  서버 스크립트: $NODE_SCRIPT"
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
    status)
        status_service
        ;;
    logs)
        view_logs
        ;;
    follow)
        follow_logs
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
