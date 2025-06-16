// src/utils/locationHelpers.js

/**
 * 두 지점 간의 거리 계산 (Haversine 공식)
 * @param {number} lat1 - 첫 번째 지점의 위도
 * @param {number} lon1 - 첫 번째 지점의 경도
 * @param {number} lat2 - 두 번째 지점의 위도
 * @param {number} lon2 - 두 번째 지점의 경도
 * @returns {number} 거리 (미터 단위)
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // 지구 반지름 (미터)
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };
  
  /**
   * 도(degree)를 라디안으로 변환
   * @param {number} deg - 각도
   * @returns {number} 라디안 값
   */
  const toRad = (deg) => deg * (Math.PI/180);
  
  /**
   * 거리를 사람이 읽기 쉬운 형태로 포맷팅
   * @param {number} meters - 미터 단위 거리
   * @returns {string} 포맷된 거리 문자열
   */
  export const formatDistance = (meters) => {
    if (meters < 0) {
      return '알 수 없음';
    }
    
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else if (meters < 10000) {
      return `${(meters / 1000).toFixed(1)}km`;
    } else {
      return `${Math.round(meters / 1000)}km`;
    }
  };
  
  /**
   * 위치가 목표 지점 근처인지 확인
   * @param {Object} currentLocation - 현재 위치 {latitude, longitude}
   * @param {Object} targetLocation - 목표 위치 {latitude, longitude}
   * @param {number} threshold - 허용 거리 (미터), 기본값 100m
   * @returns {boolean} 근처 여부
   */
  export const isNearLocation = (currentLocation, targetLocation, threshold = 100) => {
    if (!currentLocation || !targetLocation) {
      return false;
    }
    
    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      targetLocation.latitude,
      targetLocation.longitude
    );
    
    return distance <= threshold;
  };
  
  /**
   * 남은 시간 계산 (거리와 속도 기반)
   * @param {number} distance - 거리 (미터)
   * @param {number} speed - 속도 (m/s), 기본값은 30km/h
   * @returns {string} 예상 도착 시간
   */
  export const estimateArrivalTime = (distance, speed = 8.33) => {
    if (distance <= 0 || speed <= 0) {
      return '도착';
    }
    
    const seconds = distance / speed;
    const minutes = Math.ceil(seconds / 60);
    
    if (minutes < 1) {
      return '곧 도착';
    } else if (minutes < 60) {
      return `약 ${minutes}분`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes > 0) {
        return `약 ${hours}시간 ${remainingMinutes}분`;
      } else {
        return `약 ${hours}시간`;
      }
    }
  };
  
  /**
   * GPS 좌표 유효성 검사
   * @param {number} latitude - 위도
   * @param {number} longitude - 경도
   * @returns {boolean} 유효성 여부
   */
  export const isValidCoordinate = (latitude, longitude) => {
    return (
      latitude !== null && 
      longitude !== null &&
      latitude >= -90 && 
      latitude <= 90 &&
      longitude >= -180 && 
      longitude <= 180
    );
  };
  
  /**
   * 위치 정보 객체 생성
   * @param {number} latitude - 위도
   * @param {number} longitude - 경도
   * @param {number} timestamp - 타임스탬프 (선택)
   * @returns {Object} 위치 정보 객체
   */
  export const createLocationObject = (latitude, longitude, timestamp = Date.now()) => {
    return {
      latitude,
      longitude,
      timestamp
    };
  };
  
  /**
   * 경로상의 가장 가까운 정류장 찾기
   * @param {Object} currentLocation - 현재 위치 {latitude, longitude}
   * @param {Array} stations - 정류장 목록 [{id, name, location: {latitude, longitude}}]
   * @returns {Object|null} 가장 가까운 정류장 정보
   */
  export const findNearestStation = (currentLocation, stations) => {
    if (!currentLocation || !stations || stations.length === 0) {
      return null;
    }
    
    let nearestStation = null;
    let minDistance = Infinity;
    
    stations.forEach(station => {
      if (station.location && isValidCoordinate(station.location.latitude, station.location.longitude)) {
        const distance = calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          station.location.latitude,
          station.location.longitude
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          nearestStation = {
            ...station,
            distance
          };
        }
      }
    });
    
    return nearestStation;
  };
  
  /**
   * 버스 운행 관련 상수
   */
  export const LOCATION_CONSTANTS = {
    // 정류장 도착 인식 반경 (미터)
    STATION_ARRIVAL_RADIUS: 50,
    
    // 출발지/도착지 근처 인식 반경 (미터)
    START_END_ARRIVAL_RADIUS: 100,
    
    // 위치 업데이트 주기 (밀리초)
    LOCATION_UPDATE_INTERVAL: 5000,
    
    // 위치 정확도 임계값 (미터)
    ACCURACY_THRESHOLD: 50,
    
    // 기본 버스 속도 (m/s, 약 30km/h)
    DEFAULT_BUS_SPEED: 8.33
  };
  
  /**
   * 위치 관련 메시지
   */
  export const LOCATION_MESSAGES = {
    NEAR_START: '출발지에 도착했습니다.',
    FAR_FROM_START: '출발지로 이동해주세요.',
    NEAR_DESTINATION: '목적지에 접근 중입니다.',
    ARRIVED_DESTINATION: '목적지에 도착했습니다.',
    LOCATION_PERMISSION_DENIED: '위치 권한이 필요합니다.',
    LOCATION_ERROR: '위치를 확인할 수 없습니다.',
    GPS_DISABLED: 'GPS를 켜주세요.'
  };