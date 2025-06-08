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