// src/api/OrganizationAPI.js
import apiClient from './client';

/**
 * 조직 코드 검증 API
 * @param {string} code 검증할 조직 코드
 * @returns {Promise<Object>} 검증 결과
 */
export const verifyOrganizationCode = async (code) => {
    try {
        const response = await apiClient.post('/api/organization/verify', { code });
        
        // 응답이 정상적으로 왔다면 (상태 코드 200) 무조건 성공으로 처리
        // 백엔드에서 데이터를 ApiResponse 형태로 감싸서 주므로 response.data.data로 접근
        return {
            success: true,
            message: response.data?.message || '유효한 조직 코드입니다.',
            data: response.data?.data // Organization 객체가 여기에 있을 것
        };
    } catch (error) {
        console.error('[OrganizationAPI] 조직 코드 검증 오류:', error);
        
        // 오류 메시지 추출 로직 (보다 상세하게)
        let errorMessage = '조직 코드 검증 중 오류가 발생했습니다.';
        
        if (error.response) {
            // 서버에서 응답을 받았지만 오류 상태 코드인 경우
            if (error.response.data) {
                // error.response.data가 객체인 경우 message 필드 추출
                if (typeof error.response.data === 'object' && error.response.data.message) {
                    errorMessage = error.response.data.message;
                } 
                // error.response.data가 문자열인 경우 그대로 사용
                else if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                }
            }
            
            // 특정 상태 코드에 따른 추가 처리
            if (error.response.status === 404) {
                errorMessage = '유효하지 않은 조직 코드입니다.';
            }
        } else if (error.request) {
            // 요청은 보냈지만 응답을 받지 못한 경우
            errorMessage = '서버 연결에 실패했습니다. 네트워크 상태를 확인해주세요.';
        }
        
        return {
            success: false,
            message: errorMessage,
            error: error
        };
    }
};

export default {
    verifyOrganizationCode,
};