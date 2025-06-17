// src/screens/EndDriveScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { driveAPI } from '../api/drive';
import { formatKSTTime, formatKSTDate, getTimeDifference, toKSTLocaleString } from '../utils/kstTimeUtils';

const EndDriveScreen = ({ navigation, route }) => {
  const { drive } = route.params;
  const [nextDrive, setNextDrive] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkNextDrive();
  }, []);

  const checkNextDrive = async () => {
    try {
      setLoading(true);
      const response = await driveAPI.getNextDrive({
        currentOperationId: drive.operationId || drive.id,
        busNumber: drive.busNumber
      });

      if (response.data?.data) {
        setNextDrive(response.data.data);
      }
    } catch (error) {
      console.error('[EndDriveScreen] 다음 운행 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoHome = () => {
    navigation.navigate('Home');
  };

  const handleNextDrive = () => {
    if (!nextDrive) return;
    
    navigation.navigate('StartDrive', { drive: nextDrive });
  };

  // 운행 시간 계산
  const calculateDuration = () => {
    if (drive.actualStart && drive.actualEnd) {
      return getTimeDifference(drive.actualStart, drive.actualEnd);
    }
    return '00:00:00';
  };

  // 날짜 표시
  const getDateDisplay = () => {
    if (drive.actualEnd) {
      return toKSTLocaleString(drive.actualEnd, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
    }
    return formatKSTDate(new Date());
  };

  // 시간 표시
  const getTimeDisplay = (timeString) => {
    if (!timeString) return '-';
    
    try {
      return formatKSTTime(timeString);
    } catch {
      return timeString;
    }
  };

  // 거리 계산 - 안전하게 처리
  const calculateDistance = () => {
    // totalDistance가 없거나 유효하지 않으면 null 반환
    if (!drive.totalDistance) {
      return null;
    }
    
    // 이미 문자열인 경우 그대로 반환
    if (typeof drive.totalDistance === 'string') {
      return `${drive.totalDistance}km`;
    }
    
    // 숫자인 경우 포맷팅
    if (typeof drive.totalDistance === 'number') {
      return `${drive.totalDistance.toFixed(1)}km`;
    }
    
    return null;
  };

  const duration = calculateDuration();
  const distanceDisplay = calculateDistance();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.completionEmoji}>✅</Text>
          <Text style={styles.title}>운행이 완료되었습니다</Text>
          <Text style={styles.date}>{getDateDisplay()}</Text>
        </View>

        {/* 운행 요약 카드 */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.busNumber}>{drive.busNumber}</Text>
            <View style={styles.routeBadge}>
              <Text style={styles.routeText}>{drive.routeName || drive.route}</Text>
            </View>
          </View>

          <View style={styles.summaryBody}>
            {/* 운행 시간 정보 */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>운행 시간</Text>
              <View style={styles.timeRow}>
                <View style={styles.timeItem}>
                  <Text style={styles.timeLabel}>출발</Text>
                  <Text style={styles.timeValue}>{getTimeDisplay(drive.actualStart)}</Text>
                </View>
                <View style={styles.timeSeparator}>
                  <Text style={styles.arrow}>→</Text>
                </View>
                <View style={styles.timeItem}>
                  <Text style={styles.timeLabel}>도착</Text>
                  <Text style={styles.timeValue}>{getTimeDisplay(drive.actualEnd)}</Text>
                </View>
              </View>
              <View style={styles.durationContainer}>
                <Text style={styles.durationLabel}>총 운행시간</Text>
                <Text style={styles.durationValue}>{duration}</Text>
              </View>
            </View>

            {/* 승객 정보 */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>승객 정보</Text>
              <View style={styles.passengerRow}>
                <View style={styles.passengerItem}>
                  <Text style={styles.passengerEmoji}>📈</Text>
                  <Text style={styles.passengerLabel}>총 탑승</Text>
                  <Text style={styles.passengerValue}>{drive.boardedCount || 0}명</Text>
                </View>
                <View style={styles.passengerItem}>
                  <Text style={styles.passengerEmoji}>📉</Text>
                  <Text style={styles.passengerLabel}>총 하차</Text>
                  <Text style={styles.passengerValue}>{drive.alightedCount || 0}명</Text>
                </View>
                <View style={styles.passengerItem}>
                  <Text style={styles.passengerEmoji}>👥</Text>
                  <Text style={styles.passengerLabel}>최종 탑승</Text>
                  <Text style={styles.passengerValue}>{drive.occupiedSeats || 0}명</Text>
                </View>
              </View>
            </View>

            {/* 거리 정보 - 있을 때만 표시 */}
            {distanceDisplay && (
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>운행 거리</Text>
                <Text style={styles.distanceValue}>{distanceDisplay}</Text>
              </View>
            )}
          </View>
        </View>

        {/* 다음 운행 정보 */}
        {nextDrive && (
          <View style={styles.nextDriveCard}>
            <Text style={styles.nextDriveTitle}>다음 운행 일정</Text>
            <View style={styles.nextDriveInfo}>
              <Text style={styles.nextDriveBus}>{nextDrive.busNumber}</Text>
              <Text style={styles.nextDriveTime}>
                {getTimeDisplay(nextDrive.startTime)} 출발 예정
              </Text>
              <Text style={styles.nextDriveRoute}>{nextDrive.routeName || nextDrive.route}</Text>
            </View>
            <TouchableOpacity
              style={styles.nextDriveButton}
              onPress={handleNextDrive}
            >
              <Text style={styles.nextDriveButtonText}>다음 운행 준비하기</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 운행 종료 메시지 */}
        <View style={styles.messageCard}>
          <Text style={styles.messageEmoji}>👏</Text>
          <Text style={styles.messageTitle}>수고하셨습니다!</Text>
          <Text style={styles.messageText}>
            안전 운행에 감사드립니다.{'\n'}
            충분한 휴식을 취하시기 바랍니다.
          </Text>
        </View>
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={handleGoHome}
        >
          <Text style={styles.homeButtonText}>홈으로 돌아가기</Text>
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
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.white,
  },
  completionEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
    marginBottom: SPACING.sm,
  },
  date: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.grey,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    margin: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.small,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  busNumber: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
  },
  routeBadge: {
    backgroundColor: COLORS.secondary,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  routeText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.medium,
  },
  summaryBody: {
    padding: SPACING.lg,
  },
  infoSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.black,
    marginBottom: SPACING.md,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  timeItem: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.grey,
    marginBottom: SPACING.xs,
  },
  timeValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.black,
  },
  timeSeparator: {
    paddingHorizontal: SPACING.md,
  },
  arrow: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.grey,
  },
  durationContainer: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    alignItems: 'center',
  },
  durationLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.grey,
    marginBottom: SPACING.xs,
  },
  durationValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  passengerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  passengerItem: {
    alignItems: 'center',
    flex: 1,
  },
  passengerEmoji: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  passengerLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.grey,
    marginBottom: SPACING.xs,
  },
  passengerValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.black,
  },
  distanceValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.black,
    textAlign: 'center',
  },
  nextDriveCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  nextDriveTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.black,
    marginBottom: SPACING.md,
  },
  nextDriveInfo: {
    marginBottom: SPACING.md,
  },
  nextDriveBus: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  nextDriveTime: {
    fontSize: FONT_SIZE.md,
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  nextDriveRoute: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.grey,
  },
  nextDriveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  nextDriveButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
  },
  messageCard: {
    backgroundColor: COLORS.success + '20',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  messageEmoji: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  messageTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.success,
    marginBottom: SPACING.sm,
  },
  messageText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.black,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomContainer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
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
});

export default EndDriveScreen;