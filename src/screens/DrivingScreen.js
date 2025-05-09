// src/screens/DrivingScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { endDrive } from '../services/driveService';
import { getNextStopInfo } from '../services/driveService';
import { startLocationTracking, stopLocationTracking } from '../services/locationService';

const DrivingScreen = ({ navigation, route }) => {
  const { drive } = route.params;
  const [currentTime, setCurrentTime] = useState(new Date());
  const [nextStopInfo, setNextStopInfo] = useState({
    name: '동부캠퍼스 정문',
    timeRemaining: '14',
  });
  const [isAtDestination, setIsAtDestination] = useState(false);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [locationTrackingId, setLocationTrackingId] = useState(null);

  // 운행 시간 카운터와 위치 추적
  useEffect(() => {
    const startTime = new Date(drive.startTime);
    
    // 시간 타이머
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      // 경과 시간 계산
      const diff = now - startTime;
      const hours = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
      const minutes = Math.floor((diff / (1000 * 60)) % 60).toString().padStart(2, '0');
      const seconds = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
      setElapsedTime(`${hours}:${minutes}:${seconds}`);
      
      // 다음 정거장 정보 업데이트 (실제로는 현재 위치 기반으로 계산해야 함)
      setNextStopInfo(getNextStopInfo(drive.route, diff));
      
      // 시뮬레이션: 1분 후에 목적지 도착으로 설정
      if (diff > 60000) {
        setIsAtDestination(true);
      }
    }, 1000);
    
    // 위치 추적 시작
    const watchId = startLocationTracking((location) => {
      // 현재 위치가 바뀔 때마다 호출되는 콜백
      console.log('Current location:', location);
      
      // 실제로는 여기서 현재 위치와 경로 정보를 서버에 전송하고
      // 다음 정거장 정보와 목적지 도착 여부를 계산해야 함
    });
    
    setLocationTrackingId(watchId);
    
    // 컴포넌트 언마운트 시 타이머와 위치 추적 정리
    return () => {
      clearInterval(timer);
      if (locationTrackingId) {
        stopLocationTracking(locationTrackingId);
      }
    };
  }, [drive.startTime, drive.route]);

  // 뒤로가기 버튼 방지
  useEffect(() => {
    const backAction = () => {
      Alert.alert(
        '운행 중',
        '운행 중에는 앱을 종료할 수 없습니다. 운행을 종료하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { text: '운행 종료', style: 'destructive', onPress: handleEndDrive }
        ],
        { cancelable: true }
      );
      return true;
    };
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    
    return () => backHandler.remove();
  }, [isAtDestination]);

  const handleEndDrive = async () => {
    if (!isAtDestination) {
      Alert.alert(
        '목적지 도착 전',
        '아직 목적지에 도착하지 않았습니다. 정말 운행을 종료하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '운행 종료',
            style: 'destructive',
            onPress: completeEndDrive,
          },
        ],
        { cancelable: true }
      );
    } else {
      completeEndDrive();
    }
  };

  const completeEndDrive = async () => {
    try {
      // 위치 추적 중지
      if (locationTrackingId) {
        stopLocationTracking(locationTrackingId);
      }
      
      // 운행 종료 처리
      const completedDrive = await endDrive(drive);
      
      // 운행 종료 화면으로 이동
      navigation.replace('EndDrive', { drive: completedDrive });
    } catch (error) {
      console.error('Error ending drive:', error);
      Alert.alert('오류', '운행을 종료할 수 없습니다. 다시 시도해주세요.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>운행 중</Text>
        </View>

        <View style={styles.drivingStatusContainer}>
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View style={styles.liveDot} />
              <Text style={styles.statusText}>실시간 운행 중</Text>
            </View>
            
            <View style={styles.busInfoContainer}>
              <Text style={styles.busNumber}>{drive.busNumber}</Text>
              <View style={styles.routeBadge}>
                <Text style={styles.routeBadgeText}>{drive.route}</Text>
              </View>
            </View>
            
            <View style={styles.timeInfoContainer}>
              <View style={styles.timeInfoItem}>
                <Text style={styles.timeInfoLabel}>운행 시작</Text>
                <Text style={styles.timeInfoValue}>
                  {new Date(drive.startTime).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <View style={styles.timeInfoDivider} />
              <View style={styles.timeInfoItem}>
                <Text style={styles.timeInfoLabel}>현재 시간</Text>
                <Text style={styles.timeInfoValue}>
                  {currentTime.toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <View style={styles.timeInfoDivider} />
              <View style={styles.timeInfoItem}>
                <Text style={styles.timeInfoLabel}>운행 시간</Text>
                <Text style={styles.timeInfoValue}>{elapsedTime}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.nextStopCard}>
            <Text style={styles.nextStopLabel}>다음 정거장</Text>
            <Text style={styles.nextStopName}>{nextStopInfo.name}</Text>
            <View style={styles.timeRemainingContainer}>
              <Image
                source={require('../assets/clock-icon.png')}
                style={styles.clockIcon}
              />
              <Text style={styles.timeRemainingText}>
                {nextStopInfo.timeRemaining}분 후 도착 예정
              </Text>
            </View>
          </View>
          
          <Image
            source={require('../assets/route-map.png')}
            style={styles.routeMapImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.endDriveButton,
              !isAtDestination && styles.disabledButton,
            ]}
            onPress={handleEndDrive}
          >
            <Text style={styles.endDriveButtonText}>
              {isAtDestination ? '운행 종료' : '목적지 도착 전입니다'}
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
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
  },
  drivingStatusContainer: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.success,
    marginRight: SPACING.xs,
  },
  statusText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.black,
    fontWeight: FONT_WEIGHT.medium,
  },
  busInfoContainer: {
    marginBottom: SPACING.md,
  },
  busNumber: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  routeBadge: {
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    alignSelf: 'flex-start',
  },
  routeBadgeText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.medium,
  },
  timeInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeInfoItem: {
    flex: 1,
  },
  timeInfoDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.xs,
  },
  timeInfoLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.grey,
    marginBottom: SPACING.xs,
  },
  timeInfoValue: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.black,
    fontWeight: FONT_WEIGHT.medium,
  },
  nextStopCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  nextStopLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.grey,
    marginBottom: SPACING.xs,
  },
  nextStopName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
    marginBottom: SPACING.md,
  },
  timeRemainingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clockIcon: {
    width: 16,
    height: 16,
    marginRight: SPACING.xs,
  },
  timeRemainingText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.medium,
  },
  routeMapImage: {
    width: '100%',
    height: 200,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  },
  bottomContainer: {
    padding: SPACING.md,
  },
  endDriveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: COLORS.extraLightGrey,
  },
  endDriveButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semiBold,
  },
});

export default DrivingScreen;