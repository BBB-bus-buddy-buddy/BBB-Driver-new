// src/api/schedules.js
import apiClient from './client';

export const scheduleAPI = {
  /**GET
   * 전체 운행 일정 조회
   */
  getSchedules: () => {
    return apiClient.get('/api/schedules');
  },

  /**POST
   * 특정 날짜의 운행 일정 조회
   * @param {string} date 조회할 날짜 (YYYY-MM-DD)
   */
  getSchedulesByDate: (date) => {
    return apiClient.get(`/api/schedules/date/${date}`);
  },

  /**
   * 이번 주 운행 일정 조회
   */
  getWeeklySchedule: () => {
    return apiClient.get('/api/schedules/weekly');
  },

  /**
   * 이번 달 운행 일정 조회
   */
  getMonthlySchedule: () => {
    return apiClient.get('/api/schedules/monthly');
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
  }
};