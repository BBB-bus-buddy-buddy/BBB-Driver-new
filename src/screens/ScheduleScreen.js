// src/screens/ScheduleScreen.js - 업데이트된 버전
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS, SPACING } from '../constants/theme';
import BottomTabBar from '../components/BottomTabBar';
import { Calendar } from 'react-native-calendars';
import { ScheduleService } from '../services';

// 🆕 더미데이터 import 추가
import { 
  generateDummySchedules, 
  getSchedulesByDate 
} from '../data/dummyScheduleData';

const ScheduleScreen = ({ navigation }) => {
  const [schedules, setSchedules] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [markedDates, setMarkedDates] = useState({});
  const [activeBottomTab, setActiveBottomTab] = useState('schedule');

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      // 🆕 더미데이터 사용
      const USE_DUMMY_DATA = true; // 백엔드 개발 완료 시 false로 변경
      
      let scheduleData;
      
      if (USE_DUMMY_DATA) {
        // 더미데이터 생성
        scheduleData = generateDummySchedules();
        console.log('[ScheduleScreen] 더미 운행 일정 로드:', scheduleData.length, '개');
      } else {
        // 실제 API 호출
        scheduleData = await ScheduleService.getDriveSchedules();
      }
      
      setSchedules(scheduleData);

      // Mark dates with schedules on calendar
      const marked = {};
      scheduleData.forEach(schedule => {
        const dateMatch = schedule.departureTime.match(/(\d+)년 (\d+)월 (\d+)일/);
        if (dateMatch) {
          const year = dateMatch[1];
          const month = dateMatch[2].padStart(2, '0');
          const day = dateMatch[3].padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;
          
          if (!marked[dateStr]) {
            marked[dateStr] = { 
              marked: true, 
              dotColor: COLORS.primary,
              dots: []
            };
          }
          
          // 해당 날짜의 운행 횟수 표시
          marked[dateStr].dots.push({
            key: schedule.id,
            color: COLORS.primary
          });
        }
      });
      
      setMarkedDates(marked);

      // Set today as default selected date
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      setSelectedDate(todayStr);
    } catch (error) {
      console.error('[ScheduleScreen] 일정 로드 오류:', error);

      // 오류 시 빈 데이터 설정
      setSchedules([]);
      setMarkedDates({});
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSchedules();
    setRefreshing(false);
  };

  const handleDateSelect = async (day) => {
    setSelectedDate(day.dateString);

    try {
      const USE_DUMMY_DATA = true; // 백엔드 개발 완료 시 false로 변경
      
      if (USE_DUMMY_DATA) {
        // 더미데이터에서 특정 날짜 일정 필터링
        const allSchedules = generateDummySchedules();
        const dateSchedules = getSchedulesByDate(allSchedules, day.dateString);
        console.log(`[ScheduleScreen] ${day.dateString} 일정:`, dateSchedules.length, '개');
      } else {
        // 실제 API 호출
        const dateSchedules = await ScheduleService.getSchedulesByDate(day.dateString);
      }
    } catch (error) {
      console.error('[ScheduleScreen] 날짜별 일정 조회 오류:', error);
    }
  };

  const handleTabPress = (tabId) => {
    setActiveBottomTab(tabId);

    switch (tabId) {
      case 'home':
        navigation.navigate('Home');
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

  // Filter schedules for selected date
  const filteredSchedules = schedules.filter(schedule => {
    const dateMatch = schedule.departureTime.match(/(\d+)년 (\d+)월 (\d+)일/);
    if (dateMatch) {
      const year = dateMatch[1];
      const month = dateMatch[2].padStart(2, '0');
      const day = dateMatch[3].padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      return dateStr === selectedDate;
    }
    return false;
  });

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
            />
          </View>

          {/* 일정 목록 */}
          <View style={styles.scheduleListSection}>
            <Text style={styles.sectionTitle}>
              {selectedDate ? selectedDate.replace(/-/g, '.') : '오늘'} 일정
            </Text>

            {filteredSchedules.length > 0 ? (
              filteredSchedules.map((schedule) => (
                <View key={schedule.id} style={styles.scheduleCard}>
                  <View style={styles.scheduleHeader}>
                    <Text style={styles.busNumber}>{schedule.busNumber}</Text>
                    <View style={styles.routeBadge}>
                      <Text style={styles.routeBadgeText}>운행 {schedule.id}</Text>
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
                </View>
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
});

export default ScheduleScreen;