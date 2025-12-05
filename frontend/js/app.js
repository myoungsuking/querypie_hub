// 대시보드 앱 초기화
class DashboardApp {
    constructor() {
        this.allUsers = []; // 사용자 데이터
        this.currentPageNumber = 1; // 현재 페이지
        this.usersPerPage = 20; // 페이지당 사용자 수 (더 적은 수로 설정하여 성능 향상)
        this.init();
    }

    init() {
        this.setupSidebarNavigation();
        this.loadDashboardData();
        this.initializeUserManager();
    }

    setupSidebarNavigation() {
        const navLinks = document.querySelectorAll('.sidebar-menu a');
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                // 현재 활성 메뉴 아이템 업데이트
                document.querySelectorAll('.menu-item').forEach(item => {
                    item.classList.remove('active');
                });
                this.parentElement.classList.add('active');
                
                // 페이지 이동은 브라우저의 기본 동작에 맡김 (a 태그 href 사용)
            });
        });
    }

    loadDashboardData() {
        fetch('/api/dashboard')
            .then(response => response.json())
            .then(data => {
                console.log('대시보드 데이터:', data);
            })
            .catch(error => {
                console.error('대시보드 데이터 로드 오류:', error);
            });
    }

    initializeUserManager() {
        // user.html 페이지에서만 userManager 초기화
        if (document.getElementById('user-page')) {
            window.app = this; // window.app 설정
            window.userManager = new UserManager(this);
            setupUserManagement();
        }
    }
}

// 전역 앱 인스턴스
let app;

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', function() {
    app = new DashboardApp();
    window.app = app; // 전역에서 접근 가능하도록 설정
});