// src/api/notifications.js
import apiClient from './client';

export const notificationsAPI = {
  /**
   * 알림 목록 조회
   */
  getNotifications: () => {
    return apiClient.get('/api/notifications');
  },

  /**
   * 읽지 않은 알림 개수 조회
   */
  getUnreadCount: () => {
    return apiClient.get('/api/notifications/unread-count');
  },

  /**
   * 모든 알림을 읽음으로 표시
   */
  markAllAsRead: () => {
    return apiClient.post('/api/notifications/mark-read');
  },

  /**
   * 특정 알림을 읽음으로 표시
   * @param {string} notificationId 알림 ID
   */
  markAsRead: (notificationId) => {
    return apiClient.put(`/api/notifications/${notificationId}/read`);
  },

  /**
   * 특정 알림 삭제
   * @param {string} notificationId 알림 ID
   */
  deleteNotification: (notificationId) => {
    return apiClient.delete(`/api/notifications/${notificationId}`);
  },

  /**
   * 알림 설정 조회
   */
  getSettings: () => {
    return apiClient.get('/api/notifications/settings');
  },

  /**
   * 알림 설정 업데이트
   * @param {Object} settings 업데이트할 설정
   */
  updateSettings: (settings) => {
    return apiClient.put('/api/notifications/settings', settings);
  },

  /**
   * 푸시 토큰 등록
   * @param {Object} data 토큰 데이터 (token, platform)
   */
  registerPushToken: (data) => {
    return apiClient.post('/api/notifications/push-token', data);
  }
};