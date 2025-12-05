// 대시보드 컨트롤러
class DashboardController {
    static getDashboard(req, res) {
        try {
            res.json({
                success: true,
                message: 'HUB 시스템이 실행 중입니다.',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('대시보드 데이터 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '대시보드 데이터를 가져오는데 실패했습니다.'
            });
        }
    }
}

module.exports = DashboardController;
