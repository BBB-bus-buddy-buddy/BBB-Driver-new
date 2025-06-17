// src/screens/StartDriveScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { DriveService } from '../services/driveService';
import { storage } from '../utils/storage';
import { requestLocationPermission, getCurrentLocation } from '../services/locationService';
import { createKSTDate, getNowKST, formatKSTTime } from '../utils/kstTimeUtils';
import { calculateDistance, isNearLocation, LOCATION_MESSAGES } from '../utils/locationHelpers';

const StartDriveScreen = ({ navigation, route }) => {
  const { drive } = route.params;
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [nearStartLocation, setNearStartLocation] = useState(false);

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    const granted = await requestLocationPermission();
    setLocationPermission(granted);
    if (granted) {
      updateCurrentLocation();
    }
  };

  const updateCurrentLocation = async () => {
    try {
      const location = await getCurrentLocation();
      setCurrentLocation(location);

      // 출발지 근처인지 확인
      if (drive.startLocation) {
        const isNear = isNearLocation(
          location,
          drive.startLocation,
          100 // 100m 이내
        );
        setNearStartLocation(isNear);
      }
    } catch (error) {
      console.error('[StartDriveScreen] 위치 조회 오류:', error);
    }
  };

  // 조기 출발 여부 확인
  const checkEarlyStart = () => {
    const now = getNowKST();
    const startTimeStr = drive.startTime || drive.departureTime?.split(' ').pop();
    
    if (startTimeStr && drive.operationDate) {
      const scheduledStartTime = createKSTDate(drive.operationDate, startTimeStr);
      return now < scheduledStartTime;
    }
    
    return false;
  };

  const handleStartDrive = async () => {
    // 조기 출발 확인
    const isEarlyStart = checkEarlyStart();
    
    if (isEarlyStart) {
      Alert.alert(
        '조기 출발',
        '예정된 출발 시간보다 일찍 출발하시겠습니까?',
        [
          {
            text: '취소',
            style: 'cancel',
          },
          {
            text: '출발',
            onPress: () => startDrive(true),
          },
        ],
        { cancelable: true }
      );
    } else {
      startDrive(false);
    }
  };

  const startDrive = async (isEarlyStart) => {
    try {
      setLoading(true);

      // 운행 시작
      const startedDrive = await DriveService.startDrive(
        drive.operationId || drive.id,
        isEarlyStart
      );

      // 현재 운행 정보 저장
      await storage.setCurrentDrive({
        ...drive,
        ...startedDrive,
        actualStart: startedDrive.actualStart || new Date().toISOString(),
        status: 'IN_PROGRESS',
      });

      // 운행 화면으로 이동
      navigation.replace('Driving', {
        drive: {
          ...drive,
          ...startedDrive,
          actualStart: startedDrive.actualStart || new Date().toISOString(),
          status: 'IN_PROGRESS',
        },
      });
    } catch (error) {
      console.error('[StartDriveScreen] 운행 시작 오류:', error);
      Alert.alert(
        '운행 시작 실패',
        error.message || '운행을 시작할 수 없습니다. 다시 시도해주세요.',
        [{ text: '확인' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const formatLocationName = (location) => {
    if (!location) return '위치 정보 없음';
    return location.name || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← 뒤로</Text>
          </TouchableOpacity>
          <Text style={styles.title}>운행 준비</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* 버스 정보 카드 */}
        <View style={styles.busInfoCard}>
          <Text style={styles.busNumber}>{drive.busNumber}</Text>
          <View style={styles.routeBadge}>
            <Text style={styles.routeText}>{drive.routeName || drive.route}</Text>
          </View>
        </View>

        {/* 운행 정보 */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>운행 정보</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>출발 시간</Text>
              <Text style={styles.infoValue}>{drive.startTime || drive.departureTime}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>도착 예정</Text>
              <Text style={styles.infoValue}>{drive.endTime || drive.arrivalTime}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>출발지</Text>
              <Text style={styles.infoValue}>{formatLocationName(drive.startLocation)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>도착지</Text>
              <Text style={styles.infoValue}>{formatLocationName(drive.endLocation)}</Text>
            </View>
          </View>
        </View>

        {/* 위치 확인 */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>현재 위치</Text>
          <View style={styles.locationCard}>
            {!locationPermission ? (
              <View style={styles.locationWarning}>
                <Text style={styles.warningEmoji}>📍</Text>
                <Text style={styles.warningText}>위치 권한이 필요합니다</Text>
                <TouchableOpacity
                  style={styles.permissionButton}
                  onPress={checkLocationPermission}
                >
                  <Text style={styles.permissionButtonText}>권한 설정</Text>
                </TouchableOpacity>
              </View>
            ) : currentLocation ? (
              <View>
                <Text style={styles.locationText}>
                  현재 위치가 확인되었습니다.
                </Text>
                {drive.startLocation && (
                  <Text style={[
                    styles.locationStatus,
                    nearStartLocation ? styles.nearText : styles.farText
                  ]}>
                    {nearStartLocation
                      ? '✅ 출발지 근처에 있습니다'
                      : `⚠️ 출발지에서 ${calculateDistance(
                          currentLocation.latitude,
                          currentLocation.longitude,
                          drive.startLocation.latitude,
                          drive.startLocation.longitude
                        ).toFixed(0)}m 떨어져 있습니다`}
                  </Text>
                )}
              </View>
            ) : (
              <View style={styles.locationLoading}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.locationLoadingText}>위치 확인 중...</Text>
              </View>
            )}
          </View>
        </View>

        {/* 체크리스트 */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>운행 전 확인사항</Text>
          <View style={styles.checklistCard}>
            <Text style={styles.checklistItem}>✓ 차량 상태 점검 완료</Text>
            <Text style={styles.checklistItem}>✓ 운행 노선 확인</Text>
            <Text style={styles.checklistItem}>✓ 안전벨트 착용</Text>
            <Text style={styles.checklistItem}>✓ 승객 안전 안내 준비</Text>
          </View>
        </View>

        {/* 조기 출발 안내 */}
        {checkEarlyStart() && (
          <View style={styles.earlyStartNotice}>
            <Text style={styles.earlyStartEmoji}>ℹ️</Text>
            <Text style={styles.earlyStartText}>
              예정된 출발 시간보다 일찍 출발하시는 경우,{'\n'}
              조기 출발로 기록됩니다.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* 운행 시작 버튼 */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.startButton,
            loading && styles.disabledButton,
          ]}
          onPress={handleStartDrive}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Text style={styles.startButtonText}>운행 시작</Text>
          )}
        </TouchableOpacity>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
  },
  busInfoCard: {
    backgroundColor: COLORS.white,
    margin: SPACING.lg,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  busNumber: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
    marginBottom: SPACING.sm,
  },
  routeBadge: {
    backgroundColor: COLORS.secondary,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  },
  routeText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.medium,
  },
  infoSection: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.black,
    marginBottom: SPACING.md,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  infoLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.grey,
  },
  infoValue: {
    fontSize: FONT_SIZE.md,
    color: COLORS.black,
    fontWeight: FONT_WEIGHT.medium,
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  locationCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  locationWarning: {
    alignItems: 'center',
  },
  warningEmoji: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  warningText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.grey,
    marginBottom: SPACING.md,
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
  },
  permissionButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  locationText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.black,
    marginBottom: SPACING.sm,
  },
  locationStatus: {
    fontSize: FONT_SIZE.sm,
  },
  nearText: {
    color: COLORS.success,
  },
  farText: {
    color: COLORS.warning,
  },
  locationLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationLoadingText: {
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZE.md,
    color: COLORS.grey,
  },
  checklistCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  checklistItem: {
    fontSize: FONT_SIZE.md,
    color: COLORS.black,
    marginBottom: SPACING.sm,
  },
  earlyStartNotice: {
    flexDirection: 'row',
    backgroundColor: COLORS.info + '20',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  earlyStartEmoji: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  earlyStartText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.info,
    flex: 1,
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
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: COLORS.grey,
  },
  startButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semiBold,
  },
});

export default StartDriveScreen;