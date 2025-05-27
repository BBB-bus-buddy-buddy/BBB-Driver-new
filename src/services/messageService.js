// src/services/messageService.js
import { messagesAPI } from '../api';
import { storage } from '../utils/storage';

export class MessageService {
  /**
   * 메시지 목록 조회 (기존 getMessages)
   */
  static async getMessages(options = {}) {
    try {
      const { page = 1, limit = 20, filter = 'all' } = options;

      const response = await messagesAPI.getMessages({ page, limit, filter });

      if (response.data?.data) {
        const messages = response.data.data;

        // 캐시 저장
        await storage.setCachedMessages(messages);

        return messages;
      }

      return [];
    } catch (error) {
      console.error('[MessageService] 메시지 목록 조회 오류:', error);

      // 오류 시 캐시된 데이터 반환
      try {
        return await storage.getCachedMessages();
      } catch (cacheError) {
        return [];
      }
    }
  }

  /**
   * 메시지 상세 조회 (기존 getMessageDetail)
   */
  static async getMessageDetail(messageId) {
    try {
      const response = await messagesAPI.getMessageDetail(messageId);

      if (response.data?.data) {
        // 조회 시 자동으로 읽음 처리
        await this.markMessageAsRead(messageId);
        return response.data.data;
      }

      return null;
    } catch (error) {
      console.error('[MessageService] 메시지 상세 조회 오류:', error);
      return null;
    }
  }

  /**
   * 메시지 읽음 처리 (기존 markMessageAsRead)
   */
  static async markMessageAsRead(messageId) {
    try {
      const response = await messagesAPI.markAsRead(messageId);

      // 로컬 캐시 업데이트
      const messages = await storage.getCachedMessages();
      const updatedMessages = messages.map(msg =>
        msg.id === messageId ? { ...msg, unread: false } : msg
      );
      await storage.setCachedMessages(updatedMessages);

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
  }

  /**
   * 메시지 삭제 (기존 deleteMessage)
   */
  static async deleteMessage(messageId) {
    try {
      const response = await messagesAPI.deleteMessage(messageId);

      // 로컬 캐시에서도 삭제
      const messages = await storage.getCachedMessages();
      const updatedMessages = messages.filter(msg => msg.id !== messageId);
      await storage.setCachedMessages(updatedMessages);

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
  }

  /**
   * 메시지 검색 (기존 searchMessages)
   */
  static async searchMessages(keyword) {
    try {
      const response = await messagesAPI.searchMessages({ keyword });

      return response.data?.data || [];
    } catch (error) {
      console.error('[MessageService] 메시지 검색 오류:', error);
      return [];
    }
  }

  /**
   * 읽지 않은 메시지 개수 조회 (기존 getUnreadMessageCount)
   */
  static async getUnreadMessageCount() {
    try {
      const response = await messagesAPI.getUnreadCount();
      const count = response.data?.data?.count || 0;

      // 로컬 저장
      await storage.setUnreadMessageCount(count);

      return count;
    } catch (error) {
      console.error('[MessageService] 읽지 않은 메시지 개수 조회 오류:', error);

      // 오류 시 캐시된 값 반환
      return await storage.getUnreadMessageCount();
    }
  }

  /**
   * 메시지 답장 전송 (기존 sendReply)
   */
  static async sendReply(messageId, content) {
    try {
      const response = await messagesAPI.sendReply(messageId, { content });

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
  }

  /**
   * 중요 메시지 표시/해제 (기존 toggleImportant)
   */
  static async toggleImportant(messageId, isImportant) {
    try {
      const response = await messagesAPI.toggleImportant(messageId, { isImportant });

      // 로컬 캐시 업데이트
      const messages = await storage.getCachedMessages();
      const updatedMessages = messages.map(msg =>
        msg.id === messageId ? { ...msg, isImportant } : msg
      );
      await storage.setCachedMessages(updatedMessages);

      return {
        success: true,
        message: response.data?.message ||
          (isImportant ? '중요 메시지로 표시했습니다.' : '중요 표시를 해제했습니다.')
      };
    } catch (error) {
      console.error('[MessageService] 중요 표시 토글 오류:', error);
      return {
        success: false,
        message: error.response?.data?.message || '처리 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 캐시된 메시지 조회 (로컬 전용)
   */
  static async getCachedMessages() {
    return await storage.getCachedMessages();
  }

  /**
   * 메시지 캐시 업데이트 (로컬 전용)
   */
  static async updateMessageCache(messages) {
    await storage.setCachedMessages(messages);
  }
}