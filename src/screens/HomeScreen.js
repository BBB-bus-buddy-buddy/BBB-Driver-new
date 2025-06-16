// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  BORDER_RADIUS,
  SHADOWS,
  SPACING,
} from '../constants/theme';

import OperationPlanService from '../services/operationPlanService';
import { storage } from '../utils/storage';
import BottomTabBar from '../components/BottomTabBar';

const HomeScreen = ({ navigation }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [driveSchedules, setDriveSchedules] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeBottomTab, setActiveBottomTab] = useState('home');

  // 화면 로드 시 초기 데이터 로드
  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      setInitialLoading(true);

      // 사용자 정보 로드
      const storedUserInfo = await storage.getUserInfo();
      if (storedUserInfo) {
        setUserInfo(storedUserInfo);
      } else {
        Alert.alert('오류', '사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
        navigation.replace('Login');
        return;
      }

      // 운행 일정 로드
      await loadTodaySchedules();

    } catch (error) {
      console.error('[HomeScreen] 초기화 오류:', error);
      Alert.alert('오류', '정보를 불러올 수 없습니다. 다시 로그인해주세요.');
      navigation.replace('Login');
    } finally {
      setInitialLoading(false);
    }
  };

  const loadTodaySchedules = async () => {
    try {
      setRefreshing(true);
      
      // 오늘의 운행 일정 가져오기
      const schedules = await OperationPlanService.getDriverTodaySchedules();
      
      if (Array.isArray(schedules)) {
        // 시간순으로 정렬
        const sortedSchedules = schedules.sort((a, b) => {
          const timeA = a.startTime || a.departureTime;
          const timeB = b.startTime || b.departureTime;
          return timeA.localeCompare(timeB);
        });
        
        // 포맷된 일정으로 변환
        const formattedSchedules = OperationPlanService.formatScheduleList(sortedSchedules);
        setDriveSchedules(formattedSchedules);
      } else {
        setDriveSchedules([]);
      }
    } catch (error) {
      console.error('[HomeScreen] 운행 일정 로드 오류:', error);
      setDriveSchedules([]);
      Alert.alert('데이터 로드 오류', '운행 일정을 불러올 수 없습니다.');
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    await loadTodaySchedules();
  };

  const handleSelectSchedule = async (schedule) => {
    if (schedule.status === 'COMPLETED') {
      Alert.alert('알림', '이미 완료된 운행입니다.');
      return;
    }

    if (schedule.status === 'IN_PROGRESS') {
      // 이미 진행 중인 운행이면 운행 화면으로 이동
      const currentDrive = await storage.getCurrentDrive();
      if (currentDrive) {
        navigation.navigate('Driving', { drive: currentDrive });
      }
      return;
    }

    // schedule 객체를 drive 형식으로 변환하여 전달
    const driveData = {
      id: schedule.id,
      operationId: schedule.operationId || schedule.id,
      busNumber: schedule.busNumber,
      busRealNumber: schedule.busRealNumber,
      routeName: schedule.route || schedule.routeName,
      routeId: schedule.routeId,
      scheduledStart: schedule.departureTime,
      scheduledEnd: schedule.arrivalTime,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      operationDate: schedule.operationDate,
      status: schedule.status,
      driverId: schedule.driverId,
      driverName: schedule.driverName,
      organizationId: schedule.organizationId || userInfo?.organizationId,
      ...schedule
    };

    // 운행 시작 화면으로 이동
    navigation.navigate('StartDrive', { drive: driveData });
  };

  const handleBottomTabPress = (tabId) => {
    setActiveBottomTab(tabId);

    switch (tabId) {
      case 'operationPlan':
        navigation.navigate('OperationPlan');
        break;
      case 'profile':
        navigation.navigate('Profile');
        break;
    }
  };

  const getScheduleStatus = (schedule) => {
    switch (schedule.status) {
      case 'COMPLETED':
        return { text: '운행 완료', color: COLORS.grey };
      case 'IN_PROGRESS':
        return { text: '운행 중', color: COLORS.success };
      case 'SCHEDULED':
        const now = new Date();
        const startTimeStr = schedule.startTime || schedule.departureTime?.split(' ').pop();
        
        if (startTimeStr) {
          const [hours, minutes] = startTimeStr.split(':');
          const startTime = new Date();
          startTime.setHours(parseInt(hours), parseInt(minutes), 0);
          
          // 출발 1시간 전부터 운행 대기 상태
          const oneHourBefore = new Date(startTime.getTime() - 60 * 60 * 1000);
          
          if (now >= oneHourBefore && now < startTime) {
            return { text: '운행 대기', color: COLORS.warning };
          } else if (now >= startTime) {
            return { text: '출발 시간', color: COLORS.error };
          }
        }
        return { text: '운행 예정', color: COLORS.primary };
      default:
        return { text: '상태 미정', color: COLORS.grey };
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>정보를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>안녕하세요,</Text>
            <Text style={styles.userName}>{userInfo?.name || '운전자'}님!</Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          
          <View style={styles.driveSection}>
            <Text style={styles.sectionTitle}>오늘의 운행 일정</Text>

            {driveSchedules.length === 0 ? (
              <View style={styles.noDriveContainer}>
                <Text style={styles.noDriveText}>
                  오늘은 예정된 운행이 없습니다.
                </Text>
              </View>
            ) : (
              <View style={styles.scheduleList}>
                {driveSchedules.map((schedule) => {
                  const status = getScheduleStatus(schedule);
                  const isActive = status.text === '운행 대기' || status.text === '출발 시간';
                  
                  return (
                    <TouchableOpacity
                      key={schedule.id}
                      style={[
                        styles.scheduleCard,
                        schedule.status === 'COMPLETED' && styles.completedCard
                      ]}
                      onPress={() => handleSelectSchedule(schedule)}
                      disabled={schedule.status === 'COMPLETED'}
                    >
                      <View style={styles.scheduleHeader}>
                        <Text style={styles.busNumber}>{schedule.busNumber}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                          <Text style={styles.statusText}>{status.text}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.scheduleInfo}>
                        <Text style={styles.timeText}>
                          {schedule.startTime} - {schedule.endTime}
                        </Text>
                        {schedule.route && (
                          <Text style={styles.routeText}>{schedule.route}</Text>
                        )}
                      </View>

                      {isActive && (
                        <View style={styles.activeIndicator}>
                          <Text style={styles.activeIndicatorText}>
                            운행 시작 가능
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>

        <BottomTabBar
          activeTab={activeBottomTab}
          onTabPress={handleBottomTabPress}
        />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.grey,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  welcomeText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.grey,
  },
  userName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
  },
  driveSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
    marginBottom: SPACING.md,
  },
  noDriveContainer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  noDriveText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.grey,
    textAlign: 'center',
  },
  scheduleList: {
    gap: SPACING.sm,
  },
  scheduleCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  completedCard: {
    opacity: 0.6,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  busNumber: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
  },
  scheduleInfo: {
    gap: SPACING.xs,
  },
  timeText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.black,
    fontWeight: FONT_WEIGHT.medium,
  },
  routeText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.grey,
  },
  activeIndicator: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  activeIndicatorText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.medium,
  },
  bottomPadding: {
    height: 80,
  },
});

export default HomeScreen;