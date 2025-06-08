// src/utils/driveTimeUtils.js

/**
 * 운행 준비 가능 시간인지 확인
 * 현재 시간이 운행 시작 시간의 60분(1시간) 이내이면 true 반환
 * @param {string} departureTimeStr - yyyy년 MM월 dd일 HH:mm 형태의 출발 시간 문자열
 * @returns {boolean} 운행 준비 가능 여부
 */
export const isDrivePreparationTime = (departureTimeStr) => {
    // 날짜 문자열 파싱
    const parts = departureTimeStr.match(/(\d+)년 (\d+)월 (\d+)일 (\d+):(\d+)/);
    if (!parts) return false;
    
    const year = parseInt(parts[1], 10);
    const month = parseInt(parts[2], 10) - 1; // JavaScript 월은 0부터 시작
    const day = parseInt(parts[3], 10);
    const hours = parseInt(parts[4], 10);
    const minutes = parseInt(parts[5], 10);
    
    const departureTime = new Date(year, month, day, hours, minutes);
    const now = new Date();
    
    // 시간 차이를 분 단위로 계산
    const diffInMinutes = (departureTime.getTime() - now.getTime()) / (1000 * 60);
    
    // 운행 시작 60분(1시간) 전부터 준비 가능
    return diffInMinutes >= 0 && diffInMinutes <= 60;
  };
  
  /**
   * 운행 시작 시간이 되었는지 확인
   * @param {string} departureTimeStr - yyyy년 MM월 dd일 HH:mm 형태의 출발 시간 문자열
   * @returns {boolean} 운행 시작 시간 도달 여부
   */
  export const isDriveStartTimeReached = (departureTimeStr) => {
    const parts = departureTimeStr.match(/(\d+)년 (\d+)월 (\d+)일 (\d+):(\d+)/);
    if (!parts) return false;
    
    const year = parseInt(parts[1], 10);
    const month = parseInt(parts[2], 10) - 1;
    const day = parseInt(parts[3], 10);
    const hours = parseInt(parts[4], 10);
    const minutes = parseInt(parts[5], 10);
    
    const departureTime = new Date(year, month, day, hours, minutes);
    const now = new Date();
    
    return now >= departureTime;
  };
  
  /**
   * 운행 시작까지 남은 시간 계산
   * @param {string} departureTimeStr - yyyy년 MM월 dd일 HH:mm 형태의 출발 시간 문자열
   * @returns {Object} { hours: number, minutes: number, isOverdue: boolean }
   */
  export const getTimeUntilDeparture = (departureTimeStr) => {
    const parts = departureTimeStr.match(/(\d+)년 (\d+)월 (\d+)일 (\d+):(\d+)/);
    if (!parts) return { hours: 0, minutes: 0, isOverdue: true };
    
    const year = parseInt(parts[1], 10);
    const month = parseInt(parts[2], 10) - 1;
    const day = parseInt(parts[3], 10);
    const hours = parseInt(parts[4], 10);
    const minutes = parseInt(parts[5], 10);
    
    const departureTime = new Date(year, month, day, hours, minutes);
    const now = new Date();
    
    const diffInMs = departureTime.getTime() - now.getTime();
    
    if (diffInMs < 0) {
      return { hours: 0, minutes: 0, isOverdue: true };
    }
    
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const remainingHours = Math.floor(diffInMinutes / 60);
    const remainingMinutes = diffInMinutes % 60;
    
    return {
      hours: remainingHours,
      minutes: remainingMinutes,
      isOverdue: false
    };
  };
  
  /**
   * 운행 준비 가능 시간까지 남은 시간 계산
   * @param {string} departureTimeStr - yyyy년 MM월 dd일 HH:mm 형태의 출발 시간 문자열
   * @returns {number} 준비 가능 시간까지 남은 분 (-값이면 이미 준비 가능)
   */
  export const getMinutesUntilPreparation = (departureTimeStr) => {
    const parts = departureTimeStr.match(/(\d+)년 (\d+)월 (\d+)일 (\d+):(\d+)/);
    if (!parts) return Infinity;
    
    const year = parseInt(parts[1], 10);
    const month = parseInt(parts[2], 10) - 1;
    const day = parseInt(parts[3], 10);
    const hours = parseInt(parts[4], 10);
    const minutes = parseInt(parts[5], 10);
    
    const departureTime = new Date(year, month, day, hours, minutes);
    const now = new Date();
    
    // 운행 시작 60분 전 시간 계산
    const preparationTime = new Date(departureTime.getTime() - 60 * 60 * 1000);
    
    const diffInMs = preparationTime.getTime() - now.getTime();
    return Math.floor(diffInMs / (1000 * 60));
  };
  
  /**
   * 운행 상태 텍스트 생성
   * @param {string} departureTimeStr - yyyy년 MM월 dd일 HH:mm 형태의 출발 시간 문자열
   * @returns {string} 상태 텍스트
   */
  export const getDriveStatusText = (departureTimeStr) => {
    const minutesUntilPrep = getMinutesUntilPreparation(departureTimeStr);
    const timeUntilDeparture = getTimeUntilDeparture(departureTimeStr);
    
    if (timeUntilDeparture.isOverdue) {
      return '출발 시간이 지났습니다';
    }
    
    if (minutesUntilPrep > 0) {
      const hours = Math.floor(minutesUntilPrep / 60);
      const mins = minutesUntilPrep % 60;
      
      if (hours > 0) {
        return `${hours}시간 ${mins}분 후 준비 가능`;
      } else {
        return `${mins}분 후 준비 가능`;
      }
    }
    
    if (timeUntilDeparture.hours > 0) {
      return `${timeUntilDeparture.hours}시간 ${timeUntilDeparture.minutes}분 후 출발`;
    } else {
      return `${timeUntilDeparture.minutes}분 후 출발`;
    }
  };