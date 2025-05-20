// src/api/OrganizationAPI.js
import apiClient from './apiClient';

/**
 * 조직 코드 검증 API
 * @param {string} code 검증할 조직 코드
 * @returns {Promise<Object>} 검증 결과
 */
export const verifyOrganizationCode = async (code) => {
    try {
        const response = await apiClient.post('/api/organization/verify', { code });

        if (response.data && response.data.success) {
            // 검증 성공
            return {
                success: true,
                message: response.data.message || '유효한 조직 코드입니다.',
                data: response.data.data
            };
        } else {
            // 서버에서 success: false로 응답한 경우
            return {
                success: false,
                message: response.data?.message || '유효하지 않은 조직 코드입니다.',
                data: null
            };
        }
    } catch (error) {
        console.error('[OrganizationAPI] 조직 코드 검증 오류:', error);

        // 서버에서 오류 응답을 보낸 경우
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || '조직 코드 검증 중 오류가 발생했습니다.',
                error
            };
        }

        // 네트워크 오류 등의 경우
        return {
            success: false,
            message: '서버 연결에 실패했습니다. 네트워크 상태를 확인해주세요.',
            error
        };
    }
};

export default {
    verifyOrganizationCode,
};