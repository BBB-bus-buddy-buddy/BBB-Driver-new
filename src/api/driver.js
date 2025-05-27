// src/api/driver.js
import apiClient from './client';

// 상수 정의(백엔드에서도 정의 되어 있음)
const ORGANIZATION_CODE = "0001"; // 고정값
const LOGIN_TYPE = "5"; // 간편인증 고정값
const DEFAULT_LOGIN_TYPE_LEVEL = "1";

export const driverAPI = {
  /**
   * 운전면허 진위확인 API (기존 verifyDriverLicense)
   * @param {Object} verificationData 검증 데이터
   */
  verifyLicense: (verificationData) => {
    return apiClient.post('/api/driver/verify', verificationData);
  },

  /**
   * 조직 코드 검증 API (기존 verifyOrganizationCode)
   * @param {string} code 검증할 조직 코드
   */
  verifyOrganization: (code) => {
    return apiClient.post('/api/organization/verify', { code });
  },

  /**
   * 운행 시작
   * @param {Object} data 운행 시작 데이터
   */
  startDrive: (data) => {
    return apiClient.post('/api/drives/start', data);
  },

  /**
   * 운행 종료
   * @param {Object} data 운행 종료 데이터
   */
  endDrive: (data) => {
    return apiClient.post('/api/drives/end', data);
  },

  /**
   * 다음 운행 일정 조회
   * @param {Object} params 조회 파라미터
   */
  getNextDrive: (params) => {
    return apiClient.get('/api/drives/next', { params });
  },

  /**
   * 사용자 통계 조회
   */
  getUserStats: () => {
    return apiClient.get('/api/user/stats');
  },

  /**
   * 사용자 프로필 업데이트
   * @param {Object} profileData 프로필 데이터
   */
  updateProfile: (profileData) => {
    return apiClient.put('/api/user/profile', profileData);
  },

  /**
   * 면허 정보 업데이트
   * @param {Object} licenseData 면허 데이터
   */
  updateLicense: (licenseData) => {
    return apiClient.put('/api/user/license', licenseData);
  },

  /**
   * 면허 검증 상태 확인
   */
  checkLicenseVerification: () => {
    return apiClient.get('/api/user/license/verification-status');
  }
};

/**
 * 검증 데이터 준비 헬퍼 함수 (기존 prepareVerificationData)
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
    telecom: telecom || "2",
    birthDate: birthDate,
    licenseNo01: licenseRegion,
    licenseNo02: licenseYear,
    licenseNo03: licenseUnique,
    licenseNo04: licenseClass,
    serialNo: serialNo,
    userName: userName
  };
};