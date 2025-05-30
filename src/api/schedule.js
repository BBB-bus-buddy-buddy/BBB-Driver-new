// src/api/schedule.js
import apiClient from './client';

export const scheduleAPI = {
  /**
   * 전체 운행 일정 조회
   * @param {Object} params 조회 파라미터
   */
  getSchedules: (params = {}) => {
    return apiClient.get('/api/schedules', { params });
  },

  /**
   * 특정 날짜의 운행 일정 조회
   * @param {string} date 조회할 날짜 (YYYY-MM-DD)
   */
  getSchedulesByDate: (date) => {
    return apiClient.get(`/api/schedules/date/${date}`);
  },

  /**
   * 주간 운행 일정 조회
   * @param {number} weekOffset 주 오프셋
   */
  getWeeklySchedule: (weekOffset = 0) => {
    return apiClient.get('/api/schedules/weekly', { 
      params: { weekOffset } 
    });
  },

  /**
   * 월간 운행 일정 조회
   * @param {number} year 연도
   * @param {number} month 월
   */
  getMonthlySchedule: (year, month) => {
    const params = {};
    if (year) params.year = year;
    if (month) params.month = month;
    
    return apiClient.get('/api/schedules/monthly', { params });
  },

  /**
   * 특정 운행 일정 상세 조회
   * @param {string} scheduleId 일정 ID
   */
  getScheduleDetail: (scheduleId) => {
    return apiClient.get(`/api/schedules/${scheduleId}`);
  },

  /**
   * 운행 일정 변경 요청
   * @param {string} scheduleId 일정 ID
   * @param {Object} data 변경 요청 데이터
   */
  requestScheduleChange: (scheduleId, data) => {
    return apiClient.post(`/api/schedules/${scheduleId}/change-request`, data);
  },

  /**
   * 오늘의 운행 일정 조회
   */
  getTodaySchedules: () => {
    return apiClient.get('/api/schedules/today');
  },

  /**
   * 운전자별 운행 일정 조회
   * @param {string} driverId 운전자 ID
   * @param {Object} params 조회 파라미터
   */
  getDriverSchedules: (driverId, params = {}) => {
    return apiClient.get(`/api/schedules/driver/${driverId}`, { params });
  }
};