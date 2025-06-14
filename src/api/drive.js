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
   * @param {number} data.currentLocation.timestamp - 타임스탬프 (선택)
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
   * @param {number} data.currentLocation.timestamp - 타임스탬프 (선택)
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
  },

  /**
   * 운행 상태 조회
   * @param {string} operationId - 운행 일정 ID
   * @returns {Promise} API 응답
   */
  getDriveStatus: (operationId) => {
    return apiClient.get(`/api/drives/status/${operationId}`);
  },
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

/**
 * 운행 시작 가능 여부 확인
 * @param {string} scheduledStartTime - 예정 출발 시간 (ISO 문자열)
 * @param {boolean} allowEarlyStart - 조기 출발 허용 여부
 * @param {number} earlyStartMinutes - 조기 출발 허용 시간(분) (기본값: 10)
 * @returns {Object} { canStart: boolean, message: string }
 */
export const canStartDrive = (scheduledStartTime, allowEarlyStart = false, earlyStartMinutes = 10) => {
  const now = new Date();
  const scheduledStart = new Date(scheduledStartTime);
  
  if (allowEarlyStart) {
    // 조기 출발 허용 시간 계산
    const earliestStart = new Date(scheduledStart.getTime() - earlyStartMinutes * 60000);
    
    if (now < earliestStart) {
      const minutesUntilEarly = Math.ceil((earliestStart - now) / 60000);
      return {
        canStart: false,
        message: `조기 출발은 ${minutesUntilEarly}분 후부터 가능합니다.`
      };
    }
    
    return {
      canStart: true,
      message: '조기 출발이 가능합니다.'
    };
  } else {
    // 정시 출발
    if (now < scheduledStart) {
      const minutesUntilStart = Math.ceil((scheduledStart - now) / 60000);
      return {
        canStart: false,
        message: `출발 시간까지 ${minutesUntilStart}분 남았습니다.`
      };
    }
    
    return {
      canStart: true,
      message: '운행을 시작할 수 있습니다.'
    };
  }
};

/**
 * 두 위치 사이의 거리 계산 (미터)
 * @param {number} lat1 - 시작점 위도
 * @param {number} lon1 - 시작점 경도
 * @param {number} lat2 - 도착점 위도
 * @param {number} lon2 - 도착점 경도
 * @returns {number} 거리 (미터)
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // 지구 반경 (미터)
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = 
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * 출발지 도착 여부 확인
 * @param {Object} currentLocation - 현재 위치
 * @param {Object} startLocation - 출발지 위치
 * @param {number} threshold - 허용 거리 (미터, 기본값: 50)
 * @returns {Object} { isArrived: boolean, distance: number, message: string }
 */
export const checkArrivalAtStart = (currentLocation, startLocation, threshold = 50) => {
  const distance = calculateDistance(
    currentLocation.latitude,
    currentLocation.longitude,
    startLocation.latitude,
    startLocation.longitude
  );

  const isArrived = distance <= threshold;
  
  return {
    isArrived,
    distance: Math.round(distance),
    message: isArrived 
      ? '출발지에 도착했습니다.' 
      : `출발지까지 ${Math.round(distance)}m 남았습니다.`
  };
};

/**
 * 운행 시간 포맷팅
 * @param {Date|string} startTime - 시작 시간
 * @param {Date|string} endTime - 종료 시간
 * @returns {string} "HH시간 MM분" 형식의 문자열
 */
export const formatDriveDuration = (startTime, endTime) => {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
  
  const durationMs = end - start;
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }
  return `${minutes}분`;
};