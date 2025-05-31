// src/constants/apiEndpoints.js
import { API_URL_LOCAL, API_URL_PROD } from '@env';

/**
 * API 엔드포인트 중앙 관리
 * 모든 API URL을 한 곳에서 관리하여 유지보수성 향상
 */

const API_BASE = API_URL_LOCAL;

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    GET_USER: `${API_BASE}/auth/user`,
    LOGOUT: `${API_BASE}/auth/logout`,
    DRIVER_VERIFY_AND_RANKUP: `${API_BASE}/auth/driver-verify-and-rankup`,
    UPGRADE_TO_DRIVER: `${API_BASE}/auth/upgrade-to-driver`,
  },

  // Driver
  DRIVER: {
    VERIFY_LICENSE: `${API_BASE}/driver/verify`,
    START_DRIVE: `${API_BASE}/drives/start`,
    END_DRIVE: `${API_BASE}/drives/end`,
    GET_NEXT_DRIVE: `${API_BASE}/drives/next`,
    GET_USER_STATS: `${API_BASE}/user/stats`,
    UPDATE_PROFILE: `${API_BASE}/user/profile`,
    UPDATE_LICENSE: `${API_BASE}/user/license`,
    CHECK_LICENSE_VERIFICATION: `${API_BASE}/user/license/verification-status`,
  },

  // Organization
  ORGANIZATION: {
    VERIFY: `${API_BASE}/organization/verify`,
  },

  // Schedule
  SCHEDULE: {
    GET_ALL: `${API_BASE}/schedules`,
    GET_BY_DATE: (date) => `${API_BASE}/schedules/date/${date}`,
    GET_WEEKLY: `${API_BASE}/schedules/weekly`,
    GET_MONTHLY: `${API_BASE}/schedules/monthly`,
    GET_DETAIL: (scheduleId) => `${API_BASE}/schedules/${scheduleId}`,
    REQUEST_CHANGE: (scheduleId) => `${API_BASE}/schedules/${scheduleId}/change-request`,
    GET_TODAY: `${API_BASE}/schedules/today`,
    GET_BY_DRIVER: (driverId) => `${API_BASE}/schedules/driver/${driverId}`,
  },

  // Messages
  MESSAGES: {
    GET_ALL: `${API_BASE}/messages`,
    GET_DETAIL: (messageId) => `${API_BASE}/messages/${messageId}`,
    SEARCH: `${API_BASE}/messages/search`,
    GET_UNREAD_COUNT: `${API_BASE}/messages/unread-count`,
    MARK_AS_READ: (messageId) => `${API_BASE}/messages/${messageId}/read`,
    DELETE: (messageId) => `${API_BASE}/messages/${messageId}`,
    SEND_REPLY: (messageId) => `${API_BASE}/messages/${messageId}/reply`,
    TOGGLE_IMPORTANT: (messageId) => `${API_BASE}/messages/${messageId}/important`,
  },

  // Notifications
  NOTIFICATIONS: {
    GET_ALL: `${API_BASE}/notifications`,
    GET_UNREAD_COUNT: `${API_BASE}/notifications/unread-count`,
    MARK_ALL_AS_READ: `${API_BASE}/notifications/mark-read`,
    MARK_AS_READ: (notificationId) => `${API_BASE}/notifications/${notificationId}/read`,
    DELETE: (notificationId) => `${API_BASE}/notifications/${notificationId}`,
    GET_SETTINGS: `${API_BASE}/notifications/settings`,
    UPDATE_SETTINGS: `${API_BASE}/notifications/settings`,
    REGISTER_PUSH_TOKEN: `${API_BASE}/notifications/push-token`,
  },
};

// Helper function to build URL with query parameters
export const buildUrlWithParams = (baseUrl, params) => {
  if (!params || Object.keys(params).length === 0) {
    return baseUrl;
  }
  
  const queryString = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  
  return `${baseUrl}${queryString ? `?${queryString}` : ''}`;
};