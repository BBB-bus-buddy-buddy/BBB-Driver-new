// src/api/drive.js
import apiClient from './client';
import { swapScheduleLocations, swapLocationForBackend } from '../utils/locationSwapHelper';

export const driveAPI = {
  /**
   * 운행 시작
   * POST /api/drives/start
   * @param {Object} data - DriveStartRequestDTO
   * @param {string} data.operationId - 운행 일정 ID
   * @param {boolean} data.isEarlyStart - 조기 출발 여부
   * @param {Object} data.currentLocation - 현재 위치 정보
   * @param {number} data.currentLocation.latitude - 위도
   * @param {number} data.currentLocation.longitude - 경도
   * @param {number} data.currentLocation.timestamp - 타임스탬프 (선택)
   * @returns {Promise} Response: ApiResponse<DriveStatusDTO>
   */
  startDrive: (data) => {
    // 위치 정보가 있으면 백엔드 형식으로 변환
    const requestData = { ...data };
    if (data.currentLocation) {
      requestData.currentLocation = swapLocationForBackend(data.currentLocation);
    }

    return apiClient.post('/api/drives/start', requestData).then(response => {
      // 응답의 위치 정보가 있으면 프론트 형식으로 변환
      if (response.data?.data) {
        response.data.data = swapScheduleLocations(response.data.data);
      }
      return response;
    });
  },

  /**
   * 운행 종료
   * POST /api/drives/end
   * @param {Object} data - DriveEndRequestDTO
   * @param {string} data.operationId - 운행 일정 ID
   * @param {Object} data.currentLocation - 현재 위치 정보
   * @param {number} data.currentLocation.latitude - 위도
   * @param {number} data.currentLocation.longitude - 경도
   * @param {number} data.currentLocation.timestamp - 타임스탬프 (선택)
   * @param {string} data.endReason - 운행 종료 사유 (선택)
   * @returns {Promise} Response: ApiResponse<DriveStatusDTO>
   */
  endDrive: (data) => {
    // 위치 정보가 있으면 백엔드 형식으로 변환
    const requestData = { ...data };
    if (data.currentLocation) {
      requestData.currentLocation = swapLocationForBackend(data.currentLocation);
    }

    return apiClient.post('/api/drives/end', requestData).then(response => {
      // 응답의 위치 정보가 있으면 프론트 형식으로 변환
      if (response.data?.data) {
        response.data.data = swapScheduleLocations(response.data.data);
      }
      return response;
    });
  },

  /**
   * 다음 운행 정보 조회
   * GET /api/drives/next
   * @param {Object} params - 조회 파라미터
   * @param {string} params.currentOperationId - 현재 운행 일정 ID
   * @param {string} params.busNumber - 버스 번호
   * @returns {Promise} Response: ApiResponse<DriveStatusDTO>
   */
  getNextDrive: (params) => {
    return apiClient.get('/api/drives/next', { params }).then(response => {
      // 응답의 위치 정보가 있으면 프론트 형식으로 변환
      if (response.data?.data) {
        response.data.data = swapScheduleLocations(response.data.data);
      }
      return response;
    });
  },

  /**
   * 운행 상태 조회
   * GET /api/drives/status/{operationId}
   * @param {string} operationId - 운행 일정 ID
   * @returns {Promise} Response: ApiResponse<DriveStatusDTO>
   */
  getDriveStatus: (operationId) => {
    return apiClient.get(`/api/drives/status/${operationId}`).then(response => {
      // 응답의 위치 정보가 있으면 프론트 형식으로 변환
      if (response.data?.data) {
        response.data.data = swapScheduleLocations(response.data.data);
      }
      return response;
    });
  }
};

/**
 * 운행 상태 상수
 */
export const DRIVE_STATUS = {
  SCHEDULED: 'SCHEDULED',      // 예정됨
  IN_PROGRESS: 'IN_PROGRESS',  // 진행 중
  COMPLETED: 'COMPLETED',      // 완료됨
  CANCELLED: 'CANCELLED'       // 취소됨
};