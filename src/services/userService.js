// src/services/userService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/apiClient';

export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER_INFO: 'userInfo',
  HAS_ADDITIONAL_INFO: 'hasAdditionalInfo',
  LAST_SYNC: 'lastUserSync'
};

/**
 * 사용자 정보 동기화 및 업데이트 확인
 * @returns {Promise<Object>} 동기화 결과
 */
export const syncUserInfo = async () => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);

    if (!token) {
      return {
        success: false,
        needsLogin: true,
        message: '토큰이 없습니다.'
      };
    }

    // API 헤더에 토큰 설정
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // 서버에서 최신 사용자 정보 가져오기
    console.log('[UserService] 서버에서 사용자 정보 조회 중...');
    const response = await apiClient.get('/api/auth/user');

    if (!response.data?.data) {
      console.error('[UserService] 서버 응답에 사용자 정보가 없습니다.');
      return {
        success: false,
        needsLogin: true,
        message: '사용자 정보를 가져올 수 없습니다.'
      };
    }

    const serverUserInfo = response.data.data;
    console.log('[UserService] 서버 사용자 정보:', {
      email: serverUserInfo.email,
      role: serverUserInfo.role
    });

    // 로컬 저장소의 사용자 정보 가져오기
    const localUserInfoStr = await AsyncStorage.getItem(STORAGE_KEYS.USER_INFO);
    const localUserInfo = localUserInfoStr ? JSON.parse(localUserInfoStr) : null;

    // 사용자 정보 변경 감지
    const hasChanges = detectUserChanges(localUserInfo, serverUserInfo);

    if (hasChanges) {
      console.log('[UserService] 사용자 정보 변경 감지됨. 업데이트 중...');
      await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(serverUserInfo));

      // 역할 변경 시 추가 정보 플래그 초기화
      if (localUserInfo && localUserInfo.role !== serverUserInfo.role) {
        console.log('[UserService] 역할 변경 감지:', localUserInfo.role, '->', serverUserInfo.role);
        await AsyncStorage.removeItem(STORAGE_KEYS.HAS_ADDITIONAL_INFO);
      }
    }

    // 동기화 시간 기록
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());

    return {
      success: true,
      userInfo: serverUserInfo,
      hasChanges,
      needsAdditionalInfo: serverUserInfo.role === 'ROLE_GUEST',
      role: serverUserInfo.role
    };

  } catch (error) {
    console.error('[UserService] 사용자 정보 동기화 오류:', error);

    // 네트워크 오류인 경우 로컬 정보 사용
    if (error.response?.status === 401) {
      // 401 오류: 토큰 만료
      await clearUserData();
      return {
        success: false,
        needsLogin: true,
        message: '인증이 만료되었습니다.'
      };
    }

    // 기타 오류: 로컬 정보로 진행
    const localUserInfoStr = await AsyncStorage.getItem(STORAGE_KEYS.USER_INFO);
    if (localUserInfoStr) {
      const localUserInfo = JSON.parse(localUserInfoStr);
      console.log('[UserService] 네트워크 오류, 로컬 정보 사용');

      return {
        success: true,
        userInfo: localUserInfo,
        hasChanges: false,
        needsAdditionalInfo: localUserInfo.role === 'ROLE_GUEST',
        role: localUserInfo.role,
        isOffline: true
      };
    }

    return {
      success: false,
      needsLogin: true,
      message: '사용자 정보를 확인할 수 없습니다.'
    };
  }
};

/**
 * 사용자 정보 변경 감지
 * @param {Object} localInfo - 로컬 사용자 정보
 * @param {Object} serverInfo - 서버 사용자 정보
 * @returns {boolean} 변경 여부
 */
const detectUserChanges = (localInfo, serverInfo) => {
  if (!localInfo) return true;

  // 주요 필드 비교
  const keysToCheck = ['role', 'email', 'name', 'phoneNumber', 'organizationId'];

  for (const key of keysToCheck) {
    if (localInfo[key] !== serverInfo[key]) {
      console.log(`[UserService] ${key} 변경 감지:`, localInfo[key], '->', serverInfo[key]);
      return true;
    }
  }

  // 운전면허 정보 비교
  if (detectLicenseChanges(localInfo.licenseInfo, serverInfo.licenseInfo)) {
    return true;
  }

  return false;
};

/**
 * 운전면허 정보 변경 감지
 * @param {Object} localLicense - 로컬 면허 정보
 * @param {Object} serverLicense - 서버 면허 정보
 * @returns {boolean} 변경 여부
 */
const detectLicenseChanges = (localLicense, serverLicense) => {
  // 둘 다 없으면 변경 없음
  if (!localLicense && !serverLicense) return false;

  // 하나만 있으면 변경됨
  if (!localLicense || !serverLicense) {
    console.log('[UserService] 면허 정보 추가/삭제 감지');
    return true;
  }

  // 면허 정보 필드 비교
  const licenseFields = [
    'licenseNumber',
    'licenseType',
    'licenseExpiryDate',
    'licenseRegion',
    'licenseYear',
    'licenseUnique',
    'licenseClass',
    'serialNo',
    'isVerified',
    'verifiedAt'
  ];

  for (const field of licenseFields) {
    if (localLicense[field] !== serverLicense[field]) {
      console.log(`[UserService] 면허 정보 ${field} 변경 감지:`,
        localLicense[field], '->', serverLicense[field]);
      return true;
    }
  }

  return false;
};

/**
 * 사용자 데이터 초기화
 */
export const clearUserData = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TOKEN,
      STORAGE_KEYS.USER_INFO,
      STORAGE_KEYS.HAS_ADDITIONAL_INFO,
      STORAGE_KEYS.LAST_SYNC
    ]);

    // API 헤더 초기화
    delete apiClient.defaults.headers.common['Authorization'];

    console.log('[UserService] 사용자 데이터 초기화 완료');
  } catch (error) {
    console.error('[UserService] 사용자 데이터 초기화 오류:', error);
  }
};

/**
 * 현재 사용자 정보 가져오기 (로컬)
 * @returns {Promise<Object|null>} 사용자 정보
 */
export const getCurrentUser = async () => {
  try {
    const userInfoStr = await AsyncStorage.getItem(STORAGE_KEYS.USER_INFO);
    return userInfoStr ? JSON.parse(userInfoStr) : null;
  } catch (error) {
    console.error('[UserService] 사용자 정보 조회 오류:', error);
    return null;
  }
};

/**
 * 마지막 동기화 시간 확인
 * @returns {Promise<Date|null>} 마지막 동기화 시간
 */
export const getLastSyncTime = async () => {
  try {
    const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return lastSync ? new Date(lastSync) : null;
  } catch (error) {
    console.error('[UserService] 동기화 시간 조회 오류:', error);
    return null;
  }
};

/**
 * 동기화가 필요한지 확인 (5분 이상 경과 시)
 * @returns {Promise<boolean>} 동기화 필요 여부
 */
export const needsSync = async () => {
  try {
    const lastSync = await getLastSyncTime();
    if (!lastSync) return true;

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastSync < fiveMinutesAgo;
  } catch (error) {
    console.error('[UserService] 동기화 필요 여부 확인 오류:', error);
    return true;
  }
};

/**
 * 사용자 프로필 업데이트
 * @param {Object} profileData - 업데이트할 프로필 데이터
 * @returns {Promise<Object>} 업데이트 결과
 */
export const updateUserProfile = async (profileData) => {
  try {
    const response = await apiClient.put('/api/user/profile', profileData);

    if (response.data?.data) {
      // 로컬 정보도 업데이트
      await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(response.data.data));

      return {
        success: true,
        userInfo: response.data.data,
        message: '프로필이 업데이트되었습니다.'
      };
    }

    return {
      success: false,
      message: '프로필 업데이트에 실패했습니다.'
    };
  } catch (error) {
    console.error('[UserService] 프로필 업데이트 오류:', error);
    return {
      success: false,
      message: error.response?.data?.message || '프로필 업데이트 중 오류가 발생했습니다.'
    };
  }
};

/**
 * 로그아웃
 * @returns {Promise<Object>} 로그아웃 결과
 */
export const logout = async () => {
  try {
    console.log('[UserService] 로그아웃 시작');

    // 서버에 로그아웃 요청 (선택적)
    try {
      await apiClient.post('/api/auth/logout');
      console.log('[UserService] 서버 로그아웃 완료');
    } catch (apiError) {
      // 서버 로그아웃 실패해도 로컬 로그아웃은 진행
      console.warn('[UserService] 서버 로그아웃 실패, 로컬 로그아웃 진행:', apiError.message);
    }

    // 로컬 데이터 삭제
    await clearUserData();

    // 추가로 삭제할 수 있는 다른 데이터들
    const additionalKeys = [
      'currentDrive',
      'driveSchedules',
      'cachedMessages',
      'unreadNotificationCount',
      'unreadMessageCount',
      'pushToken',
      'previousRole'
    ];

    try {
      await AsyncStorage.multiRemove(additionalKeys);
    } catch (removeError) {
      console.warn('[UserService] 추가 데이터 삭제 실패:', removeError);
    }

    console.log('[UserService] 로그아웃 완료');

    return {
      success: true,
      message: '로그아웃되었습니다.'
    };
  } catch (error) {
    console.error('[UserService] 로그아웃 오류:', error);

    // 오류가 발생해도 로컬 데이터는 삭제 시도
    try {
      await clearUserData();
    } catch (clearError) {
      console.error('[UserService] 데이터 삭제 실패:', clearError);
    }

    return {
      success: false,
      message: '로그아웃 처리 중 오류가 발생했습니다.',
      error
    };
  }
};

/**
 * 자동 로그아웃 (토큰 만료 등)
 * @param {string} reason - 로그아웃 사유
 * @returns {Promise<Object>} 로그아웃 결과
 */
export const forceLogout = async (reason = '인증이 만료되었습니다.') => {
  console.log('[UserService] 강제 로그아웃:', reason);

  // 로컬 데이터만 삭제 (서버 요청 없이)
  await clearUserData();

  return {
    success: true,
    forced: true,
    message: reason
  };
};

/**
 * 면허 정보 업데이트
 * @param {Object} licenseData - 업데이트할 면허 정보
 * @returns {Promise<Object>} 업데이트 결과
 */
export const updateLicenseInfo = async (licenseData) => {
  try {
    const response = await apiClient.put('/api/user/license', licenseData);

    if (response.data?.data) {
      // 현재 사용자 정보 가져오기
      const currentUser = await getCurrentUser();

      // 면허 정보 업데이트
      const updatedUser = {
        ...currentUser,
        licenseInfo: response.data.data
      };

      // 로컬 저장소 업데이트
      await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(updatedUser));

      return {
        success: true,
        licenseInfo: response.data.data,
        message: '면허 정보가 업데이트되었습니다.'
      };
    }

    return {
      success: false,
      message: '면허 정보 업데이트에 실패했습니다.'
    };
  } catch (error) {
    console.error('[UserService] 면허 정보 업데이트 오류:', error);
    return {
      success: false,
      message: error.response?.data?.message || '면허 정보 업데이트 중 오류가 발생했습니다.'
    };
  }
};

/**
 * 면허 정보 검증 상태 확인
 * @returns {Promise<Object>} 검증 상태
 */
export const checkLicenseVerification = async () => {
  try {
    const response = await apiClient.get('/api/user/license/verification-status');

    return {
      success: true,
      isVerified: response.data?.data?.isVerified || false,
      verifiedAt: response.data?.data?.verifiedAt,
      expiryDate: response.data?.data?.expiryDate
    };
  } catch (error) {
    console.error('[UserService] 면허 검증 상태 확인 오류:', error);

    // 로컬 정보에서 확인
    const user = await getCurrentUser();
    if (user?.licenseInfo) {
      return {
        success: true,
        isVerified: user.licenseInfo.isVerified || false,
        verifiedAt: user.licenseInfo.verifiedAt,
        expiryDate: user.licenseInfo.licenseExpiryDate,
        isOffline: true
      };
    }

    return {
      success: false,
      isVerified: false
    };
  }
};

/**
 * 토큰 가져오기
 * @returns {Promise<string|null>} 토큰
 */
export const getToken = async () => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch (error) {
    console.error('[UserService] 토큰 조회 오류:', error);
    return null;
  }
};

/**
 * 토큰 저장
 * @param {string} token - 저장할 토큰
 * @returns {Promise<boolean>} 저장 성공 여부
 */
export const setToken = async (token) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return true;
  } catch (error) {
    console.error('[UserService] 토큰 저장 오류:', error);
    return false;
  }
};

/**
 * 로그인 상태 확인
 * @returns {Promise<boolean>} 로그인 여부
 */
export const isLoggedIn = async () => {
  try {
    const token = await getToken();
    const userInfo = await getCurrentUser();
    return !!(token && userInfo);
  } catch (error) {
    console.error('[UserService] 로그인 상태 확인 오류:', error);
    return false;
  }
};