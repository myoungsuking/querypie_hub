// 사용자 관리 모듈
class UserManager {
    constructor(app) {
        this.app = app;
    }

    setupCSVImport() {
        const fileArea = document.getElementById('csv-import-area');
        const fileInput = document.getElementById('csv-import-file');
        
        if (!fileArea || !fileInput) return;
        
        fileArea.addEventListener('click', () => fileInput.click());
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                const fileText = document.getElementById('csv-file-text');
                if (fileText) {
                    fileText.textContent = `선택된 파일: ${file.name}`;
                }
                this.importCSVFile(file);
            }
        });
    }

    importCSVFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                // UTF-8 BOM 제거 및 인코딩 처리
                let csvData = e.target.result;
                // UTF-8 BOM 제거 (EF BB BF)
                if (csvData.charCodeAt(0) === 0xFEFF) {
                    csvData = csvData.slice(1);
                }
                
                const users = this.parseCSVData(csvData);
                
                if (users.length === 0) {
                    Toast.error('CSV 파일에 유효한 사용자 데이터가 없습니다.');
                    return;
                }
                
                // 기존 데이터에 추가 (중복 제거)
                const existingEmails = new Set(this.app.allUsers.map(u => u.email).filter(Boolean));
                const newUsers = users.filter(user => !existingEmails.has(user.email));
                
                this.app.allUsers = [...this.app.allUsers, ...newUsers];
                this.updateUserTable();
                this.updateUserCount();
                this.updateRetryButton();
                
                if (newUsers.length === users.length) {
                    Toast.success(`${users.length}명의 사용자가 추가되었습니다.`, 'CSV Import 성공');
                } else {
                    Toast.warning(`${newUsers.length}명 추가됨 (${users.length - newUsers.length}명 중복 제외)`, 'CSV Import 완료');
                }
                
            } catch (error) {
                console.error('CSV 파싱 오류:', error);
                Toast.error('CSV 파일을 읽는 중 오류가 발생했습니다.');
            }
        };
        reader.onerror = () => {
            Toast.error('CSV 파일을 읽는 중 오류가 발생했습니다.');
        };
        // UTF-8 인코딩 명시
        reader.readAsText(file, 'UTF-8');
    }

    parseCSVData(csvData) {
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

        // 헤더 파싱 (쌍따옴표 제거)
        const headers = this.parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
        const users = [];

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
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
                    user.result = ''; // 결과 속성 추가
                    users.push(user);
                }
            }
        }

        return users;
    }

    parseCSVLine(line) {
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

    addUserRow() {
        const newUser = {
            email: '',
            loginId: '',
            name: '',
            result: ''
        };
        
        this.app.allUsers.push(newUser);
        // 마지막 페이지로 이동
        const totalPages = Math.ceil(this.app.allUsers.length / this.app.usersPerPage);
        this.app.currentPageNumber = totalPages;
        
        this.updateUserTable();
        this.updateUserCount();
        this.updatePagination();
        
        Toast.success(`사용자 행이 추가되었습니다. (총 ${this.app.allUsers.length}개, ${totalPages}페이지)`);
    }

    addMultipleRows() {
        console.log('addMultipleRows 메서드 호출됨');
        console.log('this.app:', this.app);
        console.log('this.app.allUsers:', this.app.allUsers);
        
        const rowCountInput = document.getElementById('row-count');
        const count = parseInt(rowCountInput.value) || 0;
        
        console.log('추가할 행 개수:', count);
        
        if (count <= 0) {
            Toast.warning('추가할 행의 개수를 입력해주세요.');
            return;
        }
        
        if (count > 1000) {
            Toast.error('한 번에 최대 1000개까지만 추가할 수 있습니다.');
            return;
        }
        
        // 현재 빈 행이 있는지 확인하고 제거
        const emptyRows = this.app.allUsers.filter(user => 
            !user.email && !user.loginId && !user.name
        );
        
        // 빈 행들을 제거
        this.app.allUsers = this.app.allUsers.filter(user => 
            user.email || user.loginId || user.name
        );
        
        // 새로운 행들 추가
        for (let i = 0; i < count; i++) {
            const newUser = {
                email: '',
                loginId: '',
                name: '',
                result: '' // 결과 컬럼 추가
            };
            this.app.allUsers.push(newUser);
        }
        
        console.log('행 추가 후 allUsers 길이:', this.app.allUsers.length);
        
        // 마지막 페이지로 이동
        const totalPages = Math.ceil(this.app.allUsers.length / this.app.usersPerPage);
        this.app.currentPageNumber = totalPages;
        
        console.log(`총 ${totalPages}페이지 중 ${this.app.currentPageNumber}페이지로 이동`);
        
        this.updateUserTable();
        this.updateUserCount();
        this.updatePagination();
        this.updateRetryButton();
        
        console.log('테이블 업데이트 완료');
        Toast.success(`${count}개의 사용자 행이 추가되었습니다. (총 ${this.app.allUsers.length}개, ${totalPages}페이지)`, '행 추가 완료');
        rowCountInput.value = 1; // 입력값 초기화
    }

    updateUserTable() {
        const tbody = document.getElementById('user-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (this.app.allUsers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: #6c757d;">
                        CSV 파일을 import하여 사용자 정보를 표시하세요.
                    </td>
                </tr>
            `;
            return;
        }
        
        this.app.allUsers.forEach((user, index) => {
            const row = document.createElement('tr');
            row.className = 'user-row';
            const globalIndex = index + 1;
            
            row.innerHTML = `
                <td class="row-number">${globalIndex}</td>
                <td>${user.email || ''}</td>
                <td>${user.loginId || ''}</td>
                <td>${user.name || ''}</td>
                <td class="result-cell">
                    <span class="result-status ${user.result ? (user.result === 'success' ? 'success' : user.result === 'error' ? 'error' : user.result === 'processing' ? 'processing' : '') : ''}">
                        ${user.result === 'success' ? '성공' : user.result === 'error' ? '실패' : user.result === 'processing' ? '진행중...' : ''}
                    </span>
                </td>
                <td>
                    ${user.result === 'error' ? `
                        <button type="button" class="btn-retry-single" data-index="${index}" title="이 항목만 재전송">
                            <i class="fas fa-redo"></i>
                        </button>
                    ` : ''}
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        // 개별 재전송 버튼 이벤트 리스너 추가
        tbody.querySelectorAll('.btn-retry-single').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('.btn-retry-single').dataset.index);
                this.retrySingleUser(index);
            });
        });
    }

    removeUserRow(index) {
        if (this.app.allUsers.length <= 1) {
            Toast.warning('최소 하나의 행은 유지해야 합니다.');
            return;
        }
        
        const user = this.app.allUsers[index];
        const userInfo = user.email || user.loginId || user.name || '사용자';
        
        if (confirm(`"${userInfo}" 사용자를 삭제하시겠습니까?`)) {
            this.app.allUsers.splice(index, 1);
            
            // 현재 페이지가 비어있으면 이전 페이지로 이동
            const totalPages = Math.ceil(this.app.allUsers.length / this.app.usersPerPage);
            if (this.app.currentPageNumber > totalPages) {
                this.app.currentPageNumber = totalPages;
            }
            
            this.updateUserTable();
            this.updateUserCount();
            this.updatePagination();
            this.updateRetryButton();
            
            Toast.success('사용자가 삭제되었습니다.');
        }
    }

    clearUserTable() {
        if (this.app.allUsers.length === 0) {
            Toast.warning('삭제할 데이터가 없습니다.');
            return;
        }
        
        if (confirm(`정말로 모든 사용자 데이터(${this.app.allUsers.length}명)를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
            const deletedCount = this.app.allUsers.length;
            this.app.allUsers = [];
            this.app.currentPageNumber = 1;
            this.updateUserTable();
            this.updateUserCount();
            this.updatePagination();
            this.updateRetryButton();
            
            Toast.success(`${deletedCount}명의 사용자 데이터가 삭제되었습니다.`, '데이터 삭제 완료');
        }
    }

    updateUserCount() {
        const userCountElement = document.getElementById('user-count');
        if (userCountElement) {
            const totalUsers = this.app.allUsers.length;
            const totalPages = Math.ceil(totalUsers / this.app.usersPerPage);
            userCountElement.textContent = `총 ${totalUsers}명 (${totalPages}페이지)`;
        }
    }

    updatePagination() {
        const totalPages = Math.ceil(this.app.allUsers.length / this.app.usersPerPage);
        const pageInfoElement = document.getElementById('page-info');
        const pageNumbersElement = document.getElementById('page-numbers');
        const prevBtn = document.querySelector('.btn-prev');
        const nextBtn = document.querySelector('.btn-next');
        
        if (pageInfoElement) {
            pageInfoElement.textContent = `${this.app.currentPageNumber} / ${totalPages} 페이지`;
        }
        
        if (pageNumbersElement) {
            pageNumbersElement.innerHTML = '';
            
            // 페이지 번호 생성 (최대 7개)
            const startPage = Math.max(1, this.app.currentPageNumber - 3);
            const endPage = Math.min(totalPages, startPage + 6);
            
            // 첫 페이지가 1이 아니면 "..." 표시
            if (startPage > 1) {
                const firstSpan = document.createElement('span');
                firstSpan.className = 'page-number';
                firstSpan.textContent = '1';
                firstSpan.onclick = () => this.goToPage(1);
                pageNumbersElement.appendChild(firstSpan);
                
                if (startPage > 2) {
                    const dotsSpan = document.createElement('span');
                    dotsSpan.className = 'page-number';
                    dotsSpan.textContent = '...';
                    dotsSpan.style.cursor = 'default';
                    pageNumbersElement.appendChild(dotsSpan);
                }
            }
            
            for (let i = startPage; i <= endPage; i++) {
                const pageSpan = document.createElement('span');
                pageSpan.className = `page-number ${i === this.app.currentPageNumber ? 'active' : ''}`;
                pageSpan.textContent = i;
                pageSpan.onclick = () => this.goToPage(i);
                pageNumbersElement.appendChild(pageSpan);
            }
            
            // 마지막 페이지가 끝이 아니면 "..." 표시
            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    const dotsSpan = document.createElement('span');
                    dotsSpan.className = 'page-number';
                    dotsSpan.textContent = '...';
                    dotsSpan.style.cursor = 'default';
                    pageNumbersElement.appendChild(dotsSpan);
                }
                
                const lastSpan = document.createElement('span');
                lastSpan.className = 'page-number';
                lastSpan.textContent = totalPages;
                lastSpan.onclick = () => this.goToPage(totalPages);
                pageNumbersElement.appendChild(lastSpan);
            }
        }
        
        if (prevBtn) {
            prevBtn.disabled = this.app.currentPageNumber <= 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.app.currentPageNumber >= totalPages;
        }
    }

    changePage(direction) {
        const totalPages = Math.ceil(this.app.allUsers.length / this.app.usersPerPage);
        const newPage = this.app.currentPageNumber + direction;
        
        if (newPage >= 1 && newPage <= totalPages) {
            this.app.currentPageNumber = newPage;
            this.updateUserTable();
            this.updatePagination();
        }
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.app.allUsers.length / this.app.usersPerPage);
        
        if (page >= 1 && page <= totalPages) {
            this.app.currentPageNumber = page;
            this.updateUserTable();
            this.updatePagination();
        }
    }

    async registerUsers() {
        const targetUrl = document.getElementById('user-target-url').value;
        const token = document.getElementById('user-token').value;
        const defaultPassword = document.getElementById('default-password').value;
        
        if (!targetUrl || !token || !defaultPassword) {
            Toast.error('대상 URL, API Token, 초기 비밀번호를 모두 입력해주세요.');
            return;
        }
        
        if (this.app.allUsers.length === 0) {
            Toast.warning('등록할 사용자 정보가 없습니다.');
            return;
        }
        
        // 현재 표시된 페이지의 사용자 데이터 수집
        const startIndex = (this.app.currentPageNumber - 1) * this.app.usersPerPage;
        const currentPageUsers = this.getCurrentPageUsers();
        const users = currentPageUsers.filter(user => user.email && user.loginId && user.name);
        
        console.log('등록할 사용자 데이터:', users);
        
        if (users.length === 0) {
            Toast.warning('현재 페이지에 유효한 사용자 정보가 없습니다.');
            return;
        }
        
        const submitBtn = document.querySelector('.submit-btn');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = '<div class="loading"></div> 등록 중...';
        submitBtn.disabled = true;
        
        try {
            const results = [];
            for (let i = 0; i < users.length; i++) {
                const user = users[i];
                const globalIndex = startIndex + i;
                
                // 사용자 데이터에서 정확한 인덱스 찾기
                const userIndex = this.app.allUsers.findIndex(u => 
                    u.email === user.email && u.loginId === user.loginId && u.name === user.name
                );
                
                if (userIndex === -1) continue;
                
                // 실시간 결과 표시를 위해 해당 행 찾기
                this.app.allUsers[userIndex].result = 'processing';
                this.updateUserTable();
                
                const response = await fetch('/api/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token
                    },
                    body: JSON.stringify({
                        ...user,
                        password: defaultPassword,
                        targetUrl: targetUrl
                    })
                });
                
                const result = await response.json();
                results.push({ user, result, userIndex });
                
                // 결과에 따라 행 업데이트
                const resultStatus = result.success ? 'success' : 'error';
                this.app.allUsers[userIndex].result = resultStatus;
                this.app.allUsers[userIndex].resultMessage = result.message || '';
                this.app.allUsers[userIndex].email = user.email;
                this.app.allUsers[userIndex].loginId = user.loginId;
                this.app.allUsers[userIndex].name = user.name;
                
                // 테이블 업데이트
                this.updateUserTable();
            }
            
            const successCount = results.filter(r => r.result.success).length;
            const failCount = results.length - successCount;
            
            // 결과를 Toast로 표시
            if (failCount === 0) {
                Toast.success(`${successCount}명의 사용자가 성공적으로 등록되었습니다.`, '사용자 등록 완료');
            } else {
                Toast.warning(`${successCount}명 성공, ${failCount}명 실패`, '사용자 등록 결과');
            }
            
            // 실패 항목 재전송 버튼 표시/숨김
            this.updateRetryButton();
            
            // 테이블 업데이트 (결과 반영)
            this.updateUserTable();
            this.updateUserCount();
            this.updateRetryButton();
            
        } catch (error) {
            console.error('사용자 등록 오류:', error);
            Toast.error('사용자 등록 중 오류가 발생했습니다: ' + error.message, '등록 오류');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    getCurrentPageUsers() {
        const tbody = document.getElementById('user-table-body');
        const rows = tbody.querySelectorAll('.user-row');
        const users = [];
        
        console.log('getCurrentPageUsers - 행 개수:', rows.length);
        
        rows.forEach((row, index) => {
            const inputs = row.querySelectorAll('.table-input');
            console.log(`행 ${index + 1} - 입력 필드 개수:`, inputs.length);
            
            if (inputs.length >= 3) {
                const user = {
                    email: inputs[0].value.trim(),
                    loginId: inputs[1].value.trim(),
                    name: inputs[2].value.trim()
                };
                console.log(`행 ${index + 1} 데이터:`, user);
                users.push(user);
            }
        });
        
        console.log('수집된 사용자 데이터:', users);
        return users;
    }

    updateRowResult(rowIndex, status) {
        // 이 메서드는 더 이상 사용하지 않음 (updateUserTable으로 대체)
        // 하지만 호환성을 위해 유지
        if (this.app.allUsers[rowIndex]) {
            this.app.allUsers[rowIndex].result = status;
        }
        this.updateUserTable();
    }
    
    updateRetryButton() {
        const retryBtn = document.querySelector('.btn-retry');
        if (!retryBtn) return;
        
        const failedUsers = this.app.allUsers.filter(user => 
            user.result === 'error' && user.email && user.loginId && user.name
        );
        
        if (failedUsers.length > 0) {
            retryBtn.style.display = 'inline-flex';
            retryBtn.innerHTML = `<i class="fas fa-redo"></i> 실패 항목 재전송 (${failedUsers.length}개)`;
        } else {
            retryBtn.style.display = 'none';
        }
    }
    
    async retryFailedUsers() {
        const targetUrl = document.getElementById('user-target-url').value;
        const token = document.getElementById('user-token').value;
        const defaultPassword = document.getElementById('default-password').value;
        
        if (!targetUrl || !token || !defaultPassword) {
            Toast.error('대상 URL, API Token, 초기 비밀번호를 모두 입력해주세요.');
            return;
        }
        
        // 실패한 사용자만 필터링
        const failedUsers = this.app.allUsers.filter(user => 
            user.result === 'error' && user.email && user.loginId && user.name
        );
        
        if (failedUsers.length === 0) {
            Toast.info('재전송할 실패 항목이 없습니다.');
            return;
        }
        
        const retryBtn = document.querySelector('.btn-retry');
        const originalText = retryBtn.innerHTML;
        
        retryBtn.innerHTML = '<div class="loading"></div> 재전송 중...';
        retryBtn.disabled = true;
        
        try {
            const results = [];
            for (let i = 0; i < failedUsers.length; i++) {
                const user = failedUsers[i];
                const userIndex = this.app.allUsers.findIndex(u => 
                    u.email === user.email && u.loginId === user.loginId && u.name === user.name
                );
                
                if (userIndex === -1) continue;
                
                // 진행중 표시
                this.app.allUsers[userIndex].result = 'processing';
                this.updateUserTable();
                
                const response = await fetch('/api/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token
                    },
                    body: JSON.stringify({
                        ...user,
                        password: defaultPassword,
                        targetUrl: targetUrl
                    })
                });
                
                const result = await response.json();
                results.push({ user, result });
                
                // 결과에 따라 업데이트
                const resultStatus = result.success ? 'success' : 'error';
                this.app.allUsers[userIndex].result = resultStatus;
                this.app.allUsers[userIndex].resultMessage = result.message || '';
                
                this.updateUserTable();
            }
            
            const successCount = results.filter(r => r.result.success).length;
            const failCount = results.length - successCount;
            
            if (failCount === 0) {
                Toast.success(`모든 실패 항목(${successCount}개)이 성공적으로 재전송되었습니다.`, '재전송 완료');
            } else {
                Toast.warning(`${successCount}개 성공, ${failCount}개 실패`, '재전송 결과');
            }
            
            this.updateRetryButton();
            this.updateUserTable();
            
        } catch (error) {
            console.error('재전송 오류:', error);
            Toast.error('재전송 중 오류가 발생했습니다: ' + error.message, '재전송 오류');
        } finally {
            retryBtn.innerHTML = originalText;
            retryBtn.disabled = false;
        }
    }
    
    async retrySingleUser(userIndex) {
        const targetUrl = document.getElementById('user-target-url').value;
        const token = document.getElementById('user-token').value;
        const defaultPassword = document.getElementById('default-password').value;
        
        if (!targetUrl || !token || !defaultPassword) {
            Toast.error('대상 URL, API Token, 초기 비밀번호를 모두 입력해주세요.');
            return;
        }
        
        const user = this.app.allUsers[userIndex];
        if (!user || user.result !== 'error') {
            Toast.warning('재전송할 수 없는 항목입니다.');
            return;
        }
        
        if (!user.email || !user.loginId || !user.name) {
            Toast.warning('유효하지 않은 사용자 정보입니다.');
            return;
        }
        
        // 진행중 표시
        this.app.allUsers[userIndex].result = 'processing';
        this.updateUserTable();
        
        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({
                    ...user,
                    password: defaultPassword,
                    targetUrl: targetUrl
                })
            });
            
            const result = await response.json();
            const resultStatus = result.success ? 'success' : 'error';
            
            this.app.allUsers[userIndex].result = resultStatus;
            this.app.allUsers[userIndex].resultMessage = result.message || '';
            
            this.updateUserTable();
            this.updateRetryButton();
            
            if (result.success) {
                Toast.success('사용자가 성공적으로 재전송되었습니다.', '재전송 완료');
            } else {
                Toast.error('재전송에 실패했습니다: ' + (result.message || '알 수 없는 오류'), '재전송 실패');
            }
            
        } catch (error) {
            console.error('개별 재전송 오류:', error);
            this.app.allUsers[userIndex].result = 'error';
            this.updateUserTable();
            Toast.error('재전송 중 오류가 발생했습니다: ' + error.message, '재전송 오류');
        }
    }

    downloadCSVTemplate() {
        try {
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
                URL.revokeObjectURL(url);
                
                Toast.success('템플릿이 다운로드되었습니다.', '다운로드 완료');
            } else {
                Toast.error('다운로드가 지원되지 않는 브라우저입니다.');
            }
        } catch (error) {
            console.error('템플릿 다운로드 오류:', error);
            Toast.error('템플릿 다운로드 중 오류가 발생했습니다.');
        }
    }

    downloadResults() {
        try {
            // 현재 테이블에서 실제 데이터 가져오기
            const currentUsers = this.getCurrentPageUsers();
            
            if (currentUsers.length === 0) {
                Toast.warning('다운로드할 데이터가 없습니다.');
                return;
            }

            console.log('다운로드할 사용자 데이터:', currentUsers);

            // CSV 헤더
            let csvContent = '순번,이메일,로그인ID,이름,결과\n';
            
            // 데이터 추가
            currentUsers.forEach((user, index) => {
                const rowNumber = index + 1;
                const email = user.email || '';
                const loginId = user.loginId || '';
                const name = user.name || '';
                
                // 결과는 app.allUsers에서 찾기
                const appUser = this.app.allUsers.find(u => 
                    u.email === user.email && u.loginId === user.loginId
                );
                const result = appUser && appUser.result ? 
                    (appUser.result === 'success' ? '성공' : '실패') : '';
                
                csvContent += `${rowNumber},"${email}","${loginId}","${name}","${result}"\n`;
            });

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');

            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `user_results_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                Toast.success('결과가 다운로드되었습니다.', '다운로드 완료');
            } else {
                Toast.error('다운로드가 지원되지 않는 브라우저입니다.');
            }
        } catch (error) {
            console.error('결과 다운로드 오류:', error);
            Toast.error('결과 다운로드 중 오류가 발생했습니다.');
        }
    }

    generateDummyData(count = 1000) {
        console.log(`${count}개의 더미 데이터 생성 시작`);
        
        const surnames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '전', '고'];
        const givenNames = ['민수', '지영', '현우', '서연', '준호', '수진', '동현', '미영', '성민', '예진', '태현', '지현', '민호', '지은', '준영', '서현', '민지', '현수', '지우', '서준'];
        const domains = ['gmail.com', 'naver.com', 'daum.net', 'yahoo.com', 'hotmail.com', 'company.com', 'test.com'];
        
        const dummyUsers = [];
        
        for (let i = 1; i <= count; i++) {
            const surname = surnames[Math.floor(Math.random() * surnames.length)];
            const givenName = givenNames[Math.floor(Math.random() * givenNames.length)];
            const name = surname + givenName;
            const domain = domains[Math.floor(Math.random() * domains.length)];
            const loginId = `user${i.toString().padStart(4, '0')}`;
            const email = `${loginId}@${domain}`;
            
            dummyUsers.push({
                email: email,
                loginId: loginId,
                name: name,
                result: ''
            });
            
            // 진행 상황 표시 (100개마다)
            if (i % 100 === 0) {
                console.log(`${i}개 생성 완료...`);
            }
        }
        
        console.log(`${count}개의 더미 데이터 생성 완료`);
        console.log('생성된 더미 데이터 샘플:', dummyUsers.slice(0, 5));
        return dummyUsers;
    }

    addDummyData(count = 1000) {
        if (count > 1000) {
            Toast.error('더미 데이터는 최대 1000개까지만 생성할 수 있습니다.');
            return;
        }
        
        console.log(`${count}개의 더미 데이터 추가 시작`);
        console.log('추가 전 allUsers 길이:', this.app.allUsers.length);
        
        // 기존 빈 행들 제거
        const beforeFilter = this.app.allUsers.length;
        this.app.allUsers = this.app.allUsers.filter(user => 
            user.email || user.loginId || user.name
        );
        console.log(`빈 행 제거: ${beforeFilter} -> ${this.app.allUsers.length}`);
        
        // 더미 데이터 생성 및 추가
        const dummyUsers = this.generateDummyData(count);
        console.log('생성된 더미 데이터 개수:', dummyUsers.length);
        console.log('더미 데이터 샘플:', dummyUsers.slice(0, 3));
        
        this.app.allUsers = [...this.app.allUsers, ...dummyUsers];
        console.log('추가 후 allUsers 길이:', this.app.allUsers.length);
        
        // 마지막 페이지로 이동
        const totalPages = Math.ceil(this.app.allUsers.length / this.app.usersPerPage);
        this.app.currentPageNumber = totalPages;
        
        console.log(`더미 데이터 추가 완료. 총 ${this.app.allUsers.length}개, ${totalPages}페이지`);
        console.log('현재 페이지:', this.app.currentPageNumber);
        
        this.updateUserTable();
        this.updateUserCount();
        this.updatePagination();
        
        Toast.success(`${count}개의 더미 데이터가 추가되었습니다! (총 ${this.app.allUsers.length}개, ${totalPages}페이지) 현재 마지막 페이지(${totalPages}페이지)를 보고 있습니다.`, '더미 데이터 추가 완료');
    }
}

// 전역 함수들 (기존 호환성 유지)
let userManager;

function setupUserManagement() {
    // window.app이 없으면 잠시 기다렸다가 다시 시도
    if (!window.app) {
        setTimeout(setupUserManagement, 100);
        return;
    }
    
    if (window.app && !window.userManager) {
        window.userManager = new UserManager(window.app);
    }
    if (window.userManager) {
        window.userManager.setupCSVImport();
        window.userManager.updateUserCount();
        window.userManager.updatePagination();
        
        // 초기 빈 사용자 추가
        if (window.app.allUsers.length === 0) {
            window.app.allUsers.push({ email: '', loginId: '', name: '', result: '' });
        }
        
        window.userManager.updateUserTable();
        window.userManager.updateRetryButton();
    }
}

function addUserRow() {
    if (window.userManager) window.userManager.addUserRow();
}

function addMultipleRows() {
    console.log('addMultipleRows 전역 함수 호출됨');
    console.log('window.userManager:', window.userManager);
    console.log('window.app:', window.app);
    
    if (window.userManager) {
        console.log('userManager 존재함, 행 추가 실행');
        window.userManager.addMultipleRows();
    } else {
        console.log('userManager가 존재하지 않음, 직접 실행');
        // userManager가 없을 경우 직접 실행
        const rowCountInput = document.getElementById('row-count');
        const count = parseInt(rowCountInput.value) || 0;
        
        console.log('직접 실행 - 개수:', count);
        
        if (count <= 0) {
            if (window.Toast) {
                Toast.warning('추가할 행의 개수를 입력해주세요.');
            } else {
                alert('추가할 행의 개수를 입력해주세요.');
            }
            return;
        }
        
        if (count > 1000) {
            if (window.Toast) {
                Toast.error('한 번에 최대 1000개까지만 추가할 수 있습니다.');
            } else {
                alert('한 번에 최대 1000개까지만 추가할 수 있습니다.');
            }
            return;
        }
        
        // app 객체가 있는 경우 app을 통해 행 추가
        if (window.app) {
            for (let i = 0; i < count; i++) {
                const newUser = {
                    email: '',
                    loginId: '',
                    name: '',
                    result: ''
                };
                window.app.allUsers.push(newUser);
            }
            
            // 마지막 페이지로 이동
            const totalPages = Math.ceil(window.app.allUsers.length / window.app.usersPerPage);
            window.app.currentPageNumber = totalPages;
            
            // 테이블 업데이트
            if (window.userManager) {
                window.userManager.updateUserTable();
                window.userManager.updateUserCount();
                window.userManager.updatePagination();
            }
            
            if (window.Toast) {
                Toast.success(`${count}개의 사용자 행이 추가되었습니다. (총 ${window.app.allUsers.length}개, ${totalPages}페이지)`, '행 추가 완료');
            } else {
                alert(`${count}개의 사용자 행이 추가되었습니다. (총 ${window.app.allUsers.length}개, ${totalPages}페이지)`);
            }
            rowCountInput.value = 1;
        } else {
            if (window.Toast) {
                Toast.error('앱이 초기화되지 않았습니다.');
            } else {
                alert('앱이 초기화되지 않았습니다.');
            }
        }
    }
}

function removeUserRow(index) {
    if (window.userManager) {
        window.userManager.removeUserRow(index);
    } else {
        // userManager가 없을 경우 직접 처리
        const tbody = document.getElementById('user-table-body');
        if (tbody) {
            const rows = tbody.querySelectorAll('.user-row');
            if (rows.length > 1 && index < rows.length) {
                if (confirm('이 행을 삭제하시겠습니까?')) {
                    rows[index].remove();
                    if (window.Toast) {
                        Toast.success('행이 삭제되었습니다.');
                    }
                }
            } else if (rows.length <= 1) {
                if (window.Toast) {
                    Toast.warning('최소 하나의 행은 유지해야 합니다.');
                } else {
                    alert('최소 하나의 행은 유지해야 합니다.');
                }
            }
        }
    }
}

function clearUserTable() {
    if (window.userManager) window.userManager.clearUserTable();
}

function changePage(direction) {
    if (window.userManager) window.userManager.changePage(direction);
}

function registerUsers() {
    if (window.userManager) window.userManager.registerUsers();
}

function retryFailedUsers() {
    if (window.userManager) {
        window.userManager.retryFailedUsers();
    } else {
        Toast.error('사용자 관리자가 초기화되지 않았습니다.');
    }
}

function downloadCSVTemplate() {
    console.log('downloadCSVTemplate 전역 함수 호출됨');
    if (window.userManager) {
        console.log('userManager 존재함, 다운로드 실행');
        window.userManager.downloadCSVTemplate();
    } else {
        console.log('userManager가 존재하지 않음, 직접 실행');
        // userManager가 없을 경우 직접 실행
        try {
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
                URL.revokeObjectURL(url);
                
                if (window.Toast) {
                    Toast.success('템플릿이 다운로드되었습니다.', '다운로드 완료');
                } else {
                    alert('템플릿이 다운로드되었습니다.');
                }
            } else {
                if (window.Toast) {
                    Toast.error('다운로드가 지원되지 않는 브라우저입니다.');
                } else {
                    alert('다운로드가 지원되지 않는 브라우저입니다.');
                }
            }
        } catch (error) {
            console.error('템플릿 다운로드 오류:', error);
            if (window.Toast) {
                Toast.error('템플릿 다운로드 중 오류가 발생했습니다.');
            } else {
                alert('템플릿 다운로드 중 오류가 발생했습니다.');
            }
        }
    }
}

function downloadResults() {
    if (window.userManager) {
        window.userManager.downloadResults();
    } else {
        Toast.error('사용자 관리자가 초기화되지 않았습니다.');
    }
}

function addDummyData(count = 1000) {
    console.log('addDummyData 전역 함수 호출됨, 개수:', count);
    console.log('window.userManager:', window.userManager);
    console.log('window.app:', window.app);
    
    if (window.userManager) {
        console.log('userManager를 통해 더미 데이터 추가 실행');
        window.userManager.addDummyData(count);
    } else {
        console.log('userManager가 없음, 직접 실행 시도');
        if (window.app) {
            console.log('app 객체가 있음, 직접 더미 데이터 추가');
            // 직접 더미 데이터 추가 로직
            const surnames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '전', '고'];
            const givenNames = ['민수', '지영', '현우', '서연', '준호', '수진', '동현', '미영', '성민', '예진', '태현', '지현', '민호', '지은', '준영', '서현', '민지', '현수', '지우', '서준'];
            const domains = ['gmail.com', 'naver.com', 'daum.net', 'yahoo.com', 'hotmail.com', 'company.com', 'test.com'];
            
            const dummyUsers = [];
            for (let i = 1; i <= count; i++) {
                const surname = surnames[Math.floor(Math.random() * surnames.length)];
                const givenName = givenNames[Math.floor(Math.random() * givenNames.length)];
                const name = surname + givenName;
                const domain = domains[Math.floor(Math.random() * domains.length)];
                const loginId = `user${i.toString().padStart(4, '0')}`;
                const email = `${loginId}@${domain}`;
                
                dummyUsers.push({
                    email: email,
                    loginId: loginId,
                    name: name,
                    result: ''
                });
            }
            
            window.app.allUsers = [...window.app.allUsers, ...dummyUsers];
            console.log('직접 추가 완료, 총 사용자 수:', window.app.allUsers.length);
            
            if (window.Toast) {
                const totalPages = Math.ceil(window.app.allUsers.length / window.app.usersPerPage);
                Toast.success(`${count}개의 더미 데이터가 추가되었습니다! (총 ${window.app.allUsers.length}개, ${totalPages}페이지)`, '더미 데이터 추가 완료');
            }
        } else {
            Toast.error('사용자 관리자가 초기화되지 않았습니다.');
        }
    }
}
