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
      console.log('[DriveAPI] startDrive 원본 응답:', response.data);

      // 백엔드 응답 구조 확인 및 정규화
      // 백엔드가 {success: true, data: {...}, message: "..."} 형태로 보내는 경우
      if (response.data && typeof response.data === 'object') {
        // success 필드가 없으면 data 필드의 존재 여부로 판단
        if (!response.data.hasOwnProperty('success')) {
          response.data.success = !!response.data.data;
        }

        // 응답의 위치 정보가 있으면 프론트 형식으로 변환
        if (response.data?.data) {
          response.data.data = swapScheduleLocations(response.data.data);
        }
      }

      console.log('[DriveAPI] startDrive 처리된 응답:', response.data);
      return response;
    }).catch(error => {
      console.error('[DriveAPI] startDrive 에러:', error);

      // axios 에러 구조 정규화
      if (error.response) {
        // 서버가 응답했지만 2xx 범위가 아닌 상태 코드
        console.error('[DriveAPI] 서버 응답 에러:', error.response.data);
        throw error;
      } else if (error.request) {
        // 요청은 했지만 응답을 받지 못함
        console.error('[DriveAPI] 네트워크 에러:', error.request);
        throw new Error('네트워크 오류가 발생했습니다.');
      } else {
        // 요청 설정 중 에러 발생
        console.error('[DriveAPI] 요청 설정 에러:', error.message);
        throw error;
      }
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
      console.log('[DriveAPI] endDrive 원본 응답:', response.data);

      // 백엔드 응답 구조 확인 및 정규화
      // 백엔드가 {data: {...}, message: "..."} 형태로 보내는 경우
      if (response.data && typeof response.data === 'object') {
        // success 필드가 없으면 data 필드의 존재 여부로 판단
        if (!response.data.hasOwnProperty('success')) {
          response.data.success = !!response.data.data;
        }

        // 응답의 위치 정보가 있으면 프론트 형식으로 변환
        if (response.data?.data) {
          response.data.data = swapScheduleLocations(response.data.data);
        }
      }

      console.log('[DriveAPI] endDrive 처리된 응답:', response.data);
      return response;
    }).catch(error => {
      console.error('[DriveAPI] endDrive 에러:', error);

      // axios 에러 구조 정규화
      if (error.response) {
        // 서버가 응답했지만 2xx 범위가 아닌 상태 코드
        console.error('[DriveAPI] 서버 응답 에러:', error.response.data);
        throw error;
      } else if (error.request) {
        // 요청은 했지만 응답을 받지 못함
        console.error('[DriveAPI] 네트워크 에러:', error.request);
        throw new Error('네트워크 오류가 발생했습니다.');
      } else {
        // 요청 설정 중 에러 발생
        console.error('[DriveAPI] 요청 설정 에러:', error.message);
        throw error;
      }
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
      console.log('[DriveAPI] getNextDrive 원본 응답:', response.data);

      // 백엔드 응답 구조 확인 및 정규화
      if (response.data && typeof response.data === 'object') {
        // success 필드가 없으면 data 필드의 존재 여부로 판단
        if (!response.data.hasOwnProperty('success')) {
          response.data.success = !!response.data.data;
        }

        // 응답의 위치 정보가 있으면 프론트 형식으로 변환
        if (response.data?.data) {
          response.data.data = swapScheduleLocations(response.data.data);
        }
      }

      console.log('[DriveAPI] getNextDrive 처리된 응답:', response.data);
      return response;
    }).catch(error => {
      console.error('[DriveAPI] getNextDrive 에러:', error);
      throw error;
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
      console.log('[DriveAPI] getDriveStatus 원본 응답:', response.data);

      // 백엔드 응답 구조 확인 및 정규화
      if (response.data && typeof response.data === 'object') {
        // success 필드가 없으면 data 필드의 존재 여부로 판단
        if (!response.data.hasOwnProperty('success')) {
          response.data.success = !!response.data.data;
        }

        // 응답의 위치 정보가 있으면 프론트 형식으로 변환
        if (response.data?.data) {
          response.data.data = swapScheduleLocations(response.data.data);
        }
      }

      console.log('[DriveAPI] getDriveStatus 처리된 응답:', response.data);
      return response;
    }).catch(error => {
      console.error('[DriveAPI] getDriveStatus 에러:', error);
      throw error;
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