// src/screens/DrivingScreen.js 
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  BackHandler,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { driveAPI } from '../api/drive';
import { startLocationTracking, stopLocationTracking } from '../services/locationService';
import { storage } from '../utils/storage';

const DrivingScreen = ({ navigation, route }) => {
  const { drive } = route.params;
  const [currentTime, setCurrentTime] = useState(new Date());
  const [nextStopInfo, setNextStopInfo] = useState({
    name: '다음 정류장 정보 없음',
    timeRemaining: '-',
  });
  const [isAtDestination, setIsAtDestination] = useState(false);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [locationTrackingId, setLocationTrackingId] = useState(null);
  const [gpsUpdateInterval, setGpsUpdateInterval] = useState(null);
  
  const appState = useRef(AppState.currentState);
  const locationBuffer = useRef([]);
  const lastSentLocation = useRef(null);

  // WebSocket 연결 설정
  useEffect(() => {
    let ws = null;
    
    const connectWebSocket = () => {
      try {
        // WebSocket 연결 URL은 환경에 따라 조정
        const wsUrl = __DEV__ 
          ? 'ws://localhost:8080/ws/driver' 
          : 'wss://your-production-url/ws/driver';
        
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('[DrivingScreen] WebSocket 연결 성공');
          
          // 초기 연결 정보 전송
          ws.send(JSON.stringify({
            type: 'driver_connect',
            busNumber: drive.busNumber,
            operationId: drive.operationId || drive.id,
            driverId: drive.driverId,
            organizationId: drive.organizationId
          }));
        };
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log('[DrivingScreen] WebSocket 메시지 수신:', data.type);
          
          // 서버로부터 받은 메시지 처리
          handleWebSocketMessage(data);
        };
        
        ws.onerror = (error) => {
          console.error('[DrivingScreen] WebSocket 오류:', error);
        };
        
        ws.onclose = () => {
          console.log('[DrivingScreen] WebSocket 연결 종료');
          // 재연결 시도
          setTimeout(() => {
            if (appState.current === 'active') {
              connectWebSocket();
            }
          }, 5000);
        };
        
      } catch (error) {
        console.error('[DrivingScreen] WebSocket 연결 실패:', error);
      }
      
      return ws;
    };
    
    // WebSocket 연결
    ws = connectWebSocket();
    
    // 클린업
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [drive]);

  // 운행 시간 카운터와 위치 추적
  useEffect(() => {
    const startTime = new Date(drive.actualStart || drive.startTime);

    // 시간 타이머
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // 경과 시간 계산
      const diff = now - startTime;
      const hours = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
      const minutes = Math.floor((diff / (1000 * 60)) % 60).toString().padStart(2, '0');
      const seconds = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
      setElapsedTime(`${hours}:${minutes}:${seconds}`);

      // 다음 정류장 정보 업데이트 (실제로는 서버에서 받아와야 함)
      updateNextStopInfo();
    }, 1000);

    // 위치 추적 시작
    const watchId = startLocationTracking((location) => {
      // 위치 버퍼에 추가
      locationBuffer.current.push({
        ...location,
        timestamp: Date.now()
      });

      // 위치 업데이트 처리
      handleLocationUpdate(location);
    });

    setLocationTrackingId(watchId);

    // GPS 업데이트 전송 인터벌 (10초마다)
    const gpsInterval = setInterval(() => {
      sendGPSUpdate();
    }, 10000);
    
    setGpsUpdateInterval(gpsInterval);

    // 앱 상태 리스너
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // 컴포넌트 언마운트 시 타이머와 위치 추적 정리
    return () => {
      clearInterval(timer);
      clearInterval(gpsInterval);
      if (locationTrackingId) {
        stopLocationTracking(locationTrackingId);
      }
      appStateSubscription.remove();
    };
  }, [drive.startTime]);

  // 앱 상태 변경 처리
  const handleAppStateChange = (nextAppState) => {
    if (appState.current === 'background' && nextAppState === 'active') {
      console.log('[DrivingScreen] 앱이 포그라운드로 전환됨');
      // 백그라운드에서 돌아왔을 때 즉시 위치 업데이트
      sendGPSUpdate();
    }
    appState.current = nextAppState;
  };

  // WebSocket 메시지 처리
  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'next_stop_update':
        setNextStopInfo({
          name: data.stopName,
          timeRemaining: data.estimatedTime
        });
        break;
      case 'destination_reached':
        setIsAtDestination(true);
        break;
      case 'emergency_stop':
        Alert.alert('긴급 정지', data.message);
        break;
      default:
        break;
    }
  };

  // 위치 업데이트 처리
  const handleLocationUpdate = (location) => {
    // 마지막 전송 위치와 비교하여 의미있는 변화가 있을 때만 처리
    if (lastSentLocation.current) {
      const distance = calculateDistance(
        lastSentLocation.current.latitude,
        lastSentLocation.current.longitude,
        location.latitude,
        location.longitude
      );
      
      // 10미터 이상 이동했을 때만 업데이트
      if (distance < 10) {
        return;
      }
    }
    
    // 실시간 위치 정보 저장
    storage.setCurrentDrive({
      ...drive,
      currentLocation: location,
      lastLocationUpdate: Date.now()
    });
  };

  // GPS 업데이트 전송
  const sendGPSUpdate = async () => {
    try {
      if (locationBuffer.current.length === 0) {
        return;
      }

      // 최신 위치 정보 가져오기
      const latestLocation = locationBuffer.current[locationBuffer.current.length - 1];
      
      // API 호출로 위치 업데이트
      const response = await driveAPI.updateLocation({
        operationId: drive.operationId || drive.id,
        busNumber: drive.busNumber,
        location: {
          latitude: latestLocation.latitude,
          longitude: latestLocation.longitude,
          timestamp: latestLocation.timestamp
        },
        speed: latestLocation.speed || 0,
        heading: latestLocation.heading || 0,
        accuracy: latestLocation.accuracy || 0
      });

      if (response.data.success) {
        // 성공적으로 전송된 위치 기록
        lastSentLocation.current = latestLocation;
        
        // 버퍼 비우기
        locationBuffer.current = [];
        
        // 서버에서 받은 정보로 업데이트
        if (response.data.data.nextStop) {
          setNextStopInfo(response.data.data.nextStop);
        }
        
        if (response.data.data.isNearDestination) {
          setIsAtDestination(true);
        }
      }
    } catch (error) {
      console.error('[DrivingScreen] GPS 업데이트 전송 실패:', error);
      // 오류 시 버퍼 유지 (다음 전송 시 재시도)
    }
  };

  // 다음 정류장 정보 업데이트
  const updateNextStopInfo = async () => {
    try {
      // 현재 위치 기반으로 다음 정류장 계산
      // 실제로는 서버 API를 호출해야 함
      if (drive.routeStations && drive.currentStationIndex !== undefined) {
        const nextIndex = drive.currentStationIndex + 1;
        if (nextIndex < drive.routeStations.length) {
          const nextStation = drive.routeStations[nextIndex];
          setNextStopInfo({
            name: nextStation.name,
            timeRemaining: nextStation.estimatedTime || '-'
          });
        }
      }
    } catch (error) {
      console.error('[DrivingScreen] 다음 정류장 정보 업데이트 실패:', error);
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
  }, [isAtDestination]);

  const handleEndDrive = async () => {
    if (!isAtDestination) {
      Alert.alert(
        '목적지 도착 전',
        '아직 목적지에 도착하지 않았습니다. 정말 운행을 종료하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '운행 종료',
            style: 'destructive',
            onPress: () => completeEndDrive('early_termination'),
          },
        ],
        { cancelable: true }
      );
    } else {
      completeEndDrive('normal');
    }
  };

  const completeEndDrive = async (endReason) => {
    try {
      // 위치 추적 중지
      if (locationTrackingId) {
        stopLocationTracking(locationTrackingId);
      }
      
      // GPS 업데이트 인터벌 중지
      if (gpsUpdateInterval) {
        clearInterval(gpsUpdateInterval);
      }

      // 마지막 위치 정보 가져오기
      const currentLocation = locationBuffer.current.length > 0 
        ? locationBuffer.current[locationBuffer.current.length - 1]
        : lastSentLocation.current;

      // 운행 종료 API 호출
      const response = await driveAPI.endDrive({
        operationId: drive.operationId || drive.id,
        currentLocation: currentLocation ? {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          timestamp: currentLocation.timestamp || Date.now()
        } : null,
        endReason: endReason === 'early_termination' ? '조기 종료' : null
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

  // 거리 계산 헬퍼 함수
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>운행 중</Text>
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
                <Text style={styles.routeBadgeText}>{drive.routeName || drive.route}</Text>
              </View>
            </View>

            <View style={styles.timeInfoContainer}>
              <View style={styles.timeInfoItem}>
                <Text style={styles.timeInfoLabel}>운행 시작</Text>
                <Text style={styles.timeInfoValue}>
                  {new Date(drive.actualStart || drive.startTime).toLocaleTimeString('ko-KR', {
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

          <View style={styles.nextStopCard}>
            <Text style={styles.nextStopLabel}>다음 정거장</Text>
            <Text style={styles.nextStopName}>{nextStopInfo.name}</Text>
            <View style={styles.timeRemainingContainer}>
              <Image
                source={require('../assets/clock-icon.png')}
                style={styles.clockIcon}
              />
              <Text style={styles.timeRemainingText}>
                {nextStopInfo.timeRemaining !== '-' 
                  ? `${nextStopInfo.timeRemaining}분 후 도착 예정`
                  : '도착 시간 계산 중...'}
              </Text>
            </View>
          </View>

          {drive.routeMapUrl && (
            <Image
              source={{ uri: drive.routeMapUrl }}
              style={styles.routeMapImage}
              resizeMode="contain"
            />
          )}
        </View>

        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.endDriveButton,
              !isAtDestination && styles.disabledButton,
            ]}
            onPress={handleEndDrive}
          >
            <Text style={styles.endDriveButtonText}>
              {isAtDestination ? '운행 종료' : '목적지 도착 전입니다'}
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
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
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
  clockIcon: {
    width: 16,
    height: 16,
    marginRight: SPACING.xs,
  },
  timeRemainingText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.medium,
  },
  routeMapImage: {
    width: '100%',
    height: 200,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.lightBg,
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
  disabledButton: {
    backgroundColor: COLORS.extraLightGrey,
  },
  endDriveButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semiBold,
  },
});

export default DrivingScreen;