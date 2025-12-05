/* ============================================
   User CSV Handler Module
   CSV import/export 기능 담당
   ============================================ */

export class UserCSVHandler {
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
                this.app.currentPageNumber = 1;
                
                // 이벤트 발생 (외부에서 처리)
                if (this.onUsersImported) {
                    this.onUsersImported(newUsers.length, users.length);
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

    downloadResults(getCurrentPageUsers) {
        try {
            // 현재 테이블에서 실제 데이터 가져오기
            const currentUsers = getCurrentPageUsers();
            
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
}

