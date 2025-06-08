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
import { DriveService } from '../services';
import { 
  requestLocationPermission, 
  getCurrentLocation, 
  isUserAtLocation, 
  getRouteStartLocation 
} from '../services/locationService';
import { isDriveStartTimeReached } from '../utils/driveTimeUtils';

const StartDriveScreen = ({ navigation, route }) => {
  const { drive } = route.params;
  const [loading, setLoading] = useState(false);
  const [checkingLocation, setCheckingLocation] = useState(true);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [startLocation, setStartLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    checkLocationAndPermission();
  }, []);

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

      // 출발지 위치 정보 가져오기
      const routeStartLocation = getRouteStartLocation(drive.route);
      if (!routeStartLocation) {
        setLocationError('출발지 정보를 찾을 수 없습니다.');
        return;
      }
      setStartLocation(routeStartLocation);

      // 현재 위치 가져오기
      try {
        const location = await getCurrentLocation();
        setCurrentLocation(location);

        // 출발지 도착 여부 확인 (20m 이내)
        const isAtStart = isUserAtLocation(location, routeStartLocation, 20);
        setLocationConfirmed(isAtStart);

        // 거리 계산 (디버깅용)
        const distanceToStart = calculateDistance(
          location.latitude,
          location.longitude,
          routeStartLocation.latitude,
          routeStartLocation.longitude
        );
        setDistance(Math.round(distanceToStart));

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

  const handleStartDrive = async () => {
    // 운행 시작 시간 확인
    const isTimeReached = isDriveStartTimeReached(drive.departureTime);
    
    if (!isTimeReached) {
      // 시간이 안 됐을 때 확인 다이얼로그
      Alert.alert(
        '운행 시작 시간 전',
        '운행 시작 시간 전입니다. 일찍 시작하시겠습니까?',
        [
          {
            text: '아니오',
            style: 'cancel'
          },
          {
            text: '예',
            onPress: startDrive
          }
        ],
        { cancelable: false }
      );
    } else {
      startDrive();
    }
  };

  const startDrive = async () => {
    try {
      setLoading(true);

      const activeDrive = await DriveService.startDrive(drive);

      // 운행 중 화면으로 이동
      navigation.replace('Driving', { drive: activeDrive });
    } catch (error) {
      setLoading(false);
      console.error('[StartDriveScreen] 운행 시작 오류:', error);
      Alert.alert('오류', error.message || '운행을 시작할 수 없습니다. 다시 시도해주세요.');
    }
  };

  const handleRefreshLocation = () => {
    checkLocationAndPermission();
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  // 운행 시작 버튼 활성화 조건
  const canStartDrive = locationConfirmed && !checkingLocation && !loading;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Text style={styles.backButtonText}>← 뒤로</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>운행 준비</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.driveInfoCard}>
            <Text style={styles.busNumber}>{drive.busNumber}</Text>
            <View style={styles.routeInfo}>
              <Text style={styles.routeText}>{drive.route}</Text>
            </View>
            <View style={styles.timeInfo}>
              <View style={styles.timeItem}>
                <Text style={styles.timeLabel}>출발 시간</Text>
                <Text style={styles.timeValue}>{drive.departureTime}</Text>
              </View>
              <View style={styles.timeDivider} />
              <View style={styles.timeItem}>
                <Text style={styles.timeLabel}>도착 예정</Text>
                <Text style={styles.timeValue}>{drive.arrivalTime}</Text>
              </View>
            </View>
          </View>

          <View style={styles.locationCheckCard}>
            <Text style={styles.locationCheckTitle}>
              출발지 도착 확인
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
                <Image
                  source={require('../assets/location-error.png')}
                  style={styles.errorIcon}
                />
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
                <Image
                  source={require('../assets/location-confirmed.png')}
                  style={styles.confirmedIcon}
                />
                <Text style={styles.confirmedText}>
                  출발 지점에 도착했습니다!
                </Text>
                <Text style={styles.locationName}>
                  {startLocation?.name}
                </Text>
              </View>
            ) : (
              <View style={styles.notConfirmedContainer}>
                <Image
                  source={require('../assets/location-error.png')}
                  style={styles.warningIcon}
                />
                <Text style={styles.warningText}>
                  출발 지점에서 {distance}m 떨어져 있습니다.
                </Text>
                <Text style={styles.locationInstruction}>
                  {startLocation?.name}(으)로 이동해주세요.
                </Text>
                <Text style={styles.distanceHint}>
                  (20m 이내로 접근하세요)
                </Text>
                <TouchableOpacity 
                  style={styles.refreshButton} 
                  onPress={handleRefreshLocation}
                >
                  <Text style={styles.refreshButtonText}>위치 다시 확인</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {startLocation && (
            <View style={styles.locationInfoCard}>
              <Text style={styles.locationInfoTitle}>출발지 정보</Text>
              <Text style={styles.locationInfoText}>{startLocation.name}</Text>
              <Text style={styles.locationInfoAddress}>{startLocation.address}</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.startButton,
              !canStartDrive && styles.disabledButton,
            ]}
            onPress={handleStartDrive}
            disabled={!canStartDrive}
          >
            <Text style={styles.startButtonText}>
              {loading ? '운행 시작 중...' : 
               !locationConfirmed ? '출발지에 도착 후 시작 가능' : 
               '운행 시작'}
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
  confirmedIcon: {
    width: 60,
    height: 60,
    marginBottom: SPACING.md,
  },
  confirmedText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: FONT_WEIGHT.semiBold,
  },
  locationName: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.grey,
    marginTop: SPACING.xs,
  },
  notConfirmedContainer: {
    alignItems: 'center',
    padding: SPACING.sm,
  },
  warningIcon: {
    width: 60,
    height: 60,
    marginBottom: SPACING.md,
  },
  warningText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.warning,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: FONT_WEIGHT.medium,
  },
  locationInstruction: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.grey,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  distanceHint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.lightGrey,
    textAlign: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  errorIcon: {
    width: 60,
    height: 60,
    marginBottom: SPACING.md,
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
  refreshButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  refreshButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  locationInfoCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
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
    marginBottom: SPACING.xs,
  },
  locationInfoAddress: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.grey,
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