// src/services/locationService.js
import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

/**
 * 위치 권한 요청
 * @returns {Promise<boolean>} 권한 허용 여부
 */
export const requestLocationPermission = async () => {
  if (Platform.OS === 'ios') {
    const auth = await Geolocation.requestAuthorization('whenInUse');
    return auth === 'granted';
  }

  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "위치 권한",
          message: "버스 운행을 위해 위치 권한이 필요합니다.",
          buttonNeutral: "나중에 묻기",
          buttonNegative: "취소",
          buttonPositive: "확인"
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  
  return false;
};

/**
 * 현재 위치 가져오기
 * @returns {Promise<Object|null>} 현재 위치 정보
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        resolve({
          latitude,
          longitude,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  });
};

/**
 * 위치 감시 시작
 * @param {Function} callback - 위치 업데이트 시 호출될 콜백 함수
 * @returns {number} 감시 ID
 */
export const startLocationTracking = (callback) => {
  return Geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      callback({
        latitude,
        longitude,
        timestamp: position.timestamp,
      });
    },
    (error) => {
      console.error('Error tracking location:', error);
    },
    { enableHighAccuracy: true, distanceFilter: 10, interval: 5000, fastestInterval: 2000 }
  );
};

/**
 * 위치 감시 중지
 * @param {number} watchId - 감시 ID
 */
export const stopLocationTracking = (watchId) => {
  Geolocation.clearWatch(watchId);
};

/**
 * 두 지점 간의 거리 계산 (Haversine 공식)
 * @param {number} lat1 - 시작점 위도
 * @param {number} lon1 - 시작점 경도
 * @param {number} lat2 - 도착점 위도
 * @param {number} lon2 - 도착점 경도
 * @returns {number} 거리 (미터)
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // 지구 반경 (미터)
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * 사용자가 특정 위치에 도착했는지 확인
 * @param {Object} userLocation - 사용자 위치
 * @param {Object} targetLocation - 도착지 위치
 * @param {number} radiusInMeters - 도착 인정 반경 (미터)
 * @returns {boolean} 도착 여부
 */
export const isUserAtLocation = (
  userLocation,
  targetLocation,
  radiusInMeters = 20
) => {
  const distance = calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    targetLocation.latitude,
    targetLocation.longitude
  );
  
  return distance <= radiusInMeters;
};

/**
 * 노선별 출발지 위치 정보 (더미 데이터)
 * 실제로는 API에서 받아와야 함
 */
export const ROUTE_START_LOCATIONS = {
  '동부캠퍼스 - 서부캠퍼스': {
    latitude: 37.5665,
    longitude: 126.9780,
    name: '동부캠퍼스 정문',
    address: '서울시 종로구 동부캠퍼스 정문'
  },
  '서부캠퍼스 - 동부캠퍼스': {
    latitude: 37.5565,
    longitude: 126.9680,
    name: '서부캠퍼스 정문',
    address: '서울시 종로구 서부캠퍼스 정문'
  },
  '동부캠퍼스 - 시청': {
    latitude: 37.5665,
    longitude: 126.9780,
    name: '동부캠퍼스 정문',
    address: '서울시 종로구 동부캠퍼스 정문'
  },
  '시청 - 동부캠퍼스': {
    latitude: 37.5663,
    longitude: 126.9779,
    name: '시청역 3번 출구',
    address: '서울시 중구 시청역 3번 출구'
  },
  '서부캠퍼스 - 터미널': {
    latitude: 37.5565,
    longitude: 126.9680,
    name: '서부캠퍼스 정문',
    address: '서울시 종로구 서부캠퍼스 정문'
  },
  '터미널 - 서부캠퍼스': {
    latitude: 37.5045,
    longitude: 127.0050,
    name: '서울고속버스터미널',
    address: '서울시 서초구 서울고속버스터미널'
  }
};

/**
 * 노선의 출발지 위치 정보 가져오기
 * @param {string} routeName - 노선명
 * @returns {Object|null} 출발지 위치 정보
 */
export const getRouteStartLocation = (routeName) => {
  return ROUTE_START_LOCATIONS[routeName] || null;
};