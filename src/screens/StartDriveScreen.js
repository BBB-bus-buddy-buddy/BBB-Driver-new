// src/screens/StartDriveScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { driveAPI } from '../api/drive';
import { 
  requestLocationPermission, 
  getCurrentLocation
} from '../services/locationService';
import driverWebSocketService from '../services/webSocketService';
import { storage } from '../utils/storage';
import WebSocketStatus from '../components/WebSocketStatus';

const StartDriveScreen = ({ navigation, route }) => {
  const { drive } = route.params;
  const [loading, setLoading] = useState(false);
  const [checkingLocation, setCheckingLocation] = useState(true);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [wsPreConnected, setWsPreConnected] = useState(false);

  useEffect(() => {
    checkLocationAndPermission();
    preConnectWebSocket();
  }, []);

  // WebSocket 사전 연결
  const preConnectWebSocket = async () => {
    try {
      const userInfo = await storage.getUserInfo();
      const organizationId = userInfo?.organizationId;

      if (!organizationId) {
        console.warn('[StartDriveScreen] 조직 ID를 찾을 수 없어 WebSocket 사전 연결 스킵');
        return;
      }

      // WebSocket 미리 연결 (운행 시작 전)
      await driverWebSocketService.connect(
        drive.busNumber,
        organizationId,
        drive.id || drive.operationId
      );

      setWsPreConnected(true);
      console.log('[StartDriveScreen] WebSocket 사전 연결 성공');
    } catch (error) {
      console.error('[StartDriveScreen] WebSocket 사전 연결 실패:', error);
      // 실패해도 운행 시작은 가능하도록 함
    }
  };

  const checkLocationAndPermission = async () => {
    try {
      setCheckingLocation(true);
      setLocationError(null);

      // 위치 권한 요청
      const hasPermission = await requestLocationPermission();

      if (!hasPermission) {
        setLocationError('위치 권한이 필요합니다.');
        Alert.alert(
          '위치 권한 필요',
          '운행 시작을 위해 위치 권한이 필요합니다.',
          [{ text: '확인', onPress: () => navigation.goBack() }]
        );
        return;
      }

      // 현재 위치 가져오기
      try {
        const location = await getCurrentLocation();
        setCurrentLocation(location);
        
        // 백엔드에서 출발지 확인을 하므로 프론트엔드에서는 위치 권한만 확인
        setLocationConfirmed(true);
      } catch (locError) {
        console.error('[StartDriveScreen] 위치 조회 오류:', locError);
        setLocationError('현재 위치를 확인할 수 없습니다.');
      }

    } catch (error) {
      console.error('[StartDriveScreen] 위치 확인 오류:', error);
      setLocationError('위치 확인 중 오류가 발생했습니다.');
    } finally {
      setCheckingLocation(false);
    }
  };

  const handleStartDrive = async () => {
    try {
      setLoading(true);

      const requestData = {
        operationId: drive.id || drive.operationId,
        isEarlyStart: false, // 조기 출발 여부는 시간 확인 후 결정
        currentLocation: currentLocation ? {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          timestamp: Date.now()
        } : null
      };

      // 출발 시간 확인
      const now = new Date();
      const scheduledStart = new Date(drive.scheduledStart);
      const timeDiff = (scheduledStart - now) / (1000 * 60); // 분 단위

      if (timeDiff > 0) {
        // 아직 출발 시간이 안됨
        if (timeDiff <= 10) {
          // 10분 이내면 조기 출발 가능
          Alert.alert(
            '조기 출발',
            `예정 출발 시간까지 ${Math.ceil(timeDiff)}분 남았습니다. 조기 출발하시겠습니까?`,
            [
              { text: '취소', style: 'cancel', onPress: () => setLoading(false) },
              { 
                text: '조기 출발', 
                onPress: async () => {
                  requestData.isEarlyStart = true;
                  await startDriveRequest(requestData);
                }
              }
            ]
          );
          return;
        } else {
          Alert.alert('알림', `출발 시간까지 ${Math.ceil(timeDiff)}분 남았습니다.`);
          setLoading(false);
          return;
        }
      }

      // 정상 출발
      await startDriveRequest(requestData);
    } catch (error) {
      setLoading(false);
      console.error('[StartDriveScreen] 운행 시작 오류:', error);
      Alert.alert('오류', '운행을 시작할 수 없습니다. 다시 시도해주세요.');
    }
  };

  const startDriveRequest = async (requestData) => {
    try {
      const response = await driveAPI.startDrive(requestData);

      if (response.data.success) {
        const driveStatus = response.data.data;
        
        // 운행 중 화면으로 이동
        navigation.replace('Driving', { 
          drive: {
            ...drive,
            ...driveStatus,
            status: 'IN_PROGRESS'
          } 
        });
      } else {
        throw new Error(response.data.message || '운행 시작에 실패했습니다.');
      }
    } catch (error) {
      setLoading(false);
      
      if (error.response?.data?.message) {
        Alert.alert('운행 시작 실패', error.response.data.message);
      } else {
        Alert.alert('오류', error.message || '운행을 시작할 수 없습니다.');
      }
    }
  };

  const handleRefreshLocation = () => {
    checkLocationAndPermission();
  };

  const handleGoBack = () => {
    // WebSocket 연결 해제
    if (wsPreConnected) {
      driverWebSocketService.disconnect();
    }
    navigation.goBack();
  };

  // 운행 시작 버튼 활성화 조건
  const canStart = locationConfirmed && !checkingLocation && !loading;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Text style={styles.backButtonText}>← 뒤로</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>운행 준비</Text>
          <WebSocketStatus />
        </View>

        <View style={styles.content}>
          <View style={styles.driveInfoCard}>
            <Text style={styles.busNumber}>{drive.busNumber}</Text>
            <View style={styles.routeInfo}>
              <Text style={styles.routeText}>{drive.routeName || '노선 정보 없음'}</Text>
            </View>
            <View style={styles.timeInfo}>
              <View style={styles.timeItem}>
                <Text style={styles.timeLabel}>출발 시간</Text>
                <Text style={styles.timeValue}>
                  {new Date(drive.scheduledStart).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
              <View style={styles.timeDivider} />
              <View style={styles.timeItem}>
                <Text style={styles.timeLabel}>도착 예정</Text>
                <Text style={styles.timeValue}>
                  {new Date(drive.scheduledEnd).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.locationCheckCard}>
            <Text style={styles.locationCheckTitle}>
              출발 준비 확인
            </Text>

            {checkingLocation ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>
                  현재 위치를 확인하고 있습니다...
                </Text>
              </View>
            ) : locationError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{locationError}</Text>
                <TouchableOpacity 
                  style={styles.retryButton} 
                  onPress={handleRefreshLocation}
                >
                  <Text style={styles.retryButtonText}>다시 시도</Text>
                </TouchableOpacity>
              </View>
            ) : locationConfirmed ? (
              <View style={styles.confirmedContainer}>
                <Text style={styles.confirmedText}>
                  위치 확인 완료
                </Text>
                <Text style={styles.locationInstruction}>
                  출발지 도착 확인은 운행 시작 시 자동으로 진행됩니다.
                </Text>
              </View>
            ) : null}
          </View>

          {drive.startLocation && (
            <View style={styles.locationInfoCard}>
              <Text style={styles.locationInfoTitle}>출발지 정보</Text>
              <Text style={styles.locationInfoText}>{drive.startLocation.name}</Text>
            </View>
          )}

          {wsPreConnected && (
            <View style={styles.wsStatusCard}>
              <View style={styles.wsStatusIcon} />
              <Text style={styles.wsStatusText}>실시간 통신 준비 완료</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.startButton,
              !canStart && styles.disabledButton,
            ]}
            onPress={handleStartDrive}
            disabled={!canStart}
          >
            <Text style={styles.startButtonText}>
              {loading ? '운행 시작 중...' : '운행 시작'}
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
  backButton: {
    padding: SPACING.xs,
  },
  backButtonText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
  },
  content: {
    flex: 1,
  },
  driveInfoCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  busNumber: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
    marginBottom: SPACING.sm,
  },
  routeInfo: {
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    alignSelf: 'flex-start',
    marginBottom: SPACING.md,
  },
  routeText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.medium,
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeItem: {
    flex: 1,
  },
  timeDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.sm,
  },
  timeLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.grey,
    marginBottom: SPACING.xs,
  },
  timeValue: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.black,
    fontWeight: FONT_WEIGHT.medium,
  },
  locationCheckCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  locationCheckTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: SPACING.lg,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.sm,
    color: COLORS.grey,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    padding: SPACING.sm,
  },
  confirmedContainer: {
    alignItems: 'center',
    padding: SPACING.sm,
  },
  confirmedText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: FONT_WEIGHT.semiBold,
  },
  locationInstruction: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.grey,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  errorText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.error,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  locationInfoCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  locationInfoTitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.grey,
    marginBottom: SPACING.xs,
  },
  locationInfoText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.black,
    fontWeight: FONT_WEIGHT.medium,
  },
  wsStatusCard: {
    backgroundColor: COLORS.success + '20',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wsStatusIcon: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: SPACING.xs,
  },
  wsStatusText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.success,
    fontWeight: FONT_WEIGHT.medium,
  },
  bottomContainer: {
    padding: SPACING.md,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: COLORS.extraLightGrey,
  },
  startButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semiBold,
  },
});

export default StartDriveScreen;