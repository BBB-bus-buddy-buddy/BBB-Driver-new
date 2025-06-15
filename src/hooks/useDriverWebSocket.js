// src/hooks/useDriverWebSocket.js
import { useEffect, useState, useCallback, useRef } from 'react';
import driverWebSocketService from '../services/webSocketService';

/**
 * 운전자 WebSocket 연결을 관리하는 커스텀 훅
 */
export const useDriverWebSocket = (busNumber, organizationId, operationId) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const messageHandlers = useRef(new Map());

  // WebSocket 연결
  const connect = useCallback(async () => {
    try {
      setConnectionError(null);
      await driverWebSocketService.connect(busNumber, organizationId, operationId);
      setIsConnected(true);
    } catch (error) {
      console.error('[useDriverWebSocket] 연결 실패:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    }
  }, [busNumber, organizationId, operationId]);

  // WebSocket 연결 해제
  const disconnect = useCallback(() => {
    driverWebSocketService.disconnect();
    setIsConnected(false);
  }, []);

  // 메시지 핸들러 등록
  const onMessage = useCallback((messageType, handler) => {
    messageHandlers.current.set(messageType, handler);
    driverWebSocketService.on(messageType, handler);
  }, []);

  // 메시지 핸들러 제거
  const offMessage = useCallback((messageType) => {
    messageHandlers.current.delete(messageType);
    driverWebSocketService.off(messageType);
  }, []);

  // 위치 업데이트
  const updateLocation = useCallback((location, occupiedSeats) => {
    driverWebSocketService.updateCurrentLocation(location);
    driverWebSocketService.sendLocationUpdate(location, occupiedSeats);
  }, []);

  // 버스 상태 업데이트
  const updateBusStatus = useCallback((status) => {
    driverWebSocketService.sendBusStatusUpdate(status);
  }, []);

  // 승객 업데이트
  const updatePassenger = useCallback((action, passengerInfo) => {
    driverWebSocketService.sendPassengerUpdate(action, passengerInfo);
  }, []);

  // 긴급 메시지
  const sendEmergency = useCallback((emergencyType, details) => {
    driverWebSocketService.sendEmergencyMessage(emergencyType, details);
  }, []);

  // 연결 상태 모니터링
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const connected = driverWebSocketService.checkConnection();
      setIsConnected(connected);
      
      // 재연결 시도 횟수 업데이트
      const debugInfo = driverWebSocketService.getDebugInfo();
      setReconnectAttempt(debugInfo.reconnectAttempts);
    }, 1000);

    return () => clearInterval(checkInterval);
  }, []);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      // 등록된 모든 핸들러 제거
      messageHandlers.current.forEach((_, messageType) => {
        driverWebSocketService.off(messageType);
      });
    };
  }, []);

  return {
    isConnected,
    connectionError,
    reconnectAttempt,
    connect,
    disconnect,
    onMessage,
    offMessage,
    updateLocation,
    updateBusStatus,
    updatePassenger,
    sendEmergency,
    debugInfo: driverWebSocketService.getDebugInfo()
  };
};

/**
 * WebSocket 연결 상태를 표시하는 컴포넌트에서 사용하는 훅
 */
export const useWebSocketStatus = () => {
  const [status, setStatus] = useState({
    isConnected: false,
    reconnectAttempts: 0,
    pendingMessages: 0
  });

  useEffect(() => {
    const updateStatus = () => {
      const debugInfo = driverWebSocketService.getDebugInfo();
      setStatus({
        isConnected: debugInfo.connected,
        reconnectAttempts: debugInfo.reconnectAttempts,
        pendingMessages: debugInfo.pendingMessages
      });
    };

    // 초기 상태 설정
    updateStatus();

    // 1초마다 상태 업데이트
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  return status;
};