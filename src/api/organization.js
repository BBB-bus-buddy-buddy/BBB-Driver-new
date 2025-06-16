// src/api/organization.js
import apiClient from './client';

export const organizationAPI = {
  /**
   * 조직 코드 검증
   * POST /api/organization/verify
   * @param {string} code - 검증할 조직 코드
   * Response: ApiResponse<Organization>
   */
  verifyOrganization: (code) => {
    return apiClient.post('/api/organization/verify', { code });
  }
};