// src/services/driverWebSocketService.js
import { storage } from '../utils/storage';
import { AppState } from 'react-native';
import { getWebSocketUrl, WS_CONFIG, WS_MESSAGE_TYPES, WS_READY_STATE } from '../config/websocket';
import { swapLocationForBackend } from '../utils/locationSwapHelper';

class DriverWebSocketService {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = WS_CONFIG.reconnect.maxAttempts;
    this.reconnectDelay = WS_CONFIG.reconnect.delay;
    this.heartbeatInterval = null;
    this.locationUpdateInterval = null;
    this.messageHandlers = new Map();
    this.pendingMessages = [];
    this.currentLocation = null;
    this.busNumber = null;
    this.organizationId = null;
    this.operationId = null;
    this.driverId = null;
    this.driverName = null;

    // AppState 리스너
    this.appStateSubscription = null;
  }

  /**
   * WebSocket 초기화 및 연결
   */
  async connect(busNumber, organizationId, operationId) {
    console.log('[DriverWebSocket] 연결 시작 - 버스:', busNumber, '조직:', organizationId, '운행:', operationId);

    this.busNumber = busNumber;
    this.organizationId = organizationId;
    this.operationId = operationId;

    try {
      // 토큰과 사용자 정보 가져오기
      const token = await storage.getToken();
      if (!token) {
        throw new Error('인증 토큰이 없습니다');
      }

      // 사용자 정보 저장 (운전자 식별용)
      const userInfo = await storage.getUserInfo();
      this.driverId = userInfo?.id || userInfo?.email || 'unknown';
      this.driverName = userInfo?.name || '운전자';

      // WebSocket URL 구성
      const wsUrls = getWebSocketUrl();
      const wsUrl = `${wsUrls.driver}?token=${token}`;

      console.log('[DriverWebSocket] 연결 URL:', wsUrl);
      console.log('[DriverWebSocket] 운전자 정보:', {
        driverId: this.driverId,
        driverName: this.driverName,
        busNumber: this.busNumber,
        organizationId: this.organizationId,
        operationId: this.operationId
      });

      // WebSocket 연결
      this.ws = new WebSocket(wsUrl);

      // 이벤트 핸들러 설정
      this.setupEventHandlers();

      // AppState 리스너 설정
      this.setupAppStateListener();

    } catch (error) {
      console.error('[DriverWebSocket] 연결 실패:', error);
      throw error;
    }
  }

  /**
 * WebSocket 이벤트 핸들러 설정
 */
  setupEventHandlers() {
    if (!this.ws) return;

    // 연결 성공
    this.ws.onopen = () => {
      console.log('[DriverWebSocket] 연결 성공');
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // 연결 성공 후 펜딩 메시지 전송
      this.flushPendingMessages();

      // 하트비트 시작
      this.startHeartbeat();

      // 위치 업데이트 시작
      this.startLocationUpdates();

      // 초기 버스 상태만 전송 (위치 없이)
      this.sendBusStatusUpdate('IN_OPERATION');
    };

    // 메시지 수신
    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('[DriverWebSocket] 메시지 수신:', message.type, message);

        this.handleMessage(message);
      } catch (error) {
        console.error('[DriverWebSocket] 메시지 파싱 오류:', error);
      }
    };

    // 연결 종료
    this.ws.onclose = (event) => {
      console.log('[DriverWebSocket] 연결 종료:', event.code, event.reason);
      this.isConnected = false;

      // 정리 작업
      this.stopHeartbeat();
      this.stopLocationUpdates();

      // 재연결 시도
      if (this.reconnectAttempts < this.maxReconnectAttempts && WS_CONFIG.reconnect.enabled) {
        this.scheduleReconnect();
      }
    };

    // 오류 발생
    this.ws.onerror = (error) => {
      console.error('[DriverWebSocket] 오류 발생:', error);
    };
  }

  /**
   * 메시지 처리
   */
  handleMessage(message) {
    const { type, status, data } = message;

    switch (type) {
      case WS_MESSAGE_TYPES.CONNECTION_ESTABLISHED:
        console.log('[DriverWebSocket] 서버 연결 확인:', message.message);
        break;

      case WS_MESSAGE_TYPES.HEARTBEAT_RESPONSE:
        console.log('[DriverWebSocket] 하트비트 응답 수신');
        break;

      case WS_MESSAGE_TYPES.SUCCESS:
        console.log('[DriverWebSocket] 성공:', message.message);
        break;

      case WS_MESSAGE_TYPES.ERROR:
        console.error('[DriverWebSocket] 서버 오류:', message.message);
        break;

      default:
        // 등록된 핸들러 실행
        const handler = this.messageHandlers.get(type);
        if (handler) {
          handler(message);
        } else {
          console.warn('[DriverWebSocket] 처리되지 않은 메시지 타입:', type);
        }
    }
  }

  /**
   * 운전자 등록 메시지 전송
   */
  sendDriverRegistration() {
    const registrationMessage = {
      type: WS_MESSAGE_TYPES.DRIVER_REGISTRATION,
      driverId: this.driverId,
      driverName: this.driverName,
      busNumber: this.busNumber,
      organizationId: this.organizationId,
      operationId: this.operationId,
      timestamp: Date.now()
    };

    console.log('[DriverWebSocket] 운전자 등록 메시지 전송:', registrationMessage);
    this.sendMessage(registrationMessage);
  }

  /**
 * 위치 업데이트 전송
 */
  sendLocationUpdate(location, occupiedSeats = 0) {
    if (!this.isConnected || !this.busNumber || !this.organizationId) {
      console.warn('[DriverWebSocket] 위치 업데이트 스킵 - 연결되지 않음');
      return;
    }

    // 유효한 위치인지 확인
    if (!location || !location.latitude || !location.longitude) {
      console.warn('[DriverWebSocket] 위치 업데이트 스킵 - 유효하지 않은 위치 데이터');
      return;
    }

    // (0, 0) 위치 필터링
    if (location.latitude === 0 && location.longitude === 0) {
      console.warn('[DriverWebSocket] 위치 업데이트 스킵 - (0, 0) 위치');
      return;
    }

    // GPS 좌표 유효성 검증
    if (location.latitude < -90 || location.latitude > 90 ||
      location.longitude < -180 || location.longitude > 180) {
      console.warn('[DriverWebSocket] 위치 업데이트 스킵 - 유효하지 않은 GPS 좌표:', location);
      return;
    }

    const locationMessage = {
      type: WS_MESSAGE_TYPES.LOCATION_UPDATE,
      busNumber: this.busNumber,
      organizationId: this.organizationId,
      latitude: location.latitude,
      longitude: location.longitude,
      occupiedSeats: occupiedSeats,
      timestamp: Date.now()
    };

    console.log('[DriverWebSocket] 버스 위치 전송:', {
      latitude: location.latitude,
      longitude: location.longitude
    });

    this.sendMessage(locationMessage);
  }

  /**
   * 메시지 전송
   */
  sendMessage(message) {
    if (this.isConnected && this.ws && this.ws.readyState === WS_READY_STATE.OPEN) {
      try {
        // 모든 메시지에 기본 정보 포함
        const enrichedMessage = {
          ...message,
          driverId: message.driverId || this.driverId,
          busNumber: message.busNumber || this.busNumber,
          organizationId: message.organizationId || this.organizationId,
          operationId: message.operationId || this.operationId
        };

        this.ws.send(JSON.stringify(enrichedMessage));
        console.log('[DriverWebSocket] 메시지 전송:', enrichedMessage.type);
      } catch (error) {
        console.error('[DriverWebSocket] 메시지 전송 실패:', error);
        this.pendingMessages.push(message);
      }
    } else {
      // 연결이 안된 경우 펜딩 큐에 추가
      console.log('[DriverWebSocket] 메시지 큐에 추가:', message.type);
      this.pendingMessages.push(message);

      // 큐 크기 제한
      if (this.pendingMessages.length > WS_CONFIG.messageQueue.maxSize) {
        this.pendingMessages.shift(); // 가장 오래된 메시지 제거
      }
    }
  }

  /**
   * 하트비트 시작
   */
  startHeartbeat() {
    this.stopHeartbeat(); // 기존 하트비트 정리

    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.sendMessage({
          type: WS_MESSAGE_TYPES.HEARTBEAT,
          timestamp: Date.now()
        });
      }
    }, WS_CONFIG.heartbeat.interval);
  }

  /**
   * 하트비트 중지
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
 * 위치 업데이트 시작
 */
  startLocationUpdates() {
    this.stopLocationUpdates(); // 기존 업데이트 정리

    // 설정된 간격마다 위치 전송
    this.locationUpdateInterval = setInterval(() => {
      if (this.currentLocation && this.isConnected) {
        // 유효한 위치인 경우에만 전송
        if (this.currentLocation.latitude !== 0 || this.currentLocation.longitude !== 0) {
          this.sendLocationUpdate(this.currentLocation);
        } else {
          console.log('[DriverWebSocket] 위치 업데이트 대기 중 - 유효한 GPS 위치 없음');
        }
      }
    }, WS_CONFIG.locationUpdate.interval);
  }

  /**
   * 위치 업데이트 중지
   */
  stopLocationUpdates() {
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
      this.locationUpdateInterval = null;
    }
  }

  /**
 * 현재 위치 업데이트
 */
  updateCurrentLocation(location) {
    // 유효한 위치인 경우에만 저장
    if (location && location.latitude && location.longitude &&
      (location.latitude !== 0 || location.longitude !== 0)) {
      this.currentLocation = location;
      console.log('[DriverWebSocket] 현재 위치 업데이트:', {
        latitude: location.latitude,
        longitude: location.longitude
      });
    } else {
      console.warn('[DriverWebSocket] 무효한 위치 데이터 무시:', location);
    }
  }

  /**
   * 현재 승객 수 업데이트
   */
  updateOccupiedSeats(seats) {
    this.currentOccupiedSeats = seats;
  }

  /**
   * 펜딩 메시지 전송
   */
  flushPendingMessages() {
    console.log(`[DriverWebSocket] 펜딩 메시지 전송 시작: ${this.pendingMessages.length}개`);

    while (this.pendingMessages.length > 0 && this.isConnected) {
      const message = this.pendingMessages.shift();
      this.sendMessage(message);
    }
  }

  /**
   * 재연결 스케줄링
   */
  scheduleReconnect() {
    this.reconnectAttempts++;
    const baseDelay = WS_CONFIG.reconnect.delay;
    const multiplier = WS_CONFIG.reconnect.backoffMultiplier;
    const maxDelay = WS_CONFIG.reconnect.maxDelay;

    // 지수 백오프 적용
    const delay = Math.min(baseDelay * Math.pow(multiplier, this.reconnectAttempts - 1), maxDelay);

    console.log(`[DriverWebSocket] ${delay / 1000}초 후 재연결 시도 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (!this.isConnected && this.busNumber && this.organizationId) {
        this.connect(this.busNumber, this.organizationId, this.operationId);
      }
    }, delay);
  }

  /**
   * 메시지 핸들러 등록
   */
  on(messageType, handler) {
    this.messageHandlers.set(messageType, handler);
    console.log(`[DriverWebSocket] 핸들러 등록: ${messageType}`);
  }

  /**
   * 메시지 핸들러 제거
   */
  off(messageType) {
    this.messageHandlers.delete(messageType);
    console.log(`[DriverWebSocket] 핸들러 제거: ${messageType}`);
  }

  /**
   * AppState 리스너 설정
   */
  setupAppStateListener() {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      console.log('[DriverWebSocket] 앱 상태 변경:', nextAppState);

      if (nextAppState === 'active') {
        // 포그라운드로 전환시 재연결
        if (!this.isConnected && this.busNumber) {
          this.connect(this.busNumber, this.organizationId, this.operationId);
        }
      } else if (nextAppState === 'background') {
        // 백그라운드로 전환시 처리
        console.log('[DriverWebSocket] 백그라운드 모드 - 연결 유지');
      }
    });
  }

  /**
   * WebSocket 연결 해제
   */
  disconnect() {
    console.log('[DriverWebSocket] 연결 해제');

    // 정리 작업
    this.stopHeartbeat();
    this.stopLocationUpdates();

    // AppState 리스너 제거
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    // WebSocket 닫기
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    // 상태 초기화
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.pendingMessages = [];
    this.messageHandlers.clear();
    this.busNumber = null;
    this.organizationId = null;
    this.operationId = null;
    this.driverId = null;
    this.driverName = null;
    this.currentOccupiedSeats = 0;
  }

  /**
   * 연결 상태 확인
   */
  checkConnection() {
    return this.isConnected && this.ws && this.ws.readyState === WS_READY_STATE.OPEN;
  }

  /**
   * 버스 상태 업데이트 전송
   */
  sendBusStatusUpdate(status) {
    const statusMessage = {
      type: WS_MESSAGE_TYPES.BUS_STATUS_UPDATE,
      driverId: this.driverId,
      driverName: this.driverName,
      busNumber: this.busNumber,
      organizationId: this.organizationId,
      operationId: this.operationId,
      status: status,
      timestamp: Date.now()
    };

    console.log('[DriverWebSocket] 버스 상태 업데이트 전송:', statusMessage);
    this.sendMessage(statusMessage);
  }

  /**
   * 승객 탑승/하차 알림 전송
   */
  sendPassengerUpdate(action, passengerInfo, currentOccupiedSeats) {
    const passengerMessage = {
      type: WS_MESSAGE_TYPES.PASSENGER_BOARDING,
      driverId: this.driverId,
      busNumber: this.busNumber,
      organizationId: this.organizationId,
      operationId: this.operationId,
      action: action, // 'BOARD' or 'ALIGHT'
      passengerInfo: passengerInfo,
      occupiedSeats: currentOccupiedSeats,
      timestamp: Date.now()
    };

    console.log('[DriverWebSocket] 승객 업데이트 전송:', {
      action: action,
      occupiedSeats: currentOccupiedSeats,
      passengerInfo: passengerInfo
    });

    this.sendMessage(passengerMessage);
  }

  /**
   * 긴급 메시지 전송
   */
  sendEmergencyMessage(emergencyType, details) {
    // 현재 위치가 있으면 백엔드 형식으로 변환
    let emergencyLocation = null;
    if (this.currentLocation) {
      emergencyLocation = swapLocationForBackend(this.currentLocation);
    }

    const emergencyMessage = {
      type: WS_MESSAGE_TYPES.EMERGENCY,
      driverId: this.driverId,
      busNumber: this.busNumber,
      organizationId: this.organizationId,
      operationId: this.operationId,
      emergencyType: emergencyType,
      details: details,
      location: emergencyLocation,
      timestamp: Date.now()
    };

    // 긴급 메시지는 즉시 전송 시도
    if (this.checkConnection()) {
      this.sendMessage(emergencyMessage);
    } else {
      // 연결이 안된 경우에도 큐의 맨 앞에 추가
      this.pendingMessages.unshift(emergencyMessage);
    }
  }

  /**
   * 디버그 정보 출력
   */
  getDebugInfo() {
    return {
      connected: this.isConnected,
      wsState: this.ws ? this.ws.readyState : 'no socket',
      reconnectAttempts: this.reconnectAttempts,
      pendingMessages: this.pendingMessages.length,
      busNumber: this.busNumber,
      organizationId: this.organizationId,
      operationId: this.operationId,
      driverId: this.driverId,
      driverName: this.driverName,
      currentOccupiedSeats: this.currentOccupiedSeats || 0,
      handlers: Array.from(this.messageHandlers.keys())
    };
  }

  /**
   * 통계 정보
   */
  getStats() {
    return {
      messagesSent: this.messagesSent || 0,
      messagesReceived: this.messagesReceived || 0,
      reconnectCount: this.reconnectCount || 0,
      lastConnectedAt: this.lastConnectedAt || null,
      uptime: this.isConnected ? Date.now() - this.lastConnectedAt : 0
    };
  }
}

// 싱글톤 인스턴스
const driverWebSocketService = new DriverWebSocketService();

export default driverWebSocketService;