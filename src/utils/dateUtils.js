// src/utils/dateUtils.js

/**
 * 날짜 형식을 yyyy년 MM월 dd일 HH:mm 형태로 변환
 * @param {Date|string} date - 날짜 객체 또는 ISO 문자열
 * @returns {string} 형식화된 날짜 문자열
 */
export const formatDateTime = (date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
  };
  
  /**
   * 날짜 형식을 yyyy-MM-dd 형태로 변환
   * @param {Date|string} date - 날짜 객체 또는 ISO 문자열
   * @returns {string} 형식화된 날짜 문자열
   */
  export const formatDate = (date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };
  
  /**
   * 시간 형식을 HH:mm 형태로 변환
   * @param {Date|string} date - 날짜 객체 또는 ISO 문자열
   * @returns {string} 형식화된 시간 문자열
   */
  export const formatTime = (date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${hours}:${minutes}`;
  };
  
  /**
   * 두 날짜 사이의 차이를 계산하여 HH:mm:ss 형태로 반환
   * @param {Date|string} startDate - 시작 날짜
   * @param {Date|string} endDate - 종료 날짜
   * @returns {string} 형식화된 경과 시간
   */
  export const getTimeDifference = (startDate, endDate) => {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    
    const diffInMs = end.getTime() - start.getTime();
    
    const hours = Math.floor(diffInMs / (1000 * 60 * 60)).toString().padStart(2, '0');
    const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
    const seconds = Math.floor((diffInMs % (1000 * 60)) / 1000).toString().padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
  };
  
  /**
   * 현재 날짜와 주어진 날짜 사이의 차이를 계산하여 활성화 여부 반환
   * 현재 시간이 주어진 시간의 30분 이내이면 활성화
   * @param {string} dateTimeStr - yyyy년 MM월 dd일 HH:mm 형태의 날짜 문자열
   * @returns {boolean} 활성화 여부
   */
  export const isTimeNearby = (dateTimeStr) => {
    // 날짜 문자열 파싱
    const parts = dateTimeStr.match(/(\d+)년 (\d+)월 (\d+)일 (\d+):(\d+)/);
    if (!parts) return false;
    
    const year = parseInt(parts[1], 10);
    const month = parseInt(parts[2], 10) - 1; // JavaScript 월은 0부터 시작
    const day = parseInt(parts[3], 10);
    const hours = parseInt(parts[4], 10);
    const minutes = parseInt(parts[5], 10);
    
    const targetDate = new Date(year, month, day, hours, minutes);
    const now = new Date();
    
    // 시간 차이를 분 단위로 계산
    const diffInMinutes = (targetDate.getTime() - now.getTime()) / (1000 * 60);
    
    // 시간 차이가 30분 이내면 활성화
    return diffInMinutes >= 0 && diffInMinutes <= 30;
  };