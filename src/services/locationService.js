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
      const { latitude, longitude, speed, heading, accuracy } = position.coords;
      callback({
        latitude,
        longitude,
        speed,
        heading,
        accuracy,
        timestamp: position.timestamp,
      });
    },
    (error) => {
      console.error('Error tracking location:', error);
    },
    { 
      enableHighAccuracy: true, 
      distanceFilter: 10, 
      interval: 5000, 
      fastestInterval: 2000 
    }
  );
};

/**
 * 위치 감시 중지
 * @param {number} watchId - 감시 ID
 */
export const stopLocationTracking = (watchId) => {
  Geolocation.clearWatch(watchId);
};