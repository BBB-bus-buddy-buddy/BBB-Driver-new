// src/screens/StartDriveScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
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
import { createKSTDate, toKSTISOString, getMinutesFromNowKST } from '../utils/kstTimeUtils';
import { debugLocationSwap } from '../utils/locationSwapHelper';

// 간단한 아이콘 컴포넌트
const SimpleIcon = ({ name, size = 24, color = COLORS.primary, style }) => {
  const icons = {
    'arrow-back': '←',
    'check-circle': '✓',
    'radio-button-unchecked': '○',
    'location-on': '📍',
    'flag': '🚩',
    'refresh': '↻',
    'directions-bus': '🚌',
    'schedule': '⏰',
  };

  return (
    <Text style={[{ fontSize: size, color }, style]}>
      {icons[name] || '•'}
    </Text>
  );
};

const StartDriveScreen = ({ navigation, route }) => {
  const drive = route?.params?.drive;

  // 상태 관리
  const [loading, setLoading] = useState(false);
  const [checkingLocation, setCheckingLocation] = useState(true);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [distanceToStart, setDistanceToStart] = useState(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [noStartLocationInfo, setNoStartLocationInfo] = useState(false);
  const [noEndLocationInfo, setNoEndLocationInfo] = useState(false);

  // 체크리스트 상태
  const [checklist, setChecklist] = useState({
    locationPermission: false,
    gpsEnabled: false,
    nearStartLocation: false,
    websocketConnected: false,
    timeCheck: false,
  });

  // 조기 출발 모달
  const [showEarlyStartModal, setShowEarlyStartModal] = useState(false);
  const [earlyStartMinutes, setEarlyStartMinutes] = useState(0);

  // 허용 반경 (미터)
  const ARRIVAL_THRESHOLD_METERS = 100;
  const EARLY_START_ALLOWED_MINUTES = 10;

  useEffect(() => {
    if (!drive) {
      Alert.alert(
        '오류',
        '운행 정보를 불러올 수 없습니다.',
        [{ text: '확인', onPress: () => navigation.goBack() }]
      );
      return;
    }

    const busNumber = drive.busNumber || drive.busRealNumber;
    if (!busNumber) {
      Alert.alert(
        '오류',
        '버스 정보가 올바르지 않습니다.',
        [{ text: '확인', onPress: () => navigation.goBack() }]
      );
      return;
    }

    if (!drive.operationId && !drive.id) {
      Alert.alert(
        '오류',
        '운행 ID가 올바르지 않습니다.',
        [{ text: '확인', onPress: () => navigation.goBack() }]
      );
      return;
    }

    setNoStartLocationInfo(!drive.startLocation || (!drive.startLocation.latitude || !drive.startLocation.longitude));
    setNoEndLocationInfo(!drive.endLocation || (!drive.endLocation.latitude || !drive.endLocation.longitude));

    performStartupChecks();
  }, [drive]);

  // 시작 시 모든 체크 수행
  const performStartupChecks = async () => {
    await checkLocationAndPermission();
    await checkDepartureTime();
    await preConnectWebSocket();
  };

  // 출발 시간 체크
  const checkDepartureTime = () => {
    const timeStr = drive.startTime || drive.departureTime?.split(' ').pop();
    if (timeStr && drive.operationDate) {
      const minutesFromNow = getMinutesFromNowKST(drive.operationDate, timeStr);

      if (minutesFromNow <= 0) {
        // 이미 출발 시간이 지남
        setChecklist(prev => ({ ...prev, timeCheck: true }));
      } else if (minutesFromNow <= EARLY_START_ALLOWED_MINUTES) {
        // 조기 출발 가능 시간
        setChecklist(prev => ({ ...prev, timeCheck: true }));
        setEarlyStartMinutes(minutesFromNow);
      } else {
        // 아직 출발 시간이 아님
        setChecklist(prev => ({ ...prev, timeCheck: false }));
        setEarlyStartMinutes(minutesFromNow);
      }
    } else {
      // 시간 정보가 없으면 체크 패스
      setChecklist(prev => ({ ...prev, timeCheck: true }));
    }
  };

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

      setWsConnected(true);
      setChecklist(prev => ({ ...prev, websocketConnected: true }));
      console.log('[StartDriveScreen] WebSocket 사전 연결 성공');
    } catch (error) {
      console.error('[StartDriveScreen] WebSocket 사전 연결 실패:', error);
      setChecklist(prev => ({ ...prev, websocketConnected: false }));
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
        setChecklist(prev => ({ ...prev, locationPermission: false }));
        Alert.alert(
          '위치 권한 필요',
          '운행 시작을 위해 위치 권한이 필요합니다.',
          [{ text: '확인', onPress: () => navigation.goBack() }]
        );
        return;
      }

      setLocationPermissionGranted(true);
      setChecklist(prev => ({ ...prev, locationPermission: true }));

      // 현재 위치 가져오기
      try {
        const location = await getCurrentLocation();
        console.log('[StartDriveScreen] GPS 위치 수신 성공:', {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: location.timestamp,
          정확도: location.accuracy || '알 수 없음'
        });

        setCurrentLocation(location);
        setChecklist(prev => ({ ...prev, gpsEnabled: true }));

        // 출발지 정보 로깅
        console.log('[StartDriveScreen] 출발지 정보:', {
          startLocation: drive.startLocation,
          hasLatitude: drive.startLocation?.latitude !== undefined,
          hasLongitude: drive.startLocation?.longitude !== undefined
        });

        // 출발지 정보가 있으면 거리 계산
        if (drive.startLocation?.latitude && drive.startLocation?.longitude) {
          // 디버깅: 좌표 확인
          debugLocationSwap(location, drive.startLocation, '출발지 거리 계산');

          const distance = calculateDistance(
            location.latitude,
            location.longitude,
            drive.startLocation.latitude,
            drive.startLocation.longitude
          );

          console.log('[StartDriveScreen] 출발지까지 거리:', {
            거리_미터: distance,
            포맷된_거리: formatDistance(distance),
            허용_반경: ARRIVAL_THRESHOLD_METERS
          });

          setDistanceToStart(distance);

          // 출발지 근처인지 확인
          if (distance <= ARRIVAL_THRESHOLD_METERS) {
            setLocationConfirmed(true);
            setChecklist(prev => ({ ...prev, nearStartLocation: true }));
          } else {
            setLocationConfirmed(false);
            setChecklist(prev => ({ ...prev, nearStartLocation: false }));
            setLocationError(`출발지까지 ${formatDistance(distance)} 남았습니다.`);
          }
        } else {
          // 출발지 정보가 없는 경우
          console.log('[StartDriveScreen] 출발지 정보 없음 - 위치 확인 스킵');
          setLocationConfirmed(true);
          setChecklist(prev => ({ ...prev, nearStartLocation: true }));
          setLocationError(null);
        }
      } catch (locError) {
        console.error('[StartDriveScreen] 위치 조회 오류:', locError);
        setLocationError('현재 위치를 확인할 수 없습니다.');
        setChecklist(prev => ({ ...prev, gpsEnabled: false }));
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
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRad = (deg) => deg * (Math.PI / 180);

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

      // 모든 체크리스트 확인
      const allChecked = Object.values(checklist).every(check => check === true);

      if (!allChecked && !noStartLocationInfo) {
        Alert.alert(
          '운행 준비 확인',
          '모든 준비사항을 확인해주세요.',
          [{ text: '확인', onPress: () => setLoading(false) }]
        );
        return;
      }

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

      // 조기 출발 확인
      if (earlyStartMinutes > 0) {
        setShowEarlyStartModal(true);
        setLoading(false);
        return;
      }

      await proceedWithStart();
    } catch (error) {
      setLoading(false);
      console.error('[StartDriveScreen] 운행 시작 오류:', error);
      Alert.alert('오류', '운행을 시작할 수 없습니다. 다시 시도해주세요.');
    }
  };

  const proceedWithStart = async (isEarlyStart = false) => {
    const requestData = {
      operationId: drive.operationId || drive.id,
      isEarlyStart: isEarlyStart,
      currentLocation: currentLocation ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        timestamp: Date.now()
      } : null
    };

    await startDriveRequest(requestData);
  };

  const startDriveRequest = async (requestData) => {
    try {
      console.log('[StartDriveScreen] 운행 시작 API 호출:', requestData);
      const response = await driveAPI.startDrive(requestData);
      console.log('[StartDriveScreen] API 응답:', response.data);

      if (response.data.success) {
        const driveData = response.data.data;

        const currentDriveInfo = {
          ...drive,
          ...driveData,
          actualStart: driveData.actualStart || toKSTISOString(new Date()),
          status: 'IN_PROGRESS',
          organizationId: drive.organizationId || (await storage.getUserInfo())?.organizationId
        };

        console.log('[StartDriveScreen] 저장할 운행 정보:', currentDriveInfo);
        await storage.setCurrentDrive(currentDriveInfo);

        console.log('[StartDriveScreen] DrivingScreen으로 이동 시도');

        // 로딩 상태 해제
        setLoading(false);

        // navigation.reset을 사용하여 스택을 완전히 재설정
        navigation.reset({
          index: 0,
          routes: [
            { name: 'Home' },
            { name: 'Driving', params: { drive: currentDriveInfo } }
          ],
        });

        // 백업 방법: navigate 사용
        // navigation.navigate('Driving', {
        //   drive: currentDriveInfo
        // });

        // 디버깅용 로그
        setTimeout(() => {
          console.log('[StartDriveScreen] navigation stack:', navigation.getState());
        }, 1000);
      } else {
        setLoading(false);
        throw new Error(response.data.message || '운행 시작에 실패했습니다.');
      }
    } catch (error) {
      console.error('[StartDriveScreen] 운행 시작 오류:', error);
      setLoading(false);

      if (error.response?.data?.message) {
        Alert.alert('운행 시작 실패', error.response.data.message);
      } else {
        Alert.alert('오류', error.message || '운행을 시작할 수 없습니다.');
      }
    }
  };

  const handleRefreshLocation = () => {
    performStartupChecks();
  };

  const handleGoBack = () => {
    if (wsConnected) {
      driverWebSocketService.disconnect();
    }
    navigation.goBack();
  };

  const getBusNumber = () => {
    return drive?.busNumber || drive?.busRealNumber || 'BUS-UNKNOWN';
  };

  // 체크리스트 아이템 렌더링
  const renderChecklistItem = (title, checked, description) => (
    <View style={styles.checklistItem}>
      <SimpleIcon
        name={checked ? 'check-circle' : 'radio-button-unchecked'}
        size={24}
        color={checked ? COLORS.success : COLORS.grey}
      />
      <View style={styles.checklistTextContainer}>
        <Text style={[styles.checklistTitle, checked && styles.checklistTitleChecked]}>
          {title}
        </Text>
        {description && (
          <Text style={styles.checklistDescription}>{description}</Text>
        )}
      </View>
    </View>
  );

  // 운행 시작 버튼 활성화 조건
  const canStart = !checkingLocation && !loading &&
    (Object.values(checklist).every(check => check === true) || noStartLocationInfo);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <SimpleIcon name="arrow-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>운행 준비</Text>
          {wsConnected && <WebSocketStatus />}
        </View>

        <View style={styles.content}>
          {/* 버스 정보 카드 */}
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
          </View>

          {/* 운행 준비 체크리스트 */}
          <View style={styles.checklistCard}>
            <Text style={styles.checklistHeader}>운행 준비 체크리스트</Text>

            {renderChecklistItem(
              '위치 권한',
              checklist.locationPermission,
              checklist.locationPermission ? '허용됨' : '위치 권한이 필요합니다'
            )}

            {renderChecklistItem(
              'GPS 상태',
              checklist.gpsEnabled,
              checklist.gpsEnabled ? '활성화됨' : 'GPS를 켜주세요'
            )}

            {renderChecklistItem(
              '출발지 확인',
              checklist.nearStartLocation || noStartLocationInfo,
              noStartLocationInfo ? '출발지 정보 없음' :
                checklist.nearStartLocation ? '출발지 도착' :
                  distanceToStart ? `${formatDistance(distanceToStart)} 남음` : '확인 중...'
            )}

            {renderChecklistItem(
              '실시간 통신',
              checklist.websocketConnected,
              checklist.websocketConnected ? '연결됨' : '연결 중...'
            )}

            {renderChecklistItem(
              '출발 시간',
              checklist.timeCheck,
              checklist.timeCheck ?
                (earlyStartMinutes > 0 ? `${earlyStartMinutes}분 후 출발` : '출발 가능') :
                `${earlyStartMinutes}분 후 출발 가능`
            )}
          </View>

          {/* 위치 정보 카드 */}
          <View style={styles.locationInfoCard}>
            <View style={styles.locationSection}>
              <View style={styles.locationHeader}>
                <SimpleIcon name="location-on" size={20} color={COLORS.primary} />
                <Text style={styles.locationInfoTitle}>출발지</Text>
              </View>
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

            <View style={[styles.locationSection, styles.locationSectionBorder]}>
              <View style={styles.locationHeader}>
                <SimpleIcon name="flag" size={20} color={COLORS.primary} />
                <Text style={styles.locationInfoTitle}>도착지</Text>
              </View>
              {noEndLocationInfo ? (
                <Text style={styles.noLocationText}>도착지 정보를 확인할 수 없습니다</Text>
              ) : (
                <Text style={styles.locationInfoText}>
                  {drive.endLocation?.name || '도착지'}
                </Text>
              )}
            </View>
          </View>

          {/* 새로고침 버튼 */}
          {locationError && (
            <TouchableOpacity style={styles.refreshButton} onPress={handleRefreshLocation}>
              <SimpleIcon name="refresh" size={20} color={COLORS.primary} />
              <Text style={styles.refreshButtonText}>다시 확인</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* 하단 버튼 */}
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
            <>
              <SimpleIcon name="directions-bus" size={24} color={COLORS.white} style={styles.buttonIcon} />
              <Text style={styles.startButtonText}>운행 시작</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* 조기 출발 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showEarlyStartModal}
        onRequestClose={() => setShowEarlyStartModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <SimpleIcon name="schedule" size={48} color={COLORS.warning} style={styles.modalIcon} />
            <Text style={styles.modalTitle}>조기 출발</Text>
            <Text style={styles.modalMessage}>
              예정 출발 시간까지 {earlyStartMinutes}분 남았습니다.{'\n'}
              지금 출발하시겠습니까?
            </Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowEarlyStartModal(false);
                  setLoading(false);
                }}
              >
                <Text style={styles.modalCancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={async () => {
                  setShowEarlyStartModal(false);
                  await proceedWithStart(true);
                }}
              >
                <Text style={styles.modalConfirmButtonText}>조기 출발</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
    marginLeft: SPACING.md,
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
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
  checklistCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  checklistHeader: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
    marginBottom: SPACING.lg,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  checklistTextContainer: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  checklistTitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.grey,
    fontWeight: FONT_WEIGHT.medium,
  },
  checklistTitleChecked: {
    color: COLORS.black,
  },
  checklistDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.grey,
    marginTop: SPACING.xs,
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
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  locationInfoTitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.grey,
    marginLeft: SPACING.xs,
    fontWeight: FONT_WEIGHT.medium,
  },
  locationInfoText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.black,
    fontWeight: FONT_WEIGHT.medium,
    marginLeft: 28,
  },
  noLocationText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.warning,
    fontStyle: 'italic',
    marginLeft: 28,
  },
  distanceInfoText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    marginTop: SPACING.xs,
    marginLeft: 28,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  refreshButtonText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.medium,
    marginLeft: SPACING.xs,
  },
  bottomContainer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 50,
  },
  disabledButton: {
    backgroundColor: COLORS.extraLightGrey,
  },
  buttonIcon: {
    marginRight: SPACING.sm,
  },
  startButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semiBold,
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    width: '80%',
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
    marginBottom: SPACING.sm,
  },
  modalMessage: {
    fontSize: FONT_SIZE.md,
    color: COLORS.grey,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: COLORS.lightGrey,
  },
  modalConfirmButton: {
    backgroundColor: COLORS.warning,
  },
  modalCancelButtonText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.black,
    fontWeight: FONT_WEIGHT.medium,
  },
  modalConfirmButtonText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.semiBold,
  },
});

export default StartDriveScreen;