// src/utils/storage/helpers.js
import { storage } from './index';
import { CURRENT_STORAGE_VERSION } from './keys';

/**
 * 스토리지 헬퍼 함수들
 * 
 * @description storage 객체와 함께 사용되는 유틸리티 함수들
 * - 동기화 간격을 5분에서 1분으로 단축
 */
export const storageHelpers = {
  /**
   * 동기화 필요 여부 확인
   * 
   * @description 마지막 동기화로부터 1분이 지났는지 확인
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

      // 5분에서 1분으로 단축하여 더 자주 동기화
      const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);
      return lastSync < oneMinuteAgo;
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
      const testKey = '_validation_test';
      const testData = { test: true, timestamp: new Date().toISOString() };

      const setResult = await storage._safeSetItem(testKey, JSON.stringify(testData));
      if (!setResult) {
        return {
          isValid: false,
          error: 'Failed to set test item'
        };
      }

      const retrieved = await storage._safeGetItem(testKey);
      const removeResult = await storage._safeRemoveItem(testKey);

      return {
        isValid: retrieved !== null,
        version: CURRENT_STORAGE_VERSION,
        initialized: storage.isInitialized,
        canWrite: setResult,
        canRead: retrieved !== null,
        canDelete: removeResult
      };
    } catch (error) {
      console.error('[Storage] 검증 실패:', error);
      return {
        isValid: false,
        error: error.message
      };
    }
  },

  /**
   * 스토리지 복구 시도
   * 
   * @description manifest.json 에러 등 발생 시 스토리지 복구
   * @returns {Promise<boolean>} 복구 성공 여부
   */
  async repairStorage() {
    try {
      console.log('[StorageHelpers] 스토리지 복구 시작');

      // 스토리지 재초기화
      storage.isInitialized = false;
      storage.isInitializing = false;
      storage.initPromise = null;

      // 메모리 폴백 초기화
      if (storage._memoryFallback) {
        storage._memoryFallback = {};
      }

      // 약간의 지연 후 재초기화 시도
      await new Promise(resolve => setTimeout(resolve, 300));

      const initResult = await storage.initialize();

      if (initResult) {
        console.log('[StorageHelpers] 스토리지 복구 성공');
        
        // 검증 테스트
        const validation = await this.validateStorage();
        if (validation.isValid) {
          console.log('[StorageHelpers] 스토리지 검증 성공');
          return true;
        } else {
          console.warn('[StorageHelpers] 스토리지 검증 실패:', validation.error);
          return false;
        }
      } else {
        console.warn('[StorageHelpers] 스토리지 복구 실패');
        return false;
      }
    } catch (error) {
      console.error('[StorageHelpers] 스토리지 복구 오류:', error);
      return false;
    }
  },

  /**
   * 스토리지 상태 리포트
   * 
   * @description 현재 스토리지 상태를 자세히 확인
   * @returns {Promise<Object>} 상태 리포트
   */
  async getStorageReport() {
    try {
      const report = {
        initialized: storage.isInitialized,
        initializing: storage.isInitializing,
        memoryFallbackActive: !!(storage._memoryFallback && Object.keys(storage._memoryFallback).length > 0),
        memoryFallbackKeys: storage._memoryFallback ? Object.keys(storage._memoryFallback) : [],
        validation: await this.validateStorage(),
        timestamp: new Date().toISOString()
      };

      // 저장된 데이터 크기 확인
      try {
        const keys = ['token', 'userInfo', 'currentDriveStatus', 'driveSchedules'];
        const sizes = {};
        
        for (const key of keys) {
          const value = await storage._safeGetItem(key);
          if (value) {
            sizes[key] = value.length;
          }
        }
        
        report.dataSizes = sizes;
      } catch (error) {
        report.dataSizes = { error: error.message };
      }

      return report;
    } catch (error) {
      console.error('[StorageHelpers] 상태 리포트 생성 오류:', error);
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * 임시 스토리지 사용 (메모리)
   * 
   * @description AsyncStorage를 사용할 수 없을 때 메모리 스토리지 사용
   * @returns {Object} 메모리 스토리지 인터페이스
   */
  getMemoryStorage() {
    const memoryStore = {};
    
    return {
      getItem: async (key) => {
        return memoryStore[key] || null;
      },
      
      setItem: async (key, value) => {
        memoryStore[key] = value;
        return true;
      },
      
      removeItem: async (key) => {
        delete memoryStore[key];
        return true;
      },
      
      clear: async () => {
        Object.keys(memoryStore).forEach(key => delete memoryStore[key]);
        return true;
      },
      
      getAllKeys: async () => {
        return Object.keys(memoryStore);
      }
    };
  },

  /**
   * 캐시 강제 초기화
   * 
   * @description 모든 캐시된 데이터 강제 초기화
   * @usage 데이터 동기화 문제 발생 시 사용
   */
  async forceClearCache() {
    try {
      console.log('[StorageHelpers] 캐시 강제 초기화 시작');
      
      // OperationPlanService 캐시 초기화
      const OperationPlanService = require('../services/operationPlanService').default;
      if (OperationPlanService) {
        OperationPlanService.invalidateCache();
      }
      
      // 동기화 시간 초기화 (다음 번에 강제 동기화)
      await storage.setLastSync(null);
      
      console.log('[StorageHelpers] 캐시 강제 초기화 완료');
      return true;
    } catch (error) {
      console.error('[StorageHelpers] 캐시 초기화 오류:', error);
      return false;
    }
  }
};