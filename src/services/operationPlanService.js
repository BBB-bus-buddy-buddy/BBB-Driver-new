// src/services/operationPlanService.js
import { operationPlanAPI, formatDateForAPI } from '../api/operationPlan';

/**
 * 운행 계획 관리 서비스 (운전자 전용)
 */
class OperationPlanService {
  constructor() {
    this.cachedSchedules = null;
    this.cacheTimestamp = null;
    this.CACHE_DURATION = 5 * 60 * 1000; // 5분
  }

  /**
   * 캐시 유효성 검사
   */
  isCacheValid() {
    if (!this.cachedSchedules || !this.cacheTimestamp) {
      return false;
    }
    const now = Date.now();
    return (now - this.cacheTimestamp) < this.CACHE_DURATION;
  }

  /**
   * 캐시 초기화
   */
  clearCache() {
    this.cachedSchedules = null;
    this.cacheTimestamp = null;
  }

  /**
   * 운전자 오늘 운행 일정 조회
   */
  async getDriverTodaySchedules(forceRefresh = false) {
    try {
      if (!forceRefresh && this.isCacheValid()) {
        const today = formatDateForAPI(new Date());
        const todaySchedules = this.cachedSchedules.filter(schedule =>
          schedule.operationDate === today
        );
        if (todaySchedules.length > 0) {
          console.log('[OperationPlanService] 캐시에서 오늘 일정 반환');
          return todaySchedules;
        }
      }

      console.log('[OperationPlanService] API에서 오늘 운행 일정 조회');
      const response = await operationPlanAPI.getDriverTodaySchedules();

      console.log('[OperationPlanService] API 원본 응답:', response);

      if (response.data && response.data.data !== undefined) {
        // ApiResponse 구조: { data: [...], message: "..." }
        const schedules = response.data.data;

        console.log('[OperationPlanService] 파싱된 일정 수:', schedules.length);
        console.log('[OperationPlanService] 첫 번째 일정:', schedules[0]);

        // 캐시 업데이트
        this.cachedSchedules = schedules;
        this.cacheTimestamp = Date.now();

        return schedules;
      } else {
        console.error('[OperationPlanService] 오늘 운행 일정 조회 실패:', response);
        return [];
      }
    } catch (error) {
      console.error('[OperationPlanService] 오늘 운행 일정 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 운전자 특정 날짜 운행 일정 조회
   */
  async getDriverSchedulesByDate(date) {
    try {
      const formattedDate = formatDateForAPI(date);
      console.log(`[OperationPlanService] ${formattedDate} 운행 일정 조회`);

      const response = await operationPlanAPI.getDriverSchedulesByDate(formattedDate);

      if (response.data) {
        const schedules = response.data.data || response.data || [];
        console.log(`[OperationPlanService] ${formattedDate} 일정:`, schedules);
        return schedules;
      } else {
        console.error('[OperationPlanService] 운행 일정 조회 실패: 응답 없음');
        return [];
      }
    } catch (error) {
      console.error('[OperationPlanService] 운행 일정 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 운전자 월간 운행 일정 조회
   */
  async getDriverMonthlySchedules(year, month) {
    try {
      console.log(`[OperationPlanService] ${year}년 ${month}월 운행 일정 조회`);

      const response = await operationPlanAPI.getDriverMonthlySchedules(year, month);

      if (response.data) {
        const schedules = response.data.data || response.data || [];
        console.log(`[OperationPlanService] 월간 일정 개수:`, schedules.length);
        return schedules;
      } else {
        console.error('[OperationPlanService] 월간 운행 일정 조회 실패: 응답 없음');
        return [];
      }
    } catch (error) {
      console.error('[OperationPlanService] 월간 운행 일정 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 운전자 현재 월 운행 일정 조회
   */
  async getDriverCurrentMonthSchedules() {
    try {
      console.log('[OperationPlanService] 현재 월 운행 일정 조회');

      const response = await operationPlanAPI.getDriverCurrentMonthSchedules();

      if (response.data) {
        const schedules = response.data.data || response.data || [];
        console.log('[OperationPlanService] 현재 월 일정 개수:', schedules.length);
        return schedules;
      } else {
        console.error('[OperationPlanService] 현재 월 운행 일정 조회 실패: 응답 없음');
        return [];
      }
    } catch (error) {
      console.error('[OperationPlanService] 현재 월 운행 일정 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 운행 일정 상세 조회
   */
  async getScheduleDetail(scheduleId) {
    try {
      console.log(`[OperationPlanService] 운행 일정 상세 조회 - ID: ${scheduleId}`);

      const response = await operationPlanAPI.getScheduleDetail(scheduleId);

      if (response.data) {
        const detail = response.data.data || response.data || null;
        console.log('[OperationPlanService] 일정 상세:', detail);
        return detail;
      } else {
        console.error('[OperationPlanService] 운행 일정 상세 조회 실패: 응답 없음');
        return null;
      }
    } catch (error) {
      console.error('[OperationPlanService] 운행 일정 상세 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 운행 일정 데이터 포맷팅
   * 백엔드 응답을 프론트엔드 형식으로 변환
   */
  formatScheduleData(schedule) {
    return {
      id: schedule.id || schedule.operationId,
      operationId: schedule.operationId,
      busId: schedule.busId,
      busNumber: schedule.busNumber || schedule.busRealNumber,
      busRealNumber: schedule.busRealNumber,
      driverId: schedule.driverId,
      driverName: schedule.driverName,
      route: schedule.routeName || '미지정',
      routeId: schedule.routeId,
      // 날짜와 시간 처리
      departureTime: this.formatDateTime(schedule.operationDate, schedule.startTime),
      arrivalTime: this.formatDateTime(schedule.operationDate, schedule.endTime),
      operationDate: schedule.operationDate,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      status: schedule.status || 'SCHEDULED',
      isRecurring: schedule.isRecurring || false,
      recurringWeeks: schedule.recurringWeeks || 0,
      parentOperationId: schedule.parentOperationId,
      organizationId: schedule.organizationId,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt
    };
  }

  /**
   * 날짜와 시간을 한국어 형식으로 변환
   */
  formatDateTime(date, time) {
    if (!date || !time) return '';

    const [year, month, day] = date.split('-');
    const [hour, minute] = time.split(':');

    return `${year}년 ${parseInt(month)}월 ${parseInt(day)}일 ${hour}:${minute}`;
  }

  /**
   * 운행 일정 목록 포맷팅
   */
  formatScheduleList(schedules) {
    if (!Array.isArray(schedules)) {
      return [];
    }

    return schedules.map(schedule => this.formatScheduleData(schedule));
  }

  /**
   * 오늘 날짜인지 확인
   */
  isToday(dateString) {
    const today = new Date();
    const [year, month, day] = dateString.split('-').map(Number);

    return today.getFullYear() === year &&
      today.getMonth() + 1 === month &&
      today.getDate() === day;
  }

  /**
   * 운행 시간이 임박했는지 확인 (1시간 이내)
   */
  isUpcoming(operationDate, startTime) {
    const now = new Date();
    const [year, month, day] = operationDate.split('-').map(Number);
    const [hour, minute] = startTime.split(':').map(Number);

    const scheduleTime = new Date(year, month - 1, day, hour, minute);
    const timeDiff = scheduleTime - now;

    return timeDiff > 0 && timeDiff <= 60 * 60 * 1000; // 1시간 이내
  }

  /**
   * 캘린더용 마킹 데이터 생성
   */
  createCalendarMarkedDates(schedules) {
    const marked = {};

    schedules.forEach(schedule => {
      const dateStr = schedule.operationDate;

      if (!marked[dateStr]) {
        marked[dateStr] = {
          marked: true,
          dotColor: '#0064FF',
          dots: []
        };
      }

      marked[dateStr].dots.push({
        key: schedule.id || schedule.operationId,
        color: '#0064FF'
      });
    });

    return marked;
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
export default new OperationPlanService();