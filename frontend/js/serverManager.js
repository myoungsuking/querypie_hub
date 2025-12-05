// 서버 관리 모듈
class ServerManager {
    constructor(app) {
        this.app = app;
        this.allServers = [];
        this.currentPageNumber = 1;
        this.serversPerPage = 20;
    }

    init() {
        this.setupCSVImport();
        this.setupForm();
        this.updateServerTable();
        this.updateServerCount();
    }

    setupCSVImport() {
        const fileArea = document.getElementById('server-csv-import-area');
        const fileInput = document.getElementById('server-csv-import-file');
        
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
            if (files.length > 0 && files[0].type === 'text/csv' || files[0].name.endsWith('.csv')) {
                this.handleFileSelect(files[0]);
            } else {
                Toast.error('CSV 파일만 업로드할 수 있습니다.');
            }
        });
    }

    handleFileSelect(file) {
        const fileText = document.getElementById('server-csv-file-text');
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
                
                const servers = this.parseCSVData(csvData);
                
                if (servers.length === 0) {
                    Toast.error('CSV 파일에 유효한 서버 데이터가 없습니다.');
                    return;
                }
                
                // 기존 데이터 초기화하고 새 데이터로 교체
                this.allServers = servers;
                this.currentPageNumber = 1;
                
                this.updateServerTable();
                this.updateServerCount();
                
                Toast.success(`${servers.length}개의 서버가 import되었습니다.`, 'CSV Import 성공');
                
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
        const servers = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length >= 3) {
                const server = {};
                headers.forEach((header, index) => {
                    if (values[index]) {
                        switch (header) {
                            case 'name':
                                server.name = values[index];
                                server.hostname = values[index]; // 호환성 유지
                                break;
                            case 'host':
                                server.host = values[index];
                                server.ip = values[index]; // 호환성 유지
                                break;
                            case 'sshport':
                            case 'ssh_port':
                                server.sshPort = values[index];
                                server.port = values[index]; // 호환성 유지
                                break;
                            case 'ostype':
                            case 'os_type':
                            case 'os':
                                // OS Type을 대문자로 변환하고 유효성 검사
                                const osType = values[index].toUpperCase();
                                const validOsTypes = ['ETC', 'AWS_LINUX', 'UBUNTU', 'CENTOS', 'RHEL', 'WINDOWS'];
                                if (validOsTypes.includes(osType)) {
                                    server.osType = osType;
                                    server.os = osType; // 호환성 유지
                                } else {
                                    // 매핑 시도
                                    const osMap = {
                                        'LINUX': 'ETC',
                                        'AWS': 'AWS_LINUX',
                                        'REDHAT': 'RHEL'
                                    };
                                    server.osType = osMap[osType] || 'ETC';
                                    server.os = server.osType; // 호환성 유지
                                }
                                break;
                            // 이전 형식 호환성
                            case 'hostname':
                                if (!server.name) server.name = values[index];
                                server.hostname = values[index];
                                break;
                            case 'ip':
                                if (!server.host) server.host = values[index];
                                server.ip = values[index];
                                break;
                            case 'port':
                                if (!server.sshPort) server.sshPort = values[index];
                                server.port = values[index];
                                break;
                        }
                    }
                });
                
                // 필수 필드 검증: name, host, sshPort, osType
                if (server.name && server.host && server.sshPort && server.osType) {
                    server.result = '';
                    servers.push(server);
                }
            }
        }

        return servers;
    }

    updateServerTable() {
        const tbody = document.getElementById('server-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (this.allServers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px; color: #6c757d;">
                        CSV 파일을 import하여 서버 정보를 표시하세요.
                    </td>
                </tr>
            `;
            return;
        }
        
        this.allServers.forEach((server, index) => {
            const row = document.createElement('tr');
            row.className = 'user-row';
            const globalIndex = index + 1;
            
            // OS Type select 옵션 생성
            const osTypes = ['ETC', 'AWS_LINUX', 'UBUNTU', 'CENTOS', 'RHEL', 'WINDOWS'];
            const osOptions = osTypes.map(os => 
                `<option value="${os}" ${server.os === os ? 'selected' : ''}>${os}</option>`
            ).join('');
            
            row.innerHTML = `
                <td class="row-number">${globalIndex}</td>
                <td>${server.name || server.hostname || ''}</td>
                <td>${server.host || server.ip || ''}</td>
                <td>${server.sshPort || server.port || ''}</td>
                <td>${server.osType || server.os || ''}</td>
                <td>-</td>
                <td class="result-cell">
                    <span class="result-status ${server.result ? (server.result === 'success' ? 'success' : server.result === 'error' ? 'error' : server.result === 'processing' ? 'processing' : '') : ''}">
                        ${server.result === 'success' ? '성공' : server.result === 'error' ? '실패' : server.result === 'processing' ? '진행중...' : ''}
                    </span>
                </td>
                <td>
                    ${server.result === 'error' ? `
                        <button type="button" class="btn-retry-single" data-index="${index}" title="이 항목만 재전송">
                            <i class="fas fa-redo"></i>
                        </button>
                    ` : ''}
                </td>
            `;
            tbody.appendChild(row);
        });
        
        tbody.querySelectorAll('.btn-retry-single').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('.btn-retry-single').dataset.index);
                this.retrySingleServer(index);
            });
        });
    }

    updateServerCount() {
        const countElement = document.getElementById('server-count');
        if (countElement) {
            countElement.textContent = `총 ${this.allServers.length}개`;
        }
    }

    getCurrentPageServers() {
        // allServers에서 직접 가져오기
        return this.allServers.filter(server => 
            (server.name || server.hostname) && (server.host || server.ip) && (server.sshPort || server.port) && (server.osType || server.os)
        );
    }

    setupForm() {
        const form = document.getElementById('server-form');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.uploadServers();
        });
    }

    async uploadServers() {
        const targetUrl = document.getElementById('server-target-url').value;
        const token = document.getElementById('server-token').value;
        
        if (!targetUrl || !token) {
            Toast.error('대상 URL과 API Token을 모두 입력해주세요.');
            return;
        }
        
        const servers = this.getCurrentPageServers();
        
        if (servers.length === 0) {
            Toast.warning('등록할 서버 정보가 없습니다. CSV 파일을 먼저 import해주세요.');
            return;
        }
        
        const submitBtn = document.querySelector('#server-form .submit-btn');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = '<div class="loading"></div> 등록 중...';
        submitBtn.disabled = true;
        
        try {
            const results = [];
            for (let i = 0; i < servers.length; i++) {
                const server = servers[i];
                const serverIndex = this.allServers.findIndex(s => 
                    (s.name || s.hostname) === (server.name || server.hostname) && 
                    (s.host || s.ip) === (server.host || server.ip) && 
                    (s.sshPort || s.port) === (server.sshPort || server.port)
                );
                
                if (serverIndex === -1) continue;
                
                this.allServers[serverIndex].result = 'processing';
                this.updateServerTable();
                
                try {
                    // Create Server API 스펙에 맞게 데이터 변환
                    // 필수 필드: name, host, sshPort, osType, ftpPort, telnetPort, vncPort
                    const requestData = {
                        name: server.name || server.hostname,
                        host: server.host || server.ip,
                        sshPort: parseInt(server.sshPort || server.port) || 22,
                        osType: server.osType || server.os || 'ETC',
                        ftpPort: parseInt(server.ftpPort) || 21,
                        telnetPort: parseInt(server.telnetPort) || 23,
                        vncPort: parseInt(server.vncPort) || 5900
                    };
                    
                    // 백엔드 프록시를 통해 API 호출
                    const apiUrl = '/api/servers';
                    
                    console.log(`[서버 등록] 요청 URL: ${apiUrl}`);
                    console.log(`[서버 등록] 요청 데이터:`, requestData);
                    console.log(`[서버 등록] 서버 정보:`, server);
                    
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
                    
                    console.log(`[서버 등록] 응답 상태: ${response.status} ${response.statusText}`);
                    console.log(`[서버 등록] 응답 OK: ${response.ok}`);
                    
                    let result;
                    try {
                        const responseText = await response.text();
                        console.log(`[서버 등록] 응답 본문:`, responseText);
                        result = responseText ? JSON.parse(responseText) : {};
                    } catch (parseError) {
                        console.error(`[서버 등록] JSON 파싱 오류:`, parseError);
                        result = { message: '응답 파싱 실패' };
                    }
                    
                    console.log(`[서버 등록] 파싱된 결과:`, result);
                    
                    const resultStatus = response.ok ? 'success' : 'error';
                    this.allServers[serverIndex].result = resultStatus;
                    this.allServers[serverIndex].resultMessage = result.message || result.error || (response.ok ? '성공' : `HTTP ${response.status}: ${response.statusText}`);
                    results.push({ server, result: { success: response.ok, message: result.message || result.error || '' } });
                } catch (error) {
                    console.error(`[서버 등록] 예외 발생:`, error);
                    console.error(`[서버 등록] 에러 스택:`, error.stack);
                    this.allServers[serverIndex].result = 'error';
                    this.allServers[serverIndex].resultMessage = error.message || '알 수 없는 오류';
                    results.push({ server, result: { success: false, message: error.message } });
                }
                
                this.updateServerTable();
            }
            
            const successCount = results.filter(r => r.result && r.result.success).length;
            const failCount = results.length - successCount;
            
            if (failCount === 0) {
                Toast.success(`${successCount}개의 서버가 성공적으로 등록되었습니다.`, '등록 완료');
            } else {
                Toast.warning(`${successCount}개 성공, ${failCount}개 실패`, '등록 결과');
            }
            
            this.updateRetryButton();
            
        } catch (error) {
            console.error('서버 등록 오류:', error);
            Toast.error('서버 등록 중 오류가 발생했습니다: ' + error.message, '등록 오류');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    updateRetryButton() {
        const retryBtn = document.querySelector('.btn-retry');
        if (!retryBtn) return;
        
        const failedServers = this.allServers.filter(server => 
            server.result === 'error' && server.hostname && server.ip && server.port && server.os && server.status
        );
        
        if (failedServers.length > 0) {
            retryBtn.style.display = 'inline-flex';
            retryBtn.innerHTML = `<i class="fas fa-redo"></i> 실패 항목 재전송 (${failedServers.length}개)`;
        } else {
            retryBtn.style.display = 'none';
        }
    }

    async retryFailedServers() {
        const targetUrl = document.getElementById('server-target-url').value;
        const token = document.getElementById('server-token').value;
        
        if (!targetUrl || !token) {
            Toast.error('대상 URL과 API Token을 모두 입력해주세요.');
            return;
        }
        
        const failedServers = this.allServers.filter(server => 
            server.result === 'error' && server.hostname && server.ip && server.port && server.os && server.status
        );
        
        if (failedServers.length === 0) {
            Toast.info('재전송할 실패 항목이 없습니다.');
            return;
        }
        
        const retryBtn = document.querySelector('.btn-retry');
        const originalText = retryBtn.innerHTML;
        
        retryBtn.innerHTML = '<div class="loading"></div> 재전송 중...';
        retryBtn.disabled = true;
        
        try {
            for (let i = 0; i < failedServers.length; i++) {
                const server = failedServers[i];
                const serverIndex = this.allServers.findIndex(s => 
                    (s.name || s.hostname) === (server.name || server.hostname) && 
                    (s.host || s.ip) === (server.host || server.ip) && 
                    (s.sshPort || s.port) === (server.sshPort || server.port)
                );
                
                if (serverIndex === -1) continue;
                
                this.allServers[serverIndex].result = 'processing';
                this.updateServerTable();
                
                try {
                    const requestData = {
                        name: server.name || server.hostname,
                        host: server.host || server.ip,
                        sshPort: parseInt(server.sshPort || server.port) || 22,
                        osType: server.osType || server.os || 'ETC'
                    };
                    
                    const apiUrl = '/api/servers';
                    
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
                    this.allServers[serverIndex].result = response.ok ? 'success' : 'error';
                    this.allServers[serverIndex].resultMessage = result.message || (response.ok ? '성공' : '실패');
                } catch (error) {
                    this.allServers[serverIndex].result = 'error';
                    this.allServers[serverIndex].resultMessage = error.message || '알 수 없는 오류';
                }
                
                this.updateServerTable();
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

    async retrySingleServer(serverIndex) {
        const targetUrl = document.getElementById('server-target-url').value;
        const token = document.getElementById('server-token').value;
        
        if (!targetUrl || !token) {
            Toast.error('대상 URL과 API Token을 모두 입력해주세요.');
            return;
        }
        
        const server = this.allServers[serverIndex];
        if (!server || server.result !== 'error') {
            Toast.warning('재전송할 수 없는 항목입니다.');
            return;
        }
        
        this.allServers[serverIndex].result = 'processing';
        this.updateServerTable();
        
                try {
                    const requestData = {
                        name: server.name || server.hostname,
                        host: server.host || server.ip,
                        sshPort: parseInt(server.sshPort || server.port) || 22,
                        osType: server.osType || server.os || 'ETC',
                        ftpPort: parseInt(server.ftpPort) || 21,
                        telnetPort: parseInt(server.telnetPort) || 23,
                        vncPort: parseInt(server.vncPort) || 5900
                    };
                    
                    const apiUrl = '/api/servers';
                    
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
            this.allServers[serverIndex].result = response.ok ? 'success' : 'error';
            this.allServers[serverIndex].resultMessage = result.message || (response.ok ? '성공' : '실패');
            
            this.updateServerTable();
            this.updateRetryButton();
            
            if (response.ok) {
                Toast.success('서버가 성공적으로 재전송되었습니다.', '재전송 완료');
            } else {
                Toast.error('재전송에 실패했습니다: ' + (result.message || '알 수 없는 오류'), '재전송 실패');
            }
            
        } catch (error) {
            console.error('개별 재전송 오류:', error);
            this.allServers[serverIndex].result = 'error';
            this.allServers[serverIndex].resultMessage = error.message || '알 수 없는 오류';
            this.updateServerTable();
            Toast.error('재전송 중 오류가 발생했습니다: ' + error.message, '재전송 오류');
        }
    }

    downloadCSVTemplate() {
        try {
            // API 스펙에 맞춘 템플릿: name,host,sshPort,osType
            // osType: ETC, AWS_LINUX, UBUNTU, CENTOS, RHEL, WINDOWS
            const csvContent = '\uFEFFname,host,sshPort,osType\nweb-server-01,192.168.1.10,22,UBUNTU\ndb-server-01,192.168.1.20,22,CENTOS\napp-server-01,192.168.1.30,22,RHEL';
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');

            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', 'server_template.csv');
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
function downloadServerTemplate() {
    if (window.serverManager) {
        window.serverManager.downloadCSVTemplate();
    }
}

function retryFailedServers() {
    if (window.serverManager) {
        window.serverManager.retryFailedServers();
    }
}

// 전역 초기화
let serverManager;

document.addEventListener('DOMContentLoaded', function() {
    if (typeof app !== 'undefined') {
        window.serverManager = new ServerManager(app);
        window.serverManager.init();
    }
});
