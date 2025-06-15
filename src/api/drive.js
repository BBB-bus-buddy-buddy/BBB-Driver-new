// src/api/drive.js
import apiClient from './client';

export const driveAPI = {
  /**
   * 운행 시작
   * @param {Object} data 운행 시작 데이터
   * @param {string} data.operationId - 운행 일정 ID
   * @param {boolean} data.isEarlyStart - 조기 출발 여부
   * @param {Object} data.currentLocation - 현재 위치 정보
   * @param {number} data.currentLocation.latitude - 위도
   * @param {number} data.currentLocation.longitude - 경도
   * @param {number} data.currentLocation.timestamp - 타임스탬프
   * @returns {Promise} API 응답
   */
  startDrive: (data) => {
    return apiClient.post('/api/drives/start', data);
  },

  /**
   * 운행 종료
   * @param {Object} data 운행 종료 데이터
   * @param {string} data.operationId - 운행 일정 ID
   * @param {Object} data.currentLocation - 현재 위치 정보
   * @param {number} data.currentLocation.latitude - 위도
   * @param {number} data.currentLocation.longitude - 경도
   * @param {number} data.currentLocation.timestamp - 타임스탬프
   * @param {string} data.endReason - 운행 종료 사유 (선택)
   * @returns {Promise} API 응답
   */
  endDrive: (data) => {
    return apiClient.post('/api/drives/end', data);
  },

  /**
   * 다음 운행 정보 조회
   * @param {Object} params 조회 파라미터
   * @param {string} params.currentOperationId - 현재 운행 일정 ID
   * @param {string} params.busNumber - 버스 번호
   * @returns {Promise} API 응답
   */
  getNextDrive: (params) => {
    return apiClient.get('/api/drives/next', { params });
  },

  /**
   * 운행 중 위치 업데이트
   * @param {Object} data 위치 업데이트 데이터
   * @param {string} data.operationId - 운행 일정 ID
   * @param {string} data.busNumber - 버스 번호
   * @param {Object} data.location - 위치 정보
   * @param {number} data.location.latitude - 위도
   * @param {number} data.location.longitude - 경도
   * @param {number} data.location.timestamp - 타임스탬프
   * @param {number} data.speed - 속도 (m/s)
   * @param {number} data.heading - 방향 (도)
   * @param {number} data.accuracy - 정확도 (미터)
   * @returns {Promise} API 응답
   */
  updateLocation: (data) => {
    return apiClient.post('/api/drives/location', data);
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