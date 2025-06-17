// src/utils/kstTimeUtils.js

/**
 * UTC 시간을 KST로 변환
 * @param {Date|string} utcDate - UTC 날짜
 * @returns {Date} KST 날짜
 */
export const toKST = (utcDate) => {
    const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
    // UTC에서 KST로 변환 (UTC + 9시간)
    return new Date(date.getTime() + (9 * 60 * 60 * 1000));
  };
  
  /**
   * 현재 시간을 KST로 가져오기
   * @returns {Date} 현재 KST 시간
   */
  export const getNowKST = () => {
    return toKST(new Date());
  };
  
  /**
   * KST 날짜를 yyyy-MM-dd 형식으로 포맷팅
   * @param {Date|string} date - 날짜
   * @returns {string} 포맷된 날짜 문자열
   */
  export const formatKSTDate = (date) => {
    const kstDate = toKST(date);
    const year = kstDate.getUTCFullYear();
    const month = String(kstDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(kstDate.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  /**
   * KST 시간을 HH:mm 형식으로 포맷팅
   * @param {Date|string} date - 날짜
   * @returns {string} 포맷된 시간 문자열
   */
  export const formatKSTTime = (date) => {
    const kstDate = toKST(date);
    const hours = String(kstDate.getUTCHours()).padStart(2, '0');
    const minutes = String(kstDate.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  
  /**
   * KST 날짜와 시간을 yyyy년 MM월 dd일 HH:mm 형식으로 포맷팅
   * @param {Date|string} date - 날짜
   * @returns {string} 포맷된 날짜시간 문자열
   */
  export const formatKSTDateTime = (date) => {
    const kstDate = toKST(date);
    const year = kstDate.getUTCFullYear();
    const month = String(kstDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(kstDate.getUTCDate()).padStart(2, '0');
    const hours = String(kstDate.getUTCHours()).padStart(2, '0');
    const minutes = String(kstDate.getUTCMinutes()).padStart(2, '0');
    return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
  };
  
  /**
   * ISO 문자열을 KST ISO 문자열로 변환
   * @param {string} isoString - ISO 날짜 문자열
   * @returns {string} KST ISO 문자열
   */
  export const toKSTISOString = (isoString) => {
    const date = new Date(isoString);
    const kstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
    return kstDate.toISOString();
  };
  
  /**
   * 로케일 옵션을 사용하여 KST 시간 포맷팅
   * @param {Date|string} date - 날짜
   * @param {Object} options - toLocaleString 옵션
   * @returns {string} 포맷된 문자열
   */
  export const toKSTLocaleString = (date, options = {}) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      ...options
    });
  };
  
  /**
   * 날짜 문자열과 시간 문자열을 합쳐서 KST Date 객체 생성
   * @param {string} dateStr - YYYY-MM-DD 형식의 날짜
   * @param {string} timeStr - HH:mm 형식의 시간
   * @returns {Date} KST Date 객체
   */
  export const createKSTDate = (dateStr, timeStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    // KST 시간을 UTC로 변환 (KST - 9시간)
    const utcDate = new Date(Date.UTC(year, month - 1, day, hours - 9, minutes));
    return utcDate;
  };
  
  /**
   * 운행 시간이 KST 기준 오늘인지 확인
   * @param {string} dateString - YYYY-MM-DD 형식의 날짜
   * @returns {boolean} 오늘 여부
   */
  export const isKSTToday = (dateString) => {
    const today = formatKSTDate(new Date());
    return dateString === today;
  };
  
  /**
   * KST 기준 현재 시간과 비교
   * @param {string} dateStr - YYYY-MM-DD 형식의 날짜
   * @param {string} timeStr - HH:mm 형식의 시간
   * @returns {number} 분 단위 차이 (음수면 과거, 양수면 미래)
   */
  export const getMinutesFromNowKST = (dateStr, timeStr) => {
    const targetDate = createKSTDate(dateStr, timeStr);
    const now = new Date();
    const diffMs = targetDate.getTime() - now.getTime();
    return Math.floor(diffMs / (1000 * 60));
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