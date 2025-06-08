// src/api/operationPlan.js
import apiClient from './client';

export const operationPlanAPI = {
    /**
     * 운전자 오늘 운행 일정 조회
     * 요청에 운전자의 principal이 자동으로 포함
     * @returns {Promise} API 응답
     */
    getDriverTodaySchedules: () => {
        return apiClient.get('/api/operation-plan/driver/today');
    },

    /**
     * 운전자 특정 날짜 운행 일정 조회
     * 요청에 운전자의 principal이 자동으로 포함
     * @param {string} date 조회할 날짜 (YYYY-MM-DD 형식)
     * @returns {Promise} API 응답
     */
    getDriverSchedulesByDate: (date) => {
        return apiClient.get(`/api/operation-plan/driver/${date}`);
    },

    /**
     * 운전자 월간 운행 일정 조회
     * @param {number} year 연도
     * @param {number} month 월 (1-12)
     * @returns {Promise} API 응답
     */
    getDriverMonthlySchedules: (year, month) => {
        return apiClient.get(`/api/operation-plan/driver/monthly/${year}/${month}`);
    },

    /**
     * 운전자 현재 월 운행 일정 조회
     * @returns {Promise} API 응답
     */
    getDriverCurrentMonthSchedules: () => {
        return apiClient.get('/api/operation-plan/driver/monthly');
    },

    /**
     * 운행 일정 상세 조회
     * @param {string} operationId 운행 일정 ID
     * @returns {Promise} API 응답
     */
    getScheduleDetail: (operationId) => {
        return apiClient.get(`/api/operation-plan/detail/${operationId}`);
    },
};

/**
 * 날짜 포맷 헬퍼 함수
 * @param {Date|string} date 변환할 날짜
 * @returns {string} YYYY-MM-DD 형식의 날짜 문자열
 */
export const formatDateForAPI = (date) => {
    if (!date) return null;

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

/**
 * 시간 포맷 헬퍼 함수
 * @param {string} time HH:mm 형식의 시간
 * @returns {string} HH:mm:ss 형식의 시간
 */
export const formatTimeForAPI = (time) => {
    if (!time) return null;

    // 이미 HH:mm:ss 형식인 경우
    if (time.split(':').length === 3) {
        return time;
    }

    // HH:mm 형식인 경우 :00 추가
    return `${time}:00`;
};

/**
 * 운행 일정 데이터 준비 헬퍼 함수
 * @param {Object} scheduleData 운행 일정 입력 데이터
 * @returns {Object} API 요청용 데이터 객체
 */
export const prepareScheduleData = (scheduleData) => {
    const {
        busId,
        busNumber,
        busRealNumber,
        driverId,
        driverName,
        routeId,
        routeName,
        operationDate,
        startTime,
        endTime,
        isRecurring = false,
        recurringWeeks = 0
    } = scheduleData;

    return {
        busId,
        busNumber,
        busRealNumber,
        driverId,
        driverName,
        routeId,
        routeName,
        operationDate: formatDateForAPI(operationDate),
        startTime: formatTimeForAPI(startTime),
        endTime: formatTimeForAPI(endTime),
        isRecurring,
        recurringWeeks: isRecurring ? recurringWeeks : 0
    };
};