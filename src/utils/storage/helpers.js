import { storage } from './index';
import { CURRENT_STORAGE_VERSION } from './keys';

/**
 * 스토리지 헬퍼 함수들
 * 
 * @description storage 객체와 함께 사용되는 유틸리티 함수들
 */
export const storageHelpers = {
  /**
   * 동기화 필요 여부 확인
   * 
   * @description 마지막 동기화로부터 5분이 지났는지 확인
   * @returns {Promise<boolean>} 동기화 필요 여부
   * @usage
   * if (await storageHelpers.needsSync()) {
   *   await AuthService.syncUserInfo();
   * }
   */
  async needsSync() {
    try {
      const lastSync = await storage.getLastSync();
      if (!lastSync) return true;
      
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return lastSync < fiveMinutesAgo;
    } catch (error) {
      console.error('동기화 필요 여부 확인 오류:', error);
      return true;
    }
  },

  /**
   * 로그인 상태 확인
   * 
   * @description 토큰과 사용자 정보가 모두 있는지 확인
   * @returns {Promise<boolean>} 로그인 여부
   * @usage
   * if (!await storageHelpers.isLoggedIn()) {
   *   navigation.navigate('Login');
   * }
   */
  async isLoggedIn() {
    try {
      const token = await storage.getToken();
      const userInfo = await storage.getUserInfo();
      return !!(token && userInfo);
    } catch (error) {
      console.error('로그인 상태 확인 오류:', error);
      return false;
    }
  },

  /**
   * 스토리지 유효성 검증
   * 
   * @description 스토리지가 정상적으로 작동하는지 테스트
   * @returns {Promise<Object>} 검증 결과 {isValid, version, error?}
   * @usage 앱 시작 시 또는 오류 발생 시 진단용
   */
  async validateStorage() {
    try {
      await storage.initialize();
      
      // 기본 동작 테스트
      const testData = { test: true, timestamp: new Date().toISOString() };
      await storage._safeSetItem('_validation_test', JSON.stringify(testData));
      const retrieved = await storage._safeGetItem('_validation_test');
      await storage._safeRemoveItem('_validation_test');
      
      return {
        isValid: retrieved !== null,
        version: CURRENT_STORAGE_VERSION,
        initialized: storage.isInitialized
      };
    } catch (error) {
      console.error('[Storage] 검증 실패:', error);
      return {
        isValid: false,
        error: error.message
      };
    }
  }
};