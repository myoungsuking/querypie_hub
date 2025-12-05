// 전역 변수
let currentPage = 'dashboard';
let allUsers = []; // 모든 사용자 데이터
let currentPageNumber = 1;
let usersPerPage = 50;

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// 앱 초기화
function initializeApp() {
    setupSidebarNavigation();
    setupFileUploads();
    setupForms();
    setupModal();
    setupUserManagement();
    loadDashboardData();
}

// 사이드바 네비게이션 설정
function setupSidebarNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    const pages = document.querySelectorAll('.page');

    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetPage = this.getAttribute('data-page');
            
            // 활성 메뉴 아이템 변경
            menuItems.forEach(menu => menu.classList.remove('active'));
            this.classList.add('active');
            
            // 활성 페이지 변경
            pages.forEach(page => page.classList.remove('active'));
            document.getElementById(targetPage + '-page').classList.add('active');
            
            currentPage = targetPage;
        });
    });
}

// 파일 업로드 설정
function setupFileUploads() {
    const fileAreas = ['server', 'database', 'user'];
    
    fileAreas.forEach(area => {
        const fileArea = document.getElementById(area + '-file-area');
        const fileInput = document.getElementById(area + '-file');
        const fileInfo = document.getElementById(area + '-file-info');
        
        // 클릭 이벤트
        fileArea.addEventListener('click', () => {
            fileInput.click();
        });
        
        // 파일 선택 이벤트
        fileInput.addEventListener('change', (e) => {
            handleFileSelect(e, fileInfo);
        });
        
        // 드래그 앤 드롭 이벤트
        fileArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileArea.classList.add('dragover');
        });
        
        fileArea.addEventListener('dragleave', () => {
            fileArea.classList.remove('dragover');
        });
        
        fileArea.addEventListener('drop', (e) => {
            e.preventDefault();
            fileArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                handleFileSelect({ target: { files: files } }, fileInfo);
            }
        });
    });
}

// 파일 선택 처리
function handleFileSelect(event, fileInfo) {
    const file = event.target.files[0];
    if (file) {
        const fileSize = (file.size / 1024 / 1024).toFixed(2);
        fileInfo.innerHTML = `
            <i class="fas fa-file"></i>
            <strong>${file.name}</strong> (${fileSize} MB)
        `;
        fileInfo.style.display = 'block';
    }
}

// 폼 설정
function setupForms() {
    const forms = ['server', 'database', 'user'];
    
    forms.forEach(formType => {
        const form = document.getElementById(formType + '-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleFormSubmit(formType);
        });
    });
}

// 폼 제출 처리
async function handleFormSubmit(formType) {
    const form = document.getElementById(formType + '-form');
    const formData = new FormData(form);
    
    // 필수 필드 검증
    if (!validateForm(formType)) {
        return;
    }
    
    // 제출 버튼 비활성화 및 로딩 표시
    const submitBtn = form.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<div class="loading"></div> 전송 중...';
    submitBtn.disabled = true;
    
    try {
        // 실제 API 호출
        const result = await callApi(formType, formData);
        
        // 결과 모달 표시
        showResultModal(result);
        
        // 성공 시 폼 리셋
        if (result.success) {
            form.reset();
            resetFileInfo(formType);
        }
        
    } catch (error) {
        console.error('API 호출 오류:', error);
        showResultModal({
            success: false,
            message: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
            failedItems: []
        });
    } finally {
        // 제출 버튼 복원
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// 폼 검증
function validateForm(formType) {
    const form = document.getElementById(formType + '-form');
    const fileInput = document.getElementById(formType + '-file');
    const ipInput = document.getElementById(formType + '-ip');
    const tokenInput = document.getElementById(formType + '-token');
    
    let isValid = true;
    
    // 파일 검증
    if (!fileInput.files[0]) {
        showFieldError(fileInput, '파일을 선택해주세요.');
        isValid = false;
    } else {
        clearFieldError(fileInput);
    }
    
    // IP 주소 검증
    if (!ipInput.value.trim()) {
        showFieldError(ipInput, 'IP 주소를 입력해주세요.');
        isValid = false;
    } else if (!isValidIP(ipInput.value.trim())) {
        showFieldError(ipInput, '올바른 IP 주소 형식을 입력해주세요.');
        isValid = false;
    } else {
        clearFieldError(ipInput);
    }
    
    // API Token 검증
    if (!tokenInput.value.trim()) {
        showFieldError(tokenInput, 'API Token을 입력해주세요.');
        isValid = false;
    } else {
        clearFieldError(tokenInput);
    }
    
    return isValid;
}

// IP 주소 형식 검증
function isValidIP(ip) {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(:\d{1,5})?$/;
    return ipRegex.test(ip);
}

// 필드 오류 표시
function showFieldError(field, message) {
    clearFieldError(field);
    field.style.borderColor = '#e74c3c';
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.color = '#e74c3c';
    errorDiv.style.fontSize = '0.9rem';
    errorDiv.style.marginTop = '5px';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
}

// 필드 오류 제거
function clearFieldError(field) {
    field.style.borderColor = '#e1e8ed';
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

// 파일 정보 리셋
function resetFileInfo(formType) {
    const fileInfo = document.getElementById(formType + '-file-info');
    fileInfo.style.display = 'none';
    fileInfo.innerHTML = '';
}

// 실제 API 호출
async function callApi(formType, formData) {
    try {
        const response = await fetch(`/api/upload/${formType}`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('API 호출 오류:', error);
        return {
            success: false,
            message: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
            failedItems: []
        };
    }
}

// 폼 타입 이름 반환
function getFormTypeName(formType) {
    const names = {
        'server': '서버',
        'database': 'DB',
        'user': '사용자'
    };
    return names[formType] || formType;
}

// 실패 항목 생성
function generateFailedItems(formType) {
    const sampleItems = {
        'server': [
            '서버 설정 파일 (config.json)',
            '네트워크 구성 정보',
            '보안 정책 설정'
        ],
        'database': [
            '데이터베이스 스키마',
            '테이블 구조 정보',
            '인덱스 설정'
        ],
        'user': [
            '사용자 권한 정보',
            '프로필 데이터',
            '인증 정보'
        ]
    };
    
    const items = sampleItems[formType] || [];
    const numFailed = Math.floor(Math.random() * items.length) + 1;
    return items.slice(0, numFailed);
}

// 결과 모달 설정
function setupModal() {
    const modal = document.getElementById('result-modal');
    const closeBtn = document.getElementById('modal-close');
    const retryBtn = document.getElementById('retry-btn');
    
    // 모달 닫기
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // 재전송 버튼 제거 - 단순 전달 서버로 변경
}

// 결과 모달 표시
function showResultModal(result) {
    const modal = document.getElementById('result-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalIcon = document.getElementById('modal-icon');
    const modalMessage = document.getElementById('modal-message');
    const failedItemsDiv = document.getElementById('failed-items');
    const failedList = document.getElementById('failed-list');
    
    // 제목 설정
    modalTitle.textContent = result.success ? '전송 성공' : '전송 실패';
    
    // 아이콘 설정
    const iconClass = result.success ? 'fas fa-check-circle success' : 'fas fa-times-circle error';
    modalIcon.innerHTML = `<i class="${iconClass}"></i>`;
    
    // 메시지 설정
    modalMessage.textContent = result.message;
    
조     // 실패 항목 표시 제거 - 단순 전달 서버로 변경
    failedItemsDiv.style.display = 'none';
    
    // 모달 표시
    modal.style.display = 'block';
}

// 모달 닫기
function closeModal() {
    const modal = document.getElementById('result-modal');
    modal.style.display = 'none';
}

// 사용자 관리 설정
function setupUserManagement() {
    setupCSVImport();
    
    // 초기 빈 사용자 추가
    if (allUsers.length === 0) {
        allUsers.push({ email: '', loginId: '', name: '' });
    }
    
    updateUserTable();
    updateUserCount();
    updatePagination();
}

// CSV Import 설정
function setupCSVImport() {
    const fileArea = document.getElementById('csv-import-area');
    const fileInput = document.getElementById('csv-import-file');
    
    if (!fileArea || !fileInput) return;
    
    fileArea.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            const file = this.files[0];
            importCSVFile(file);
        }
    });
}

// CSV 파일 Import
function importCSVFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            // UTF-8 BOM 제거 및 인코딩 처리
            let csvData = e.target.result;
            // UTF-8 BOM 제거 (EF BB BF)
            if (csvData.charCodeAt(0) === 0xFEFF) {
                csvData = csvData.slice(1);
            }
            
            const users = parseCSVData(csvData);
            
            if (users.length === 0) {
                alert('CSV 파일에 유효한 사용자 데이터가 없습니다.');
                return;
            }
            
            // 기존 데이터에 추가
            allUsers = [...allUsers, ...users];
            currentPageNumber = 1;
            
            updateUserTable();
            updateUserCount();
            updatePagination();
            
            alert(`${users.length}명의 사용자가 추가되었습니다.`);
            
        } catch (error) {
            console.error('CSV 파싱 오류:', error);
            alert('CSV 파일을 읽는 중 오류가 발생했습니다.');
        }
    };
    reader.onerror = function() {
        alert('CSV 파일을 읽는 중 오류가 발생했습니다.');
    };
    // UTF-8 인코딩 명시
    reader.readAsText(file, 'UTF-8');
}

// CSV 데이터 파싱 (개선된 버전 - 쌍따옴표 처리)
function parseCSVData(csvData) {
    // 개선된 CSV 파싱 (쌍따옴표 처리)
    const lines = [];
    let currentLine = '';
    let inQuotes = false;
    
    for (let i = 0; i < csvData.length; i++) {
        const char = csvData[i];
        const nextChar = csvData[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // 이스케이프된 따옴표
                currentLine += '"';
                i++; // 다음 따옴표 건너뛰기
            } else {
                // 따옴표 시작/끝
                inQuotes = !inQuotes;
            }
        } else if (char === '\n' && !inQuotes) {
            // 따옴표 밖에서 줄바꿈
            lines.push(currentLine);
            currentLine = '';
        } else {
            currentLine += char;
        }
    }
    if (currentLine) lines.push(currentLine);
    
    if (lines.length < 2) return [];

    // 헤더 파싱
    const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
    const users = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length >= 3) {
            const user = {};
            headers.forEach((header, index) => {
                if (values[index]) {
                    const value = values[index].trim();
                    switch (header) {
                        case 'email':
                            user.email = value;
                            break;
                        case 'loginid':
                        case 'login_id':
                            user.loginId = value;
                            break;
                        case 'name':
                            user.name = value;
                            break;
                    }
                }
            });
            
            if (user.email && user.loginId && user.name) {
                users.push(user);
            }
        }
    }

    return users;
}

// CSV 라인 파싱 (쌍따옴표 처리)
function parseCSVLine(line) {
    const values = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // 이스케이프된 따옴표
                currentValue += '"';
                i++;
            } else {
                // 따옴표 시작/끝
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // 따옴표 밖에서 쉼표
            values.push(currentValue);
            currentValue = '';
        } else {
            currentValue += char;
        }
    }
    values.push(currentValue);
    
    return values;
}

// CSV 파일 업로드 설정
function setupCSVFileUpload() {
    const fileArea = document.getElementById('user-csv-file-area');
    const fileInput = document.getElementById('user-csv-file');
    const fileInfo = document.getElementById('user-csv-file-info');
    
    if (!fileArea || !fileInput || !fileInfo) return;
    
    fileArea.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            const file = this.files[0];
            fileInfo.innerHTML = `
                <div class="file-selected">
                    <i class="fas fa-file-csv"></i>
                    <span>${file.name}</span>
                    <small>(${(file.size / 1024).toFixed(1)} KB)</small>
                </div>
            `;
            fileInfo.style.display = 'block';
        }
    });
}

// CSV 폼 설정
function setupCSVForm() {
    const form = document.getElementById('user-csv-form');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData();
        const fileInput = document.getElementById('user-csv-file');
        const targetUrl = document.getElementById('user-csv-target-url').value;
        const token = document.getElementById('user-csv-token').value;
        
        if (!fileInput.files[0]) {
            alert('CSV 파일을 선택해주세요.');
            return;
        }
        
        if (!targetUrl || !token) {
            alert('대상 URL과 API Token을 입력해주세요.');
            return;
        }
        
        formData.append('file', fileInput.files[0]);
        formData.append('targetUrl', targetUrl);
        formData.append('token', token);
        
        const submitBtn = form.querySelector('.submit-btn');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = '<div class="loading"></div> 업로드 중...';
        submitBtn.disabled = true;
        
        try {
            const response = await fetch('/api/users/bulk', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            showResultModal(result);
            
            if (result.success) {
                form.reset();
                document.getElementById('user-csv-file-info').style.display = 'none';
            }
            
        } catch (error) {
            console.error('CSV 업로드 오류:', error);
            showResultModal({
                success: false,
                message: 'CSV 업로드 중 오류가 발생했습니다.',
                error: error.message
            });
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// 사용자 행 추가
function addUserRow() {
    const newUser = {
        email: '',
        loginId: '',
        name: ''
    };
    
    allUsers.push(newUser);
    updateUserTable();
    updateUserCount();
    updatePagination();
    
    // 마지막 페이지로 이동
    const totalPages = Math.ceil(allUsers.length / usersPerPage);
    if (totalPages > currentPageNumber) {
        currentPageNumber = totalPages;
        updateUserTable();
        updatePagination();
    }
}

// 사용자 테이블 업데이트
function updateUserTable() {
    const tbody = document.getElementById('user-table-body');
    if (!tbody) return;
    
    const startIndex = (currentPageNumber - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    const currentPageUsers = allUsers.slice(startIndex, endIndex);
    
    tbody.innerHTML = '';
    
    if (currentPageUsers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 40px; color: #6c757d;">
                    사용자 데이터가 없습니다. 행 추가 버튼을 클릭하거나 CSV 파일을 import하세요.
                </td>
            </tr>
        `;
        return;
    }
    
    currentPageUsers.forEach((user, index) => {
        const row = document.createElement('tr');
        row.className = 'user-row';
        row.innerHTML = `
            <td><input type="email" class="table-input" placeholder="user@example.com" value="${user.email || ''}" required></td>
            <td><input type="text" class="table-input" placeholder="userid" value="${user.loginId || ''}" required></td>
            <td><input type="text" class="table-input" placeholder="홍길동" value="${user.name || ''}" required></td>
            <td>
                <button type="button" class="btn-delete" onclick="removeUserRow(${startIndex + index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// 사용자 행 삭제
function removeUserRow(index) {
    if (allUsers.length <= 1) {
        alert('최소 하나의 행은 유지해야 합니다.');
        return;
    }
    
    allUsers.splice(index, 1);
    
    // 현재 페이지가 비어있으면 이전 페이지로 이동
    const totalPages = Math.ceil(allUsers.length / usersPerPage);
    if (currentPageNumber > totalPages) {
        currentPageNumber = totalPages;
    }
    
    updateUserTable();
    updateUserCount();
    updatePagination();
}

// 사용자 수 업데이트
function updateUserCount() {
    const userCountElement = document.getElementById('user-count');
    if (userCountElement) {
        userCountElement.textContent = `총 ${allUsers.length}명`;
    }
}

// 페이지네이션 업데이트
function updatePagination() {
    const totalPages = Math.ceil(allUsers.length / usersPerPage);
    const pageInfoElement = document.getElementById('page-info');
    const pageNumbersElement = document.getElementById('page-numbers');
    const prevBtn = document.querySelector('.btn-prev');
    const nextBtn = document.querySelector('.btn-next');
    
    if (pageInfoElement) {
        pageInfoElement.textContent = `${currentPageNumber} / ${totalPages} 페이지`;
    }
    
    if (pageNumbersElement) {
        pageNumbersElement.innerHTML = '';
        
        // 페이지 번호 생성 (최대 5개)
        const startPage = Math.max(1, currentPageNumber - 2);
        const endPage = Math.min(totalPages, startPage + 4);
        
        for (let i = startPage; i <= endPage; i++) {
            const pageSpan = document.createElement('span');
            pageSpan.className = `page-number ${i === currentPageNumber ? 'active' : ''}`;
            pageSpan.textContent = i;
            pageSpan.onclick = () => goToPage(i);
            pageNumbersElement.appendChild(pageSpan);
        }
    }
    
    if (prevBtn) {
        prevBtn.disabled = currentPageNumber <= 1;
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentPageNumber >= totalPages;
    }
}

// 페이지 변경
function changePage(direction) {
    const totalPages = Math.ceil(allUsers.length / usersPerPage);
    const newPage = currentPageNumber + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPageNumber = newPage;
        updateUserTable();
        updatePagination();
    }
}

// 특정 페이지로 이동
function goToPage(page) {
    const totalPages = Math.ceil(allUsers.length / usersPerPage);
    
    if (page >= 1 && page <= totalPages) {
        currentPageNumber = page;
        updateUserTable();
        updatePagination();
    }
}

// 사용자 테이블 전체 지우기
function clearUserTable() {
    if (confirm('모든 사용자 데이터를 지우시겠습니까?')) {
        allUsers = [];
        currentPageNumber = 1;
        updateUserTable();
        updateUserCount();
        updatePagination();
    }
}

// 사용자 등록
async function registerUsers() {
    const targetUrl = document.getElementById('user-target-url').value;
    const token = document.getElementById('user-token').value;
    
    if (!targetUrl || !token) {
        alert('대상 URL과 API Token을 입력해주세요.');
        return;
    }
    
    const rows = document.querySelectorAll('#user-table-body .user-row');
    const users = [];
    
    for (const row of rows) {
        const inputs = row.querySelectorAll('.table-input');
        const email = inputs[0].value.trim();
        const loginId = inputs[1].value.trim();
        const name = inputs[2].value.trim();
        const password = inputs[3].value.trim();
        
        if (email && loginId && name && password) {
            users.push({ email, loginId, name, password });
        }
    }
    
    if (users.length === 0) {
        alert('등록할 사용자 정보를 입력해주세요.');
        return;
    }
    
    const submitBtn = document.querySelector('#table-tab .submit-btn');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '<div class="loading"></div> 등록 중...';
    submitBtn.disabled = true;
    
    try {
        const results = [];
        for (const user of users) {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({
                    ...user,
                    targetUrl: targetUrl
                })
            });
            
            const result = await response.json();
            results.push({ user, result });
        }
        
        const successCount = results.filter(r => r.result.success).length;
        const failCount = results.length - successCount;
        
        showResultModal({
            success: failCount === 0,
            message: `${successCount}명 성공, ${failCount}명 실패`,
            results: results
        });
        
        if (failCount === 0) {
            clearUserTable();
        }
        
    } catch (error) {
        console.error('사용자 등록 오류:', error);
        showResultModal({
            success: false,
            message: '사용자 등록 중 오류가 발생했습니다.',
            error: error.message
        });
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// CSV 템플릿 다운로드
function downloadCSVTemplate() {
    const csvContent = 'email,loginId,name\nuser1@example.com,user1,홍길동\nuser2@example.com,user2,김철수';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'user_template.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// 재전송 처리 함수 제거 - 단순 전달 서버로 변경

// 키보드 단축키
document.addEventListener('keydown', function(e) {
    // ESC 키로 모달 닫기
    if (e.key === 'Escape') {
        closeModal();
    }
    
    // Ctrl + Enter로 폼 제출
    if (e.ctrlKey && e.key === 'Enter') {
        const activeForm = document.querySelector('.page.active form');
        if (activeForm) {
            activeForm.dispatchEvent(new Event('submit'));
        }
    }
});

// 페이지 가시성 변경 시 처리
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // 페이지가 숨겨질 때 처리
        console.log('페이지가 백그라운드로 이동했습니다.');
    } else {
        // 페이지가 다시 보일 때 처리
        console.log('페이지가 포그라운드로 돌아왔습니다.');
    }
});

// 에러 처리
window.addEventListener('error', function(e) {
    console.error('JavaScript 오류:', e.error);
});

// Promise rejection 처리
window.addEventListener('unhandledrejection', function(e) {
    console.error('처리되지 않은 Promise rejection:', e.reason);
    e.preventDefault();
});

// 대시보드 데이터 로드
async function loadDashboardData() {
    try {
        const response = await fetch('/api/dashboard');
        if (response.ok) {
            const data = await response.json();
            console.log('HUB 시스템이 실행 중입니다:', data.timestamp);
        }
    } catch (error) {
        console.log('대시보드 데이터 로드 실패');
    }
}

// 대시보드 통계 업데이트 함수 제거 - 단순 전달 서버로 변경

// 페이지 네비게이션 함수 (전역으로 사용)
function navigateToPage(pageName) {
    const menuItems = document.querySelectorAll('.menu-item');
    const pages = document.querySelectorAll('.page');
    
    // 활성 메뉴 아이템 변경
    menuItems.forEach(menu => menu.classList.remove('active'));
    const targetMenuItem = document.querySelector(`[data-page="${pageName}"]`);
    if (targetMenuItem) {
        targetMenuItem.classList.add('active');
    }
    
    // 활성 페이지 변경
    pages.forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageName + '-page');
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    currentPage = pageName;
    
    // 대시보드로 돌아갈 때 데이터 새로고침
    if (pageName === 'dashboard') {
        loadDashboardData();
    }
}
