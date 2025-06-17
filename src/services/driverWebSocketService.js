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

    // AppState 리스너
    this.appStateSubscription = null;
  }

  /**
   * WebSocket 초기화 및 연결
   */
  async connect(busNumber, organizationId, operationId) {
    console.log('[DriverWebSocket] 연결 시작 - 버스:', busNumber, '조직:', organizationId);

    this.busNumber = busNumber;
    this.organizationId = organizationId;
    this.operationId = operationId;

    try {
      // 토큰 가져오기
      const token = await storage.getToken();
      if (!token) {
        throw new Error('인증 토큰이 없습니다');
      }

      // WebSocket URL 구성
      const wsUrls = getWebSocketUrl();
      const wsUrl = `${wsUrls.driver}?token=${token}`;

      console.log('[DriverWebSocket] 연결 URL:', wsUrl);

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
    };

    // 메시지 수신
    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('[DriverWebSocket] 메시지 수신:', message.type);

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
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
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
     * 위치 업데이트 전송
     */
  sendLocationUpdate(location, occupiedSeats = 0) {
    if (!this.isConnected || !this.busNumber || !this.organizationId) {
      console.warn('[DriverWebSocket] 위치 업데이트 스킵 - 연결되지 않음');
      return;
    }

    // 버스 위치는 백엔드에서 정상적으로 처리하므로 swap하지 않음
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
        this.ws.send(JSON.stringify(message));
        console.log('[DriverWebSocket] 메시지 전송:', message.type);
      } catch (error) {
        console.error('[DriverWebSocket] 메시지 전송 실패:', error);
        this.pendingMessages.push(message);
      }
    } else {
      // 연결이 안된 경우 펜딩 큐에 추가
      console.log('[DriverWebSocket] 메시지 큐에 추가:', message.type);
      this.pendingMessages.push(message);
    }
  }

  /**
   * 하트비트 시작
   */
  startHeartbeat() {
    this.stopHeartbeat(); // 기존 하트비트 정리

    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.sendMessage({ type: WS_MESSAGE_TYPES.HEARTBEAT });
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
        this.sendLocationUpdate(this.currentLocation);
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
    this.currentLocation = location;
  }

  /**
   * 펜딩 메시지 전송
   */
  flushPendingMessages() {
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
  }

  /**
   * 메시지 핸들러 제거
   */
  off(messageType) {
    this.messageHandlers.delete(messageType);
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
      busNumber: this.busNumber,
      organizationId: this.organizationId,
      status: status,
      timestamp: Date.now()
    };

    this.sendMessage(statusMessage);
  }

  /**
   * 승객 탑승/하차 알림 전송
   */
  sendPassengerUpdate(action, passengerInfo) {
    const passengerMessage = {
      type: WS_MESSAGE_TYPES.PASSENGER_BOARDING,
      busNumber: this.busNumber,
      organizationId: this.organizationId,
      action: action, // 'BOARD' or 'ALIGHT'
      passengerInfo: passengerInfo,
      timestamp: Date.now()
    };

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
      type: 'emergency',
      busNumber: this.busNumber,
      organizationId: this.organizationId,
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