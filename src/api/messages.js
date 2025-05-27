// src/api/messages.js
import apiClient from './client';

export const messagesAPI = {
  /**
   * 메시지 목록 조회
   * @param {Object} params 조회 파라미터 (page, limit, filter)
   */
  getMessages: (params = {}) => {
    return apiClient.get('/api/messages', { params });
  },

  /**
   * 메시지 상세 조회
   * @param {string} messageId 메시지 ID
   */
  getMessageDetail: (messageId) => {
    return apiClient.get(`/api/messages/${messageId}`);
  },

  /**
   * 메시지 검색
   * @param {Object} params 검색 파라미터 (keyword)
   */
  searchMessages: (params) => {
    return apiClient.get('/api/messages/search', { params });
  },

  /**
   * 읽지 않은 메시지 개수 조회
   */
  getUnreadCount: () => {
    return apiClient.get('/api/messages/unread-count');
  },

  /**
   * 메시지 읽음 처리
   * @param {string} messageId 메시지 ID
   */
  markAsRead: (messageId) => {
    return apiClient.put(`/api/messages/${messageId}/read`);
  },

  /**
   * 메시지 삭제
   * @param {string} messageId 메시지 ID
   */
  deleteMessage: (messageId) => {
    return apiClient.delete(`/api/messages/${messageId}`);
  },

  /**
   * 메시지 답장 전송
   * @param {string} messageId 원본 메시지 ID
   * @param {Object} data 답장 데이터
   */
  sendReply: (messageId, data) => {
    return apiClient.post(`/api/messages/${messageId}/reply`, data);
  },

  /**
   * 중요 메시지 표시/해제
   * @param {string} messageId 메시지 ID
   * @param {Object} data 중요 표시 데이터
   */
  toggleImportant: (messageId, data) => {
    return apiClient.put(`/api/messages/${messageId}/important`, data);
  }
};