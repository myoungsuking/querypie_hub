module.exports = {
  apps: [{
    name: 'qp-hub',
    script: './server.js',
    cwd: '/home/qp_hub',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // 로그 설정
    log_file: './logs/qp-hub.log',
    out_file: './logs/qp-hub-out.log',
    error_file: './logs/qp-hub-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // 자동 재시작 설정
    min_uptime: '10s',
    max_restarts: 10,
    
    // 클러스터 모드 (필요한 경우)
    exec_mode: 'fork',
    
    // 환경 변수
    env_file: '.env',
    
    // 고급 설정
    kill_timeout: 5000,
    listen_timeout: 3000,
    
    // 헬스체크
    health_check_grace_period: 3000,
    
    // 메모리 사용량 모니터링
    max_memory_restart: '500M',
    
    // CPU 사용량 제한
    max_cpu_restart: 80
  }]
};
