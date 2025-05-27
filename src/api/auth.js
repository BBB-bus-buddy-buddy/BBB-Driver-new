// src/api/auth.js
import apiClient from './client';

export const authAPI = {
  /**
   * 사용자 정보 조회
   */
  getUser: () => {
    return apiClient.get('/api/auth/user');
  },

  /**
   * 로그아웃
   */
  logout: () => {
    return apiClient.post('/api/auth/logout');
  },

  /**
   * 면허 검증 및 권한 승급 통합 API
   * @param {Object} formData 모든 폼 필드 데이터
   */
  verifyAndRankUpDriver: (formData) => {
    return apiClient.post('/api/auth/driver-verify-and-rankup', formData);
  },

  /**
   * 게스트에서 운전자로 권한 업그레이드
   * @param {Object} data 업그레이드 데이터
   */
  upgradeToDriver: (data) => {
    return apiClient.post('/api/auth/upgrade-to-driver', data);
  }
};