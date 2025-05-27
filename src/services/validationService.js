// src/services/validationService.js
import { driverAPI, prepareVerificationData, authAPI } from '../api';
import { storage } from '../utils/storage';

export class ValidationService {
    /**
     * 운전면허 진위확인 (기존 verifyDriverLicense 로직)
     */
    static async verifyLicense(licenseData) {
        try {
            const verificationData = prepareVerificationData(licenseData);
            const response = await driverAPI.verifyLicense(verificationData);

            // 응답 처리
            if (response.data && response.data.data) {
                const resultData = response.data.data;

                if (resultData.resAuthenticity === "1" || resultData.resAuthenticity === "2") {
                    console.log('[ValidationService] 면허 검증 성공:', resultData);
                    return {
                        success: true,
                        data: resultData
                    };
                } else {
                    console.warn('[ValidationService] 면허 검증 실패:', resultData);
                    return {
                        success: false,
                        message: resultData.resAuthenticityDesc1 || '면허 정보가 일치하지 않습니다.',
                        data: resultData
                    };
                }
            } else {
                console.error('[ValidationService] API 응답 오류:', response.data);
                return {
                    success: false,
                    message: response.data?.message || '면허 검증 중 오류가 발생했습니다.',
                    data: response.data
                };
            }
        } catch (error) {
            console.error('[ValidationService] 면허 검증 API 오류:', error);
            return {
                success: false,
                message: error.response?.data?.message || '면허 검증 중 오류가 발생했습니다.',
                error
            };
        }
    }

    /**
     * 조직 코드 검증 (기존 verifyOrganizationCode 로직)
     */
    static async verifyOrganization(code) {
        try {
            const response = await driverAPI.verifyOrganization(code);

            // 응답이 정상적으로 왔다면 (상태 코드 200) 무조건 성공으로 처리
            // 백엔드에서 데이터를 ApiResponse 형태로 감싸서 주므로 response.data.data로 접근
            return {
                success: true,
                message: response.data?.message || '유효한 조직 코드입니다.',
                data: response.data?.data // Organization 객체가 여기에 있을 것
            };
        } catch (error) {
            console.error('[ValidationService] 조직 코드 검증 오류:', error);

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
    }

    /**
     * 면허 검증 및 운전자 권한 승급 통합 (기존 verifyAndRankUpDriver 로직)
     */
    static async verifyAndRankUp(formData) {
        try {
            // 백엔드 API로 면허 검증 및 권한 승급 요청 전송
            const response = await authAPI.verifyAndRankUpDriver(formData);

            // 응답 처리
            return {
                success: response.data?.data !== null, // data 필드가 null이 아니면 성공
                message: response.data?.message || '처리 완료',
                data: response.data?.data
            };
        } catch (error) {
            console.error('[ValidationService] 면허 검증 및 권한 승급 API 오류:', error);
            return {
                success: false,
                message: error.response?.data?.message || '처리 중 오류가 발생했습니다.',
                error
            };
        }
    }

    /**
     * 게스트에서 운전자로 업그레이드 (기존 driverService의 upgradeToDriver)
     */
    static async upgradeToDriver(data) {
        try {
            console.log('[ValidationService] 게스트 -> 운전자 권한 업그레이드 시작');

            const response = await authAPI.upgradeToDriver(data);

            console.log('[ValidationService] 업그레이드 응답:', response.data);

            if (response.data?.success) {
                // 성공 시 사용자 정보 업데이트
                if (response.data.data) {
                    await storage.setUserInfo(response.data.data);
                }

                return {
                    success: true,
                    message: response.data.message || '운전자 권한 업그레이드가 완료되었습니다.',
                    data: response.data.data
                };
            }

            return response.data;
        } catch (error) {
            console.error('[ValidationService] 운전자 업그레이드 오류:', error);

            // axios 에러 응답 처리
            const errorMessage = error.response?.data?.message ||
                (error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');

            return {
                success: false,
                message: errorMessage,
            };
        }
    }
}