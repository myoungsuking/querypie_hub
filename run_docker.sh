#!/bin/bash

# QP Hub Docker 백그라운드 실행 스크립트
# 사용법: ./run_docker.sh [build|start|stop|restart|status|logs|clean]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
CONTAINER_NAME="qp-hub"
IMAGE_NAME="qp-hub"

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

# Docker 설치 확인
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker가 설치되어 있지 않습니다."
        echo "Docker를 설치하려면 다음 명령어를 실행하세요:"
        echo "curl -fsSL https://get.docker.com -o get-docker.sh"
        echo "sh get-docker.sh"
        return 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose가 설치되어 있지 않습니다."
        echo "Docker Compose를 설치하려면 다음 명령어를 실행하세요:"
        echo "sudo curl -L \"https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
        echo "sudo chmod +x /usr/local/bin/docker-compose"
        return 1
    fi
    
    return 0
}

# Docker 이미지 빌드
build_image() {
    if ! check_docker; then
        return 1
    fi
    
    log "QP Hub Docker 이미지를 빌드합니다..."
    
    cd "$SCRIPT_DIR"
    docker-compose build --no-cache
    
    if [ $? -eq 0 ]; then
        success "QP Hub Docker 이미지가 성공적으로 빌드되었습니다."
    else
        error "Docker 이미지 빌드에 실패했습니다."
        return 1
    fi
}

# Docker 컨테이너 시작
start_container() {
    if ! check_docker; then
        return 1
    fi
    
    # 이미 실행 중인지 확인
    if docker ps | grep -q "$CONTAINER_NAME"; then
        warning "QP Hub 컨테이너가 이미 실행 중입니다."
        return 1
    fi
    
    log "QP Hub Docker 컨테이너를 시작합니다..."
    
    cd "$SCRIPT_DIR"
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        success "QP Hub Docker 컨테이너가 성공적으로 시작되었습니다."
        log "컨테이너 상태를 확인하려면: docker ps"
        log "로그를 보려면: docker logs $CONTAINER_NAME"
    else
        error "Docker 컨테이너 시작에 실패했습니다."
        return 1
    fi
}

# Docker 컨테이너 중지
stop_container() {
    if ! check_docker; then
        return 1
    fi
    
    if ! docker ps | grep -q "$CONTAINER_NAME"; then
        warning "QP Hub 컨테이너가 실행 중이지 않습니다."
        return 1
    fi
    
    log "QP Hub Docker 컨테이너를 중지합니다..."
    
    cd "$SCRIPT_DIR"
    docker-compose down
    
    if [ $? -eq 0 ]; then
        success "QP Hub Docker 컨테이너가 중지되었습니다."
    else
        error "Docker 컨테이너 중지에 실패했습니다."
        return 1
    fi
}

# Docker 컨테이너 재시작
restart_container() {
    if ! check_docker; then
        return 1
    fi
    
    log "QP Hub Docker 컨테이너를 재시작합니다..."
    
    cd "$SCRIPT_DIR"
    docker-compose restart
    
    if [ $? -eq 0 ]; then
        success "QP Hub Docker 컨테이너가 재시작되었습니다."
    else
        error "Docker 컨테이너 재시작에 실패했습니다."
        return 1
    fi
}

# Docker 컨테이너 상태 확인
status_container() {
    if ! check_docker; then
        return 1
    fi
    
    echo -e "${BLUE}=== Docker 컨테이너 상태 ===${NC}"
    docker ps -a | grep "$CONTAINER_NAME"
    
    if docker ps | grep -q "$CONTAINER_NAME"; then
        echo -e "\n${BLUE}=== 컨테이너 상세 정보 ===${NC}"
        docker inspect "$CONTAINER_NAME" | grep -E '"Status"|"Health"|"Ports"'
        
        echo -e "\n${BLUE}=== 리소스 사용량 ===${NC}"
        docker stats --no-stream "$CONTAINER_NAME"
    else
        warning "QP Hub 컨테이너가 실행 중이지 않습니다."
    fi
}

# Docker 로그 보기
view_logs() {
    if ! check_docker; then
        return 1
    fi
    
    if ! docker ps | grep -q "$CONTAINER_NAME"; then
        warning "QP Hub 컨테이너가 실행 중이지 않습니다."
        return 1
    fi
    
    echo -e "${BLUE}=== QP Hub Docker 로그 (마지막 100줄) ===${NC}"
    docker logs --tail 100 "$CONTAINER_NAME"
}

# Docker 실시간 로그 보기
follow_logs() {
    if ! check_docker; then
        return 1
    fi
    
    if ! docker ps | grep -q "$CONTAINER_NAME"; then
        warning "QP Hub 컨테이너가 실행 중이지 않습니다."
        return 1
    fi
    
    echo -e "${BLUE}=== QP Hub Docker 실시간 로그 (Ctrl+C로 종료) ===${NC}"
    docker logs -f "$CONTAINER_NAME"
}

# Docker 컨테이너 내부 접속
exec_container() {
    if ! check_docker; then
        return 1
    fi
    
    if ! docker ps | grep -q "$CONTAINER_NAME"; then
        warning "QP Hub 컨테이너가 실행 중이지 않습니다."
        return 1
    fi
    
    log "QP Hub 컨테이너 내부로 접속합니다..."
    docker exec -it "$CONTAINER_NAME" /bin/sh
}

# Docker 이미지 및 컨테이너 정리
clean_docker() {
    if ! check_docker; then
        return 1
    fi
    
    log "Docker 리소스를 정리합니다..."
    
    # 컨테이너 중지 및 제거
    if docker ps | grep -q "$CONTAINER_NAME"; then
        docker-compose down
    fi
    
    # 이미지 제거
    if docker images | grep -q "$IMAGE_NAME"; then
        docker rmi "$IMAGE_NAME"
    fi
    
    # 사용하지 않는 리소스 정리
    docker system prune -f
    
    success "Docker 리소스가 정리되었습니다."
}

# Docker 이미지 업데이트
update_image() {
    if ! check_docker; then
        return 1
    fi
    
    log "QP Hub Docker 이미지를 업데이트합니다..."
    
    # 기존 컨테이너 중지
    if docker ps | grep -q "$CONTAINER_NAME"; then
        docker-compose down
    fi
    
    # 새 이미지 빌드
    build_image
    
    # 컨테이너 시작
    start_container
}

# 도움말
show_help() {
    echo -e "${BLUE}QP Hub Docker 백그라운드 실행 스크립트${NC}"
    echo ""
    echo "사용법: $0 [명령어]"
    echo ""
    echo "명령어:"
    echo "  build       - Docker 이미지 빌드"
    echo "  start       - Docker 컨테이너 시작"
    echo "  stop        - Docker 컨테이너 중지"
    echo "  restart     - Docker 컨테이너 재시작"
    echo "  status      - Docker 컨테이너 상태 확인"
    echo "  logs        - 로그 보기 (마지막 100줄)"
    echo "  follow      - 실시간 로그 보기"
    echo "  exec        - 컨테이너 내부 접속"
    echo "  clean       - Docker 리소스 정리"
    echo "  update      - 이미지 업데이트 및 재시작"
    echo "  help        - 이 도움말 표시"
    echo ""
    echo "Docker 명령어:"
    echo "  docker ps                    - 실행 중인 컨테이너 확인"
    echo "  docker logs $CONTAINER_NAME  - 컨테이너 로그 보기"
    echo "  docker exec -it $CONTAINER_NAME /bin/sh - 컨테이너 내부 접속"
    echo "  docker-compose up -d         - 백그라운드로 컨테이너 시작"
    echo "  docker-compose down          - 컨테이너 중지"
    echo ""
    echo "설정 파일: $COMPOSE_FILE"
}

# 메인 로직
case "${1:-help}" in
    build)
        build_image
        ;;
    start)
        start_container
        ;;
    stop)
        stop_container
        ;;
    restart)
        restart_container
        ;;
    status)
        status_container
        ;;
    logs)
        view_logs
        ;;
    follow)
        follow_logs
        ;;
    exec)
        exec_container
        ;;
    clean)
        clean_docker
        ;;
    update)
        update_image
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
