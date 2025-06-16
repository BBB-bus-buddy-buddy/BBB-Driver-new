// src/api/driver.js
import apiClient from './client';

export const driverAPI = {
  /**
   * 현재 운전자 정보 조회 (운전자 본인용)
   * GET /api/driver/me
   * Response: ApiResponse<Driver>
   */
  getCurrentDriver: () => {
    return apiClient.get('/api/driver/me');
  },

  /**
   * 운전자 프로필 업데이트
   * PUT /api/driver/profile
   * @param {Object} profileData - 프로필 데이터
   * Response: ApiResponse<Map<String, String>>
   */
  updateProfile: (profileData) => {
    return apiClient.put('/api/driver/profile', profileData);
  },

  /**
   * 운전자 면허 정보 업데이트
   * PUT /api/driver/license
   * @param {Object} licenseData - 면허 데이터
   * Response: ApiResponse<Map<String, String>>
   */
  updateLicense: (licenseData) => {
    return apiClient.put('/api/driver/license', licenseData);
  }
};

/**
 * 드라이버 업그레이드 데이터 준비 헬퍼 함수
 * @param {Object} data - 사용자 입력 데이터
 * @returns {Object} DriverUpgradeRequestDTO 형식의 데이터
 */
export const prepareDriverUpgradeData = (data) => {
  const {
    organizationId,
    identity,
    birthDate,
    phoneNumber,
    licenseNumber,
    licenseSerial,
    licenseType,
    licenseExpiryDate
  } = data;

  // 주민등록번호에서 하이픈 제거
  const cleanIdentity = identity ? identity.replace(/-/g, '') : '';
  
  // 전화번호에서 하이픈 제거
  const cleanPhoneNumber = phoneNumber ? phoneNumber.replace(/-/g, '') : '';

  return {
    organizationId,
    identity: cleanIdentity,
    birthDate,
    phoneNumber: cleanPhoneNumber,
    licenseNumber,
    licenseSerial,
    licenseType,
    licenseExpiryDate
  };
};