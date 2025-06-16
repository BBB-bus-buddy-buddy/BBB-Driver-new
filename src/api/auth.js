// src/api/auth.js
import apiClient from './client';

export const authAPI = {
  /**
   * 사용자 정보 조회
   * GET /api/auth/user
   * Response: ApiResponse<Map<String, Object>>
   */
  getUser: () => {
    return apiClient.get('/api/auth/user');
  },

  /**
   * 로그아웃
   * POST /api/auth/logout
   * Response: ApiResponse<Boolean>
   */
  logout: () => {
    return apiClient.post('/api/auth/logout');
  },

  /**
   * 드라이버 권한 업그레이드 (게스트 → 드라이버)
   * POST /api/auth/upgrade-to-driver
   * @param {Object} data - DriverUpgradeRequestDTO
   * @param {string} data.organizationId - 조직 ID
   * @param {string} data.identity - 주민등록번호
   * @param {string} data.birthDate - 생년월일
   * @param {string} data.phoneNumber - 전화번호
   * @param {string} data.licenseNumber - 운전면허번호
   * @param {string} data.licenseSerial - 면허 일련번호
   * @param {string} data.licenseType - 면허 종류
   * @param {string} data.licenseExpiryDate - 면허 만료일
   * Response: ApiResponse<Driver>
   */
  upgradeToDriver: (data) => {
    return apiClient.post('/api/auth/upgrade-to-driver', data);
  }
};