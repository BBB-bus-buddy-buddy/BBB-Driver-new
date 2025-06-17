// src/config/websocket.js
import { API_URL_LOCAL, API_URL_PROD } from '@env';

/**
 * WebSocket URL 설정
 */
export const getWebSocketUrl = () => {
  const baseUrl = __DEV__ ? API_URL_LOCAL : API_URL_PROD;
  
  console.log('[WebSocket Config] 환경:', __DEV__ ? '개발' : '프로덕션');
  console.log('[WebSocket Config] Base URL:', baseUrl);
  
  // HTTP를 WS로, HTTPS를 WSS로 변환
  const wsUrl = baseUrl
    .replace('https://', 'wss://')
    .replace('http://', 'ws://');
  
  return {
    driver: `${wsUrl}/ws/driver`,
  };
};

/**
 * WebSocket 설정 옵션
 */
export const WS_CONFIG = {
  // 재연결 설정
  reconnect: {
    enabled: true,
    maxAttempts: 5,
    delay: 3000,
    backoffMultiplier: 1.5,
    maxDelay: 30000
  },
  
  // 하트비트 설정
  heartbeat: {
    enabled: true,
    interval: 30000, // 30초
    timeout: 60000   // 60초 (응답 대기 시간)
  },
  
  // 위치 업데이트 설정
  locationUpdate: {
    interval: 5000,  // 5초
    minDistance: 5,  // 최소 이동 거리 (미터)
    highAccuracy: true,
    // 정류장 근처 감지 반경
    stationRadius: 50, // 50미터
  },
  
  // 메시지 큐 설정
  messageQueue: {
    maxSize: 100,    // 최대 큐 크기
    flushOnConnect: true
  }
};

/**
 * WebSocket 메시지 타입
 */
export const WS_MESSAGE_TYPES = {
  // 연결 관련
  CONNECTION_ESTABLISHED: 'connection_established',
  HEARTBEAT: 'heartbeat',
  HEARTBEAT_RESPONSE: 'heartbeat_response',
  
  // 위치 관련
  LOCATION_UPDATE: 'location_update',
  
  // 버스 상태 관련
  BUS_STATUS_UPDATE: 'bus_status_update',
  BUS_UPDATE: 'busUpdate',
  
  // 정류장 관련
  STATION_UPDATE: 'stationUpdate',
  STATION_ARRIVAL: 'stationArrival',
  STATION_DEPARTURE: 'stationDeparture',
  
  // 승객 관련
  PASSENGER_BOARDING: 'passengerBoarding',
  BOARDING: 'boarding',
  
  // 운행 관련
  DRIVE_STATUS_UPDATE: 'driveStatusUpdate',
  DRIVE_START: 'driveStart',
  DRIVE_END: 'driveEnd',
  
  // 알림
  NOTIFICATION: 'notification',
  EMERGENCY: 'emergency',
  
  // 일반 응답
  SUCCESS: 'success',
  ERROR: 'error'
};

/**
 * WebSocket 에러 코드
 */
export const WS_ERROR_CODES = {
  NORMAL_CLOSURE: 1000,
  GOING_AWAY: 1001,
  PROTOCOL_ERROR: 1002,
  UNSUPPORTED_DATA: 1003,
  NO_STATUS: 1005,
  ABNORMAL_CLOSURE: 1006,
  INVALID_PAYLOAD: 1007,
  POLICY_VIOLATION: 1008,
  MESSAGE_TOO_BIG: 1009,
  MISSING_EXTENSION: 1010,
  INTERNAL_ERROR: 1011,
  SERVICE_RESTART: 1012,
  TRY_AGAIN_LATER: 1013,
  BAD_GATEWAY: 1014,
  TLS_HANDSHAKE: 1015
};

/**
 * WebSocket 상태
 */
export const WS_READY_STATE = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
};

/**
 * 운행 상태 코드
 */
export const DRIVE_STATUS = {
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

/**
 * 정류장 이벤트 타입
 */
export const STATION_EVENT_TYPES = {
  APPROACHING: 'approaching',    // 접근 중
  ARRIVED: 'arrived',            // 도착
  DEPARTED: 'departed',          // 출발
  PASSED: 'passed'               // 통과
};

/**
 * 알림 타입
 */
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success',
  EMERGENCY: 'emergency'
};