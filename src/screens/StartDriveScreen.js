// src/screens/StartDriveScreen.js (KST 시간 적용 부분)
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
import driverWebSocketService from '../services/driverWebSocketService';
import { storage } from '../utils/storage';
import WebSocketStatus from '../components/WebSocketStatus';
import { createKSTDate, toKSTISOString } from '../utils/kstTimeUtils';

const StartDriveScreen = ({ navigation, route }) => {
  // route.params가 없거나 drive가 없는 경우 처리
  const drive = route?.params?.drive;

  const [loading, setLoading] = useState(false);
  const [checkingLocation, setCheckingLocation] = useState(true);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [wsPreConnected, setWsPreConnected] = useState(false);
  const [distanceToStart, setDistanceToStart] = useState(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [noStartLocationInfo, setNoStartLocationInfo] = useState(false);
  const [noEndLocationInfo, setNoEndLocationInfo] = useState(false);

  // 허용 반경 (미터)
  const ARRIVAL_THRESHOLD_METERS = 100; // 백엔드는 50m이지만 프론트엔드는 좀 더 넉넉하게

  useEffect(() => {
    // drive 객체 유효성 검증
    if (!drive) {
      Alert.alert(
        '오류',
        '운행 정보를 불러올 수 없습니다.',
        [{ text: '확인', onPress: () => navigation.goBack() }]
      );
      return;
    }

    // drive 객체 내용 로그
    console.log('[StartDriveScreen] drive 객체:', JSON.stringify(drive, null, 2));

    // 필수 정보 검증
    const busNumber = drive.busNumber || drive.busRealNumber;
    if (!busNumber) {
      console.error('[StartDriveScreen] busNumber is missing:', drive);
      Alert.alert(
        '오류',
        '버스 정보가 올바르지 않습니다.',
        [{ text: '확인', onPress: () => navigation.goBack() }]
      );
      return;
    }

    // operationId 검증
    if (!drive.operationId && !drive.id) {
      console.error('[StartDriveScreen] operationId is missing:', drive);
      Alert.alert(
        '오류',
        '운행 ID가 올바르지 않습니다.',
        [{ text: '확인', onPress: () => navigation.goBack() }]
      );
      return;
    }

    // 출발지/도착지 정보 확인
    setNoStartLocationInfo(!drive.startLocation || (!drive.startLocation.latitude || !drive.startLocation.longitude));
    setNoEndLocationInfo(!drive.endLocation || (!drive.endLocation.latitude || !drive.endLocation.longitude));

    checkLocationAndPermission();
    preConnectWebSocket();
  }, [drive]);

  // WebSocket 사전 연결
  const preConnectWebSocket = async () => {
    try {
      const userInfo = await storage.getUserInfo();
      const organizationId = userInfo?.organizationId || drive.organizationId;

      if (!organizationId) {
        console.warn('[StartDriveScreen] 조직 ID를 찾을 수 없어 WebSocket 사전 연결 스킵');
        return;
      }

      const busNumber = drive.busNumber || drive.busRealNumber;
      if (!busNumber) {
        console.error('[StartDriveScreen] WebSocket 연결 실패 - busNumber 없음');
        return;
      }

      await driverWebSocketService.connect(
        busNumber,
        organizationId,
        drive.operationId || drive.id
      );

      setWsPreConnected(true);
      console.log('[StartDriveScreen] WebSocket 사전 연결 성공');
    } catch (error) {
      console.error('[StartDriveScreen] WebSocket 사전 연결 실패:', error);
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

      setLocationPermissionGranted(true);

      // 현재 위치 가져오기
      try {
        const location = await getCurrentLocation();
        setCurrentLocation(location);

        // 출발지 정보가 있으면 거리 계산
        if (drive.startLocation?.latitude && drive.startLocation?.longitude) {
          const distance = calculateDistance(
            location.latitude,
            location.longitude,
            drive.startLocation.latitude,
            drive.startLocation.longitude
          );
          
          setDistanceToStart(distance);
          
          // 출발지 근처인지 확인
          if (distance <= ARRIVAL_THRESHOLD_METERS) {
            setLocationConfirmed(true);
          } else {
            setLocationConfirmed(false);
            setLocationError(`출발지까지 ${formatDistance(distance)} 남았습니다.`);
          }
        } else {
          // 출발지 정보가 없는 경우
          console.log('[StartDriveScreen] 출발지 정보 없음');
          console.warn('[StartDriveScreen] drive.startLocation:', drive.startLocation);
          console.warn('[StartDriveScreen] drive.endLocation:', drive.endLocation);
          
          // 출발지 확인 없이 운행 시작 허용
          setLocationConfirmed(true);
          setLocationError(null);
        }
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

  // 거리 계산 함수 (미터 단위)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // 지구 반지름 (미터)
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const toRad = (deg) => deg * (Math.PI/180);

  // 거리 포맷팅
  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  };

  const handleStartDrive = async () => {
    try {
      setLoading(true);

      // 출발지/도착지 정보가 없는 경우 경고
      if (noStartLocationInfo || noEndLocationInfo) {
        const missingInfo = [];
        if (noStartLocationInfo) missingInfo.push('출발지');
        if (noEndLocationInfo) missingInfo.push('도착지');
        
        Alert.alert(
          '위치 정보 확인',
          `${missingInfo.join('와 ')} 정보를 확인할 수 없습니다.\n그래도 운행을 시작하시겠습니까?`,
          [
            { text: '취소', style: 'cancel', onPress: () => setLoading(false) },
            { text: '운행 시작', onPress: () => proceedWithStart() }
          ]
        );
        return;
      }

      // 출발지 정보가 있고, 출발지 근처가 아닌 경우에만 경고
      if (!noStartLocationInfo && distanceToStart !== null && distanceToStart > ARRIVAL_THRESHOLD_METERS) {
        Alert.alert(
          '출발지 확인',
          `현재 출발지에서 ${formatDistance(distanceToStart)} 떨어져 있습니다. 그래도 운행을 시작하시겠습니까?`,
          [
            { text: '취소', style: 'cancel', onPress: () => setLoading(false) },
            { text: '운행 시작', onPress: () => proceedWithStart() }
          ]
        );
        return;
      }

      await proceedWithStart();
    } catch (error) {
      setLoading(false);
      console.error('[StartDriveScreen] 운행 시작 오류:', error);
      Alert.alert('오류', '운행을 시작할 수 없습니다. 다시 시도해주세요.');
    }
  };

  const proceedWithStart = async () => {
    const requestData = {
      operationId: drive.operationId || drive.id,
      isEarlyStart: false,
      currentLocation: currentLocation ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        timestamp: Date.now()
      } : null
    };

    // 출발 시간 확인 - KST 기준
    const now = new Date();
    let scheduledStart;

    const timeStr = drive.startTime || drive.departureTime?.split(' ').pop();
    if (timeStr && drive.operationDate) {
      scheduledStart = createKSTDate(drive.operationDate, timeStr);
    } else if (drive.scheduledStart) {
      scheduledStart = new Date(drive.scheduledStart);
    } else {
      scheduledStart = now;
    }

    const timeDiff = (scheduledStart - now) / (1000 * 60); // 분 단위

    // 예정 시간보다 이른 경우 조기 출발 확인 (시간 제한 없음)
    if (timeDiff > 0) {
      const hours = Math.floor(timeDiff / 60);
      const minutes = Math.ceil(timeDiff % 60);
      const timeText = hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
      
      Alert.alert(
        '조기 출발',
        `예정 출발 시간까지 ${timeText} 남았습니다. 조기 출발하시겠습니까?`,
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
    }

    await startDriveRequest(requestData);
  };

  const startDriveRequest = async (requestData) => {
    try {
      const response = await driveAPI.startDrive(requestData);

      if (response.data.success) {
        const driveData = response.data.data;

        const currentDriveInfo = {
          ...drive,
          ...driveData,
          actualStart: driveData.actualStart || toKSTISOString(new Date()),
          status: 'IN_PROGRESS',
          organizationId: drive.organizationId || (await storage.getUserInfo())?.organizationId
        };

        await storage.setCurrentDrive(currentDriveInfo);

        navigation.replace('Driving', {
          drive: currentDriveInfo
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
    if (wsPreConnected) {
      driverWebSocketService.disconnect();
    }
    navigation.goBack();
  };

  const getBusNumber = () => {
    return drive?.busNumber || drive?.busRealNumber || 'BUS-UNKNOWN';
  };

  // 운행 시작 버튼 활성화 조건 수정
  const canStart = locationPermissionGranted && !checkingLocation && !loading;

  const formatDepartureTime = () => {
    if (drive.startTime && drive.operationDate) {
      return `${drive.operationDate} ${drive.startTime}`;
    }
    return drive.departureTime || '시간 정보 없음';
  };

  const formatArrivalTime = () => {
    if (drive.endTime && drive.operationDate) {
      return drive.endTime;
    }
    return drive.arrivalTime?.split(' ').pop() || '시간 정보 없음';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Text style={styles.backButtonText}>← 뒤로</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>운행 준비</Text>
          {wsPreConnected && <WebSocketStatus />}
        </View>

        <View style={styles.content}>
          <View style={styles.driveInfoCard}>
            <Text style={styles.busNumber}>{getBusNumber()}</Text>
            <View style={styles.routeInfo}>
              <Text style={styles.routeText}>{drive.route || drive.routeName || '노선 정보 없음'}</Text>
            </View>
            <View style={styles.timeInfo}>
              <View style={styles.timeItem}>
                <Text style={styles.timeLabel}>출발 시간</Text>
                <Text style={styles.timeValue}>
                  {drive.startTime || '시간 정보 없음'}
                </Text>
              </View>
              <View style={styles.timeDivider} />
              <View style={styles.timeItem}>
                <Text style={styles.timeLabel}>도착 예정</Text>
                <Text style={styles.timeValue}>
                  {drive.endTime || '시간 정보 없음'}
                </Text>
              </View>
            </View>
            {drive.driverName && (
              <View style={styles.driverInfo}>
                <Text style={styles.driverLabel}>운전자</Text>
                <Text style={styles.driverName}>{drive.driverName}</Text>
              </View>
            )}
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
                {locationError !== '출발지 정보를 확인할 수 없습니다.' && (
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={handleRefreshLocation}
                  >
                    <Text style={styles.retryButtonText}>다시 시도</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : noStartLocationInfo ? (
              <View style={styles.warningContainer}>
                <Text style={styles.warningText}>
                  ⚠️ 출발지 정보를 확인할 수 없습니다
                </Text>
                <Text style={styles.warningSubText}>
                  위치 확인 없이 운행을 시작할 수 있습니다
                </Text>
              </View>
            ) : locationConfirmed ? (
              <View style={styles.confirmedContainer}>
                <Text style={styles.confirmedText}>
                  ✓ 출발지 도착 확인 완료
                </Text>
                {distanceToStart !== null && distanceToStart <= ARRIVAL_THRESHOLD_METERS && (
                  <Text style={styles.locationInstruction}>
                    출발지에서 {formatDistance(distanceToStart)} 이내에 있습니다.
                  </Text>
                )}
              </View>
            ) : distanceToStart !== null ? (
              <View style={styles.distanceContainer}>
                <Text style={styles.distanceText}>
                  출발지까지 거리
                </Text>
                <Text style={styles.distanceValue}>
                  {formatDistance(distanceToStart)}
                </Text>
                <Text style={styles.distanceWarning}>
                  출발지 {ARRIVAL_THRESHOLD_METERS}m 이내로 이동해주세요
                </Text>
              </View>
            ) : null}
          </View>

          {/* 위치 정보 카드 */}
          <View style={styles.locationInfoCard}>
            {/* 출발지 정보 */}
            <View style={styles.locationSection}>
              <Text style={styles.locationInfoTitle}>출발지</Text>
              {noStartLocationInfo ? (
                <Text style={styles.noLocationText}>출발지 정보를 확인할 수 없습니다</Text>
              ) : (
                <>
                  <Text style={styles.locationInfoText}>
                    {drive.startLocation?.name || '출발지'}
                  </Text>
                  {currentLocation && distanceToStart !== null && (
                    <Text style={styles.distanceInfoText}>
                      현재 위치에서 {formatDistance(distanceToStart)}
                    </Text>
                  )}
                </>
              )}
            </View>

            {/* 도착지 정보 */}
            <View style={[styles.locationSection, styles.locationSectionBorder]}>
              <Text style={styles.locationInfoTitle}>도착지</Text>
              {noEndLocationInfo ? (
                <Text style={styles.noLocationText}>도착지 정보를 확인할 수 없습니다</Text>
              ) : (
                <Text style={styles.locationInfoText}>
                  {drive.endLocation?.name || '도착지'}
                </Text>
              )}
            </View>
          </View>

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
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.startButtonText}>운행 시작</Text>
            )}
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
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: -1,
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
  driverInfo: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  driverLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.grey,
    marginBottom: SPACING.xs,
  },
  driverName: {
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
    color: COLORS.success,
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
  warningContainer: {
    alignItems: 'center',
    padding: SPACING.sm,
  },
  warningText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.warning,
    textAlign: 'center',
    fontWeight: FONT_WEIGHT.semiBold,
    marginBottom: SPACING.xs,
  },
  warningSubText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.grey,
    textAlign: 'center',
  },
  distanceContainer: {
    alignItems: 'center',
    padding: SPACING.md,
  },
  distanceText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.grey,
    marginBottom: SPACING.xs,
  },
  distanceValue: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.warning,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.sm,
  },
  distanceWarning: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.warning,
    textAlign: 'center',
  },
  locationInfoCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  locationSection: {
    marginBottom: SPACING.md,
  },
  locationSectionBorder: {
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginBottom: 0,
  },
  locationInfoTitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.grey,
    marginBottom: SPACING.xs,
    fontWeight: FONT_WEIGHT.medium,
  },
  locationInfoText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.black,
    fontWeight: FONT_WEIGHT.medium,
  },
  noLocationText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.warning,
    fontStyle: 'italic',
  },
  distanceInfoText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    marginTop: SPACING.xs,
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
    minHeight: 50,
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