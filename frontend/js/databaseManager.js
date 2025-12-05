// 데이터베이스 관리 모듈
class DatabaseManager {
    constructor(app) {
        this.app = app;
        this.allDatabases = [];
        this.currentPageNumber = 1;
        this.databasesPerPage = 20;
    }

    init() {
        this.setupCSVImport();
        this.setupForm();
        this.updateDatabaseTable();
        this.updateDatabaseCount();
    }

    setupCSVImport() {
        const fileArea = document.getElementById('database-csv-import-area');
        const fileInput = document.getElementById('database-csv-import-file');
        
        if (!fileArea || !fileInput) return;
        
        // 클릭 이벤트
        fileArea.addEventListener('click', () => fileInput.click());
        
        // 파일 선택 이벤트
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                this.handleFileSelect(file);
            }
        });
        
        // 드래그 앤 드롭 이벤트
        fileArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            fileArea.classList.add('dragover');
        });
        
        fileArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            fileArea.classList.remove('dragover');
        });
        
        fileArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            fileArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0 && (files[0].type === 'text/csv' || files[0].name.endsWith('.csv'))) {
                this.handleFileSelect(files[0]);
            } else {
                Toast.error('CSV 파일만 업로드할 수 있습니다.');
            }
        });
    }

    handleFileSelect(file) {
        const fileText = document.getElementById('database-csv-file-text');
        if (fileText) {
            fileText.textContent = `선택된 파일: ${file.name}`;
        }
        this.importCSVFile(file);
    }

    importCSVFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                let csvData = e.target.result;
                if (csvData.charCodeAt(0) === 0xFEFF) {
                    csvData = csvData.slice(1);
                }
                
                const databases = this.parseCSVData(csvData);
                
                if (databases.length === 0) {
                    Toast.error('CSV 파일에 유효한 데이터베이스 데이터가 없습니다.');
                    return;
                }
                
                // 기존 데이터 초기화하고 새 데이터로 교체
                this.allDatabases = databases;
                this.currentPageNumber = 1;
                
                this.updateDatabaseTable();
                this.updateDatabaseCount();
                
                Toast.success(`${databases.length}개의 데이터베이스가 import되었습니다.`, 'CSV Import 성공');
                
            } catch (error) {
                console.error('CSV 파싱 오류:', error);
                Toast.error('CSV 파일을 읽는 중 오류가 발생했습니다.');
            }
        };
        reader.onerror = () => {
            Toast.error('CSV 파일을 읽는 중 오류가 발생했습니다.');
        };
        reader.readAsText(file, 'UTF-8');
    }

    parseCSVData(csvData) {
        const lines = csvData.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const rowData = [];

        // 먼저 모든 행을 파싱
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length >= 4) {
                const row = {};
                headers.forEach((header, index) => {
                    if (values[index]) {
                        switch (header) {
                            case 'name':
                                row.name = values[index];
                                break;
                            case 'databasetype':
                            case 'database_type':
                            case 'type':
                                // databaseType 유효성 검사
                                const dbType = values[index];
                                const validDbTypes = ['Mysql', 'MariaDB', 'PostgreSQL', 'Redshift', 'SQLServer', 'AzureSQL', 'Oracle', 'Tibero', 'MongoDB', 'BigQuery', 'Presto', 'Trino', 'Hive', 'Cassandra', 'DynamoDB', 'Snowflake', 'Impala', 'Redis', 'SingleStore', 'Hana', 'CustomDataSource'];
                                if (validDbTypes.includes(dbType)) {
                                    row.databaseType = dbType;
                                } else {
                                    // MySQL -> Mysql 변환 등
                                    const typeMap = {
                                        'mysql': 'Mysql',
                                        'postgresql': 'PostgreSQL',
                                        'postgres': 'PostgreSQL',
                                        'mariadb': 'MariaDB',
                                        'oracle': 'Oracle',
                                        'mongodb': 'MongoDB'
                                    };
                                    row.databaseType = typeMap[dbType.toLowerCase()] || 'PostgreSQL'; // 기본값
                                }
                                break;
                            case 'username':
                            case 'user_name':
                            case 'user':
                                row.userName = values[index];
                                break;
                            case 'password':
                            case 'pass':
                                row.password = values[index];
                                break;
                            case 'host':
                                row.host = values[index];
                                break;
                            case 'port':
                                row.port = parseInt(values[index]) || values[index];
                                break;
                            case 'clustertype':
                            case 'cluster_type':
                                // Cluster Type 유효성 검사
                                const clusterType = values[index];
                                const validClusterTypes = ['Primary', 'Secondary', 'Single'];
                                if (validClusterTypes.includes(clusterType)) {
                                    row.clusterType = clusterType;
                                } else {
                                    const typeUpper = clusterType.charAt(0).toUpperCase() + clusterType.slice(1).toLowerCase();
                                    row.clusterType = validClusterTypes.includes(typeUpper) ? typeUpper : 'Single'; // 기본값
                                }
                                break;
                        }
                    }
                });
                
                // 필수 필드 검증: name, databaseType, userName, password, host, port, clusterType
                if (row.name && row.databaseType && row.userName && row.password && row.host && row.port && row.clusterType) {
                    rowData.push(row);
                }
            }
        }

        // 같은 name을 가진 행들을 그룹화하여 하나의 DB Connection으로 묶기
        const dbMap = new Map();
        
        rowData.forEach(row => {
            const key = `${row.name}_${row.databaseType}_${row.userName}`;
            
            if (!dbMap.has(key)) {
                // 첫 번째 행의 정보로 DB Connection 생성
                dbMap.set(key, {
                    name: row.name,
                    databaseType: row.databaseType,
                    userName: row.userName,
                    password: row.password,
                    clusters: [],
                    result: ''
                });
            }
            
            // 클러스터 정보 추가
            const db = dbMap.get(key);
            db.clusters.push({
                host: row.host,
                port: row.port,
                clusterType: row.clusterType
            });
        });

        // Map을 배열로 변환
        return Array.from(dbMap.values());
    }

    updateDatabaseTable() {
        const tbody = document.getElementById('database-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (this.allDatabases.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align: center; padding: 40px; color: #6c757d;">
                        CSV 파일을 import하여 데이터베이스 정보를 표시하세요.
                    </td>
                </tr>
            `;
            return;
        }
        
        let globalIndex = 0;
        this.allDatabases.forEach((db, index) => {
            // 각 클러스터를 별도 행으로 표시 (같은 DB Connection 정보 반복 표시)
            db.clusters.forEach((cluster, clusterIndex) => {
                const row = document.createElement('tr');
                row.className = 'user-row';
                globalIndex++;
                
                // 첫 번째 클러스터만 순번 표시
                const displayIndex = clusterIndex === 0 ? globalIndex - clusterIndex : '';
                
                row.innerHTML = `
                    <td class="row-number">${displayIndex}</td>
                    <td>${db.name || ''}</td>
                    <td>${db.databaseType || ''}</td>
                    <td>${db.userName || ''}</td>
                    <td>${'*'.repeat(db.password ? db.password.length : 0)}</td>
                    <td>${cluster.host || ''}</td>
                    <td>${cluster.port || ''}</td>
                    <td>${cluster.clusterType || ''}</td>
                    <td class="result-cell">
                        ${clusterIndex === 0 ? `
                            <span class="result-status ${db.result ? (db.result === 'success' ? 'success' : db.result === 'error' ? 'error' : db.result === 'processing' ? 'processing' : '') : ''}">
                                ${db.result === 'success' ? '성공' : db.result === 'error' ? '실패' : db.result === 'processing' ? '진행중...' : ''}
                            </span>
                        ` : ''}
                    </td>
                    <td>
                        ${clusterIndex === 0 && db.result === 'error' ? `
                            <button type="button" class="btn-retry-single" data-index="${index}" title="이 항목만 재전송">
                                <i class="fas fa-redo"></i>
                            </button>
                        ` : ''}
                    </td>
                `;
                tbody.appendChild(row);
            });
        });
        
        tbody.querySelectorAll('.btn-retry-single').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('.btn-retry-single').dataset.index);
                this.retrySingleDatabase(index);
            });
        });
    }

    updateDatabaseCount() {
        const countElement = document.getElementById('database-count');
        if (countElement) {
            countElement.textContent = `총 ${this.allDatabases.length}개`;
        }
    }

    getCurrentPageDatabases() {
        // allDatabases에서 직접 가져오기 (clusters 배열이 있는 것들)
        return this.allDatabases.filter(db => 
            db.name && db.databaseType && db.userName && db.password && db.clusters && db.clusters.length > 0
        );
    }

    setupForm() {
        const form = document.getElementById('database-form');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.uploadDatabases();
        });
    }

    async uploadDatabases() {
        const targetUrl = document.getElementById('database-target-url').value;
        const token = document.getElementById('database-token').value;
        
        if (!targetUrl || !token) {
            Toast.error('대상 URL과 API Token을 모두 입력해주세요.');
            return;
        }
        
        const databases = this.getCurrentPageDatabases();
        
        if (databases.length === 0) {
            Toast.warning('등록할 데이터베이스 정보가 없습니다. CSV 파일을 먼저 import해주세요.');
            return;
        }
        
        const submitBtn = document.querySelector('#database-form .submit-btn');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = '<div class="loading"></div> 등록 중...';
        submitBtn.disabled = true;
        
        try {
            const results = [];
            for (let i = 0; i < databases.length; i++) {
                const db = databases[i];
                const dbIndex = this.allDatabases.findIndex(d => 
                    d.name === db.name && d.databaseType === db.databaseType && d.userName === db.userName
                );
                
                if (dbIndex === -1) continue;
                
                this.allDatabases[dbIndex].result = 'processing';
                this.updateDatabaseTable();
                
                try {
                    // Create DB Connection API 스펙에 맞게 데이터 변환
                    // clusters 배열에 모든 클러스터 정보 포함
                    const requestData = {
                        name: db.name,
                        databaseType: db.databaseType,
                        userName: db.userName,
                        password: db.password,
                        hideCredential: false,
                        useProxy: true,
                        proxyAuthType: 'QUERYPIE', // QUERYPIE 또는 MANUAL
                        maxDisplayRows: -1,
                        maxExportRows: -1,
                        useFixedCredentialForAgent: false,
                        clusters: db.clusters.map(cluster => ({
                            host: cluster.host,
                            port: parseInt(cluster.port),
                            type: cluster.clusterType
                        })),
                        connectionAccount: {
                            type: 'UIDPWD',
                            useMultipleDatabaseAccount: false,
                            usernamePasswords: {
                                common: {
                                    username: db.userName,
                                    password: db.password
                                }
                            }
                        }
                    };
                    
                    // 백엔드 프록시를 통해 API 호출
                    const apiUrl = '/api/databases';
                    
                    const requestBody = {
                        targetUrl: targetUrl,
                        ...requestData
                    };
                    
                    console.log(`[DB 등록] 요청 URL: ${apiUrl}`);
                    console.log(`[DB 등록] 요청 데이터:`, requestData);
                    console.log(`[DB 등록] 전체 요청 body:`, JSON.stringify(requestBody, null, 2));
                    console.log(`[DB 등록] proxyAuthType 포함 여부:`, 'proxyAuthType' in requestBody, requestBody.proxyAuthType);
                    console.log(`[DB 등록] DB 정보:`, db);
                    
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': token
                        },
                        body: JSON.stringify(requestBody)
                    });
                    
                    console.log(`[DB 등록] 응답 상태: ${response.status} ${response.statusText}`);
                    console.log(`[DB 등록] 응답 OK: ${response.ok}`);
                    
                    let result;
                    try {
                        const responseText = await response.text();
                        console.log(`[DB 등록] 응답 본문:`, responseText);
                        result = responseText ? JSON.parse(responseText) : {};
                    } catch (parseError) {
                        console.error(`[DB 등록] JSON 파싱 오류:`, parseError);
                        result = { message: '응답 파싱 실패' };
                    }
                    
                    console.log(`[DB 등록] 파싱된 결과:`, result);
                    
                    const resultStatus = response.ok ? 'success' : 'error';
                    this.allDatabases[dbIndex].result = resultStatus;
                    this.allDatabases[dbIndex].resultMessage = result.message || result.error || (response.ok ? '성공' : `HTTP ${response.status}: ${response.statusText}`);
                    results.push({ db, result: { success: response.ok, message: result.message || result.error || '' } });
                } catch (error) {
                    console.error(`[DB 등록] 예외 발생:`, error);
                    console.error(`[DB 등록] 에러 스택:`, error.stack);
                    this.allDatabases[dbIndex].result = 'error';
                    this.allDatabases[dbIndex].resultMessage = error.message || '알 수 없는 오류';
                    results.push({ db, result: { success: false, message: error.message } });
                }
                
                this.updateDatabaseTable();
            }
            
            const successCount = results.filter(r => r.result.success).length;
            const failCount = results.length - successCount;
            
            if (failCount === 0) {
                Toast.success(`${successCount}개의 DB Connection이 성공적으로 등록되었습니다.`, '등록 완료');
            } else {
                Toast.warning(`${successCount}개 성공, ${failCount}개 실패`, '등록 결과');
            }
            
            this.updateRetryButton();
            
        } catch (error) {
            console.error('데이터베이스 등록 오류:', error);
            Toast.error('데이터베이스 등록 중 오류가 발생했습니다: ' + error.message, '등록 오류');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    updateRetryButton() {
        const retryBtn = document.querySelector('.btn-retry');
        if (!retryBtn) return;
        
        const failedDatabases = this.allDatabases.filter(db => 
            db.result === 'error' && db.name && db.databaseType && db.userName && db.password && db.clusters && db.clusters.length > 0
        );
        
        if (failedDatabases.length > 0) {
            retryBtn.style.display = 'inline-flex';
            retryBtn.innerHTML = `<i class="fas fa-redo"></i> 실패 항목 재전송 (${failedDatabases.length}개)`;
        } else {
            retryBtn.style.display = 'none';
        }
    }

    async retryFailedDatabases() {
        const targetUrl = document.getElementById('database-target-url').value;
        const token = document.getElementById('database-token').value;
        
        if (!targetUrl || !token) {
            Toast.error('대상 URL과 API Token을 모두 입력해주세요.');
            return;
        }
        
        const failedDatabases = this.allDatabases.filter(db => 
            db.result === 'error' && db.name && db.databaseType && db.userName && db.password && db.clusters && db.clusters.length > 0
        );
        
        if (failedDatabases.length === 0) {
            Toast.info('재전송할 실패 항목이 없습니다.');
            return;
        }
        
        const retryBtn = document.querySelector('.btn-retry');
        const originalText = retryBtn.innerHTML;
        
        retryBtn.innerHTML = '<div class="loading"></div> 재전송 중...';
        retryBtn.disabled = true;
        
        try {
            for (let i = 0; i < failedDatabases.length; i++) {
                const db = failedDatabases[i];
                const dbIndex = this.allDatabases.findIndex(d => 
                    d.name === db.name && d.databaseType === db.databaseType && d.userName === db.userName
                );
                
                if (dbIndex === -1) continue;
                
                this.allDatabases[dbIndex].result = 'processing';
                this.updateDatabaseTable();
                
                try {
                    const requestData = {
                        name: db.name,
                        databaseType: db.databaseType,
                        hideCredential: false,
                        useProxy: true,
                        proxyAuthType: 'QUERYPIE', // QUERYPIE 또는 MANUAL
                        maxDisplayRows: -1,
                        maxExportRows: -1,
                        useFixedCredentialForAgent: false,
                        clusters: db.clusters.map(cluster => ({
                            host: cluster.host,
                            port: parseInt(cluster.port),
                            type: cluster.clusterType
                        })),
                        connectionAccount: {
                            type: 'UIDPWD',
                            useMultipleDatabaseAccount: false,
                            usernamePasswords: {
                                common: {
                                    username: db.userName || '',
                                    password: db.password || ''
                                }
                            }
                        }
                    };
                    
                    // userName과 password가 있으면 최상위 레벨에도 포함 (선택사항)
                    if (db.userName) requestData.userName = db.userName;
                    if (db.password) requestData.password = db.password;
                    
                    const apiUrl = '/api/databases';
                    
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': token
                        },
                        body: JSON.stringify({
                            targetUrl: targetUrl,
                            ...requestData
                        })
                    });
                    
                    const result = await response.json();
                    this.allDatabases[dbIndex].result = response.ok ? 'success' : 'error';
                    this.allDatabases[dbIndex].resultMessage = result.message || (response.ok ? '성공' : '실패');
                } catch (error) {
                    this.allDatabases[dbIndex].result = 'error';
                    this.allDatabases[dbIndex].resultMessage = error.message || '알 수 없는 오류';
                }
                
                this.updateDatabaseTable();
            }
            
            this.updateRetryButton();
            Toast.success('재전송이 완료되었습니다.', '재전송 완료');
            
        } catch (error) {
            console.error('재전송 오류:', error);
            Toast.error('재전송 중 오류가 발생했습니다: ' + error.message, '재전송 오류');
        } finally {
            retryBtn.innerHTML = originalText;
            retryBtn.disabled = false;
        }
    }

    async retrySingleDatabase(dbIndex) {
        const targetUrl = document.getElementById('database-target-url').value;
        const token = document.getElementById('database-token').value;
        
        if (!targetUrl || !token) {
            Toast.error('대상 URL과 API Token을 모두 입력해주세요.');
            return;
        }
        
        const db = this.allDatabases[dbIndex];
        if (!db || db.result !== 'error') {
            Toast.warning('재전송할 수 없는 항목입니다.');
            return;
        }
        
        this.allDatabases[dbIndex].result = 'processing';
        this.updateDatabaseTable();
        
        try {
            const requestData = {
                name: db.name,
                databaseType: db.databaseType,
                userName: db.userName,
                password: db.password,
                hideCredential: false,
                useProxy: true,
                proxyAuthType: 'QUERYPIE', // QUERYPIE 또는 MANUAL
                maxDisplayRows: -1,
                maxExportRows: -1,
                useFixedCredentialForAgent: false,
                clusters: db.clusters.map(cluster => ({
                    host: cluster.host,
                    port: parseInt(cluster.port),
                    type: cluster.clusterType
                })),
                connectionAccount: {
                    type: 'UIDPWD',
                    useMultipleDatabaseAccount: false,
                    usernamePasswords: {
                        common: {
                            username: db.userName,
                            password: db.password
                        }
                    }
                }
            };
            
            const apiUrl = '/api/databases';
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({
                    targetUrl: targetUrl,
                    ...requestData
                })
            });
            
            const result = await response.json();
            this.allDatabases[dbIndex].result = response.ok ? 'success' : 'error';
            this.allDatabases[dbIndex].resultMessage = result.message || (response.ok ? '성공' : '실패');
            
            this.updateDatabaseTable();
            this.updateRetryButton();
            
            if (response.ok) {
                Toast.success('DB Connection이 성공적으로 재전송되었습니다.', '재전송 완료');
            } else {
                Toast.error('재전송에 실패했습니다: ' + (result.message || '알 수 없는 오류'), '재전송 실패');
            }
            
        } catch (error) {
            console.error('개별 재전송 오류:', error);
            this.allDatabases[dbIndex].result = 'error';
            this.allDatabases[dbIndex].resultMessage = error.message || '알 수 없는 오류';
            this.updateDatabaseTable();
            Toast.error('재전송 중 오류가 발생했습니다: ' + error.message, '재전송 오류');
        }
    }

    downloadCSVTemplate() {
        try {
            // Create DB Connection API 스펙에 맞춘 템플릿
            // 같은 name을 가진 여러 행을 입력하면 하나의 DB Connection에 여러 클러스터가 추가됩니다.
            // userName과 password는 선택사항입니다.
            const csvContent = '\uFEFFname,databaseType,userName,password,host,port,clusterType\nproduction_db,PostgreSQL,admin,password123,db1.example.com,5432,Primary\nproduction_db,PostgreSQL,admin,password123,db2.example.com,5432,Secondary\ntest_db,MySQL,user,pass456,test-db.example.com,3306,Single\ndev_db,MongoDB,dev_user,dev_pass789,dev-db.example.com,27017,Primary';
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');

            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', 'database_template.csv');
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
}

// 전역 함수
function downloadDatabaseTemplate() {
    if (window.databaseManager) {
        window.databaseManager.downloadCSVTemplate();
    }
}

function retryFailedDatabases() {
    if (window.databaseManager) {
        window.databaseManager.retryFailedDatabases();
    }
}

// 전역 초기화
let databaseManager;

document.addEventListener('DOMContentLoaded', function() {
    if (typeof app !== 'undefined') {
        window.databaseManager = new DatabaseManager(app);
        window.databaseManager.init();
    }
});
