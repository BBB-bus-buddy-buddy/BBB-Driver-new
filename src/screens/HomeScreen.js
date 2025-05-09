// src/screens/HomeScreen.js
import React, {useState, useEffect} from 'react';
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
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  BORDER_RADIUS,
  SHADOWS,
  SPACING,
} from '../constants/theme';
import {isTimeNearby} from '../utils/dateUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DriveStatusCard from '../components/DriveStatusCard';
import NotificationItem from '../components/NotificationItem';
import BottomTabBar from '../components/BottomTabBar';
import {useUser} from '../context/UserContext';

const HomeScreen = ({navigation}) => {
  const {userInfo} = useUser();
  const [userName, setUserName] = useState('');
  const [driveSchedules, setDriveSchedules] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [weather, setWeather] = useState({temp: '23°C', condition: '맑음'});
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [activeBottomTab, setActiveBottomTab] = useState('home');
  const [notificationModalVisible, setNotificationModalVisible] =
    useState(false);

  // 이 부분 삭제
  // const { drive} =

  useEffect(() => {
    // 사용자 정보 로드
    if (userInfo && userInfo.name) {
      setUserName(userInfo.name);
      console.log(`Context에 저장된 사용자 정보: ${JSON.stringify(userInfo)}`);
      console.log(`현재 컴포넌트의 State에 저장된 사용자 이름: ${userName}`);
    }

    // 데이터 로드
    loadData();
  }, [userInfo]);

  const loadData = async () => {
    try {
      // 운행 일정 로드
      const schedules = await getDriveSchedules();

      // 버튼 활성화 여부 계산
      const schedulesWithButtonStatus = schedules.map(schedule => ({
        ...schedule,
        isButtonActive: isTimeNearby(schedule.departureTime),
      }));

      setDriveSchedules(schedulesWithButtonStatus);

      // 날씨 정보 로드
      const weatherInfo = await getWeatherInfo();
      setWeather(weatherInfo);

      // 알림 로드
      const notifs = await getNotifications();
      setNotifications(notifs);

      // 읽지 않은 알림 개수 계산
      const unreadCount = notifs.filter(
        notification => notification.unread,
      ).length;
      setUnreadNotifications(unreadCount);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // 여기에 드라이브 스케줄, 날씨 정보, 알림을 가져오는 함수들을 추가해야 합니다
  const getDriveSchedules = async () => {
    // 임시 데이터
    return [
      {
        id: '1',
        routeName: '동부 -> 서부',
        departureTime: '14:00',
        arrivalTime: '16:00',
        startLocation: '울산과학대학교 동부캠퍼스',
        endLocation: '울산과학대학교 서부캠퍼스',
        totalStops: 5,
        currentStop: 0,
        status: 'scheduled',
      },
    ];
  };

  const getWeatherInfo = async () => {
    // 임시 데이터
    return {temp: '23°C', condition: '맑음'};
  };

  const getNotifications = async () => {
    // 임시 데이터
    return [
      {
        id: '1',
        title: '운행 알림',
        message: '내일 운행 일정이 추가되었습니다.',
        time: '오전 10:30',
        unread: true,
      },
    ];
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleStartDrive = driveId => {
    // 선택된 운행 정보 찾기
    const selectedDrive = driveSchedules.find(drive => drive.id === driveId);

    if (selectedDrive) {
      // 운행 정보를 로컬 스토리지에 저장
      AsyncStorage.setItem('currentDrive', JSON.stringify(selectedDrive));
      // 운행 시작 화면으로 이동
      navigation.navigate('StartDrive', {drive: selectedDrive});
    } else {
      Alert.alert('오류', '운행 정보를 찾을 수 없습니다.');
    }
  };

  const renderDriveItem = drive => (
    <DriveStatusCard
      key={drive.id}
      drive={drive}
      onPress={() => handleStartDrive(drive.id)}
      isActive={drive.isButtonActive}
    />
  );

  const handleBottomTabPress = tabId => {
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

  const markNotificationsAsRead = () => {
    // 읽지 않은 알림을 모두 읽음 처리
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      unread: false,
    }));

    setNotifications(updatedNotifications);
    setUnreadNotifications(0);

    // 실제 앱에서는 서버에 읽음 상태 업데이트 요청을 보내야 함
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>안녕하세요,</Text>
            <Text style={styles.userName}>{userName}님!</Text>
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
          {/* 날씨 섹션 */}
          <View style={styles.weatherSection}>
            <View style={styles.weatherCard}>
              <Text style={styles.weatherTitle}>오늘의 날씨</Text>
              <View style={styles.weatherInfo}>
                <Image
                  source={require('../assets/weather-sunny.png')}
                  style={styles.weatherIcon}
                />
                <View>
                  <Text style={styles.temperature}>{weather.temp}</Text>
                  <Text style={styles.weatherCondition}>
                    {weather.condition}
                  </Text>
                </View>
              </View>
            </View>
          </View>

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
              renderDriveItem(driveSchedules[activeTab])
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
