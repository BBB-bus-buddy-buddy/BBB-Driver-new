// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
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

// 🔄 NEW: 새로운 Service 구조로 import 변경
import { DriveService, NotificationService } from '../services';
import { storage } from '../utils/storage';

import DriveStatusCard from '../components/DriveStatusCard';
import NotificationItem from '../components/NotificationItem';
import BottomTabBar from '../components/BottomTabBar';
import { isTimeNearby } from '../utils/dateUtils';

const HomeScreen = ({ navigation }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [driveSchedules, setDriveSchedules] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [weather, setWeather] = useState({ temp: '23°C', condition: '맑음' });
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [activeBottomTab, setActiveBottomTab] = useState('home');
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);

  // 화면 로드 시 초기 데이터 로드
  useEffect(() => {
    const initializeData = async () => {
      try {
        setInitialLoading(true);

        // 🔄 NEW: storage 헬퍼 사용
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

      // 🔄 NEW: DriveService 사용
      try {
        const schedules = await DriveService.getSchedules();

        // 버튼 활성화 여부 계산
        const schedulesWithButtonStatus = schedules.map(schedule => ({
          ...schedule,
          isButtonActive: isTimeNearby(schedule.departureTime),
        }));

        setDriveSchedules(schedulesWithButtonStatus);
      } catch (scheduleError) {
        console.error('[HomeScreen] 운행 일정 로드 오류:', scheduleError);
      }

      // NotificationService 사용
      try {
        const notifs = await NotificationService.getNotifications();
        setNotifications(notifs);

        // 읽지 않은 알림 개수 계산
        const unreadCount = notifs.filter(notification => notification.unread).length;
        setUnreadNotifications(unreadCount);
      } catch (notificationError) {
        console.error('[HomeScreen] 알림 정보 로드 오류:', notificationError);
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
      case 'schedule':
        navigation.navigate('Schedule');
        break;
      case 'message':
        navigation.navigate('Message');
        break;
      case 'profile':
        navigation.navigate('Profile');
        break;
      default:
        break;
    }
  };

  const toggleNotificationModal = () => {
    setNotificationModalVisible(!notificationModalVisible);

    // 모달이 열릴 때 알림을 읽음 처리
    if (!notificationModalVisible) {
      markNotificationsAsRead();
    }
  };

  const markNotificationsAsRead = async () => {
    try {
      // 🔄 NEW: NotificationService 사용
      const result = await NotificationService.markAllAsRead();

      if (result.success) {
        // 읽지 않은 알림을 모두 읽음 처리 (UI 업데이트)
        const updatedNotifications = notifications.map(notification => ({
          ...notification,
          unread: false,
        }));

        setNotifications(updatedNotifications);
        setUnreadNotifications(0);
      }
    } catch (error) {
      console.error('[HomeScreen] 알림 읽음 처리 오류:', error);

      // API 호출 실패 시 로컬에서만 처리
      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        unread: false,
      }));

      setNotifications(updatedNotifications);
      setUnreadNotifications(0);
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

          {/* 알림 아이콘 */}
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={toggleNotificationModal}>
            <Image
              source={require('../assets/notification-icon.png')}
              style={styles.notificationIcon}
            />
            {unreadNotifications > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadNotifications}
                </Text>
              </View>
            )}
          </TouchableOpacity>
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
                      운행 {drive.id}
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

        {/* 알림 모달 */}
        <Modal
          visible={notificationModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={toggleNotificationModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>알림</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={toggleNotificationModal}>
                  <Text style={styles.closeButtonText}>닫기</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent}>
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                    />
                  ))
                ) : (
                  <View style={styles.emptyNotification}>
                    <Text style={styles.emptyNotificationText}>
                      알림이 없습니다.
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

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
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  notificationIcon: {
    width: 22,
    height: 22,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  notificationBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
  },
  weatherSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  weatherCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  weatherTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.black,
    marginBottom: SPACING.sm,
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherIcon: {
    width: 50,
    height: 50,
    marginRight: SPACING.md,
  },
  temperature: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
  },
  weatherCondition: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.grey,
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

  // 알림 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    paddingBottom: 20,
    height: '70%', // 화면의 70% 높이
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  modalTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  closeButtonText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.medium,
  },
  modalContent: {
    flex: 1,
  },
  emptyNotification: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyNotificationText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.grey,
    textAlign: 'center',
  },
});

export default HomeScreen;