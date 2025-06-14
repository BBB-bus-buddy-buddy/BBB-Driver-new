// src/screens/DrivingScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  BackHandler,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { driveAPI } from '../api/drive';
import { startLocationTracking, stopLocationTracking } from '../services/locationService';
import driverWebSocketService from '../services/webSocketService';
import { storage } from '../utils/storage';

const DrivingScreen = ({ navigation, route }) => {
  const { drive } = route.params;
  const [currentTime, setCurrentTime] = useState(new Date());
  const [nextStopInfo, setNextStopInfo] = useState(null);
  const [isNearDestination, setIsNearDestination] = useState(false);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [locationTrackingId, setLocationTrackingId] = useState(null);
  const [occupiedSeats, setOccupiedSeats] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);
  
  const appState = useRef(AppState.currentState);
  const locationUpdateInterval = useRef(null);

  // 운행 시간 카운터
  useEffect(() => {
    const startTime = new Date(drive.actualStart || drive.scheduledStart);

    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // 경과 시간 계산
      const diff = now - startTime;
      const hours = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
      const minutes = Math.floor((diff / (1000 * 60)) % 60).toString().padStart(2, '0');
      const seconds = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
      setElapsedTime(`${hours}:${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [drive.actualStart, drive.scheduledStart]);

  // WebSocket 연결 및 위치 추적
  useEffect(() => {
    let currentLocation = null;

    const initializeWebSocket = async () => {
      try {
        const userInfo = await storage.getUserInfo();
        const organizationId = userInfo?.organizationId;

        if (!organizationId) {
          console.error('[DrivingScreen] 조직 ID를 찾을 수 없습니다');
          return;
        }

        // WebSocket 연결
        await driverWebSocketService.connect(
          drive.busNumber,
          organizationId,
          drive.operationId || drive.id
        );

        setWsConnected(true);

        // WebSocket 메시지 핸들러 등록
        driverWebSocketService.on('busUpdate', handleBusUpdate);
        driverWebSocketService.on('passengerBoarding', handlePassengerBoarding);

      } catch (error) {
        console.error('[DrivingScreen] WebSocket 연결 실패:', error);
        Alert.alert('연결 오류', 'WebSocket 연결에 실패했습니다. 운행은 계속됩니다.');
      }
    };

    // 위치 추적 시작
    const watchId = startLocationTracking((location) => {
      currentLocation = location;
      
      // WebSocket으로 위치 전송
      if (driverWebSocketService.checkConnection()) {
        driverWebSocketService.updateCurrentLocation(location);
        driverWebSocketService.sendLocationUpdate(location, occupiedSeats);
      }
    });

    setLocationTrackingId(watchId);

    // 5초마다 서버 API로 위치 업데이트 (백업)
    locationUpdateInterval.current = setInterval(async () => {
      if (currentLocation) {
        await sendLocationUpdate(currentLocation);
      }
    }, 5000);

    // WebSocket 초기화
    initializeWebSocket();

    // 앱 상태 리스너
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      // WebSocket 연결 해제
      driverWebSocketService.off('busUpdate');
      driverWebSocketService.off('passengerBoarding');
      driverWebSocketService.disconnect();

      // 위치 추적 중지
      if (locationTrackingId) {
        stopLocationTracking(locationTrackingId);
      }
      if (locationUpdateInterval.current) {
        clearInterval(locationUpdateInterval.current);
      }
      appStateSubscription.remove();
    };
  }, []);

  // WebSocket 메시지 핸들러들
  const handleBusUpdate = (message) => {
    console.log('[DrivingScreen] 버스 상태 업데이트:', message);
    // 필요시 UI 업데이트
  };

  const handlePassengerBoarding = (message) => {
    console.log('[DrivingScreen] 승객 탑승/하차:', message);
    
    const { action, userId } = message.data;
    if (action === 'BOARD') {
      setOccupiedSeats(prev => prev + 1);
      // 알림 표시 (선택)
      // Alert.alert('승객 탑승', `승객이 탑승했습니다`);
    } else if (action === 'ALIGHT') {
      setOccupiedSeats(prev => Math.max(0, prev - 1));
      // Alert.alert('승객 하차', `승객이 하차했습니다`);
    }
  };

  // 앱 상태 변경 처리
  const handleAppStateChange = (nextAppState) => {
    if (appState.current === 'background' && nextAppState === 'active') {
      console.log('[DrivingScreen] 앱이 포그라운드로 전환됨');
      
      // WebSocket 재연결 확인
      if (!driverWebSocketService.checkConnection()) {
        driverWebSocketService.connect(
          drive.busNumber,
          drive.organizationId,
          drive.operationId || drive.id
        );
      }
    }
    appState.current = nextAppState;
  };

  // 위치 업데이트 전송 (REST API 백업)
  const sendLocationUpdate = async (location) => {
    try {
      const requestData = {
        operationId: drive.operationId || drive.id,
        busNumber: drive.busNumber,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: Date.now()
        },
        speed: location.speed || 0,
        heading: location.heading || 0,
        accuracy: location.accuracy || 0
      };

      const response = await driveAPI.updateLocation(requestData);

      if (response.data.success && response.data.data) {
        const updateData = response.data.data;
        
        // 다음 정류장 정보 업데이트
        if (updateData.nextStop) {
          setNextStopInfo(updateData.nextStop);
        }
        
        // 목적지 근접 여부 업데이트
        if (updateData.isNearDestination !== undefined) {
          setIsNearDestination(updateData.isNearDestination);
        }
      }
    } catch (error) {
      console.error('[DrivingScreen] 위치 업데이트 전송 실패:', error);
    }
  };

  // 뒤로가기 버튼 방지
  useEffect(() => {
    const backAction = () => {
      Alert.alert(
        '운행 중',
        '운행 중에는 앱을 종료할 수 없습니다. 운행을 종료하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { text: '운행 종료', style: 'destructive', onPress: handleEndDrive }
        ],
        { cancelable: true }
      );
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, []);

  const handleEndDrive = async () => {
    if (!isNearDestination) {
      Alert.alert(
        '목적지 도착 전',
        '아직 목적지에 도착하지 않았습니다. 정말 운행을 종료하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '운행 종료',
            style: 'destructive',
            onPress: () => completeEndDrive('조기 종료'),
          },
        ],
        { cancelable: true }
      );
    } else {
      completeEndDrive('정상 종료');
    }
  };

  const completeEndDrive = async (endReason) => {
    try {
      // WebSocket 연결 해제
      driverWebSocketService.disconnect();
      
      // 위치 추적 중지
      if (locationTrackingId) {
        stopLocationTracking(locationTrackingId);
      }
      
      // 위치 업데이트 인터벌 중지
      if (locationUpdateInterval.current) {
        clearInterval(locationUpdateInterval.current);
      }

      // 운행 종료 API 호출
      const response = await driveAPI.endDrive({
        operationId: drive.operationId || drive.id,
        endReason: endReason
      });

      if (response.data.success) {
        const completedDrive = response.data.data;
        
        // 운행 종료 화면으로 이동
        navigation.replace('EndDrive', { 
          drive: {
            ...drive,
            ...completedDrive
          } 
        });
      } else {
        throw new Error(response.data.message || '운행 종료에 실패했습니다.');
      }
    } catch (error) {
      console.error('[DrivingScreen] 운행 종료 오류:', error);
      Alert.alert('오류', error.message || '운행을 종료할 수 없습니다. 다시 시도해주세요.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>운행 중</Text>
          {wsConnected && (
            <View style={styles.connectionStatus}>
              <View style={styles.connectedDot} />
              <Text style={styles.connectionText}>실시간 연결됨</Text>
            </View>
          )}
        </View>

        <View style={styles.drivingStatusContainer}>
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View style={styles.liveDot} />
              <Text style={styles.statusText}>실시간 운행 중</Text>
            </View>

            <View style={styles.busInfoContainer}>
              <Text style={styles.busNumber}>{drive.busNumber}</Text>
              <View style={styles.routeBadge}>
                <Text style={styles.routeBadgeText}>{drive.routeName || '노선 정보 없음'}</Text>
              </View>
            </View>

            <View style={styles.seatInfoContainer}>
              <Text style={styles.seatInfoLabel}>탑승 승객</Text>
              <Text style={styles.seatInfoValue}>{occupiedSeats}명</Text>
            </View>

            <View style={styles.timeInfoContainer}>
              <View style={styles.timeInfoItem}>
                <Text style={styles.timeInfoLabel}>운행 시작</Text>
                <Text style={styles.timeInfoValue}>
                  {new Date(drive.actualStart || drive.scheduledStart).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <View style={styles.timeInfoDivider} />
              <View style={styles.timeInfoItem}>
                <Text style={styles.timeInfoLabel}>현재 시간</Text>
                <Text style={styles.timeInfoValue}>
                  {currentTime.toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <View style={styles.timeInfoDivider} />
              <View style={styles.timeInfoItem}>
                <Text style={styles.timeInfoLabel}>운행 시간</Text>
                <Text style={styles.timeInfoValue}>{elapsedTime}</Text>
              </View>
            </View>
          </View>

          {nextStopInfo && (
            <View style={styles.nextStopCard}>
              <Text style={styles.nextStopLabel}>다음 정거장</Text>
              <Text style={styles.nextStopName}>{nextStopInfo.name}</Text>
              {nextStopInfo.estimatedTime && (
                <View style={styles.timeRemainingContainer}>
                  <Text style={styles.timeRemainingText}>
                    {nextStopInfo.estimatedTime}
                  </Text>
                </View>
              )}
              {nextStopInfo.sequence && (
                <Text style={styles.stopSequence}>
                  {nextStopInfo.sequence} / {nextStopInfo.totalStops} 정거장
                </Text>
              )}
            </View>
          )}

          {isNearDestination && (
            <View style={styles.arrivalNotice}>
              <Text style={styles.arrivalNoticeText}>
                목적지에 접근 중입니다. 안전 운행하세요.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.endDriveButton,
              !isNearDestination && styles.warningButton,
            ]}
            onPress={handleEndDrive}
          >
            <Text style={styles.endDriveButtonText}>
              {isNearDestination ? '운행 종료' : '운행 종료 (목적지 도착 전)'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: SPACING.xs,
  },
  connectionText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.success,
  },
  drivingStatusContainer: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.success,
    marginRight: SPACING.xs,
  },
  statusText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.black,
    fontWeight: FONT_WEIGHT.medium,
  },
  busInfoContainer: {
    marginBottom: SPACING.md,
  },
  busNumber: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  routeBadge: {
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    alignSelf: 'flex-start',
  },
  routeBadgeText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.medium,
  },
  seatInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.lightGrey,
    borderRadius: BORDER_RADIUS.sm,
  },
  seatInfoLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.grey,
  },
  seatInfoValue: {
    fontSize: FONT_SIZE.md,
    color: COLORS.black,
    fontWeight: FONT_WEIGHT.semiBold,
  },
  timeInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeInfoItem: {
    flex: 1,
  },
  timeInfoDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.xs,
  },
  timeInfoLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.grey,
    marginBottom: SPACING.xs,
  },
  timeInfoValue: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.black,
    fontWeight: FONT_WEIGHT.medium,
  },
  nextStopCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  nextStopLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.grey,
    marginBottom: SPACING.xs,
  },
  nextStopName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
    marginBottom: SPACING.md,
  },
  timeRemainingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeRemainingText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.medium,
  },
  stopSequence: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.grey,
    marginTop: SPACING.xs,
  },
  arrivalNotice: {
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  arrivalNoticeText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    textAlign: 'center',
  },
  bottomContainer: {
    padding: SPACING.md,
  },
  endDriveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  warningButton: {
    backgroundColor: COLORS.warning,
  },
  endDriveButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semiBold,
  },
});

export default DrivingScreen;