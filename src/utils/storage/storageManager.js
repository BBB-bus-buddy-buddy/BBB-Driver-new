// src/utils/storage/storageManager.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KEYS, CURRENT_STORAGE_VERSION } from './keys';

/**
 * AsyncStorage 관리자 클래스 - 안정적인 버전
 * 
 * @description
 * - 무한 재귀 방지를 위한 초기화 플래그 개선
 * - 필수 키가 없을 때 적절한 에러 처리
 * - manifest.json 에러 대응
 */
export class StorageManager {
  constructor() {
    this.isInitialized = false;
    this.isInitializing = false; // 초기화 진행 중 플래그 추가
    this._memoryFallback = {}; // 메모리 폴백 저장소
  }

  /**
   * 스토리지 초기화
   */
  async initialize() {
    // 이미 초기화됨
    if (this.isInitialized) {
      return true;
    }
    
    // 초기화 진행 중이면 대기
    if (this.isInitializing) {
      console.log('[Storage] 초기화 진행 중... 대기');
      // 초기화 완료까지 대기 (최대 5초)
      let waitCount = 0;
      while (this.isInitializing && waitCount < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        waitCount++;
      }
      return this.isInitialized;
    }

    // 초기화 시작
    this.isInitializing = true;
    
    try {
      console.log('[Storage] 초기화 시작...');
      
      // 버전 확인 (await 제거하여 재귀 방지)
      const storedVersion = await this._directGetItem(KEYS.STORAGE_VERSION);
      
      if (storedVersion !== CURRENT_STORAGE_VERSION) {
        console.log('[Storage] 버전 업데이트 필요:', storedVersion, '->', CURRENT_STORAGE_VERSION);
        await this._migrateStorage(storedVersion, CURRENT_STORAGE_VERSION);
        await this._directSetItem(KEYS.STORAGE_VERSION, CURRENT_STORAGE_VERSION);
      }

      // 기본 배열 초기화 (운행 일정, 히스토리만)
      const arrayKeys = [
        { key: KEYS.DRIVE_SCHEDULES, defaultValue: '[]' },
        { key: KEYS.DRIVE_HISTORY, defaultValue: '[]' }
      ];

      for (const { key, defaultValue } of arrayKeys) {
        const value = await this._directGetItem(key);
        if (value === null) {
          await this._directSetItem(key, defaultValue);
          console.log(`[Storage] 배열 초기화: ${key}`);
        }
      }

      this.isInitialized = true;
      console.log('[Storage] 초기화 완료');
      return true;
      
    } catch (error) {
      console.error('[Storage] 초기화 실패:', error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * 직접 AsyncStorage 접근 (초기화 체크 없이)
   * @private
   */
  async _directGetItem(key) {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`[Storage] 직접 조회 실패: ${key}`, error);
      return null;
    }
  }

  /**
   * 직접 AsyncStorage 저장 (초기화 체크 없이)
   * @private
   */
  async _directSetItem(key, value) {
    try {
      await AsyncStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`[Storage] 직접 저장 실패: ${key}`, error);
      throw error;
    }
  }

  /**
   * 스토리지 마이그레이션
   * @private
   */
  async _migrateStorage(fromVersion, toVersion) {
    console.log(`[Storage] 마이그레이션: ${fromVersion} -> ${toVersion}`);
    // 향후 버전 업데이트 시 마이그레이션 로직 추가
  }

  /**
   * 안전한 저장 메서드
   * @private
   */
  async _safeSetItem(key, value, retries = 3) {
    // 토큰과 사용자 정보는 초기화 없이도 저장 가능
    const criticalKeys = [KEYS.TOKEN, KEYS.USER_INFO];
    if (!criticalKeys.includes(key)) {
      await this.initialize();
    }

    for (let i = 0; i < retries; i++) {
      try {
        console.log(`[Storage] 저장 시도: ${key} (${i + 1}/${retries})`);
        await AsyncStorage.setItem(key, value);
        console.log(`[Storage] 저장 성공: ${key}`);
        return true;
      } catch (error) {
        console.error(`[Storage] 저장 실패 (시도 ${i + 1}/${retries}):`, key, error.message);
        
        // manifest.json 에러 처리
        if (error.message?.includes('manifest.json') || error.message?.includes('doesn\'t exist')) {
          console.log('[Storage] manifest.json 에러 감지, 재시도 중...');
          
          // AsyncStorage 초기화 재시도
          try {
            // 약간의 지연 후 재시도
            await new Promise(resolve => setTimeout(resolve, 200 * (i + 1)));
            
            // 마지막 시도가 아니면 계속
            if (i < retries - 1) {
              continue;
            }
          } catch (retryError) {
            console.error('[Storage] 재시도 실패:', retryError);
          }
        }
        
        // 마지막 시도에서 실패하면 폴백 처리
        if (i === retries - 1) {
          console.warn(`[Storage] 모든 시도 실패, 폴백 처리: ${key}`);
          // 중요한 데이터는 메모리에 임시 저장
          if (criticalKeys.includes(key)) {
            this._memoryFallback = this._memoryFallback || {};
            this._memoryFallback[key] = value;
            console.log(`[Storage] 메모리 폴백 사용: ${key}`);
            return true;
          }
          throw error;
        }
      }
    }
    return false;
  }

  /**
   * 안전한 조회 메서드
   * @private
   */
  async _safeGetItem(key) {
    // 토큰과 사용자 정보는 초기화 없이도 조회 가능
    const criticalKeys = [KEYS.TOKEN, KEYS.USER_INFO];
    if (!criticalKeys.includes(key)) {
      await this.initialize();
    }
    
    try {
      const value = await AsyncStorage.getItem(key);
      console.log(`[Storage] 조회 성공: ${key} = ${value ? '있음' : '없음'}`);
      return value;
    } catch (error) {
      console.error(`[Storage] 조회 실패: ${key}`, error);
      
      // 메모리 폴백 확인
      if (this._memoryFallback && this._memoryFallback[key]) {
        console.log(`[Storage] 메모리 폴백에서 조회: ${key}`);
        return this._memoryFallback[key];
      }
      
      return null;
    }
  }

  /**
   * 안전한 삭제 메서드
   * @private
   */
  async _safeRemoveItem(key) {
    try {
      await AsyncStorage.removeItem(key);
      console.log(`[Storage] 삭제 성공: ${key}`);
      
      // 메모리 폴백에서도 삭제
      if (this._memoryFallback && this._memoryFallback[key]) {
        delete this._memoryFallback[key];
        console.log(`[Storage] 메모리 폴백에서도 삭제: ${key}`);
      }
      
      return true;
    } catch (error) {
      console.error(`[Storage] 삭제 실패: ${key}`, error);
      
      // 에러가 발생해도 메모리 폴백에서는 삭제 시도
      if (this._memoryFallback && this._memoryFallback[key]) {
        delete this._memoryFallback[key];
      }
      
      return false;
    }
  }

  // ============== 토큰 관련 메서드 ==============

  async getToken() {
    console.log('[Storage] 토큰 조회 시작');
    const token = await this._safeGetItem(KEYS.TOKEN);
    console.log('[Storage] 토큰 조회 결과:', token ? '있음' : '없음');
    return token;
  }

  async setToken(token) {
    console.log('[Storage] 토큰 저장 시작');
    if (!token) {
      throw new Error('토큰이 없습니다');
    }
    const result = await this._safeSetItem(KEYS.TOKEN, token);
    console.log('[Storage] 토큰 저장 결과:', result);
    return result;
  }

  async removeToken() {
    return await this._safeRemoveItem(KEYS.TOKEN);
  }

  // ============== 사용자 정보 관련 메서드 ==============

  async getUserInfo() {
    const data = await this._safeGetItem(KEYS.USER_INFO);
    return data ? JSON.parse(data) : null;
  }

  async setUserInfo(userInfo) {
    if (!userInfo) {
      throw new Error('사용자 정보가 없습니다');
    }
    return await this._safeSetItem(KEYS.USER_INFO, JSON.stringify(userInfo));
  }

  async removeUserInfo() {
    return await this._safeRemoveItem(KEYS.USER_INFO);
  }

  // ============== 운행 관련 메서드 ==============

  async getCurrentDrive() {
    const data = await this._safeGetItem(KEYS.CURRENT_DRIVE);
    return data ? JSON.parse(data) : null;
  }

  async setCurrentDrive(drive) {
    return await this._safeSetItem(KEYS.CURRENT_DRIVE, JSON.stringify(drive));
  }

  async removeCurrentDrive() {
    return await this._safeRemoveItem(KEYS.CURRENT_DRIVE);
  }

  async getCompletedDrive() {
    const data = await this._safeGetItem(KEYS.COMPLETED_DRIVE);
    return data ? JSON.parse(data) : null;
  }

  async setCompletedDrive(drive) {
    return await this._safeSetItem(KEYS.COMPLETED_DRIVE, JSON.stringify(drive));
  }

  async getDriveSchedules() {
    const data = await this._safeGetItem(KEYS.DRIVE_SCHEDULES);
    return data ? JSON.parse(data) : [];
  }

  async setDriveSchedules(schedules) {
    return await this._safeSetItem(KEYS.DRIVE_SCHEDULES, JSON.stringify(schedules));
  }

  async getDriveHistory() {
    const data = await this._safeGetItem(KEYS.DRIVE_HISTORY);
    return data ? JSON.parse(data) : [];
  }

  async setDriveHistory(history) {
    return await this._safeSetItem(KEYS.DRIVE_HISTORY, JSON.stringify(history));
  }

  // ============== 동기화 & 추가 정보 관련 메서드 ==============

  async getLastSync() {
    const data = await this._safeGetItem(KEYS.LAST_SYNC);
    return data ? new Date(data) : null;
  }

  async setLastSync(dateString) {
    return await this._safeSetItem(KEYS.LAST_SYNC, dateString);
  }

  async getHasAdditionalInfo() {
    const data = await this._safeGetItem(KEYS.HAS_ADDITIONAL_INFO);
    return data === 'true';
  }

  async setHasAdditionalInfo(hasInfo) {
    return await this._safeSetItem(KEYS.HAS_ADDITIONAL_INFO, hasInfo ? 'true' : 'false');
  }

  // ============== 유틸리티 메서드 ==============

  async clearUserData() {
    console.log('[Storage] 사용자 데이터 삭제 시작');
    
    const userKeys = [
      KEYS.TOKEN,
      KEYS.USER_INFO,
      KEYS.CURRENT_DRIVE,
      KEYS.COMPLETED_DRIVE,
      KEYS.LAST_SYNC,
      KEYS.HAS_ADDITIONAL_INFO
    ];
    
    // 각각 개별적으로 삭제 (multiRemove 대신)
    for (const key of userKeys) {
      await this._safeRemoveItem(key);
      // 메모리 폴백에서도 삭제
      if (this._memoryFallback && this._memoryFallback[key]) {
        delete this._memoryFallback[key];
      }
    }
    
    console.log('[Storage] 사용자 데이터 삭제 완료');
    return true;
  }

  async clearAllData() {
    try {
      console.log('[Storage] 전체 데이터 삭제 시작');
      await AsyncStorage.clear();
      this.isInitialized = false;
      this.isInitializing = false;
      this._memoryFallback = {}; // 메모리 폴백 초기화
      console.log('[Storage] 전체 데이터 삭제 완료');
      
      // 재초기화
      await this.initialize();
    } catch (error) {
      console.error('[Storage] 전체 데이터 삭제 오류:', error);
      throw error;
    }
  }

  async debugStorageState() {
    const allKeys = await AsyncStorage.getAllKeys();
    const allData = {};
    
    for (const key of allKeys) {
      try {
        const value = await AsyncStorage.getItem(key);
        allData[key] = value?.substring(0, 100) + (value?.length > 100 ? '...' : '');
      } catch (error) {
        allData[key] = `Error: ${error.message}`;
      }
    }
    
    console.log('[Storage Debug] 전체 데이터:', allData);
    return allData;
  }
}