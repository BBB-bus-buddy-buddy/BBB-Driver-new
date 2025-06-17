// src/utils/locationSwapHelper.js

/**
 * 백엔드에서 위도와 경도가 반대로 오는 이슈를 해결하기 위한 헬퍼 함수
 * 
 * @description
 * 백엔드에서 latitude와 longitude가 서로 바뀌어서 전송되는 문제를 
 * 프론트엔드에서 임시로 해결하기 위한 유틸리티
 */

/**
 * 단일 위치 객체의 위도와 경도를 바꿔줍니다
 * @param {Object} location - 위치 객체
 * @returns {Object|null} 위도와 경도가 바뀐 위치 객체
 */
export const swapLocationCoordinates = (location) => {
    if (!location) return null;
    
    // location 객체가 없거나 위도/경도가 없으면 그대로 반환
    if (!location.latitude && !location.longitude) {
      return location;
    }
  
    console.log('[LocationSwap] 좌표 변환 전:', {
      latitude: location.latitude,
      longitude: location.longitude,
      name: location.name
    });
  
    // 위도와 경도를 바꿔서 새 객체 생성
    const swappedLocation = {
      ...location,
      latitude: location.longitude,  // longitude를 latitude로
      longitude: location.latitude   // latitude를 longitude로
    };
  
    console.log('[LocationSwap] 좌표 변환 후:', {
      latitude: swappedLocation.latitude,
      longitude: swappedLocation.longitude,
      name: swappedLocation.name
    });
  
    return swappedLocation;
  };
  
  /**
   * API로 전송하기 위해 위치 좌표를 다시 바꿔줍니다
   * @param {Object} location - 프론트엔드에서 사용 중인 위치 객체
   * @returns {Object|null} 백엔드 형식으로 변환된 위치 객체
   */
  export const swapLocationForBackend = (location) => {
    if (!location) return null;
    
    // location 객체가 없거나 위도/경도가 없으면 그대로 반환
    if (!location.latitude && !location.longitude) {
      return location;
    }
  
    console.log('[LocationSwap] 백엔드 전송용 좌표 변환 전:', {
      latitude: location.latitude,
      longitude: location.longitude
    });
  
    // 백엔드가 기대하는 형식으로 다시 swap
    const backendLocation = {
      ...location,
      latitude: location.longitude,  // 프론트의 longitude를 백엔드의 latitude로
      longitude: location.latitude   // 프론트의 latitude를 백엔드의 longitude로
    };
  
    console.log('[LocationSwap] 백엔드 전송용 좌표 변환 후:', {
      latitude: backendLocation.latitude,
      longitude: backendLocation.longitude
    });
  
    return backendLocation;
  };
  
  /**
   * 운행 일정 데이터의 모든 위치 정보를 변환합니다
   * @param {Object} schedule - 운행 일정 객체
   * @returns {Object} 위치 정보가 변환된 운행 일정
   */
  export const swapScheduleLocations = (schedule) => {
    if (!schedule) return schedule;
  
    const swappedSchedule = { ...schedule };
  
    // startLocation 변환
    if (schedule.startLocation) {
      swappedSchedule.startLocation = swapLocationCoordinates(schedule.startLocation);
    }
  
    // endLocation 변환
    if (schedule.endLocation) {
      swappedSchedule.endLocation = swapLocationCoordinates(schedule.endLocation);
    }
  
    // stations 배열이 있다면 각 정류장의 위치도 변환
    if (schedule.stations && Array.isArray(schedule.stations)) {
      swappedSchedule.stations = schedule.stations.map(station => ({
        ...station,
        location: swapLocationCoordinates(station.location)
      }));
    }
  
    return swappedSchedule;
  };
  
  /**
   * 운행 일정 배열의 모든 위치 정보를 변환합니다
   * @param {Array} schedules - 운행 일정 배열
   * @returns {Array} 위치 정보가 변환된 운행 일정 배열
   */
  export const swapScheduleListLocations = (schedules) => {
    if (!Array.isArray(schedules)) return schedules;
    
    return schedules.map(schedule => swapScheduleLocations(schedule));
  };
  
  /**
   * API 응답의 위치 정보를 변환합니다
   * @param {Object} response - API 응답 객체
   * @returns {Object} 위치 정보가 변환된 응답 객체
   */
  export const swapApiResponseLocations = (response) => {
    if (!response) return response;
  
    // 단일 운행 일정인 경우
    if (response.startLocation || response.endLocation) {
      return swapScheduleLocations(response);
    }
  
    // 운행 일정 배열인 경우
    if (Array.isArray(response)) {
      return swapScheduleListLocations(response);
    }
  
    // data 속성 안에 운행 일정이 있는 경우
    if (response.data) {
      if (Array.isArray(response.data)) {
        return {
          ...response,
          data: swapScheduleListLocations(response.data)
        };
      } else if (response.data.startLocation || response.data.endLocation) {
        return {
          ...response,
          data: swapScheduleLocations(response.data)
        };
      }
    }
  
    return response;
  };
  
  /**
   * 디버깅용: 현재 위치와 목표 위치의 좌표를 출력합니다
   * @param {Object} currentLocation - 현재 위치
   * @param {Object} targetLocation - 목표 위치
   * @param {string} label - 디버깅 라벨
   */
  export const debugLocationSwap = (currentLocation, targetLocation, label = '') => {
    console.log(`[LocationSwap Debug] ${label}`);
    console.log('현재 위치:', {
      latitude: currentLocation?.latitude,
      longitude: currentLocation?.longitude
    });
    console.log('목표 위치 (원본):', {
      latitude: targetLocation?.latitude,
      longitude: targetLocation?.longitude,
      name: targetLocation?.name
    });
    console.log('목표 위치 (변환):', {
      latitude: targetLocation?.longitude,  // 의도적으로 바꿈
      longitude: targetLocation?.latitude,  // 의도적으로 바꿈
      name: targetLocation?.name
    });
  };