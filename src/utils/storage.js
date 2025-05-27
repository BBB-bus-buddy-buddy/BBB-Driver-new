// src/utils/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TOKEN: 'token',
  USER_INFO: 'userInfo',
  CURRENT_DRIVE: 'currentDriveStatus',
  DRIVE_SCHEDULES: 'driveSchedules', 
  DRIVE_HISTORY: 'driveHistory',
  CACHED_MESSAGES: 'cachedMessages',
  UNREAD_MESSAGE_COUNT: 'unreadMessageCount',
  UNREAD_NOTIFICATION_COUNT: 'unreadNotificationCount',
  LAST_SYNC: 'lastUserSync',
  HAS_ADDITIONAL_INFO: 'hasAdditionalInfo',
  COMPLETED_DRIVE: 'completedDrive'
};

export const storage = {
  // Token 관련
  async getToken() {
    try {
      return await AsyncStorage.getItem(KEYS.TOKEN);
    } catch (error) {
      console.error('토큰 조회 오류:', error);
      return null;
    }
  },

  async setToken(token) {
    try {
      await AsyncStorage.setItem(KEYS.TOKEN, token);
      return true;
    } catch (error) {
      console.error('토큰 저장 오류:', error);
      return false;
    }
  },

  async removeToken() {
    try {
      await AsyncStorage.removeItem(KEYS.TOKEN);
    } catch (error) {
      console.error('토큰 삭제 오류:', error);
    }
  },

  // User Info 관련
  async getUserInfo() {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER_INFO);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('사용자 정보 조회 오류:', error);
      return null;
    }
  },

  async setUserInfo(userInfo) {
    try {
      await AsyncStorage.setItem(KEYS.USER_INFO, JSON.stringify(userInfo));
    } catch (error) {
      console.error('사용자 정보 저장 오류:', error);
    }
  },

  async removeUserInfo() {
    try {
      await AsyncStorage.removeItem(KEYS.USER_INFO);
    } catch (error) {
      console.error('사용자 정보 삭제 오류:', error);
    }
  },

  // Drive 관련
  async getCurrentDrive() {
    try {
      const data = await AsyncStorage.getItem(KEYS.CURRENT_DRIVE);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('현재 운행 정보 조회 오류:', error);
      return null;
    }
  },

  async setCurrentDrive(drive) {
    try {
      await AsyncStorage.setItem(KEYS.CURRENT_DRIVE, JSON.stringify(drive));
    } catch (error) {
      console.error('현재 운행 정보 저장 오류:', error);
    }
  },

  async removeCurrentDrive() {
    try {
      await AsyncStorage.removeItem(KEYS.CURRENT_DRIVE);
    } catch (error) {
      console.error('현재 운행 정보 삭제 오류:', error);
    }
  },

  async getCompletedDrive() {
    try {
      const data = await AsyncStorage.getItem(KEYS.COMPLETED_DRIVE);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('완료된 운행 정보 조회 오류:', error);
      return null;
    }
  },

  async setCompletedDrive(drive) {
    try {
      await AsyncStorage.setItem(KEYS.COMPLETED_DRIVE, JSON.stringify(drive));
    } catch (error) {
      console.error('완료된 운행 정보 저장 오류:', error);
    }
  },

  async getDriveSchedules() {
    try {
      const data = await AsyncStorage.getItem(KEYS.DRIVE_SCHEDULES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('운행 일정 조회 오류:', error);
      return [];
    }
  },

  async setDriveSchedules(schedules) {
    try {
      await AsyncStorage.setItem(KEYS.DRIVE_SCHEDULES, JSON.stringify(schedules));
    } catch (error) {
      console.error('운행 일정 저장 오류:', error);
    }
  },

  async getDriveHistory() {
    try {
      const data = await AsyncStorage.getItem(KEYS.DRIVE_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('운행 히스토리 조회 오류:', error);
      return [];
    }
  },

  async setDriveHistory(history) {
    try {
      await AsyncStorage.setItem(KEYS.DRIVE_HISTORY, JSON.stringify(history));
    } catch (error) {
      console.error('운행 히스토리 저장 오류:', error);
    }
  },

  // Message & Notification 관련
  async getCachedMessages() {
    try {
      const data = await AsyncStorage.getItem(KEYS.CACHED_MESSAGES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('캐시된 메시지 조회 오류:', error);
      return [];
    }
  },

  async setCachedMessages(messages) {
    try {
      await AsyncStorage.setItem(KEYS.CACHED_MESSAGES, JSON.stringify(messages));
    } catch (error) {
      console.error('메시지 캐시 저장 오류:', error);
    }
  },

  async getUnreadMessageCount() {
    try {
      const count = await AsyncStorage.getItem(KEYS.UNREAD_MESSAGE_COUNT);
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      console.error('읽지 않은 메시지 개수 조회 오류:', error);
      return 0;
    }
  },

  async setUnreadMessageCount(count) {
    try {
      await AsyncStorage.setItem(KEYS.UNREAD_MESSAGE_COUNT, String(count));
    } catch (error) {
      console.error('읽지 않은 메시지 개수 저장 오류:', error);
    }
  },

  async getUnreadNotificationCount() {
    try {
      const count = await AsyncStorage.getItem(KEYS.UNREAD_NOTIFICATION_COUNT);
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      console.error('읽지 않은 알림 개수 조회 오류:', error);
      return 0;
    }
  },

  async setUnreadNotificationCount(count) {
    try {
      await AsyncStorage.setItem(KEYS.UNREAD_NOTIFICATION_COUNT, String(count));
    } catch (error) {
      console.error('읽지 않은 알림 개수 저장 오류:', error);
    }
  },

  // Sync & Additional Info
  async getLastSync() {
    try {
      const data = await AsyncStorage.getItem(KEYS.LAST_SYNC);
      return data ? new Date(data) : null;
    } catch (error) {
      console.error('마지막 동기화 시간 조회 오류:', error);
      return null;
    }
  },

  async setLastSync(dateString) {
    try {
      await AsyncStorage.setItem(KEYS.LAST_SYNC, dateString);
    } catch (error) {
      console.error('마지막 동기화 시간 저장 오류:', error);
    }
  },

  async getHasAdditionalInfo() {
    try {
      const data = await AsyncStorage.getItem(KEYS.HAS_ADDITIONAL_INFO);
      return data === 'true';
    } catch (error) {
      console.error('추가 정보 여부 조회 오류:', error);
      return false;
    }
  },

  async setHasAdditionalInfo(hasInfo) {
    try {
      await AsyncStorage.setItem(KEYS.HAS_ADDITIONAL_INFO, hasInfo ? 'true' : 'false');
    } catch (error) {
      console.error('추가 정보 여부 저장 오류:', error);
    }
  },

  // 다중 삭제 메서드
  async clearUserData() {
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
    } catch (error) {
      console.error('[Storage] 사용자 데이터 삭제 오류:', error);
    }
  },

  async clearAllData() {
    try {
      await AsyncStorage.clear();
      console.log('[Storage] 모든 데이터 삭제 완료');
    } catch (error) {
      console.error('[Storage] 전체 데이터 삭제 오류:', error);
    }
  }
};

// 헬퍼 함수들
export const storageHelpers = {
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

  async isLoggedIn() {
    try {
      const token = await storage.getToken();
      const userInfo = await storage.getUserInfo();
      return !!(token && userInfo);
    } catch (error) {
      console.error('로그인 상태 확인 오류:', error);
      return false;
    }
  }
};