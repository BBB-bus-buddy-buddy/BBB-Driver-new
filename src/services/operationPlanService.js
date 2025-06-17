// src/services/operationPlanService.js
import { operationPlanAPI, formatDateForAPI } from '../api/operationPlan';
import { formatKSTDate, isKSTToday, getMinutesFromNowKST } from '../utils/kstTimeUtils';

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
        const today = formatKSTDate(new Date());
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

      if (response.data && response.data.data !== undefined) {
        const schedules = response.data.data;
        console.log('[OperationPlanService] 오늘 일정 개수:', schedules.length);

        // 캐시 업데이트
        this.cachedSchedules = schedules;
        this.cacheTimestamp = Date.now();

        return schedules;
      } else {
        console.error('[OperationPlanService] 오늘 운행 일정 조회 실패');
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
        const schedules = response.data.data || [];
        console.log(`[OperationPlanService] ${formattedDate} 일정 개수:`, schedules.length);
        return schedules;
      } else {
        console.error('[OperationPlanService] 운행 일정 조회 실패');
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
        const schedules = response.data.data || [];
        console.log(`[OperationPlanService] 월간 일정 개수:`, schedules.length);
        return schedules;
      } else {
        console.error('[OperationPlanService] 월간 운행 일정 조회 실패');
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
        const schedules = response.data.data || [];
        console.log('[OperationPlanService] 현재 월 일정 개수:', schedules.length);
        return schedules;
      } else {
        console.error('[OperationPlanService] 현재 월 운행 일정 조회 실패');
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
        const detail = response.data.data || null;
        console.log('[OperationPlanService] 일정 상세:', detail);
        return detail;
      } else {
        console.error('[OperationPlanService] 운행 일정 상세 조회 실패');
        return null;
      }
    } catch (error) {
      console.error('[OperationPlanService] 운행 일정 상세 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 운행 일정 데이터 포맷팅
   * 백엔드 DTO를 프론트엔드 형식으로 변환
   */
  formatScheduleData(schedule) {
    if (!schedule) {
      console.warn('[OperationPlanService] formatScheduleData: schedule is null or undefined');
      return null;
    }

    console.log('[OperationPlanService] 원본 schedule 데이터:', {
      id: schedule.id,
      operationId: schedule.operationId,
      startLocation: schedule.startLocation,
      endLocation: schedule.endLocation
    });

    // 날짜 유효성 검증
    const operationDate = schedule.operationDate || null;
    const startTime = schedule.startTime || null;
    const endTime = schedule.endTime || null;

    // 날짜가 유효하지 않은 경우 처리
    if (!operationDate) {
      console.warn('[OperationPlanService] operationDate is missing');
    }

    // busNumber 처리 - busNumber가 없으면 busRealNumber 사용, 둘 다 없으면 busId 기반으로 생성
    let busNumber = schedule.busNumber;
    if (!busNumber) {
      if (schedule.busRealNumber) {
        busNumber = schedule.busRealNumber;
      } else if (schedule.busId) {
        busNumber = `BUS-${schedule.busId.substring(0, 8)}`;
        console.warn(`[OperationPlanService] busNumber missing, using busId: ${busNumber}`);
      } else {
        busNumber = 'BUS-UNKNOWN';
        console.error('[OperationPlanService] No bus identifier found');
      }
    }

    return {
      id: schedule.id || schedule.operationId,
      operationId: schedule.operationId || schedule.id,
      busId: schedule.busId,
      busNumber: busNumber,
      busRealNumber: schedule.busRealNumber || busNumber,
      driverId: schedule.driverId,
      driverName: schedule.driverName || '미배정',
      route: schedule.routeName || '미지정',
      routeId: schedule.routeId,
      routeName: schedule.routeName || '미지정',
      // 날짜와 시간 처리 - null safe
      departureTime: operationDate && startTime ? 
        this.formatDateTime(operationDate, startTime) : 
        '시간 정보 없음',
      arrivalTime: operationDate && endTime ? 
        this.formatDateTime(operationDate, endTime) : 
        '시간 정보 없음',
      operationDate: operationDate || this.getCurrentDateString(),
      startTime: startTime || '시간 미정',
      endTime: endTime || '시간 미정',
      status: schedule.status || 'SCHEDULED',
      isRecurring: schedule.isRecurring || false,
      recurringWeeks: schedule.recurringWeeks || 0,
      organizationId: schedule.organizationId,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
      // 위치 정보 추가 - 백엔드 LocationInfo 형식 그대로 전달
      startLocation: schedule.startLocation || null,
      endLocation: schedule.endLocation || null
    };
  }

  /**
   * 현재 날짜를 YYYY-MM-DD 형식으로 반환 (KST)
   */
  getCurrentDateString() {
    return formatKSTDate(new Date());
  }

  /**
   * 날짜와 시간을 한국어 형식으로 변환
   */
  formatDateTime(date, time) {
    if (!date || !time) {
      return time || '시간 정보 없음';
    }

    try {
      const dateParts = date.split('-');
      if (dateParts.length !== 3) {
        console.error('[OperationPlanService] Invalid date format:', date);
        return time;
      }

      const [year, month, day] = dateParts;
      const timeParts = time.split(':');
      
      if (timeParts.length < 2) {
        console.error('[OperationPlanService] Invalid time format:', time);
        return time;
      }

      const [hour, minute] = timeParts;

      // 유효성 검증
      if (!year || !month || !day || !hour || !minute) {
        return time || '시간 정보 없음';
      }

      return `${year}년 ${parseInt(month)}월 ${parseInt(day)}일 ${hour}:${minute}`;
    } catch (error) {
      console.error('[OperationPlanService] formatDateTime error:', error);
      return time || '시간 정보 없음';
    }
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
   * 오늘 날짜인지 확인 (KST)
   */
  isToday(dateString) {
    return isKSTToday(dateString);
  }

  /**
   * 운행 시간이 임박했는지 확인 (1시간 이내)
   */
  isUpcoming(operationDate, startTime) {
    const minutesFromNow = getMinutesFromNowKST(operationDate, startTime);
    return minutesFromNow > 0 && minutesFromNow <= 60; // 1시간 이내
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