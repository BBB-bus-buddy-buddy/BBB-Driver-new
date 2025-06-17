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
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { driveAPI } from '../api/drive';
import { startLocationTracking, stopLocationTracking, getCurrentLocation } from '../services/locationService';
import driverWebSocketService from '../services/driverWebSocketService';
import { storage } from '../utils/storage';
import { toKSTLocaleString, getNowKST, toKSTISOString } from '../utils/kstTimeUtils';
import DriveEndConfirmationModal from '../components/DriveEndConfirmationModal';
import { debugLocationSwap } from '../utils/locationSwapHelper';

const DrivingScreen = ({ navigation, route }) => {
  const { drive } = route.params;

  // 상태 관리
  const [currentTime, setCurrentTime] = useState(getNowKST());
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [locationTrackingId, setLocationTrackingId] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [currentLocationInfo, setCurrentLocationInfo] = useState(null);

  // 운행 정보 상태
  const [drivingInfo, setDrivingInfo] = useState({
    occupiedSeats: 0,
    totalPassengers: 0,
    boardedCount: 0,
    alightedCount: 0,
    currentSpeed: 0,
    averageSpeed: 0,
    totalDistance: 0,
  });

  // 정류장 정보 상태
  const [stationInfo, setStationInfo] = useState({
    currentStation: null,
    nextStation: null,
    remainingStations: 0,
    progress: 0,
  });

  // 목적지 정보 상태
  const [destinationInfo, setDestinationInfo] = useState({
    isNear: false,
    distance: null,
    estimatedTime: null,
  });

  // 운행 종료 모달 상태
  const [showEndConfirmModal, setShowEndConfirmModal] = useState(false);

  // 애니메이션
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  const appState = useRef(AppState.currentState);
  const locationUpdateInterval = useRef(null);
  const speedHistory = useRef([]);

  // 펄스 애니메이션 (운행 중 표시)
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // 운행 시간 카운터
  useEffect(() => {
    const startTime = new Date(drive.actualStart || drive.scheduledStart || new Date());

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
        if (driverWebSocketService.checkConnection()) {
          setWsConnected(true);
          console.log('[DrivingScreen] WebSocket 이미 연결됨');
        } else {
          const userInfo = await storage.getUserInfo();
          const organizationId = drive.organizationId || userInfo?.organizationId;

          if (!organizationId) {
            console.error('[DrivingScreen] 조직 ID를 찾을 수 없습니다');
            return;
          }

          await driverWebSocketService.connect(
            drive.busNumber || drive.busRealNumber,
            organizationId,
            drive.operationId || drive.id
          );

          setWsConnected(true);
        }

        // WebSocket 메시지 핸들러 등록
        driverWebSocketService.on('busUpdate', handleBusUpdate);
        driverWebSocketService.on('stationUpdate', handleStationUpdate);
        driverWebSocketService.on('passengerBoarding', handlePassengerBoarding);
        driverWebSocketService.on('boarding', handlePassengerBoarding);

        // 운행 시작 상태 전송
        driverWebSocketService.sendBusStatusUpdate('IN_OPERATION');

      } catch (error) {
        console.error('[DrivingScreen] WebSocket 연결 실패:', error);
        Alert.alert('연결 오류', 'WebSocket 연결에 실패했습니다. 운행은 계속됩니다.');
      }
    };

    // 위치 추적 시작
    const watchId = startLocationTracking((location) => {
      console.log('[DrivingScreen] GPS 위치 업데이트:', {
        latitude: location.latitude,
        longitude: location.longitude,
        speed: location.speed,
        accuracy: location.accuracy,
        timestamp: new Date(location.timestamp).toLocaleTimeString()
      });

      currentLocation = location;
      setCurrentLocationInfo(location);

      // 속도 정보 업데이트
      if (location.speed !== null && location.speed !== undefined) {
        const speedKmh = location.speed * 3.6; // m/s를 km/h로 변환
        speedHistory.current.push(speedKmh);

        // 최근 10개의 속도만 유지
        if (speedHistory.current.length > 10) {
          speedHistory.current.shift();
        }

        // 평균 속도 계산
        const avgSpeed = speedHistory.current.reduce((a, b) => a + b, 0) / speedHistory.current.length;

        setDrivingInfo(prev => ({
          ...prev,
          currentSpeed: Math.round(speedKmh),
          averageSpeed: Math.round(avgSpeed),
        }));
      }

      // WebSocket으로 위치 전송
      if (driverWebSocketService.checkConnection()) {
        driverWebSocketService.updateCurrentLocation(location);
        driverWebSocketService.sendLocationUpdate(location, drivingInfo.occupiedSeats);
      }

      // 목적지 근접 여부 확인
      if (drive.endLocation?.latitude && drive.endLocation?.longitude) {
        // 디버깅: 좌표 확인
        debugLocationSwap(location, drive.endLocation, '목적지 거리 계산');

        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          drive.endLocation.latitude,
          drive.endLocation.longitude
        );

        const distanceInMeters = distance * 1000; // km를 m로 변환
        const estimatedTime = estimateArrivalTime(distanceInMeters, location.speed || 8.33);

        console.log('[DrivingScreen] 목적지까지 거리:', {
          목적지: drive.endLocation.name,
          거리_미터: distanceInMeters,
          예상_도착: estimatedTime,
          근처여부: distance < 0.1
        });

        setDestinationInfo({
          isNear: distance < 0.1, // 100m = 0.1km
          distance: distanceInMeters,
          estimatedTime: estimatedTime,
        });
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
      driverWebSocketService.off('stationUpdate');
      driverWebSocketService.off('passengerBoarding');
      driverWebSocketService.off('boarding');

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

    if (message.data) {
      // 승객 수 업데이트
      if (message.data.occupiedSeats !== undefined) {
        setDrivingInfo(prev => ({
          ...prev,
          occupiedSeats: message.data.occupiedSeats,
        }));
      }
    }
  };

  const handleStationUpdate = (message) => {
    console.log('[DrivingScreen] 정류장 업데이트:', message);

    if (message.data) {
      const { currentStation, nextStation, progress, remainingStations } = message.data;

      setStationInfo({
        currentStation,
        nextStation,
        remainingStations: remainingStations || 0,
        progress: progress || 0,
      });

      // 진행률 애니메이션
      Animated.timing(progressAnimation, {
        toValue: progress || 0,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }
  };

  const handlePassengerBoarding = (message) => {
    console.log('[DrivingScreen] 승객 탑승/하차:', message);

    const { action, userId, passengerInfo } = message.data || message;

    if (action === 'BOARD' || action === 'board') {
      setDrivingInfo(prev => ({
        ...prev,
        occupiedSeats: prev.occupiedSeats + 1,
        boardedCount: prev.boardedCount + 1,
        totalPassengers: prev.totalPassengers + 1,
      }));

      // 탑승 알림
      showPassengerNotification('탑승', passengerInfo);
    } else if (action === 'ALIGHT' || action === 'alight') {
      setDrivingInfo(prev => ({
        ...prev,
        occupiedSeats: Math.max(0, prev.occupiedSeats - 1),
        alightedCount: prev.alightedCount + 1,
      }));

      // 하차 알림
      showPassengerNotification('하차', passengerInfo);
    }
  };

  // 승객 알림 표시
  const showPassengerNotification = (type, passengerInfo) => {
    // 실제 앱에서는 토스트 메시지나 알림으로 구현
    console.log(`[DrivingScreen] 승객 ${type}:`, passengerInfo);
  };

  // 앱 상태 변경 처리
  const handleAppStateChange = (nextAppState) => {
    if (appState.current === 'background' && nextAppState === 'active') {
      console.log('[DrivingScreen] 앱이 포그라운드로 전환됨');

      // WebSocket 재연결 확인
      if (!driverWebSocketService.checkConnection()) {
        const reconnect = async () => {
          try {
            const userInfo = await storage.getUserInfo();
            const organizationId = drive.organizationId || userInfo?.organizationId;

            await driverWebSocketService.connect(
              drive.busNumber || drive.busRealNumber,
              organizationId,
              drive.operationId || drive.id
            );
            setWsConnected(true);
          } catch (error) {
            console.error('[DrivingScreen] WebSocket 재연결 실패:', error);
          }
        };
        reconnect();
      }
    }
    appState.current = nextAppState;
  };

  // 위치 업데이트 전송 (REST API 백업)
  const sendLocationUpdate = async (location) => {
    try {
      const requestData = {
        operationId: drive.operationId || drive.id,
        busNumber: drive.busNumber || drive.busRealNumber,
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
          setStationInfo(prev => ({
            ...prev,
            nextStation: updateData.nextStop,
          }));
        }

        // 목적지 근접 여부 업데이트
        if (updateData.isNearDestination !== undefined) {
          setDestinationInfo(prev => ({
            ...prev,
            isNear: updateData.isNearDestination,
          }));
        }
      }
    } catch (error) {
      console.error('[DrivingScreen] 위치 업데이트 전송 실패:', error);
    }
  };

  // 거리 계산 함수 (km)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // 지구 반경 (km)
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRad = (deg) => deg * (Math.PI / 180);

  // 도착 예상 시간 계산
  const estimateArrivalTime = (distanceInMeters, speedMs) => {
    if (distanceInMeters <= 0 || !speedMs || speedMs <= 0) {
      return '도착';
    }

    const seconds = distanceInMeters / speedMs;
    const minutes = Math.ceil(seconds / 60);

    if (minutes < 1) {
      return '곧 도착';
    } else if (minutes < 60) {
      return `약 ${minutes}분`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes > 0) {
        return `약 ${hours}시간 ${remainingMinutes}분`;
      } else {
        return `약 ${hours}시간`;
      }
    }
  };

  // 거리 포맷팅
  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
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
    // 운행 종료 확인 모달 표시
    setShowEndConfirmModal(true);
  };

  const handleEndDriveConfirm = async () => {
    if (!destinationInfo.isNear && destinationInfo.distance !== null && destinationInfo.distance > 100) {
      Alert.alert(
        '목적지 도착 전',
        `아직 목적지에서 ${formatDistance(destinationInfo.distance)} 떨어져 있습니다. 정말 운행을 종료하시겠습니까?`,
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
      // 운행 종료 상태 전송
      driverWebSocketService.sendBusStatusUpdate('COMPLETED');

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

      // 현재 위치 가져오기 (선택적)
      let endLocation = null;
      try {
        const location = await getCurrentLocation();
        endLocation = {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: Date.now()
        };
      } catch (locError) {
        console.log('[DrivingScreen] 종료 위치 조회 실패:', locError);
      }

      // 운행 종료 API 호출
      const response = await driveAPI.endDrive({
        operationId: drive.operationId || drive.id,
        currentLocation: endLocation,
        endReason: endReason
      });

      if (response.data.success) {
        const completedDrive = response.data.data;

        // 운행 정보에 추가 데이터 포함
        const enrichedCompletedDrive = {
          ...drive,
          ...completedDrive,
          actualEnd: completedDrive.actualEnd || toKSTISOString(new Date()),
          ...drivingInfo,
          totalDistance: (drivingInfo.totalDistance / 1000).toFixed(1), // km 단위로 변환
        };

        // 운행 정보 저장
        await storage.setCompletedDrive(enrichedCompletedDrive);
        await storage.removeCurrentDrive();

        // 운행 종료 화면으로 이동
        navigation.replace('EndDrive', {
          drive: enrichedCompletedDrive
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
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnimation }] }]} />
            <Text style={styles.headerTitle}>운행 중</Text>
          </View>
          {wsConnected && (
            <View style={styles.connectionStatus}>
              <Text style={styles.connectionText}>🟢 실시간 연결됨</Text>
            </View>
          )}
        </View>

        {/* 버스 정보 카드 */}
        <View style={styles.busInfoCard}>
          <View style={styles.busHeader}>
            <View>
              <Text style={styles.busNumber}>{drive.busNumber || drive.busRealNumber}</Text>
              <View style={styles.routeBadge}>
                <Text style={styles.routeBadgeText}>{drive.routeName || drive.route || '노선 정보 없음'}</Text>
              </View>
            </View>
            <View style={styles.timeContainer}>
              <Text style={styles.timeLabel}>운행 시간</Text>
              <Text style={styles.elapsedTime}>{elapsedTime}</Text>
            </View>
          </View>

          {/* 승객 정보 */}
          <View style={styles.passengerInfoContainer}>
            <View style={styles.infoItem}>
              <Text style={styles.infoEmoji}>👥</Text>
              <Text style={styles.infoLabel}>현재 탑승</Text>
              <Text style={styles.infoValue}>{drivingInfo.occupiedSeats}명</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoEmoji}>📈</Text>
              <Text style={styles.infoLabel}>총 탑승</Text>
              <Text style={styles.infoValue}>{drivingInfo.boardedCount}명</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoEmoji}>📉</Text>
              <Text style={styles.infoLabel}>총 하차</Text>
              <Text style={styles.infoValue}>{drivingInfo.alightedCount}명</Text>
            </View>
          </View>

          {/* 속도 정보 */}
          <View style={styles.speedInfoContainer}>
            <View style={styles.speedItem}>
              <Text style={styles.speedLabel}>현재 속도</Text>
              <Text style={styles.speedValue}>{drivingInfo.currentSpeed} km/h</Text>
            </View>
            <View style={styles.speedItem}>
              <Text style={styles.speedLabel}>평균 속도</Text>
              <Text style={styles.speedValue}>{drivingInfo.averageSpeed} km/h</Text>
            </View>
          </View>
        </View>

        {/* 정류장 진행 상황 */}
        {(stationInfo.currentStation || stationInfo.nextStation) && (
          <View style={styles.stationProgressCard}>
            <Text style={styles.sectionTitle}>정류장 진행 상황</Text>

            {/* 진행 바 */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      width: progressAnimation.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{Math.round(stationInfo.progress || 0)}%</Text>
            </View>

            {/* 현재 정류장 */}
            {stationInfo.currentStation && (
              <View style={styles.stationItem}>
                <Text style={styles.stationEmoji}>📍</Text>
                <View style={styles.stationTextContainer}>
                  <Text style={styles.stationLabel}>현재 정류장</Text>
                  <Text style={styles.stationName}>{stationInfo.currentStation.name}</Text>
                </View>
              </View>
            )}

            {/* 다음 정류장 */}
            {stationInfo.nextStation && (
              <View style={[styles.stationItem, styles.nextStationItem]}>
                <Text style={styles.stationEmoji}>🚩</Text>
                <View style={styles.stationTextContainer}>
                  <Text style={styles.stationLabel}>다음 정류장</Text>
                  <Text style={styles.stationName}>{stationInfo.nextStation.name}</Text>
                  {stationInfo.nextStation.estimatedTime && (
                    <Text style={styles.estimatedTime}>{stationInfo.nextStation.estimatedTime}</Text>
                  )}
                </View>
              </View>
            )}

            {/* 남은 정류장 */}
            {stationInfo.remainingStations > 0 && (
              <Text style={styles.remainingStations}>
                남은 정류장: {stationInfo.remainingStations}개
              </Text>
            )}
          </View>
        )}

        {/* 도착지 정보 카드 */}
        {drive.endLocation && (
          <View style={[styles.destinationCard, destinationInfo.isNear && styles.nearDestinationCard]}>
            <View style={styles.destinationHeader}>
              <Text style={styles.destinationEmoji}>
                {destinationInfo.isNear ? '✅' : '📍'}
              </Text>
              <Text style={styles.destinationTitle}>도착지</Text>
            </View>

            <Text style={styles.destinationName}>
              {drive.endLocation.name || '도착지'}
            </Text>

            {destinationInfo.distance !== null && (
              <View style={styles.destinationInfo}>
                <Text style={[styles.distanceText, destinationInfo.isNear && styles.nearDistanceText]}>
                  남은 거리: {formatDistance(destinationInfo.distance)}
                </Text>
                {destinationInfo.estimatedTime && (
                  <Text style={styles.estimatedArrivalText}>
                    도착 예정: {destinationInfo.estimatedTime}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* 도착 임박 알림 */}
        {destinationInfo.isNear && (
          <View style={styles.arrivalNotice}>
            <Text style={styles.arrivalNoticeText}>
              ℹ️ 목적지에 접근 중입니다. 안전 운행하세요.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* 운행 종료 버튼 */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.endDriveButton,
            !destinationInfo.isNear && styles.warningButton,
          ]}
          onPress={handleEndDrive}
        >
          <Text style={styles.endDriveButtonText}>
            {destinationInfo.isNear ? '🛑 운행 종료' : '⚠️ 운행 종료 (목적지 도착 전)'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 운행 종료 확인 모달 */}
      <DriveEndConfirmationModal
        visible={showEndConfirmModal}
        onClose={() => setShowEndConfirmModal(false)}
        onConfirm={handleEndDriveConfirm}
        driveInfo={{
          busNumber: drive.busNumber || drive.busRealNumber,
          elapsedTime: elapsedTime,
          totalPassengers: drivingInfo.totalPassengers,
          occupiedSeats: drivingInfo.occupiedSeats,
        }}
        destinationInfo={{
          isNear: destinationInfo.isNear,
          distance: destinationInfo.distance,
          distanceText: destinationInfo.distance ? formatDistance(destinationInfo.distance) : null,
        }}
      />
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.error,
    marginRight: SPACING.sm,
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
  connectionText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.success,
  },
  busInfoCard: {
    backgroundColor: COLORS.white,
    margin: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  busHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
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
  timeContainer: {
    alignItems: 'flex-end',
  },
  timeLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.grey,
    marginBottom: SPACING.xs,
  },
  elapsedTime: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.primary,
  },
  passengerInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoEmoji: {
    fontSize: 20,
    marginBottom: SPACING.xs,
  },
  infoLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.grey,
    marginBottom: SPACING.xs,
  },
  infoValue: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.black,
    fontWeight: FONT_WEIGHT.semiBold,
  },
  infoDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  speedInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  speedItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speedLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.grey,
    marginRight: SPACING.sm,
  },
  speedValue: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.black,
    fontWeight: FONT_WEIGHT.medium,
  },
  stationProgressCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
    marginBottom: SPACING.md,
  },
  progressBarContainer: {
    marginBottom: SPACING.lg,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: COLORS.lightGrey,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.grey,
    marginTop: SPACING.xs,
    textAlign: 'right',
  },
  stationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  stationEmoji: {
    fontSize: 20,
    marginRight: SPACING.md,
  },
  nextStationItem: {
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  stationTextContainer: {
    flex: 1,
  },
  stationLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.grey,
    marginBottom: SPACING.xs,
  },
  stationName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.black,
  },
  estimatedTime: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  remainingStations: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.grey,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  destinationCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    ...SHADOWS.small,
  },
  nearDestinationCard: {
    borderLeftColor: COLORS.success,
    backgroundColor: COLORS.success + '10',
  },
  destinationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  destinationEmoji: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  destinationTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.black,
  },
  destinationName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
    marginBottom: SPACING.sm,
  },
  destinationInfo: {
    marginTop: SPACING.sm,
  },
  distanceText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.medium,
  },
  nearDistanceText: {
    color: COLORS.success,
  },
  estimatedArrivalText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.grey,
    marginTop: SPACING.xs,
  },
  arrivalNotice: {
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  arrivalNoticeText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    textAlign: 'center',
  },
  bottomContainer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  endDriveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
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