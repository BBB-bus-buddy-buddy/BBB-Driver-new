// src/components/DriveStatusCard.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { formatKSTTime } from '../utils/kstTimeUtils';

const DriveStatusCard = ({ drive, onPress, isActive }) => {
  // 시간 표시를 위한 헬퍼 함수
  const getTimeDisplay = (timeString) => {
    if (!timeString) return '시간 정보 없음';
    
    // "YYYY년 MM월 DD일 HH:mm" 형식에서 시간만 추출
    const match = timeString.match(/\d{2}:\d{2}/);
    if (match) {
      return match[0];
    }
    
    // ISO 형식이거나 다른 형식인 경우
    try {
      return formatKSTTime(timeString);
    } catch {
      return timeString;
    }
  };

  return (
    <View style={styles.driveCard}>
      <View style={styles.driveHeader}>
        <Text style={styles.busNumber}>{drive.busNumber}</Text>
        <View style={styles.routeBadge}>
          <Text style={styles.routeBadgeText}>운행 {drive.id}</Text>
        </View>
      </View>

      <View style={styles.driveInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>노선:</Text>
          <Text style={styles.infoValue}>{drive.route}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>출발:</Text>
          <Text style={styles.infoValue}>{getTimeDisplay(drive.departureTime)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>도착:</Text>
          <Text style={styles.infoValue}>{getTimeDisplay(drive.arrivalTime)}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.startDriveButton,
          !isActive && styles.disabledButton,
        ]}
        onPress={onPress}
        disabled={!isActive}
      >
        <Text style={styles.startDriveButtonText}>
          {isActive ? '운행 준비' : '출발 시간 1시간 전부터 가능'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  driveCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  driveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  busNumber: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
  },
  routeBadge: {
    backgroundColor: COLORS.secondary,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  routeBadgeText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.medium,
  },
  driveInfo: {
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  infoLabel: {
    width: 50,
    fontSize: FONT_SIZE.sm,
    color: COLORS.grey,
  },
  infoValue: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.black,
    fontWeight: FONT_WEIGHT.medium,
    flex: 1,
  },
  startDriveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: COLORS.extraLightGrey,
  },
  startDriveButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
  },
});

export default DriveStatusCard;