// src/services/authService.js
import { authAPI, driverAPI } from '../api';
import { storage, storageHelpers } from '../utils/storage';

export class AuthService {
  /**
   * Google OAuth 로그인 처리
   * @param {string} token - OAuth로부터 받은 토큰
   * @returns {Promise<Object>} 로그인 결과 및 사용자 정보
   */
  static async login(token) {
    try {
      console.log('[AuthService] 로그인 시작');

      // 토큰 저장
      await storage.setToken(token);
      console.log('[AuthService] 토큰 저장 완료');

      // 사용자 정보 가져오기
      const userResponse = await authAPI.getUser();
      const userInfo = userResponse.data?.data;

      if (!userInfo) {
        throw new Error('사용자 정보를 가져올 수 없습니다.');
      }

      console.log('[AuthService] 사용자 정보 조회 성공:', {
        email: userInfo.email,
        role: userInfo.role
      });

      // 사용자 정보 저장
      await storage.setUserInfo(userInfo);

      // 동기화 시간 기록
      await storage.setLastSync(new Date().toISOString());

      console.log('[AuthService] 로그인 완료');

      return {
        success: true,
        userInfo,
        role: userInfo.role,
        needsAdditionalInfo: userInfo.role === 'ROLE_GUEST'
      };

    } catch (error) {
      console.error('[AuthService] 로그인 오류:', error);

      // 로그인 실패 시 토큰 삭제
      try {
        await storage.removeToken();
      } catch (removeError) {
        console.error('[AuthService] 토큰 삭제 실패:', removeError);
      }

      return {
        success: false,
        message: error.response?.data?.message || error.message || '로그인 처리 중 오류가 발생했습니다.',
        error
      };
    }
  }

  /**
   * 사용자 정보 동기화 및 업데이트 확인 (기존 syncUserInfo)
   */
  static async syncUserInfo() {
    try {
      const token = await storage.getToken();

      if (!token) {
        return {
          success: false,
          needsLogin: true,
          message: '토큰이 없습니다.'
        };
      }

      console.log('[AuthService] 서버에서 사용자 정보 조회 중...');
      const response = await authAPI.getUser();

      if (!response.data?.data) {
        console.error('[AuthService] 서버 응답에 사용자 정보가 없습니다.');
        return {
          success: false,
          needsLogin: true,
          message: '사용자 정보를 가져올 수 없습니다.'
        };
      }

      const serverUserInfo = response.data.data;
      console.log('[AuthService] 서버 사용자 정보:', {
        email: serverUserInfo.email,
        role: serverUserInfo.role
      });

      // 로컬 저장소의 사용자 정보 가져오기
      const localUserInfo = await storage.getUserInfo();

      // 사용자 정보 변경 감지
      const hasChanges = this._detectUserChanges(localUserInfo, serverUserInfo);

      if (hasChanges) {
        console.log('[AuthService] 사용자 정보 변경 감지됨. 업데이트 중...');
        await storage.setUserInfo(serverUserInfo);

        // 역할 변경 시 추가 정보 플래그 초기화
        if (localUserInfo && localUserInfo.role !== serverUserInfo.role) {
          console.log('[AuthService] 역할 변경 감지:', localUserInfo.role, '->', serverUserInfo.role);
          await storage.setHasAdditionalInfo(false);
        }
      }

      // 동기화 시간 기록
      await storage.setLastSync(new Date().toISOString());

      return {
        success: true,
        userInfo: serverUserInfo,
        hasChanges,
        needsAdditionalInfo: serverUserInfo.role === 'ROLE_GUEST',
        role: serverUserInfo.role
      };

    } catch (error) {
      console.error('[AuthService] 사용자 정보 동기화 오류:', error);

      // 네트워크 오류인 경우 로컬 정보 사용
      if (error.response?.status === 401) {
        // 401 오류: 토큰 만료
        await this.clearUserData();
        return {
          success: false,
          needsLogin: true,
          message: '인증이 만료되었습니다.'
        };
      }

      // 기타 오류: 로컬 정보로 진행
      const localUserInfo = await storage.getUserInfo();
      if (localUserInfo) {
        console.log('[AuthService] 네트워크 오류, 로컬 정보 사용');

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
  }

  /**
   * 로그아웃 (기존 logout)
   */
  static async logout() {
    try {
      console.log('[AuthService] 로그아웃 시작');

      // 서버에 로그아웃 요청 (선택적)
      try {
        await authAPI.logout();
        console.log('[AuthService] 서버 로그아웃 완료');
      } catch (apiError) {
        // 서버 로그아웃 실패해도 로컬 로그아웃은 진행
        console.warn('[AuthService] 서버 로그아웃 실패, 로컬 로그아웃 진행:', apiError.message);
      }

      // 로컬 데이터 삭제
      await this.clearUserData();

      console.log('[AuthService] 로그아웃 완료');

      return {
        success: true,
        message: '로그아웃되었습니다.'
      };
    } catch (error) {
      console.error('[AuthService] 로그아웃 오류:', error);

      // 오류가 발생해도 로컬 데이터는 삭제 시도
      try {
        await this.clearUserData();
      } catch (clearError) {
        console.error('[AuthService] 데이터 삭제 실패:', clearError);
      }

      return {
        success: false,
        message: '로그아웃 처리 중 오류가 발생했습니다.',
        error
      };
    }
  }

  /**
   * 사용자 데이터 초기화 (기존 clearUserData)
   */
  static async clearUserData() {
    try {
      await storage.clearUserData();
      console.log('[AuthService] 사용자 데이터 초기화 완료');
    } catch (error) {
      console.error('[AuthService] 사용자 데이터 초기화 오류:', error);
    }
  }

  /**
   * 현재 사용자 정보 가져오기 (기존 getCurrentUser)
   */
  static async getCurrentUser() {
    return await storage.getUserInfo();
  }

  /**
   * 마지막 동기화 시간 확인 (기존 getLastSyncTime)
   */
  static async getLastSyncTime() {
    return await storage.getLastSync();
  }

  /**
   * 동기화가 필요한지 확인 (기존 needsSync)
   */
  static async needsSync() {
    return await storageHelpers.needsSync();
  }

  /**
   * 사용자 프로필 업데이트 (기존 updateUserProfile)
   */
  static async updateUserProfile(profileData) {
    try {
      const response = await driverAPI.updateProfile(profileData);

      if (response.data?.data) {
        // 로컬 정보도 업데이트
        await storage.setUserInfo(response.data.data);

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
      console.error('[AuthService] 프로필 업데이트 오류:', error);
      return {
        success: false,
        message: error.response?.data?.message || '프로필 업데이트 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 면허 정보 업데이트 (기존 updateLicenseInfo)
   */
  static async updateLicenseInfo(licenseData) {
    try {
      const response = await driverAPI.updateLicense(licenseData);

      if (response.data?.data) {
        // 현재 사용자 정보 가져오기
        const currentUser = await this.getCurrentUser();

        // 면허 정보 업데이트
        const updatedUser = {
          ...currentUser,
          licenseInfo: response.data.data
        };

        // 로컬 저장소 업데이트
        await storage.setUserInfo(updatedUser);

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
      console.error('[AuthService] 면허 정보 업데이트 오류:', error);
      return {
        success: false,
        message: error.response?.data?.message || '면허 정보 업데이트 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 면허 정보 검증 상태 확인 (기존 checkLicenseVerification)
   */
  static async checkLicenseVerification() {
    try {
      const response = await driverAPI.checkLicenseVerification();

      return {
        success: true,
        isVerified: response.data?.data?.isVerified || false,
        verifiedAt: response.data?.data?.verifiedAt,
        expiryDate: response.data?.data?.expiryDate
      };
    } catch (error) {
      console.error('[AuthService] 면허 검증 상태 확인 오류:', error);

      // 로컬 정보에서 확인
      const user = await this.getCurrentUser();
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
  }

  /**
   * 로그인 상태 확인 (기존 isLoggedIn)
   */
  static async isLoggedIn() {
    return await storageHelpers.isLoggedIn();
  }

  /**
   * 토큰 관련 헬퍼 메서드들
   */
  static async getToken() {
    return await storage.getToken();
  }

  static async setToken(token) {
    return await storage.setToken(token);
  }

  /**
   * 자동 로그아웃 (기존 forceLogout)
   */
  static async forceLogout(reason = '인증이 만료되었습니다.') {
    console.log('[AuthService] 강제 로그아웃:', reason);

    // 로컬 데이터만 삭제 (서버 요청 없이)
    await this.clearUserData();

    return {
      success: true,
      forced: true,
      message: reason
    };
  }

  /**
   * 사용자 정보 변경 감지 (기존 detectUserChanges)
   */
  static _detectUserChanges(localInfo, serverInfo) {
    if (!localInfo) return true;

    // 주요 필드 비교
    const keysToCheck = ['role', 'email', 'name', 'phoneNumber', 'organizationId'];

    for (const key of keysToCheck) {
      if (localInfo[key] !== serverInfo[key]) {
        console.log(`[AuthService] ${key} 변경 감지:`, localInfo[key], '->', serverInfo[key]);
        return true;
      }
    }

    // 운전면허 정보 비교
    if (this._detectLicenseChanges(localInfo.licenseInfo, serverInfo.licenseInfo)) {
      return true;
    }

    return false;
  }

  /**
   * 운전면허 정보 변경 감지 (기존 detectLicenseChanges)
   */
  static _detectLicenseChanges(localLicense, serverLicense) {
    // 둘 다 없으면 변경 없음
    if (!localLicense && !serverLicense) return false;

    // 하나만 있으면 변경됨
    if (!localLicense || !serverLicense) {
      console.log('[AuthService] 면허 정보 추가/삭제 감지');
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
        console.log(`[AuthService] 면허 정보 ${field} 변경 감지:`,
          localLicense[field], '->', serverLicense[field]);
        return true;
      }
    }

    return false;
  }
}