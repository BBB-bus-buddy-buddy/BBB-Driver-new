import apiClient from './client';

// 상수 정의(백엔드에서도 정의 되어 있음)
const ORGANIZATION_CODE = "0001"; // 고정값
const LOGIN_TYPE = "5"; // 간편인증 고정값

/**
 * 운전면허 진위확인 API 호출을 처리하는 서비스
 */
export const verifyDriverLicense = async (verificationData) => {
  try {
    // 백엔드 API로 면허 검증 요청 전송
    const response = await apiClient.post('/api/driver/verify', verificationData);

    // 응답 처리
    if (response.data && response.data.data) {
      const resultData = response.data.data;

      if (resultData.resAuthenticity === "1" || resultData.resAuthenticity === "2") {
        console.log('[LicenseVerificationAPI] 면허 검증 성공:', resultData);
        return {
          success: true,
          data: resultData
        };
      } else {
        console.warn('[LicenseVerificationAPI] 면허 검증 실패:', resultData);
        return {
          success: false,
          message: resultData.resAuthenticityDesc1 || '면허 정보가 일치하지 않습니다.',
          data: resultData
        };
      }
    } else {
      console.error('[LicenseVerificationAPI] API 응답 오류:', response.data);
      return {
        success: false,
        message: response.data?.message || '면허 검증 중 오류가 발생했습니다.',
        data: response.data
      };
    }
  } catch (error) {
    console.error('[LicenseVerificationAPI] 면허 검증 API 오류:', error);
    return {
      success: false,
      message: error.response?.data?.message || '면허 검증 중 오류가 발생했습니다.',
      error
    };
  }
};

/**
 * 면허 검증 및 운전자 권한 승급 통합 API
 * @param {Object} formData 모든 폼 필드 데이터
 * @returns {Promise<Object>} API 응답
 */
export const verifyAndRankUpDriver = async (formData) => {
  try {
    // 백엔드 API로 면허 검증 및 권한 승급 요청 전송
    const response = await apiClient.post('/api/auth/driver-verify-and-rankup', formData);

    // 응답 처리
    return {
      success: response.data?.data !== null, // data 필드가 null이 아니면 성공
      message: response.data?.message || '처리 완료',
      data: response.data?.data
    };
  } catch (error) {
    console.error('[LicenseVerificationAPI] 면허 검증 및 권한 승급 API 오류:', error);
    return {
      success: false,
      message: error.response?.data?.message || '처리 중 오류가 발생했습니다.',
      error
    };
  }
};

/**
 * 검증 데이터 준비 헬퍼 함수
 * @param {Object} licenseData 면허 관련 사용자 입력 데이터
 * @returns {Object} API 요청용 데이터 객체
 */
export const prepareVerificationData = (licenseData) => {
  const {
    userName,
    identity,
    phoneNo,
    birthDate,
    licenseRegion,
    licenseYear,
    licenseUnique,
    licenseClass,
    serialNo,
    telecom,
    loginTypeLevel = DEFAULT_LOGIN_TYPE_LEVEL
  } = licenseData;

  // 주민등록번호에서 하이픈 제거
  const cleanIdentity = identity ? identity.replace(/-/g, '') : '';

  // 전화번호에서 하이픈 제거
  const cleanPhoneNo = phoneNo ? phoneNo.replace(/-/g, '') : '';

  return {
    organization: ORGANIZATION_CODE,
    loginType: LOGIN_TYPE,
    loginUserName: userName,
    identity: cleanIdentity,
    loginTypeLevel: loginTypeLevel,
    phoneNo: cleanPhoneNo,
    telecom: telecom,
    birthDate: birthDate,
    licenseNo01: licenseRegion,
    licenseNo02: licenseYear,
    licenseNo03: licenseUnique,
    licenseNo04: licenseClass,
    serialNo: serialNo,
    userName: userName
  };
};