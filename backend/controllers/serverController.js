const ApiClient = require('../utils/apiClient');

// 서버 컨트롤러
class ServerController {
    static async uploadServer(req, res) {
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
                `${targetUrl}/api/external/v2/sac/servers`,
                fileData,
                authorization
            );

            res.json(result);
        } catch (error) {
            console.error('서버 업로드 오류:', error);
            res.status(500).json({
                success: false,
                message: '서버 업로드 중 오류가 발생했습니다.'
            });
        }
    }

    // 서버 생성 API 프록시
    static async createServer(req, res) {
        try {
            const { targetUrl, name, host, sshPort, osType } = req.body;
            const authorization = req.headers.authorization;

            if (!targetUrl || !authorization) {
                return res.status(400).json({
                    success: false,
                    message: '대상 URL과 API Token이 필요합니다.'
                });
            }

            if (!name || !host || !sshPort || !osType) {
                return res.status(400).json({
                    success: false,
                    message: 'name, host, sshPort, osType이 모두 필요합니다.'
                });
            }

            const requestData = {
                name,
                host,
                sshPort: parseInt(sshPort),
                osType,
                ftpPort: parseInt(req.body.ftpPort) || 21,
                telnetPort: parseInt(req.body.telnetPort) || 23,
                vncPort: parseInt(req.body.vncPort) || 5900
            };

            console.log(`[서버 생성 프록시] 요청 URL: ${targetUrl}/api/external/v2/sac/servers`);
            console.log(`[서버 생성 프록시] 요청 데이터:`, requestData);

            const result = await ApiClient.callExternalAPI(
                `${targetUrl}/api/external/v2/sac/servers`,
                requestData,
                authorization
            );

            if (result.success) {
                res.json({
                    success: true,
                    message: '서버가 성공적으로 생성되었습니다.',
                    data: result.data
                });
            } else {
                res.status(result.status || 500).json({
                    success: false,
                    message: result.error || '서버 생성에 실패했습니다.',
                    details: result.details
                });
            }
        } catch (error) {
            console.error('서버 생성 프록시 오류:', error);
            res.status(500).json({
                success: false,
                message: '서버 생성 중 오류가 발생했습니다: ' + error.message
            });
        }
    }
}

module.exports = ServerController;
