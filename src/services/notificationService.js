// src/services/notificationService.js
import { notificationsAPI } from '../api';
import { storage } from '../utils/storage';

export class NotificationService {
    /**
     * 알림 목록 조회 (기존 getNotifications)
     */
    static async getNotifications() {
        try {
            const response = await notificationsAPI.getNotifications();

            if (response.data?.data) {
                const notifications = response.data.data;

                // 읽지 않은 알림 개수 저장
                const unreadCount = notifications.filter(n => n.unread).length;
                await storage.setUnreadNotificationCount(unreadCount);

                return notifications;
            }

            return [];
        } catch (error) {
            console.error('[NotificationService] 알림 조회 오류:', error);
            return [];
        }
    }

    /**
     * 읽지 않은 알림 개수 조회 (기존 getUnreadCount)
     */
    static async getUnreadCount() {
        try {
            const response = await notificationsAPI.getUnreadCount();
            const count = response.data?.data?.count || 0;

            // 로컬 저장소에도 저장
            await storage.setUnreadNotificationCount(count);

            return count;
        } catch (error) {
            console.error('[NotificationService] 읽지 않은 알림 개수 조회 오류:', error);

            // 오류 시 로컬 저장소에서 가져오기
            return await storage.getUnreadNotificationCount();
        }
    }

    /**
     * 모든 알림을 읽음으로 표시 (기존 markAllAsRead)
     */
    static async markAllAsRead() {
        try {
            const response = await notificationsAPI.markAllAsRead();

            // 성공 시 로컬 카운트 초기화
            await storage.setUnreadNotificationCount(0);

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
    }

    /**
     * 특정 알림을 읽음으로 표시 (기존 markAsRead)
     */
    static async markAsRead(notificationId) {
        try {
            const response = await notificationsAPI.markAsRead(notificationId);

            // 읽지 않은 개수 업데이트
            const currentCount = await storage.getUnreadNotificationCount();
            if (currentCount > 0) {
                await storage.setUnreadNotificationCount(currentCount - 1);
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
    }

    /**
     * 특정 알림 삭제 (기존 deleteNotification)
     */
    static async deleteNotification(notificationId) {
        try {
            const response = await notificationsAPI.deleteNotification(notificationId);
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
    }

    /**
     * 알림 설정 조회 (기존 getNotificationSettings)
     */
    static async getNotificationSettings() {
        try {
            const response = await notificationsAPI.getSettings();
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
    }

    /**
     * 알림 설정 업데이트 (기존 updateNotificationSettings)
     */
    static async updateNotificationSettings(settings) {
        try {
            const response = await notificationsAPI.updateSettings(settings);
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
    }

    /**
     * 푸시 토큰 등록 (기존 registerPushToken)
     */
    static async registerPushToken(token, platform) {
        try {
            const response = await notificationsAPI.registerPushToken({
                token,
                platform
            });

            // 토큰 로컬 저장
            await storage.setUserInfo({ pushToken: token });

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
    }
}