const ApiClient = require('../utils/apiClient');

// 데이터베이스 컨트롤러
class DatabaseController {
    static async uploadDatabase(req, res) {
        try {
            const { targetUrl } = req.body;
            const authorization = req.headers.authorization;

            if (!targetUrl || !authorization) {
                return res.status(400).json({
                    success: false,
                    message: '대상 URL과 API Token이 필요합니다.'
                });
            }

            // UTF-8 인코딩으로 파일 읽기 (BOM 자동 제거)
            let fileData = req.body;
            if (req.file) {
                fileData = req.file.buffer.toString('utf8');
                // UTF-8 BOM 제거 (EF BB BF)
                if (fileData.charCodeAt(0) === 0xFEFF) {
                    fileData = fileData.slice(1);
                }
            }
            
            const result = await ApiClient.callExternalAPI(
                `${targetUrl}/api/external/v2/database`,
                fileData,
                authorization
            );

            res.json(result);
        } catch (error) {
            console.error('데이터베이스 업로드 오류:', error);
            res.status(500).json({
                success: false,
                message: '데이터베이스 업로드 중 오류가 발생했습니다.'
            });
        }
    }

    // Create DB Connection API 프록시
    static async createDBConnection(req, res) {
        try {
            console.log(`[DB Connection 생성 프록시] 받은 요청 body:`, JSON.stringify(req.body, null, 2));
            
            const { targetUrl, name, databaseType, userName, password, hideCredential, useProxy, proxyAuthType, maxDisplayRows, maxExportRows, useFixedCredentialForAgent, clusters, connectionAccount } = req.body;
            const authorization = req.headers.authorization;

            console.log(`[DB Connection 생성 프록시] 추출된 proxyAuthType:`, proxyAuthType);

            if (!targetUrl || !authorization) {
                return res.status(400).json({
                    success: false,
                    message: '대상 URL과 API Token이 필요합니다.'
                });
            }

            if (!name || !databaseType || !userName || !password || !clusters || !connectionAccount) {
                return res.status(400).json({
                    success: false,
                    message: 'name, databaseType, userName, password, clusters, connectionAccount가 모두 필요합니다.'
                });
            }

            const requestData = {
                name,
                databaseType,
                userName,
                password,
                hideCredential: hideCredential !== undefined ? hideCredential : false,
                useProxy: useProxy !== undefined ? useProxy : true,
                proxyAuthType: proxyAuthType || 'QUERYPIE', // QUERYPIE 또는 MANUAL
                maxDisplayRows: maxDisplayRows !== undefined ? maxDisplayRows : -1,
                maxExportRows: maxExportRows !== undefined ? maxExportRows : -1,
                useFixedCredentialForAgent: useFixedCredentialForAgent !== undefined ? useFixedCredentialForAgent : false,
                clusters: Array.isArray(clusters) ? clusters.map(cluster => ({
                    host: cluster.host,
                    port: parseInt(cluster.port),
                    type: cluster.type
                })) : [],
                connectionAccount: connectionAccount || {
                    type: 'UIDPWD',
                    useMultipleDatabaseAccount: false,
                    usernamePasswords: {
                        common: {
                            username: userName,
                            password: password
                        }
                    }
                }
            };

            const apiUrl = `${targetUrl}/api/external/v2/dac/connections`;

            console.log(`[DB Connection 생성 프록시] 요청 URL: ${apiUrl}`);
            console.log(`[DB Connection 생성 프록시] 요청 데이터:`, JSON.stringify(requestData, null, 2));

            const result = await ApiClient.callExternalAPI(
                apiUrl,
                requestData,
                authorization
            );

            if (result.success) {
                res.json({
                    success: true,
                    message: 'DB Connection이 성공적으로 생성되었습니다.',
                    data: result.data
                });
            } else {
                res.status(result.status || 500).json({
                    success: false,
                    message: result.error || 'DB Connection 생성에 실패했습니다.',
                    details: result.details
                });
            }
        } catch (error) {
            console.error('DB Connection 생성 프록시 오류:', error);
            res.status(500).json({
                success: false,
                message: 'DB Connection 생성 중 오류가 발생했습니다: ' + error.message
            });
        }
    }

    // 클러스터 생성 API 프록시 (하위 호환성 유지)
    static async createCluster(req, res) {
        try {
            const { targetUrl, clusterGroupUuid, host, port, type } = req.body;
            const authorization = req.headers.authorization;

            if (!targetUrl || !authorization) {
                return res.status(400).json({
                    success: false,
                    message: '대상 URL과 API Token이 필요합니다.'
                });
            }

            if (!clusterGroupUuid || !host || !port || !type) {
                return res.status(400).json({
                    success: false,
                    message: 'clusterGroupUuid, host, port, type이 모두 필요합니다.'
                });
            }

            const requestData = {
                host,
                port: parseInt(port),
                type
            };

            const apiUrl = `${targetUrl}/api/external/v2/dac/connections/${clusterGroupUuid}/clusters`;

            console.log(`[클러스터 생성 프록시] 요청 URL: ${apiUrl}`);
            console.log(`[클러스터 생성 프록시] 요청 데이터:`, requestData);

            const result = await ApiClient.callExternalAPI(
                apiUrl,
                requestData,
                authorization
            );

            if (result.success) {
                res.json({
                    success: true,
                    message: '클러스터가 성공적으로 생성되었습니다.',
                    data: result.data
                });
            } else {
                res.status(result.status || 500).json({
                    success: false,
                    message: result.error || '클러스터 생성에 실패했습니다.',
                    details: result.details
                });
            }
        } catch (error) {
            console.error('클러스터 생성 프록시 오류:', error);
            res.status(500).json({
                success: false,
                message: '클러스터 생성 중 오류가 발생했습니다: ' + error.message
            });
        }
    }
}

module.exports = DatabaseController;
