// src/screens/EndDriveScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { getNextDriveSchedule } from '../services/driveService';

const EndDriveScreen = ({ navigation, route }) => {
  const { drive } = route.params;
  const [hasNextDrive, setHasNextDrive] = useState(false);
  const [nextDrive, setNextDrive] = useState(null);
  
  useEffect(() => {
    // 다음 운행 일정 확인
    const checkNextDrive = async () => {
      try {
        const nextDriveData = await getNextDriveSchedule(drive);
        
        if (nextDriveData) {
          setHasNextDrive(true);
          setNextDrive(nextDriveData);
        } else {
          setHasNextDrive(false);
        }
      } catch (error) {
        console.log('Error checking next drive:', error);
        setHasNextDrive(false);
      }
    };
    
    checkNextDrive();
  }, [drive]);

  const handleGoToNextDrive = () => {
    // 다음 운행 시작 화면으로 이동
    navigation.replace('StartDrive', { drive: nextDrive });
  };

  const handleGoHome = () => {
    // 홈 화면으로 이동
    navigation.replace('Home');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Image
            source={require('../assets/complete-icon.png')}
            style={styles.completeIcon}
          />
          <Text style={styles.headerTitle}>운행이 종료되었습니다</Text>
          <Text style={styles.headerSubtitle}>수고하셨습니다!</Text>
        </View>

        <View style={styles.driveInfoCard}>
          <Text style={styles.cardTitle}>운행 정보</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>버스 번호</Text>
            <Text style={styles.infoValue}>{drive.busNumber}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>노선</Text>
            <Text style={styles.infoValue}>{drive.route}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>출발 시간</Text>
            <Text style={styles.infoValue}>
              {new Date(drive.startTime).toLocaleString('ko-KR')}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>도착 시간</Text>
            <Text style={styles.infoValue}>
              {new Date(drive.endTime).toLocaleString('ko-KR')}
            </Text>
          </View>
          
          <View style={styles.infoRowLast}>
            <Text style={styles.infoLabel}>운행 시간</Text>
            <Text style={styles.infoValue}>{drive.duration}</Text>
          </View>
        </View>

        {hasNextDrive && nextDrive && (
          <View style={styles.nextDriveCard}>
            <Text style={styles.cardTitle}>다음 운행 정보</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>버스 번호</Text>
              <Text style={styles.infoValue}>{nextDrive.busNumber}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>노선</Text>
              <Text style={styles.infoValue}>{nextDrive.route}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>출발 시간</Text>
              <Text style={styles.infoValue}>{nextDrive.departureTime}</Text>
            </View>
            
            <View style={styles.infoRowLast}>
              <Text style={styles.infoLabel}>도착 예정</Text>
              <Text style={styles.infoValue}>{nextDrive.arrivalTime}</Text>
            </View>
          </View>
        )}

        <View style={styles.messageCard}>
          <Text style={styles.messageText}>
            오늘 하루도 안전 운행 해주셔서 감사합니다. 피로한 경우 무리하게 운행하지 마시고 충분한 휴식을 취하세요.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          {hasNextDrive ? (
            <TouchableOpacity
              style={styles.nextDriveButton}
              onPress={handleGoToNextDrive}
            >
              <Text style={styles.nextDriveButtonText}>다음 운행 시작</Text>
            </TouchableOpacity>
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
  completeIcon: {
    width: 80,
    height: 80,
    marginBottom: SPACING.lg,
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
  nextDriveCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    ...SHADOWS.small,
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
});

export default EndDriveScreen;