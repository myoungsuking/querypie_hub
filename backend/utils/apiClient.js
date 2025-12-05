const axios = require('axios');

// 외부 API 호출 유틸리티
class ApiClient {
    static async callExternalAPI(url, data, authorization) {
        try {
            console.log(`[ApiClient] 외부 API 호출: ${url}`);
            console.log(`[ApiClient] 요청 데이터:`, JSON.stringify(data, null, 2));
            
            const response = await axios.post(url, data, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authorization
                },
                timeout: 30000
            });

            console.log(`[ApiClient] 응답 상태: ${response.status}`);
            console.log(`[ApiClient] 응답 데이터:`, JSON.stringify(response.data, null, 2));

            return {
                success: true,
                data: response.data,
                status: response.status,
                message: response.data?.message || '성공'
            };
        } catch (error) {
            console.error('[ApiClient] 외부 API 호출 오류:', error.message);
            console.error('[ApiClient] 응답 상태:', error.response?.status);
            console.error('[ApiClient] 응답 데이터:', error.response?.data);
            
            const errorMessage = error.response?.data?.message || 
                               error.response?.data?.error || 
                               error.message || 
                               '알 수 없는 오류';
            
            return {
                success: false,
                error: errorMessage,
                message: errorMessage,
                status: error.response?.status || 500,
                details: error.response?.data
            };
        }
    }
}

module.exports = ApiClient;
