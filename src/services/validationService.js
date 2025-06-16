// src/services/validationService.js
import { organizationAPI, authAPI, prepareDriverUpgradeData } from '../api';
import { storage } from '../utils/storage';

export class ValidationService {
    /**
     * 조직 코드 검증
     */
    static async verifyOrganization(code) {
        try {
            const response = await organizationAPI.verifyOrganization(code);

            if (response.data?.data) {
                return {
                    success: true,
                    data: response.data.data,
                    message: response.data.message || '유효한 조직 코드입니다.'
                };
            }

            return {
                success: false,
                message: response.data?.message || '유효하지 않은 조직 코드입니다.'
            };
        } catch (error) {
            console.error('[ValidationService] 조직 코드 검증 오류:', error);

            // 오류 메시지 추출
            let errorMessage = '조직 코드 검증 중 오류가 발생했습니다.';

            if (error.response) {
                if (error.response.status === 404) {
                    errorMessage = '유효하지 않은 조직 코드입니다.';
                } else if (error.response.data?.message) {
                    errorMessage = error.response.data.message;
                }
            } else if (error.request) {
                errorMessage = '서버 연결에 실패했습니다. 네트워크 상태를 확인해주세요.';
            }

            return {
                success: false,
                message: errorMessage,
                error
            };
        }
    }

    /**
     * 게스트에서 운전자로 업그레이드
     */
    static async upgradeToDriver(data) {
        try {
            console.log('[ValidationService] 게스트 -> 운전자 권한 업그레이드 시작');

            // 데이터 준비
            const requestData = prepareDriverUpgradeData(data);

            const response = await authAPI.upgradeToDriver(requestData);

            console.log('[ValidationService] 업그레이드 응답:', response.data);

            if (response.data?.data) {
                // 성공 시 사용자 정보 업데이트
                await storage.setUserInfo(response.data.data);

                return {
                    success: true,
                    data: response.data.data,
                    message: response.data.message || '운전자 권한 업그레이드가 완료되었습니다.'
                };
            }

            return {
                success: false,
                message: response.data?.message || '운전자 업그레이드에 실패했습니다.'
            };
        } catch (error) {
            console.error('[ValidationService] 운전자 업그레이드 오류:', error);

            const errorMessage = error.response?.data?.message || 
                (error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');

            return {
                success: false,
                message: errorMessage,
                error
            };
        }
    }
}