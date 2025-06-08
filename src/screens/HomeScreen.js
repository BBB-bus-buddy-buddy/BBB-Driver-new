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

// 🔄 OperationPlanService 사용
import OperationPlanService from '../services/operationPlanService';
import { storage } from '../utils/storage';

import DriveStatusCard from '../components/DriveStatusCard';
import BottomTabBar from '../components/BottomTabBar';
import { isDrivePreparationTime } from '../utils/driveTimeUtils';

const HomeScreen = ({ navigation }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [driveSchedules, setDriveSchedules] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [weather, setWeather] = useState({ temp: '23°C', condition: '맑음' });
  const [activeBottomTab, setActiveBottomTab] = useState('home');

  // 화면 로드 시 초기 데이터 로드
  useEffect(() => {
    const initializeData = async () => {
      try {
        setInitialLoading(true);

        // storage 헬퍼 사용
        const storedUserInfo = await storage.getUserInfo();
        if (storedUserInfo) {
          setUserInfo(storedUserInfo);
          console.log('[HomeScreen] 저장된 사용자 정보 로드:', storedUserInfo.email);
        } else {
          // 저장된 사용자 정보가 없으면 로그인 화면으로 이동
          console.error('[HomeScreen] 저장된 사용자 정보 없음');
          Alert.alert('오류', '사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
          navigation.replace('Login');
          return;
        }

        // 이후 다른 데이터 로드
        await loadData();

      } catch (error) {
        console.error('[HomeScreen] 초기화 오류:', error);
        Alert.alert('오류', '정보를 불러올 수 없습니다. 다시 로그인해주세요.');
        navigation.replace('Login');
      } finally {
        setInitialLoading(false);
      }
    };

    initializeData();
  }, [navigation]);

  const loadData = async () => {
    try {
      setRefreshing(true);
      
      try {
        // 운전자의 오늘 운행 일정 가져오기
        const schedules = await OperationPlanService.getDriverTodaySchedules();
        console.log('[HomeScreen] 오늘의 운행 일정:', schedules);
        
        // 빈 배열이어도 정상 처리
        if (!Array.isArray(schedules)) {
          console.warn('[HomeScreen] 일정이 배열이 아님:', schedules);
          setDriveSchedules([]);
          return;
        }

        console.log('[HomeScreen] 오늘의 운행 일정 개수:', schedules.length);

        // 데이터 포맷팅
        const formattedSchedules = OperationPlanService.formatScheduleList(schedules);

        // 버튼 활성화 여부 계산
        const schedulesWithButtonStatus = formattedSchedules.map(schedule => ({
          ...schedule,
          isButtonActive: isDrivePreparationTime(schedule.departureTime),
        }));

        setDriveSchedules(schedulesWithButtonStatus);
      } catch (scheduleError) {
        console.error('[HomeScreen] 운행 일정 로드 오류:', scheduleError);
        // API 오류 시 빈 배열로 설정
        setDriveSchedules([]);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('데이터 로드 오류', '정보를 불러오는 중 문제가 발생했습니다.');
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    await loadData();
  };

  const handleStartDrive = async (driveId) => {
    // 선택된 운행 정보 찾기
    const selectedDrive = driveSchedules.find(drive => drive.id === driveId);

    if (selectedDrive) {
      // storage 헬퍼 사용
      await storage.setCurrentDrive(selectedDrive);
      // 운행 시작 화면으로 이동
      navigation.navigate('StartDrive', { drive: selectedDrive });
    } else {
      Alert.alert('오류', '운행 정보를 찾을 수 없습니다.');
    }
  };

  const handleBottomTabPress = (tabId) => {
    setActiveBottomTab(tabId);

    switch (tabId) {
      case 'home':
        // 이미 홈 화면이므로 아무 작업도 하지 않음
        break;
      case 'operationPlan':
        navigation.navigate('OperationPlan');
        break;
      case 'profile':
        navigation.navigate('Profile');
        break;
      default:
        break;
    }
  };

  // 초기 로딩 중이면 로딩 화면 표시
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
          {/* 운행 정보 섹션 */}
          <View style={styles.driveSection}>
            <Text style={styles.sectionTitle}>금일 운행 정보</Text>

            {/* 운행 탭 */}
            {driveSchedules.length > 0 && (
              <View style={styles.driveTabs}>
                {driveSchedules.map((drive, index) => (
                  <TouchableOpacity
                    key={drive.id}
                    style={[
                      styles.driveTab,
                      activeTab === index && styles.activeTab,
                    ]}
                    onPress={() => setActiveTab(index)}>
                    <Text
                      style={[
                        styles.driveTabText,
                        activeTab === index && styles.activeTabText,
                      ]}>
                      운행 {index + 1}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* 현재 선택된 운행 정보 */}
            {driveSchedules.length > 0 ? (
              <DriveStatusCard
                drive={driveSchedules[activeTab]}
                onPress={() => handleStartDrive(driveSchedules[activeTab].id)}
                isActive={driveSchedules[activeTab].isButtonActive}
              />
            ) : (
              <View style={styles.noDriveContainer}>
                <Text style={styles.noDriveText}>
                  오늘은 예정된 운행이 없습니다.
                </Text>
              </View>
            )}
          </View>

          {/* 안전 운행 팁 */}
          <View style={styles.safetyTipsSection}>
            <Text style={styles.sectionTitle}>안전 운행 팁</Text>
            <View style={styles.safetyTipCard}>
              <Text style={styles.safetyTipTitle}>안전벨트 착용 확인</Text>
              <Text style={styles.safetyTipContent}>
                모든 승객이 안전벨트를 착용했는지 출발 전 확인해주세요.
              </Text>
            </View>
          </View>

          {/* 하단 여백 */}
          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* 하단 탭 바 */}
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
  driveTabs: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  driveTab: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    marginRight: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.extraLightGrey,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  driveTabText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.grey,
  },
  activeTabText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.medium,
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
  safetyTipsSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  safetyTipCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    ...SHADOWS.small,
  },
  safetyTipTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  safetyTipContent: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.grey,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 70, // 바텀 탭 바 높이 + 여백
  },
});

export default HomeScreen;