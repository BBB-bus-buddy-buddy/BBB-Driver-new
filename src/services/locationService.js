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
      // Android 12 이상에서는 정확한 위치 권한도 필요
      if (Platform.Version >= 31) {
        const fineLocationGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "정확한 위치 권한",
            message: "버스 운행을 위해 정확한 위치 권한이 필요합니다.",
            buttonNeutral: "나중에 묻기",
            buttonNegative: "취소",
            buttonPositive: "확인"
          }
        );
        
        if (fineLocationGranted !== PermissionsAndroid.RESULTS.GRANTED) {
          return false;
        }
      } else {
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
        
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          return false;
        }
      }
      
      // 백그라운드 위치 권한 (선택적)
      if (Platform.Version >= 29) {
        try {
          const backgroundGranted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
            {
              title: "백그라운드 위치 권한",
              message: "백그라운드에서도 위치 추적을 위해 권한이 필요합니다.",
              buttonNeutral: "나중에 묻기",
              buttonNegative: "취소",
              buttonPositive: "확인"
            }
          );
          console.log('[LocationService] 백그라운드 위치 권한:', backgroundGranted);
        } catch (err) {
          console.warn('[LocationService] 백그라운드 위치 권한 요청 실패:', err);
        }
      }
      
      return true;
    } catch (err) {
      console.error('[LocationService] 위치 권한 요청 오류:', err);
      return false;
    }
  }
  
  return false;
};

/**
 * 현재 위치 가져오기 (개선된 버전)
 * @returns {Promise<Object|null>} 현재 위치 정보
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    console.log('[LocationService] 현재 위치 요청 시작');
    
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy, speed, heading } = position.coords;
        
        console.log('[LocationService] 위치 획득 성공:', {
          latitude,
          longitude,
          accuracy,
          speed,
          heading
        });
        
        resolve({
          latitude,
          longitude,
          accuracy,
          speed: speed || 0,
          heading: heading || 0,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        console.error('[LocationService] 위치 획득 실패:', error.code, error.message);
        
        // 오류 코드별 처리
        switch(error.code) {
          case 1: // PERMISSION_DENIED
            reject(new Error('위치 권한이 거부되었습니다.'));
            break;
          case 2: // POSITION_UNAVAILABLE
            reject(new Error('위치 정보를 사용할 수 없습니다.'));
            break;
          case 3: // TIMEOUT
            reject(new Error('위치 요청 시간이 초과되었습니다.'));
            break;
          default:
            reject(error);
        }
      },
      { 
        enableHighAccuracy: true,  // 높은 정확도
        timeout: 20000,           // 20초 타임아웃
        maximumAge: 1000,         // 1초 이내 캐시 허용
        distanceFilter: 0,        // 모든 위치 변화 감지
        forceRequestLocation: true // 강제 위치 요청
      }
    );
  });
};

/**
 * 위치 감시 시작 (개선된 버전)
 * @param {Function} callback - 위치 업데이트 시 호출될 콜백 함수
 * @param {Object} options - 추가 옵션
 * @returns {number} 감시 ID
 */
export const startLocationTracking = (callback, options = {}) => {
  console.log('[LocationService] 위치 추적 시작');
  
  const defaultOptions = {
    enableHighAccuracy: true,     // 높은 정확도 사용
    distanceFilter: 3,           // 3미터 이상 이동시 업데이트
    interval: 2000,              // 2초마다 위치 확인
    fastestInterval: 1000,       // 최소 1초 간격
    showLocationDialog: true,     // 위치 서비스 켜기 대화상자
    forceRequestLocation: true,   // 강제 위치 요청
    forceLocationManager: false,  // GPS Provider 우선 사용
    useSignificantChanges: false  // iOS: 중요한 변화만 감지 비활성화
  };
  
  const trackingOptions = { ...defaultOptions, ...options };
  
  console.log('[LocationService] 추적 옵션:', trackingOptions);
  
  let lastValidLocation = null;
  let consecutiveErrors = 0;
  
  return Geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, speed, heading, accuracy } = position.coords;
      
      // 유효성 검사
      if (latitude === 0 && longitude === 0) {
        console.warn('[LocationService] (0, 0) 위치 무시');
        consecutiveErrors++;
        
        // 연속 3회 오류시 마지막 유효 위치 사용
        if (consecutiveErrors >= 3 && lastValidLocation) {
          console.log('[LocationService] 마지막 유효 위치 사용');
          callback({
            ...lastValidLocation,
            timestamp: position.timestamp,
            isLastKnown: true
          });
        }
        return;
      }
      
      // GPS 좌표 범위 검증
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        console.error('[LocationService] 잘못된 GPS 좌표:', { latitude, longitude });
        return;
      }
      
      // 정확도가 너무 낮은 경우 경고
      if (accuracy > 100) {
        console.warn('[LocationService] 낮은 GPS 정확도:', accuracy, '미터');
      }
      
      consecutiveErrors = 0;
      const locationData = {
        latitude,
        longitude,
        speed: speed || 0,
        heading: heading || 0,
        accuracy: accuracy || 0,
        timestamp: position.timestamp,
        isLastKnown: false
      };
      
      lastValidLocation = locationData;
      
      console.log('[LocationService] 위치 업데이트:', {
        lat: latitude.toFixed(6),
        lng: longitude.toFixed(6),
        speed: speed ? `${(speed * 3.6).toFixed(1)} km/h` : '0 km/h',
        accuracy: `${accuracy.toFixed(0)}m`
      });
      
      callback(locationData);
    },
    (error) => {
      console.error('[LocationService] 위치 추적 오류:', error.code, error.message);
      consecutiveErrors++;
      
      // 오류가 발생해도 마지막 알려진 위치 사용
      if (lastValidLocation && consecutiveErrors < 5) {
        console.log('[LocationService] 오류 발생 - 마지막 유효 위치 사용');
        callback({
          ...lastValidLocation,
          timestamp: Date.now(),
          isLastKnown: true,
          errorCode: error.code
        });
      }
    },
    trackingOptions
  );
};

/**
 * 위치 감시 중지
 * @param {number} watchId - 감시 ID
 */
export const stopLocationTracking = (watchId) => {
  console.log('[LocationService] 위치 추적 중지:', watchId);
  if (watchId !== null && watchId !== undefined) {
    Geolocation.clearWatch(watchId);
  }
};

/**
 * GPS 상태 확인
 * @returns {Promise<boolean>} GPS 활성화 여부
 */
export const checkGPSEnabled = () => {
  return new Promise((resolve) => {
    Geolocation.getCurrentPosition(
      () => resolve(true),
      (error) => {
        if (error.code === 2) { // POSITION_UNAVAILABLE
          resolve(false);
        } else {
          resolve(true);
        }
      },
      { timeout: 5000, maximumAge: 0, enableHighAccuracy: false }
    );
  });
};

/**
 * 위치 서비스 초기화
 */
export const initializeLocationService = async () => {
  console.log('[LocationService] 위치 서비스 초기화 시작');
  
  try {
    // 권한 확인
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      throw new Error('위치 권한이 없습니다.');
    }
    
    // GPS 상태 확인
    const gpsEnabled = await checkGPSEnabled();
    if (!gpsEnabled) {
      console.warn('[LocationService] GPS가 비활성화되어 있습니다.');
    }
    
    console.log('[LocationService] 위치 서비스 초기화 완료');
    return { hasPermission, gpsEnabled };
  } catch (error) {
    console.error('[LocationService] 초기화 실패:', error);
    throw error;
  }
};