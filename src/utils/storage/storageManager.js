import AsyncStorage from '@react-native-async-storage/async-storage';
import { KEYS, CURRENT_STORAGE_VERSION } from './keys';

/**
 * AsyncStorage 관리자 클래스
 * 
 * @description
 * - AsyncStorage의 모든 작업을 중앙에서 관리
 * - 자동 초기화 및 에러 복구 기능 제공
 * - manifest.json 에러 등 iOS 특정 이슈 대응
 * 
 * @example
 * // 사용자 정보 저장
 * await storage.setUserInfo({ name: '홍길동', role: 'ROLE_DRIVER' });
 * 
 * // 사용자 정보 조회
 * const userInfo = await storage.getUserInfo();
 * console.log(userInfo.name); // '홍길동'
 */
export class StorageManager {
  constructor() {
    this.isInitialized = false;
    this.initPromise = null;
  }

  /**
   * 스토리지 초기화
   * 
   * @description
   * - 앱 시작 시 자동으로 호출됨
   * - 필수 디렉토리 구조 생성 및 기본값 설정
   * - 버전 확인 및 마이그레이션 수행
   * 
   * @returns {Promise<boolean>} 초기화 성공 여부
   * @throws {Error} 초기화 실패 시
   */
  async initialize() {
    if (this.isInitialized) return true;
    
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._performInitialization();
    return this.initPromise;
  }

  /**
   * 실제 초기화 수행 (내부 메서드)
   * @private
   */
  async _performInitialization() {
    try {
      console.log('[Storage] 초기화 시작...');
      
      // 스토리지 버전 확인
      const storedVersion = await AsyncStorage.getItem(KEYS.STORAGE_VERSION);
      
      if (storedVersion !== CURRENT_STORAGE_VERSION) {
        console.log('[Storage] 버전 업데이트 필요:', storedVersion, '->', CURRENT_STORAGE_VERSION);
        await this._migrateStorage(storedVersion, CURRENT_STORAGE_VERSION);
      }

      // 필수 키들이 존재하는지 확인하고 없으면 기본값 설정
      const essentialKeys = [
        { key: KEYS.DRIVE_SCHEDULES, defaultValue: '[]' },
        { key: KEYS.DRIVE_HISTORY, defaultValue: '[]' },
        { key: KEYS.CACHED_MESSAGES, defaultValue: '[]' },
        { key: KEYS.UNREAD_MESSAGE_COUNT, defaultValue: '0' },
        { key: KEYS.UNREAD_NOTIFICATION_COUNT, defaultValue: '0' }
      ];

      for (const { key, defaultValue } of essentialKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value === null) {
          await AsyncStorage.setItem(key, defaultValue);
          console.log(`[Storage] 기본값 설정: ${key}`);
        }
      }

      // 버전 저장
      await AsyncStorage.setItem(KEYS.STORAGE_VERSION, CURRENT_STORAGE_VERSION);

      this.isInitialized = true;
      console.log('[Storage] 초기화 완료');
      return true;
    } catch (error) {
      console.error('[Storage] 초기화 실패:', error);
      this.initPromise = null;
      throw error;
    }
  }

  /**
   * 스토리지 마이그레이션
   * @private
   * @param {string} fromVersion - 이전 버전
   * @param {string} toVersion - 새 버전
   */
  async _migrateStorage(fromVersion, toVersion) {
    console.log(`[Storage] 마이그레이션: ${fromVersion} -> ${toVersion}`);
    // 향후 버전 업데이트 시 마이그레이션 로직 추가
    // 예: 데이터 구조 변경, 키 이름 변경 등
  }

  /**
   * 안전한 저장 메서드 (재시도 로직 포함)
   * @private
   * @param {string} key - 저장할 키
   * @param {string} value - 저장할 값 (문자열)
   * @param {number} retries - 재시도 횟수
   * @returns {Promise<boolean>} 저장 성공 여부
   */
  async _safeSetItem(key, value, retries = 3) {
    await this.initialize();

    for (let i = 0; i < retries; i++) {
      try {
        await AsyncStorage.setItem(key, value);
        return true;
      } catch (error) {
        console.error(`[Storage] 저장 실패 (시도 ${i + 1}/${retries}):`, key, error);
        
        if (error.message?.includes('manifest.json') && i < retries - 1) {
          // manifest.json 에러인 경우 짧은 대기 후 재시도
          await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
          continue;
        }
        
        if (i === retries - 1) throw error;
      }
    }
  }

  /**
   * 안전한 조회 메서드
   * @private
   * @param {string} key - 조회할 키
   * @returns {Promise<string|null>} 저장된 값 또는 null
   */
  async _safeGetItem(key) {
    await this.initialize();
    
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`[Storage] 조회 실패: ${key}`, error);
      return null;
    }
  }

  /**
   * 안전한 삭제 메서드
   * @private
   * @param {string} key - 삭제할 키
   * @returns {Promise<boolean>} 삭제 성공 여부
   */
  async _safeRemoveItem(key) {
    await this.initialize();
    
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`[Storage] 삭제 실패: ${key}`, error);
      return false;
    }
  }

  // ============== 토큰 관련 메서드 ==============

  /**
   * 인증 토큰 조회
   */
  async getToken() {
    const token = await this._safeGetItem(KEYS.TOKEN);
    return token;
  }

  /**
   * 인증 토큰 저장
   */
  async setToken(token) {
    return await this._safeSetItem(KEYS.TOKEN, token);
  }

  /**
   * 인증 토큰 삭제
   */
  async removeToken() {
    return await this._safeRemoveItem(KEYS.TOKEN);
  }

  // ============== 사용자 정보 관련 메서드 ==============

  /**
   * 사용자 정보 조회
   */
  async getUserInfo() {
    const data = await this._safeGetItem(KEYS.USER_INFO);
    return data ? JSON.parse(data) : null;
  }

  /**
   * 사용자 정보 저장
   */
  async setUserInfo(userInfo) {
    return await this._safeSetItem(KEYS.USER_INFO, JSON.stringify(userInfo));
  }

  /**
   * 사용자 정보 삭제
   */
  async removeUserInfo() {
    return await this._safeRemoveItem(KEYS.USER_INFO);
  }

  // ============== 운행 관련 메서드 ==============

  /**
   * 현재 진행 중인 운행 정보 조회
   */
  async getCurrentDrive() {
    const data = await this._safeGetItem(KEYS.CURRENT_DRIVE);
    return data ? JSON.parse(data) : null;
  }

  /**
   * 현재 운행 정보 저장
   */
  async setCurrentDrive(drive) {
    return await this._safeSetItem(KEYS.CURRENT_DRIVE, JSON.stringify(drive));
  }

  /**
   * 현재 운행 정보 삭제
   */
  async removeCurrentDrive() {
    return await this._safeRemoveItem(KEYS.CURRENT_DRIVE);
  }

  /**
   * 마지막 완료된 운행 정보 조회
   */
  async getCompletedDrive() {
    const data = await this._safeGetItem(KEYS.COMPLETED_DRIVE);
    return data ? JSON.parse(data) : null;
  }

  /**
   * 완료된 운행 정보 저장
   */
  async setCompletedDrive(drive) {
    return await this._safeSetItem(KEYS.COMPLETED_DRIVE, JSON.stringify(drive));
  }

  /**
   * 운행 일정 목록 조회
   */
  async getDriveSchedules() {
    const data = await this._safeGetItem(KEYS.DRIVE_SCHEDULES);
    return data ? JSON.parse(data) : [];
  }

  /**
   * 운행 일정 저장
   */
  async setDriveSchedules(schedules) {
    return await this._safeSetItem(KEYS.DRIVE_SCHEDULES, JSON.stringify(schedules));
  }

  /**
   * 운행 기록 조회
   */
  async getDriveHistory() {
    const data = await this._safeGetItem(KEYS.DRIVE_HISTORY);
    return data ? JSON.parse(data) : [];
  }

  /**
   * 운행 기록 저장
   */
  async setDriveHistory(history) {
    return await this._safeSetItem(KEYS.DRIVE_HISTORY, JSON.stringify(history));
  }

  // ============== 메시지 & 알림 관련 메서드 ==============

  /**
   * 캐시된 메시지 목록 조회
   */
  async getCachedMessages() {
    const data = await this._safeGetItem(KEYS.CACHED_MESSAGES);
    return data ? JSON.parse(data) : [];
  }

  /**
   * 메시지 목록 캐싱
   */
  async setCachedMessages(messages) {
    return await this._safeSetItem(KEYS.CACHED_MESSAGES, JSON.stringify(messages));
  }

  /**
   * 읽지 않은 메시지 개수 조회
   */
  async getUnreadMessageCount() {
    const count = await this._safeGetItem(KEYS.UNREAD_MESSAGE_COUNT);
    return count ? parseInt(count, 10) : 0;
  }

  /**
   * 읽지 않은 메시지 개수 저장
   */
  async setUnreadMessageCount(count) {
    return await this._safeSetItem(KEYS.UNREAD_MESSAGE_COUNT, String(count));
  }

  /**
   * 읽지 않은 알림 개수 조회
   */
  async getUnreadNotificationCount() {
    const count = await this._safeGetItem(KEYS.UNREAD_NOTIFICATION_COUNT);
    return count ? parseInt(count, 10) : 0;
  }

  /**
   * 읽지 않은 알림 개수 저장
   */
  async setUnreadNotificationCount(count) {
    return await this._safeSetItem(KEYS.UNREAD_NOTIFICATION_COUNT, String(count));
  }

  // ============== 동기화 & 추가 정보 관련 메서드 ==============

  /**
   * 마지막 동기화 시간 조회
   */
  async getLastSync() {
    const data = await this._safeGetItem(KEYS.LAST_SYNC);
    return data ? new Date(data) : null;
  }

  /**
   * 마지막 동기화 시간 저장
   */
  async setLastSync(dateString) {
    return await this._safeSetItem(KEYS.LAST_SYNC, dateString);
  }

  /**
   * 추가 정보 입력 완료 여부 조회
   */
  async getHasAdditionalInfo() {
    const data = await this._safeGetItem(KEYS.HAS_ADDITIONAL_INFO);
    return data === 'true';
  }

  /**
   * 추가 정보 입력 완료 여부 저장
   */
  async setHasAdditionalInfo(hasInfo) {
    return await this._safeSetItem(KEYS.HAS_ADDITIONAL_INFO, hasInfo ? 'true' : 'false');
  }

  // ============== 유틸리티 메서드 ==============

  /**
   * 사용자 관련 데이터 전체 삭제
   * 
   * @description 로그아웃 시 사용자 관련 모든 데이터 제거
   * @usage AuthService.logout()에서 호출
   */
  async clearUserData() {
    await this.initialize();
    
    try {
      const userKeys = [
        KEYS.TOKEN,
        KEYS.USER_INFO,
        KEYS.CURRENT_DRIVE,
        KEYS.COMPLETED_DRIVE,
        KEYS.CACHED_MESSAGES,
        KEYS.UNREAD_MESSAGE_COUNT,
        KEYS.UNREAD_NOTIFICATION_COUNT,
        KEYS.LAST_SYNC,
        KEYS.HAS_ADDITIONAL_INFO
      ];
      
      await AsyncStorage.multiRemove(userKeys);
      console.log('[Storage] 사용자 데이터 삭제 완료');
      
      // 필수 키들 재초기화
      await this._safeSetItem(KEYS.CACHED_MESSAGES, '[]');
      await this._safeSetItem(KEYS.UNREAD_MESSAGE_COUNT, '0');
      await this._safeSetItem(KEYS.UNREAD_NOTIFICATION_COUNT, '0');
      
    } catch (error) {
      console.error('[Storage] 사용자 데이터 삭제 오류:', error);
      throw error;
    }
  }

  /**
   * 모든 데이터 삭제
   * 
   * @description 앱 초기화 또는 디버깅 시 사용
   * @warning 모든 데이터가 삭제되므로 주의 필요
   */
  async clearAllData() {
    try {
      await AsyncStorage.clear();
      this.isInitialized = false;
      this.initPromise = null;
      console.log('[Storage] 모든 데이터 삭제 완료');
      
      // 재초기화
      await this.initialize();
    } catch (error) {
      console.error('[Storage] 전체 데이터 삭제 오류:', error);
      throw error;
    }
  }

  /**
   * 스토리지 상태 디버깅
   * 
   * @description 현재 저장된 모든 데이터 확인 (개발용)
   */
  async debugStorageState() {
    const allKeys = await AsyncStorage.getAllKeys();
    const allData = {};
    
    for (const key of allKeys) {
      try {
        const value = await AsyncStorage.getItem(key);
        allData[key] = value;
      } catch (error) {
        allData[key] = `Error: ${error.message}`;
      }
    }
    
    console.log('[Storage Debug] 전체 데이터:', allData);
    return allData;
  }
}