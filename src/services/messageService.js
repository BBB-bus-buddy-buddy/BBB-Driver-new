// src/services/messageService.js
import apiClient from '../api/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 메시지 목록 조회
 * @param {Object} options - 조회 옵션 (page, limit, filter)
 * @returns {Promise<Array>} 메시지 목록
 */
export const getMessages = async (options = {}) => {
  try {
    const { page = 1, limit = 20, filter = 'all' } = options;
    
    const response = await apiClient.get('/api/messages', {
      params: { page, limit, filter }
    });
    
    if (response.data?.data) {
      const messages = response.data.data;
      
      // 캐시 저장
      await AsyncStorage.setItem('cachedMessages', JSON.stringify(messages));
      
      return messages;
    }
    
    return [];
  } catch (error) {
    console.error('[MessageService] 메시지 목록 조회 오류:', error);
    
    // 오류 시 캐시된 데이터 반환
    try {
      const cached = await AsyncStorage.getItem('cachedMessages');
      return cached ? JSON.parse(cached) : [];
    } catch (cacheError) {
      return [];
    }
  }
};

/**
 * 메시지 상세 조회
 * @param {string} messageId - 메시지 ID
 * @returns {Promise<Object>} 메시지 상세 정보
 */
export const getMessageDetail = async (messageId) => {
  try {
    const response = await apiClient.get(`/api/messages/${messageId}`);
    
    if (response.data?.data) {
      // 조회 시 자동으로 읽음 처리
      await markMessageAsRead(messageId);
      return response.data.data;
    }
    
    return null;
  } catch (error) {
    console.error('[MessageService] 메시지 상세 조회 오류:', error);
    return null;
  }
};

/**
 * 메시지 읽음 처리
 * @param {string} messageId - 메시지 ID
 * @returns {Promise<Object>} 처리 결과
 */
export const markMessageAsRead = async (messageId) => {
  try {
    const response = await apiClient.put(`/api/messages/${messageId}/read`);
    
    return {
      success: true,
      message: response.data?.message || '메시지를 읽음 처리했습니다.'
    };
  } catch (error) {
    console.error('[MessageService] 메시지 읽음 처리 오류:', error);
    return {
      success: false,
      message: error.response?.data?.message || '읽음 처리 중 오류가 발생했습니다.'
    };
  }
};

/**
 * 메시지 삭제
 * @param {string} messageId - 메시지 ID
 * @returns {Promise<Object>} 처리 결과
 */
export const deleteMessage = async (messageId) => {
  try {
    const response = await apiClient.delete(`/api/messages/${messageId}`);
    
    return {
      success: true,
      message: response.data?.message || '메시지가 삭제되었습니다.'
    };
  } catch (error) {
    console.error('[MessageService] 메시지 삭제 오류:', error);
    return {
      success: false,
      message: error.response?.data?.message || '메시지 삭제 중 오류가 발생했습니다.'
    };
  }
};

/**
 * 메시지 검색
 * @param {string} keyword - 검색어
 * @returns {Promise<Array>} 검색 결과
 */
export const searchMessages = async (keyword) => {
  try {
    const response = await apiClient.get('/api/messages/search', {
      params: { keyword }
    });
    
    return response.data?.data || [];
  } catch (error) {
    console.error('[MessageService] 메시지 검색 오류:', error);
    return [];
  }
};

/**
 * 읽지 않은 메시지 개수 조회
 * @returns {Promise<number>} 읽지 않은 메시지 개수
 */
export const getUnreadMessageCount = async () => {
  try {
    const response = await apiClient.get('/api/messages/unread-count');
    const count = response.data?.data?.count || 0;
    
    // 로컬 저장
    await AsyncStorage.setItem('unreadMessageCount', String(count));
    
    return count;
  } catch (error) {
    console.error('[MessageService] 읽지 않은 메시지 개수 조회 오류:', error);
    
    // 오류 시 캐시된 값 반환
    const cached = await AsyncStorage.getItem('unreadMessageCount');
    return cached ? parseInt(cached, 10) : 0;
  }
};

/**
 * 메시지 답장 전송
 * @param {string} messageId - 원본 메시지 ID
 * @param {string} content - 답장 내용
 * @returns {Promise<Object>} 전송 결과
 */
export const sendReply = async (messageId, content) => {
  try {
    const response = await apiClient.post(`/api/messages/${messageId}/reply`, {
      content
    });
    
    return {
      success: true,
      message: response.data?.message || '답장이 전송되었습니다.',
      data: response.data?.data
    };
  } catch (error) {
    console.error('[MessageService] 답장 전송 오류:', error);
    return {
      success: false,
      message: error.response?.data?.message || '답장 전송 중 오류가 발생했습니다.'
    };
  }
};

/**
 * 중요 메시지 표시/해제
 * @param {string} messageId - 메시지 ID
 * @param {boolean} isImportant - 중요 표시 여부
 * @returns {Promise<Object>} 처리 결과
 */
export const toggleImportant = async (messageId, isImportant) => {
  try {
    const response = await apiClient.put(`/api/messages/${messageId}/important`, {
      isImportant
    });
    
    return {
      success: true,
      message: response.data?.message || isImportant ? '중요 메시지로 표시했습니다.' : '중요 표시를 해제했습니다.'
    };
  } catch (error) {
    console.error('[MessageService] 중요 표시 토글 오류:', error);
    return {
      success: false,
      message: error.response?.data?.message || '처리 중 오류가 발생했습니다.'
    };
  }
};