// src/services/notificationService.js
import apiClient from '../api/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 알림 목록 조회
 * @returns {Promise<Array>} 알림 목록
 */
export const getNotifications = async () => {
  try {
    const response = await apiClient.get('/api/notifications');
    
    if (response.data?.data) {
      const notifications = response.data.data;
      
      // 읽지 않은 알림 개수 저장
      const unreadCount = notifications.filter(n => n.unread).length;
      await AsyncStorage.setItem('unreadNotificationCount', String(unreadCount));
      
      return notifications;
    }
    
    return [];
  } catch (error) {
    console.error('[NotificationService] 알림 조회 오류:', error);
    return [];
  }
};

/**
 * 읽지 않은 알림 개수 조회
 * @returns {Promise<number>} 읽지 않은 알림 개수
 */
export const getUnreadCount = async () => {
  try {
    const response = await apiClient.get('/api/notifications/unread-count');
    const count = response.data?.data?.count || 0;
    
    // 로컬 저장소에도 저장
    await AsyncStorage.setItem('unreadNotificationCount', String(count));
    
    return count;
  } catch (error) {
    console.error('[NotificationService] 읽지 않은 알림 개수 조회 오류:', error);
    
    // 오류 시 로컬 저장소에서 가져오기
    const cachedCount = await AsyncStorage.getItem('unreadNotificationCount');
    return cachedCount ? parseInt(cachedCount, 10) : 0;
  }
};

/**
 * 모든 알림을 읽음으로 표시
 * @returns {Promise<Object>} 처리 결과
 */
export const markAllAsRead = async () => {
  try {
    const response = await apiClient.post('/api/notifications/mark-read');
    
    // 성공 시 로컬 카운트 초기화
    await AsyncStorage.setItem('unreadNotificationCount', '0');
    
    return {
      success: true,
      message: response.data?.message || '모든 알림이 읽음 처리되었습니다.'
    };
  } catch (error) {
    console.error('[NotificationService] 알림 읽음 처리 오류:', error);
    return {
      success: false,
      message: error.response?.data?.message || '알림 읽음 처리 중 오류가 발생했습니다.'
    };
  }
};

/**
 * 특정 알림을 읽음으로 표시
 * @param {string} notificationId - 알림 ID
 * @returns {Promise<Object>} 처리 결과
 */
export const markAsRead = async (notificationId) => {
  try {
    const response = await apiClient.put(`/api/notifications/${notificationId}/read`);
    
    // 읽지 않은 개수 업데이트
    const currentCount = await AsyncStorage.getItem('unreadNotificationCount');
    if (currentCount && parseInt(currentCount, 10) > 0) {
      await AsyncStorage.setItem('unreadNotificationCount', String(parseInt(currentCount, 10) - 1));
    }
    
    return {
      success: true,
      message: response.data?.message || '알림이 읽음 처리되었습니다.'
    };
  } catch (error) {
    console.error('[NotificationService] 개별 알림 읽음 처리 오류:', error);
    return {
      success: false,
      message: error.response?.data?.message || '알림 읽음 처리 중 오류가 발생했습니다.'
    };
  }
};

/**
 * 특정 알림 삭제
 * @param {string} notificationId - 알림 ID
 * @returns {Promise<Object>} 처리 결과
 */
export const deleteNotification = async (notificationId) => {
  try {
    const response = await apiClient.delete(`/api/notifications/${notificationId}`);
    return {
      success: true,
      message: response.data?.message || '알림이 삭제되었습니다.'
    };
  } catch (error) {
    console.error('[NotificationService] 알림 삭제 오류:', error);
    return {
      success: false,
      message: error.response?.data?.message || '알림 삭제 중 오류가 발생했습니다.'
    };
  }
};

/**
 * 알림 설정 조회
 * @returns {Promise<Object>} 알림 설정 정보
 */
export const getNotificationSettings = async () => {
  try {
    const response = await apiClient.get('/api/notifications/settings');
    return response.data?.data || {
      pushEnabled: true,
      scheduleAlerts: true,
      messageAlerts: true,
      systemAlerts: true
    };
  } catch (error) {
    console.error('[NotificationService] 알림 설정 조회 오류:', error);
    
    // 기본 설정 반환
    return {
      pushEnabled: true,
      scheduleAlerts: true,
      messageAlerts: true,
      systemAlerts: true
    };
  }
};

/**
 * 알림 설정 업데이트
 * @param {Object} settings - 업데이트할 설정
 * @returns {Promise<Object>} 처리 결과
 */
export const updateNotificationSettings = async (settings) => {
  try {
    const response = await apiClient.put('/api/notifications/settings', settings);
    return {
      success: true,
      message: response.data?.message || '알림 설정이 업데이트되었습니다.',
      data: response.data?.data
    };
  } catch (error) {
    console.error('[NotificationService] 알림 설정 업데이트 오류:', error);
    return {
      success: false,
      message: error.response?.data?.message || '알림 설정 업데이트 중 오류가 발생했습니다.'
    };
  }
};

/**
 * 푸시 토큰 등록
 * @param {string} token - FCM 또는 APNs 토큰
 * @param {string} platform - 플랫폼 (ios/android)
 * @returns {Promise<Object>} 처리 결과
 */
export const registerPushToken = async (token, platform) => {
  try {
    const response = await apiClient.post('/api/notifications/push-token', {
      token,
      platform
    });
    
    // 토큰 로컬 저장
    await AsyncStorage.setItem('pushToken', token);
    
    return {
      success: true,
      message: response.data?.message || '푸시 토큰이 등록되었습니다.'
    };
  } catch (error) {
    console.error('[NotificationService] 푸시 토큰 등록 오류:', error);
    return {
      success: false,
      message: error.response?.data?.message || '푸시 토큰 등록 중 오류가 발생했습니다.'
    };
  }
};