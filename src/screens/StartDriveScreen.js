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
import { startDrive } from '../services/driveService';
import { requestLocationPermission, getCurrentLocation, isUserAtLocation, getDepartureLocation } from '../services/locationService';

const StartDriveScreen = ({ navigation, route }) => {
  const { drive } = route.params;
  const [loading, setLoading] = useState(true);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [countdown, setCountdown] = useState(5); // 위치 확인을 위한 카운트다운

  useEffect(() => {
    // 위치 권한 및 현재 위치 확인
    const checkLocation = async () => {
      try {
        // 위치 권한 요청
        const hasPermission = await requestLocationPermission();
        
        if (hasPermission) {
          // 시뮬레이션을 위한 카운트다운
          let timer = setInterval(() => {
            setCountdown((prevCount) => {
              if (prevCount <= 1) {
                clearInterval(timer);
                
                // 실제로는 현재 위치와 출발 위치를 비교해야 함
                // 시뮬레이션을 위해 항상 위치가 확인되었다고 가정
                setLoading(false);
                setLocationConfirmed(true);
                return 0;
              }
              return prevCount - 1;
            });
          }, 1000);
          
          return () => clearInterval(timer);
        } else {
          setLoading(false);
          Alert.alert(
            '위치 권한 필요',
            '운행 시작을 위해 위치 권한이 필요합니다.',
            [{ text: '확인', onPress: () => navigation.goBack() }]
          );
        }
      } catch (error) {
        console.error('Error checking location:', error);
        setLoading(false);
        Alert.alert(
          '오류',
          '위치 확인 중 오류가 발생했습니다.',
          [{ text: '확인', onPress: () => navigation.goBack() }]
        );
      }
    };

    checkLocation();
  }, [navigation]);

  const handleStartDrive = async () => {
    try {
      setLoading(true);
      
      // 운행 시작 처리
      const activeDrive = await startDrive(drive);
      
      // 운행 중 화면으로 이동
      navigation.replace('Driving', { drive: activeDrive });
    } catch (error) {
      setLoading(false);
      Alert.alert('오류', '운행을 시작할 수 없습니다. 다시 시도해주세요.');
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Text style={styles.backButtonText}>← 뒤로</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>운행 시작</Text>
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
              {loading
                ? `출발 위치 확인 중 (${countdown}초)`
                : locationConfirmed
                ? '출발 위치 확인 완료!'
                : '출발 위치가 다릅니다'}
            </Text>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>
                  현재 위치를 확인하고 있습니다...
                </Text>
              </View>
            ) : locationConfirmed ? (
              <View style={styles.confirmedContainer}>
                <Image
                  source={require('../assets/location-confirmed.png')}
                  style={styles.confirmedIcon}
                />
                <Text style={styles.confirmedText}>
                  출발 지점에 도착했습니다. 운행을 시작하세요.
                </Text>
              </View>
            ) : (
              <View style={styles.notConfirmedContainer}>
                <Image
                  source={require('../assets/location-error.png')}
                  style={styles.errorIcon}
                />
                <Text style={styles.errorText}>
                  출발 지점에 위치하고 있지 않습니다. 출발 지점으로 이동해주세요.
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.startButton,
              !locationConfirmed && styles.disabledButton,
            ]}
            onPress={handleStartDrive}
            disabled={!locationConfirmed || loading}
          >
            <Text style={styles.startButtonText}>
              {loading ? '위치 확인 중...' : '운행 시작'}
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
  },
  notConfirmedContainer: {
    alignItems: 'center',
    padding: SPACING.sm,
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