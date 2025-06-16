// src/screens/EndDriveScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { driveAPI } from '../api/drive';
import { storage } from '../utils/storage';

const EndDriveScreen = ({ navigation, route }) => {
  const { drive } = route.params;
  const [hasNextDrive, setHasNextDrive] = useState(false);
  const [nextDrive, setNextDrive] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 다음 운행 일정 확인
    checkNextDrive();
  }, []);

  const checkNextDrive = async () => {
    try {
      setLoading(true);
      
      const response = await driveAPI.getNextDrive({
        currentOperationId: drive.operationId || drive.id,
        busNumber: drive.busNumber || drive.busRealNumber
      });

      if (response.data.success && response.data.data) {
        setHasNextDrive(true);
        setNextDrive(response.data.data);
      } else {
        setHasNextDrive(false);
      }
    } catch (error) {
      console.log('[EndDriveScreen] 다음 운행 일정 확인 오류:', error);
      setHasNextDrive(false);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToNextDrive = () => {
    if (nextDrive) {
      // 다음 운행을 위한 drive 객체 생성
      const driveData = {
        id: nextDrive.id,
        operationId: nextDrive.operationId || nextDrive.id,
        busNumber: nextDrive.busNumber,
        busRealNumber: nextDrive.busRealNumber,
        routeName: nextDrive.routeName || nextDrive.route,
        routeId: nextDrive.routeId,
        scheduledStart: nextDrive.scheduledStart || nextDrive.departureTime,
        scheduledEnd: nextDrive.scheduledEnd || nextDrive.arrivalTime,
        startTime: nextDrive.startTime,
        endTime: nextDrive.endTime,
        operationDate: nextDrive.operationDate,
        status: nextDrive.status,
        driverId: nextDrive.driverId,
        driverName: nextDrive.driverName,
        organizationId: nextDrive.organizationId || drive.organizationId,
        ...nextDrive
      };
      
      // 다음 운행 시작 화면으로 이동
      navigation.replace('StartDrive', { drive: driveData });
    }
  };

  const handleGoHome = () => {
    // 홈 화면으로 이동
    navigation.replace('Home');
  };

  // 운행 시간 계산
  const calculateDuration = () => {
    if (drive.actualStart && drive.actualEnd) {
      const start = new Date(drive.actualStart);
      const end = new Date(drive.actualEnd);
      const diffMs = end - start;
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        return `${hours}시간 ${minutes}분`;
      }
      return `${minutes}분`;
    }
    return '-';
  };

  // 운행 거리 계산 (더미 데이터 사용 시)
  const calculateDistance = () => {
    if (drive.totalDistance) {
      return `${drive.totalDistance.toFixed(1)}km`;
    }
    // 더미 데이터: 평균 속도 30km/h 기준
    const duration = drive.actualStart && drive.actualEnd ? 
      (new Date(drive.actualEnd) - new Date(drive.actualStart)) / (1000 * 60 * 60) : 0;
    return `${(duration * 30).toFixed(1)}km`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>운행이 종료되었습니다</Text>
          <Text style={styles.headerSubtitle}>수고하셨습니다!</Text>
        </View>

        <View style={styles.driveInfoCard}>
          <Text style={styles.cardTitle}>운행 정보</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>버스 번호</Text>
            <Text style={styles.infoValue}>{drive.busNumber || drive.busRealNumber}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>노선</Text>
            <Text style={styles.infoValue}>{drive.routeName || drive.route || '노선 정보 없음'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>출발 시간</Text>
            <Text style={styles.infoValue}>
              {new Date(drive.actualStart || drive.scheduledStart).toLocaleString('ko-KR', {
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>도착 시간</Text>
            <Text style={styles.infoValue}>
              {new Date(drive.actualEnd || new Date()).toLocaleString('ko-KR', {
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>운행 시간</Text>
            <Text style={styles.infoValue}>{calculateDuration()}</Text>
          </View>

          <View style={styles.infoRowLast}>
            <Text style={styles.infoLabel}>운행 거리</Text>
            <Text style={styles.infoValue}>{calculateDistance()}</Text>
          </View>
        </View>

        {/* 승객 통계 카드 */}
        {(drive.totalPassengers !== undefined || drive.boardedCount !== undefined) && (
          <View style={styles.passengerStatsCard}>
            <Text style={styles.cardTitle}>승객 통계</Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>총 탑승</Text>
                <Text style={styles.statValue}>{drive.boardedCount || 0}명</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>총 하차</Text>
                <Text style={styles.statValue}>{drive.alightedCount || 0}명</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>최종 탑승</Text>
                <Text style={styles.statValue}>{drive.finalOccupiedSeats || 0}명</Text>
              </View>
            </View>
          </View>
        )}

        {!loading && hasNextDrive && nextDrive && (
          <View style={styles.nextDriveCard}>
            <Text style={styles.cardTitle}>다음 운행 정보</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>버스 번호</Text>
              <Text style={styles.infoValue}>{nextDrive.busNumber || nextDrive.busRealNumber}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>노선</Text>
              <Text style={styles.infoValue}>{nextDrive.routeName || nextDrive.route || '노선 정보 없음'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>출발 시간</Text>
              <Text style={styles.infoValue}>
                {nextDrive.startTime || 
                 new Date(nextDrive.scheduledStart).toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>

            <View style={styles.infoRowLast}>
              <Text style={styles.infoLabel}>도착 예정</Text>
              <Text style={styles.infoValue}>
                {nextDrive.endTime ||
                 new Date(nextDrive.scheduledEnd).toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>

            {/* 다음 운행까지 남은 시간 */}
            {nextDrive.scheduledStart && (
              <View style={styles.timeUntilNextDrive}>
                <Text style={styles.timeUntilText}>
                  다음 운행까지 {getTimeUntilNextDrive(nextDrive)}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.messageCard}>
          <Text style={styles.messageText}>
            오늘 하루도 안전 운행 해주셔서 감사합니다. 피로한 경우 무리하게 운행하지 마시고 충분한 휴식을 취하세요.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          {hasNextDrive && nextDrive ? (
            <>
              <TouchableOpacity
                style={styles.nextDriveButton}
                onPress={handleGoToNextDrive}
              >
                <Text style={styles.nextDriveButtonText}>다음 운행 시작</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.homeButtonSecondary}
                onPress={handleGoHome}
              >
                <Text style={styles.homeButtonTextSecondary}>홈으로 돌아가기</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.homeButton}
              onPress={handleGoHome}
            >
              <Text style={styles.homeButtonText}>홈으로 돌아가기</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  // 다음 운행까지 남은 시간 계산
  function getTimeUntilNextDrive(nextDrive) {
    const now = new Date();
    let nextStart;
    
    if (nextDrive.operationDate && nextDrive.startTime) {
      const [year, month, day] = nextDrive.operationDate.split('-');
      const [hours, minutes] = nextDrive.startTime.split(':');
      nextStart = new Date(year, month - 1, day, parseInt(hours), parseInt(minutes));
    } else if (nextDrive.scheduledStart) {
      nextStart = new Date(nextDrive.scheduledStart);
    } else {
      return '';
    }
    
    const diff = nextStart - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    } else if (minutes > 0) {
      return `${minutes}분`;
    } else {
      return '곧 시작';
    }
  }
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginVertical: SPACING.xxxl,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.grey,
  },
  driveInfoCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  cardTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  infoRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.grey,
    flex: 1,
  },
  infoValue: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.black,
    fontWeight: FONT_WEIGHT.medium,
    flex: 2,
    textAlign: 'right',
  },
  passengerStatsCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.divider,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.grey,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold,
  },
  nextDriveCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    ...SHADOWS.small,
  },
  timeUntilNextDrive: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
  },
  timeUntilText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.medium,
  },
  messageCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  messageText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    lineHeight: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: SPACING.xl,
  },
  nextDriveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  nextDriveButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semiBold,
  },
  homeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  homeButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semiBold,
  },
  homeButtonSecondary: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  homeButtonTextSecondary: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
  },
});

export default EndDriveScreen;