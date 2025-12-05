const ApiClient = require('../utils/apiClient');
const CsvParser = require('../utils/csvParser');

// 사용자 컨트롤러
class UserController {
    // 단일 사용자 등록
    static async registerUser(req, res) {
        try {
            const { email, loginId, name, password, targetUrl } = req.body;
            const authorization = req.headers.authorization;

            if (!email || !loginId || !name || !password || !targetUrl || !authorization) {
                return res.status(400).json({
                    success: false,
                    message: '모든 필수 필드와 API Token이 필요합니다.'
                });
            }

            const result = await ApiClient.callExternalAPI(
                `${targetUrl}/api/external/v2/users`,
                { email, loginId, name, password },
                authorization
            );

            res.json(result);
        } catch (error) {
            console.error('사용자 등록 오류:', error);
            res.status(500).json({
                success: false,
                message: '사용자 등록 중 오류가 발생했습니다.'
            });
        }
    }

    // CSV 일괄 사용자 등록
    static async registerUsersBulk(req, res) {
        try {
            const { targetUrl } = req.body;
            const authorization = req.headers.authorization;

            if (!req.file || !targetUrl || !authorization) {
                return res.status(400).json({
                    success: false,
                    message: 'CSV 파일, 대상 URL, API Token이 필요합니다.'
                });
            }

            // UTF-8 인코딩으로 파일 읽기 (BOM 자동 제거)
            let csvData = req.file.buffer.toString('utf8');
            // UTF-8 BOM 제거 (EF BB BF)
            if (csvData.charCodeAt(0) === 0xFEFF) {
                csvData = csvData.slice(1);
            }
            const users = CsvParser.parseCSV(csvData);

            if (users.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: '유효한 사용자 데이터가 없습니다.'
                });
            }

            const results = [];
            for (const user of users) {
                const result = await ApiClient.callExternalAPI(
                    `${targetUrl}/api/external/v2/users`,
                    user,
                    authorization
                );
                results.push({ user, result });
            }

            const successCount = results.filter(r => r.result.success).length;
            const failCount = results.length - successCount;

            res.json({
                success: failCount === 0,
                message: `${successCount}명 성공, ${failCount}명 실패`,
                results: results
            });
        } catch (error) {
            console.error('사용자 일괄 등록 오류:', error);
            res.status(500).json({
                success: false,
                message: '사용자 일괄 등록 중 오류가 발생했습니다.'
            });
        }
    }
}

module.exports = UserController;
