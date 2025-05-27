// src/services/scheduleService.js
import apiClient from '../api/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 운행 일정 목록 조회
 * @returns {Promise<Array>} 운행 일정 목록
 */
export const getDriveSchedules = async () => {
  try {
    const response = await apiClient.get('/api/routes');
    
    if (response.data?.data) {
      // 캐시 저장
      await AsyncStorage.setItem('driveSchedules', JSON.stringify(response.data.data));
      return response.data.data;
    }
    
    // API 응답이 없으면 캐시된 데이터 반환
    const cached = await AsyncStorage.getItem('driveSchedules');
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('[ScheduleService] 운행 일정 조회 오류:', error);
    
    // 오류 시 캐시된 데이터 반환
    try {
      const cached = await AsyncStorage.getItem('driveSchedules');
      return cached ? JSON.parse(cached) : [];
    } catch (cacheError) {
      return [];
    }
  }
};

/**
 * 특정 날짜의 운행 일정 조회
 * @param {string} date - 조회할 날짜 (YYYY-MM-DD)
 * @returns {Promise<Array>} 해당 날짜의 운행 일정
 */
export const getSchedulesByDate = async (date) => {
  try {
    const response = await apiClient.get(`/api/routes/date/${date}`);
    return response.data?.data || [];
  } catch (error) {
    console.error('[ScheduleService] 날짜별 일정 조회 오류:', error);
    
    // 오류 시 전체 일정에서 필터링
    const allSchedules = await getDriveSchedules();
    return allSchedules.filter(schedule => {
      const dateMatch = schedule.departureTime.match(/(\d+)년 (\d+)월 (\d+)일/);
      if (dateMatch) {
        const year = dateMatch[1];
        const month = dateMatch[2].padStart(2, '0');
        const day = dateMatch[3].padStart(2, '0');
        const scheduleDate = `${year}-${month}-${day}`;
        return scheduleDate === date;
      }
      return false;
    });
  }
};

/**
 * 이번 주 운행 일정 조회
 * @returns {Promise<Array>} 이번 주 운행 일정
 */
export const getWeeklySchedule = async () => {
  try {
    const response = await apiClient.get('/api/routes/weekly');
    return response.data?.data || [];
  } catch (error) {
    console.error('[ScheduleService] 주간 일정 조회 오류:', error);
    return [];
  }
};

/**
 * 이번 달 운행 일정 조회
 * @returns {Promise<Array>} 이번 달 운행 일정
 */
export const getMonthlySchedule = async () => {
  try {
    const response = await apiClient.get('/api/routes/monthly');
    return response.data?.data || [];
  } catch (error) {
    console.error('[ScheduleService] 월간 일정 조회 오류:', error);
    return [];
  }
};

/**
 * 특정 운행 일정 상세 조회
 * @param {string} scheduleId - 일정 ID
 * @returns {Promise<Object>} 운행 일정 상세 정보
 */
export const getScheduleDetail = async (scheduleId) => {
  try {
    const response = await apiClient.get(`/api/routes/${scheduleId}`);
    return response.data?.data || null;
  } catch (error) {
    console.error('[ScheduleService] 일정 상세 조회 오류:', error);
    return null;
  }
};

/**
 * 운행 일정 변경 요청
 * @param {string} scheduleId - 일정 ID
 * @param {string} reason - 변경 사유
 * @returns {Promise<Object>} 변경 요청 결과
 */
export const requestScheduleChange = async (scheduleId, reason) => {
  try {
    const response = await apiClient.post(`/api/routes/${scheduleId}/change-request`, {
      reason
    });
    return {
      success: true,
      message: response.data?.message || '변경 요청이 전송되었습니다.'
    };
  } catch (error) {
    console.error('[ScheduleService] 일정 변경 요청 오류:', error);
    return {
      success: false,
      message: error.response?.data?.message || '변경 요청 중 오류가 발생했습니다.'
    };
  }
};

/**
 * 캘린더용 마킹 데이터 생성
 * @param {Array} schedules - 운행 일정 목록
 * @returns {Object} 캘린더 마킹 데이터
 */
export const createCalendarMarkedDates = (schedules) => {
  const marked = {};
  
  schedules.forEach(schedule => {
    const dateMatch = schedule.departureTime.match(/(\d+)년 (\d+)월 (\d+)일/);
    if (dateMatch) {
      const year = dateMatch[1];
      const month = dateMatch[2].padStart(2, '0');
      const day = dateMatch[3].padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      if (!marked[dateStr]) {
        marked[dateStr] = { marked: true, dots: [] };
      }
      
      marked[dateStr].dots.push({
        key: schedule.id,
        color: '#0064FF'
      });
    }
  });
  
  return marked;
};