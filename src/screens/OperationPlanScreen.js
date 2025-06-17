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
import OperationPlanService from '../services/operationPlanService';

const OperationPlanScreen = ({ navigation }) => {
  const [schedules, setSchedules] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [markedDates, setMarkedDates] = useState({});
  const [activeBottomTab, setActiveBottomTab] = useState('operationPlan');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedScheduleDetail, setSelectedScheduleDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 화면 포커스 시 데이터 새로고침
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('[OperationPlanScreen] 화면 포커스 - 데이터 새로고침');
      // 화면에 돌아올 때마다 강제 새로고침
      loadInitialData(true);
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    // 오늘 날짜로 초기화
    const today = new Date();
    const todayStr = formatDateForAPI(today);
    setSelectedDate(todayStr);

    // 초기 데이터 로드 (캐시 사용 가능)
    loadInitialData(false);
  }, []);

  const formatDateForAPI = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const loadInitialData = async (forceRefresh = false) => {
    try {
      setLoading(true);

      console.log('[OperationPlanScreen] 초기 데이터 로드 - 강제 새로고침:', forceRefresh);

      // 오늘 날짜의 일정을 가져옴 (forceRefresh 파라미터 전달)
      const todaySchedules = await OperationPlanService.getDriverTodaySchedules(forceRefresh);

      const schedulesArray = Array.isArray(todaySchedules) ? todaySchedules : [];
      const formattedSchedules = OperationPlanService.formatScheduleList(schedulesArray);
      setSchedules(formattedSchedules);

      // 이번 달의 일정이 있는 날짜들을 표시하기 위해 추가 로드
      await loadMonthSchedules(forceRefresh);

    } catch (error) {
      console.error('[OperationPlanScreen] 초기 데이터 로드 오류:', error);
      Alert.alert('오류', '일정을 불러오는 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadMonthSchedules = async (forceRefresh = false) => {
    try {
      console.log('[OperationPlanScreen] 월별 일정 로드 - 강제 새로고침:', forceRefresh);

      // 현재 달의 운행 일정을 조회 (forceRefresh 파라미터 전달)
      const monthSchedules = await OperationPlanService.getDriverCurrentMonthSchedules(forceRefresh);
      const formattedSchedules = OperationPlanService.formatScheduleList(monthSchedules);

      // 캘린더 마킹 데이터 생성
      const marked = OperationPlanService.createCalendarMarkedDates(formattedSchedules);

      setMarkedDates(marked);

    } catch (error) {
      console.error('[OperationPlanScreen] 월별 일정 로드 오류:', error);
    }
  };

  const onRefresh = async () => {
    console.log('[OperationPlanScreen] Pull-to-refresh 시작');
    setRefreshing(true);
    // Pull-to-refresh 시 항상 강제 새로고침
    await loadInitialData(true);
    setRefreshing(false);
  };

  const handleDateSelect = async (day) => {
    setSelectedDate(day.dateString);

    try {
      setLoading(true);
      console.log('[OperationPlanScreen] 날짜 선택 - 강제 새로고침');
      
      // 날짜 선택 시에도 강제 새로고침
      const dateSchedules = await OperationPlanService.getDriverSchedulesByDate(day.dateString, true);
      const schedulesArray = Array.isArray(dateSchedules) ? dateSchedules : [];
      const formattedSchedules = OperationPlanService.formatScheduleList(schedulesArray);
      setSchedules(formattedSchedules);
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
      if (!schedule) {
        Alert.alert('오류', '운행 정보가 올바르지 않습니다.');
        return;
      }

      // busNumber 검증 - busNumber 또는 busRealNumber 중 하나는 있어야 함
      if (!schedule.busNumber && !schedule.busRealNumber) {
        Alert.alert('오류', '버스 정보가 올바르지 않습니다.');
        return;
      }

      setDetailLoading(true);
      setModalVisible(true);

      // 상세 정보 조회 (항상 최신 정보 조회)
      const detail = await OperationPlanService.getScheduleDetail(schedule.operationId || schedule.id, true);
      
      if (detail) {
        const formattedDetail = OperationPlanService.formatScheduleData(detail);
        
        // 상세 정보에도 busNumber가 없으면 기본값 설정
        if (!formattedDetail.busNumber && !formattedDetail.busRealNumber) {
          formattedDetail.busNumber = `BUS-${formattedDetail.busId || 'UNKNOWN'}`;
        }
        
        setSelectedScheduleDetail(formattedDetail);
      } else {
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
      console.log('[OperationPlanScreen] 월 변경 - 강제 새로고침');
      
      // 월 변경 시에도 강제 새로고침
      const monthSchedules = await OperationPlanService.getDriverMonthlySchedules(month.year, month.month, true);
      const formattedSchedules = OperationPlanService.formatScheduleList(monthSchedules);

      // 캘린더 마킹 데이터 생성
      const marked = OperationPlanService.createCalendarMarkedDates(formattedSchedules);

      setMarkedDates(marked);

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
                    {selectedScheduleDetail.route || '노선 정보 없음'}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>운전자</Text>
                  <Text style={styles.detailValue}>
                    {selectedScheduleDetail.driverName || '-'}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>운행 날짜</Text>
                  <Text style={styles.detailValue}>
                    {selectedScheduleDetail.operationDate}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>출발 시간</Text>
                  <Text style={styles.detailValue}>
                    {selectedScheduleDetail.startTime}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>도착 시간</Text>
                  <Text style={styles.detailValue}>
                    {selectedScheduleDetail.endTime}
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

                <View style={styles.modalFooter}>
                  {/* 운행 시작 가능한 상태인지 확인 */}
                  {selectedScheduleDetail.status === 'SCHEDULED' && (
                    <TouchableOpacity
                      style={[styles.modalActionButton, styles.startDriveButton]}
                      onPress={() => {
                        // busNumber 확인 후 StartDriveScreen으로 이동
                        const busNumber = selectedScheduleDetail.busNumber || 
                                         selectedScheduleDetail.busRealNumber || 
                                         `BUS-${selectedScheduleDetail.busId}`;
                        
                        const driveData = {
                          ...selectedScheduleDetail,
                          busNumber: busNumber, // busNumber 보장
                          busRealNumber: selectedScheduleDetail.busRealNumber || busNumber
                        };
                        
                        setModalVisible(false);
                        setSelectedScheduleDetail(null);
                        navigation.navigate('StartDrive', { drive: driveData });
                      }}>
                      <Text style={styles.modalActionButtonText}>운행 시작</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={[styles.modalActionButton, styles.closeButton]}
                    onPress={() => {
                      setModalVisible(false);
                      setSelectedScheduleDetail(null);
                    }}>
                    <Text style={[styles.modalActionButtonText, styles.closeButtonText]}>닫기</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    );
  };

  const getScheduleStatus = (schedule) => {
    if (schedule.status === 'COMPLETED') return '완료';
    if (schedule.status === 'IN_PROGRESS') return '진행 중';
    if (schedule.status === 'CANCELLED') return '취소';

    // SCHEDULED 상태일 때 시간 체크
    if (OperationPlanService.isToday(schedule.operationDate)) {
      if (OperationPlanService.isUpcoming(schedule.operationDate, schedule.startTime)) {
        return '곧 시작';
      }
    }

    return '예정';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case '완료': return COLORS.grey;
      case '진행 중': return COLORS.success;
      case '취소': return COLORS.error;
      case '곧 시작': return COLORS.warning;
      default: return COLORS.primary;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>운행 일정</Text>
          {/* 수동 새로고침 버튼 추가 */}
          <TouchableOpacity 
            onPress={() => loadInitialData(true)}
            style={styles.refreshButton}
          >
            <Text style={styles.refreshButtonText}>🔄</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >
          {/* 새로고침 안내 */}
          <View style={styles.refreshHint}>
            <Text style={styles.refreshHintText}>
              ⬇️ 아래로 당겨서 새로고침
            </Text>
          </View>

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
              schedules.map((schedule, index) => {
                const status = getScheduleStatus(schedule);
                const statusColor = getStatusColor(status);

                return (
                  <TouchableOpacity
                    key={schedule.id || index}
                    style={styles.scheduleCard}
                    onPress={() => handleSchedulePress(schedule)}
                    activeOpacity={0.7}>
                    <View style={styles.scheduleHeader}>
                      <Text style={styles.busNumber}>{schedule.busNumber}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                        <Text style={styles.statusBadgeText}>{status}</Text>
                      </View>
                    </View>

                    <View style={styles.scheduleInfo}>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>노선:</Text>
                        <Text style={styles.infoValue}>{schedule.route || '노선 정보 없음'}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>출발:</Text>
                        <Text style={styles.infoValue}>{schedule.startTime}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>도착:</Text>
                        <Text style={styles.infoValue}>{schedule.endTime}</Text>
                      </View>
                      {schedule.driverName && (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>운전자:</Text>
                          <Text style={styles.infoValue}>{schedule.driverName}</Text>
                        </View>
                      )}
                    </View>

                    {schedule.isRecurring && (
                      <View style={styles.recurringBadge}>
                        <Text style={styles.recurringBadgeText}>반복 일정</Text>
                      </View>
                    )}

                    <Text style={styles.tapHint}>자세히 보려면 탭하세요 →</Text>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.noScheduleContainer}>
                <Text style={styles.noScheduleText}>예정된 일정이 없습니다.</Text>
                <TouchableOpacity 
                  style={styles.reloadButton}
                  onPress={() => handleDateSelect({ dateString: selectedDate })}
                >
                  <Text style={styles.reloadButtonText}>다시 확인</Text>
                </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  refreshButton: {
    padding: SPACING.sm,
  },
  refreshButtonText: {
    fontSize: FONT_SIZE.xl,
  },
  scrollView: {
    flex: 1,
  },
  refreshHint: {
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.secondary,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  refreshHintText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
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
  statusBadge: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusBadgeText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.white,
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
    width: 60,
    fontSize: FONT_SIZE.sm,
    color: COLORS.grey,
  },
  infoValue: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.black,
    fontWeight: FONT_WEIGHT.medium,
    flex: 1,
  },
  recurringBadge: {
    backgroundColor: COLORS.secondary,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
  },
  recurringBadgeText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.medium,
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
    marginBottom: SPACING.md,
  },
  reloadButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  reloadButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
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
  modalFooter: {
    marginTop: SPACING.xl,
    gap: SPACING.sm,
  },
  modalActionButton: {
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  startDriveButton: {
    backgroundColor: COLORS.primary,
  },
  closeButton: {
    backgroundColor: COLORS.lightGrey,
  },
  modalActionButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
  },
  closeButtonText: {
    color: COLORS.black,
  }
});

export default OperationPlanScreen;