// src/screens/OperationPlanScreen.js
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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS, SPACING } from '../constants/theme';
import BottomTabBar from '../components/BottomTabBar';
import { Calendar } from 'react-native-calendars';
// 🔄 OperationPlanService 사용
import OperationPlanService from '../services/operationPlanService';
import { formatDateForAPI } from '../api/operationPlan';

const OperationPlanScreen = ({ navigation }) => {
  console.log('[OperationPlanScreen] OperationPlanService:', OperationPlanService);
  
  const [schedules, setSchedules] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [markedDates, setMarkedDates] = useState({});
  const [activeBottomTab, setActiveBottomTab] = useState('operationPlan');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedScheduleDetail, setSelectedScheduleDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    // 오늘 날짜로 초기화
    const today = new Date();
    const todayStr = formatDateForAPI(today);
    setSelectedDate(todayStr);
    
    // 초기 데이터 로드
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // 먼저 오늘 날짜의 일정을 가져옴
      const todaySchedules = await OperationPlanService.getDriverTodaySchedules();
      console.log('[OperationPlanScreen] 원본 응답:', todaySchedules);
      
      // 배열인지 확인
      const schedulesArray = Array.isArray(todaySchedules) ? todaySchedules : [];
      console.log('[OperationPlanScreen] 일정 배열:', schedulesArray);
      
      const formattedSchedules = OperationPlanService.formatScheduleList(schedulesArray);
      setSchedules(formattedSchedules);
      
      // 이번 달의 일정이 있는 날짜들을 표시하기 위해 추가 로드
      await loadMonthSchedules();
      
    } catch (error) {
      console.error('[OperationPlanScreen] 초기 데이터 로드 오류:', error);
      Alert.alert('오류', '일정을 불러오는 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadMonthSchedules = async () => {
    try {
      // 현재 달의 운행 일정을 한 번에 조회
      const monthSchedules = await OperationPlanService.getDriverCurrentMonthSchedules();
      const formattedSchedules = OperationPlanService.formatScheduleList(monthSchedules);
      
      // 캘린더 마킹 데이터 생성
      const marked = OperationPlanService.createCalendarMarkedDates(formattedSchedules);
      
      setMarkedDates(marked);
      console.log('[OperationPlanScreen] 월간 일정 로드 완료:', formattedSchedules.length, '개');
      
    } catch (error) {
      console.error('[OperationPlanScreen] 월별 일정 로드 오류:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleDateSelect = async (day) => {
    setSelectedDate(day.dateString);
    
    try {
      setLoading(true);
      const dateSchedules = await OperationPlanService.getDriverSchedulesByDate(day.dateString);
      const schedulesArray = Array.isArray(dateSchedules) ? dateSchedules : [];
      const formattedSchedules = OperationPlanService.formatScheduleList(schedulesArray);
      setSchedules(formattedSchedules);
      console.log(`[OperationPlanScreen] ${day.dateString} 일정:`, formattedSchedules.length, '개');
    } catch (error) {
      console.error('[OperationPlanScreen] 날짜별 일정 조회 오류:', error);
      Alert.alert('오류', '일정을 불러오는 중 문제가 발생했습니다.');
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSchedulePress = async (schedule) => {
    try {
      setDetailLoading(true);
      setModalVisible(true);
      
      // 상세 정보 조회
      const detail = await OperationPlanService.getScheduleDetail(schedule.operationId || schedule.id);
      if (detail) {
        const formattedDetail = OperationPlanService.formatScheduleData(detail);
        setSelectedScheduleDetail(formattedDetail);
      } else {
        console.error('[OperationPlanScreen] 일정 상세 정보 없음');
        Alert.alert('오류', '일정 상세 정보를 불러올 수 없습니다.');
        setModalVisible(false);
      }
      
    } catch (error) {
      console.error('[OperationPlanScreen] 일정 상세 조회 오류:', error);
      Alert.alert('오류', '일정 상세 정보를 불러올 수 없습니다.');
      setModalVisible(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleMonthChange = async (month) => {
    try {
      console.log('[OperationPlanScreen] 월 변경:', month);
      
      // month 객체: { year: 2024, month: 12 }
      const monthSchedules = await OperationPlanService.getDriverMonthlySchedules(month.year, month.month);
      const formattedSchedules = OperationPlanService.formatScheduleList(monthSchedules);
      
      // 캘린더 마킹 데이터 생성
      const marked = OperationPlanService.createCalendarMarkedDates(formattedSchedules);
      
      setMarkedDates(marked);
      console.log(`[OperationPlanScreen] ${month.year}년 ${month.month}월 일정 로드 완료:`, formattedSchedules.length, '개');
      
    } catch (error) {
      console.error('[OperationPlanScreen] 월 변경 일정 로드 오류:', error);
    }
  };

  const handleTabPress = (tabId) => {
    setActiveBottomTab(tabId);

    switch (tabId) {
      case 'home':
        navigation.navigate('Home');
        break;
      case 'profile':
        navigation.navigate('Profile');
        break;
      default:
        break;
    }
  };

  const renderScheduleDetailModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedScheduleDetail(null);
        }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>운행 일정 상세</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setSelectedScheduleDetail(null);
                }}
                style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {detailLoading ? (
              <View style={styles.modalLoadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.modalLoadingText}>정보를 불러오는 중...</Text>
              </View>
            ) : selectedScheduleDetail ? (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>버스 번호</Text>
                  <Text style={styles.detailValue}>
                    {selectedScheduleDetail.busNumber}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>노선</Text>
                  <Text style={styles.detailValue}>
                    {selectedScheduleDetail.route}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>운전자</Text>
                  <Text style={styles.detailValue}>
                    {selectedScheduleDetail.driverName}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>출발 시간</Text>
                  <Text style={styles.detailValue}>
                    {selectedScheduleDetail.departureTime}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>도착 시간</Text>
                  <Text style={styles.detailValue}>
                    {selectedScheduleDetail.arrivalTime}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>상태</Text>
                  <Text style={[styles.detailValue, styles.statusText]}>
                    {selectedScheduleDetail.status === 'SCHEDULED' ? '예정' :
                     selectedScheduleDetail.status === 'IN_PROGRESS' ? '진행 중' :
                     selectedScheduleDetail.status === 'COMPLETED' ? '완료' : '취소'}
                  </Text>
                </View>

                {selectedScheduleDetail.isRecurring && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>반복 일정</Text>
                    <Text style={styles.detailValue}>
                      {selectedScheduleDetail.recurringWeeks}주 반복
                    </Text>
                  </View>
                )}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>운행 일정</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* 캘린더 */}
          <View style={styles.calendarContainer}>
            <Calendar
              style={styles.calendar}
              markedDates={{
                ...markedDates,
                [selectedDate]: {
                  ...markedDates[selectedDate],
                  selected: true,
                  selectedColor: COLORS.primary,
                }
              }}
              theme={{
                calendarBackground: COLORS.white,
                textSectionTitleColor: COLORS.grey,
                selectedDayBackgroundColor: COLORS.primary,
                selectedDayTextColor: COLORS.white,
                todayTextColor: COLORS.primary,
                dayTextColor: COLORS.black,
                dotColor: COLORS.primary,
                arrowColor: COLORS.primary,
                monthTextColor: COLORS.black,
                textMonthFontWeight: FONT_WEIGHT.bold,
                textDayFontSize: FONT_SIZE.sm,
              }}
              onDayPress={handleDateSelect}
              onMonthChange={handleMonthChange}
            />
          </View>

          {/* 일정 목록 */}
          <View style={styles.scheduleListSection}>
            <Text style={styles.sectionTitle}>
              {selectedDate ? selectedDate.replace(/-/g, '.') : '오늘'} 일정
            </Text>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>일정을 불러오는 중...</Text>
              </View>
            ) : schedules.length > 0 ? (
              schedules.map((schedule, index) => (
                <TouchableOpacity
                  key={schedule.id || index}
                  style={styles.scheduleCard}
                  onPress={() => handleSchedulePress(schedule)}
                  activeOpacity={0.7}>
                  <View style={styles.scheduleHeader}>
                    <Text style={styles.busNumber}>{schedule.busNumber}</Text>
                    <View style={styles.routeBadge}>
                      <Text style={styles.routeBadgeText}>운행 {index + 1}</Text>
                    </View>
                  </View>

                  <View style={styles.scheduleInfo}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>노선:</Text>
                      <Text style={styles.infoValue}>{schedule.route}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>출발:</Text>
                      <Text style={styles.infoValue}>{schedule.departureTime}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>도착:</Text>
                      <Text style={styles.infoValue}>{schedule.arrivalTime}</Text>
                    </View>
                  </View>

                  <Text style={styles.tapHint}>자세히 보려면 탭하세요 →</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noScheduleContainer}>
                <Text style={styles.noScheduleText}>예정된 일정이 없습니다.</Text>
              </View>
            )}
          </View>

          {/* 하단 여백 */}
          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* 상세 정보 모달 */}
        {renderScheduleDetailModal()}

        {/* 하단 탭 바 */}
        <BottomTabBar
          activeTab={activeBottomTab}
          onTabPress={handleTabPress}
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
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
  },
  scrollView: {
    flex: 1,
  },
  calendarContainer: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    margin: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.small,
  },
  calendar: {
    borderRadius: BORDER_RADIUS.md,
  },
  scheduleListSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
    marginBottom: SPACING.md,
  },
  loadingContainer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: COLORS.grey,
  },
  scheduleCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  scheduleHeader: {
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
  scheduleInfo: {
    marginBottom: SPACING.sm,
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
  tapHint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.grey,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  noScheduleContainer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  noScheduleText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.grey,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 80,
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    maxHeight: '80%',
    paddingBottom: SPACING.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
  },
  modalCloseButton: {
    padding: SPACING.xs,
  },
  modalCloseText: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.grey,
  },
  modalBody: {
    padding: SPACING.lg,
  },
  modalLoadingContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  modalLoadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.sm,
    color: COLORS.grey,
  },
  detailSection: {
    marginBottom: SPACING.lg,
  },
  detailLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.grey,
    marginBottom: SPACING.xs,
  },
  detailValue: {
    fontSize: FONT_SIZE.md,
    color: COLORS.black,
    fontWeight: FONT_WEIGHT.medium,
  },
  statusText: {
    color: COLORS.primary,
  },
});

export default OperationPlanScreen;