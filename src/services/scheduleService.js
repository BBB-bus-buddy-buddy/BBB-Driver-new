// src/services/scheduleService.js
import { scheduleAPI } from '../api';
import { storage } from '../utils/storage';

export class ScheduleService {
    /**
     * 운행 일정 목록 조회 (기존 getDriveSchedules)
     */
    static async getDriveSchedules() {
        try {
            const response = await scheduleAPI.getSchedules();

            if (response.data?.data) {
                // 캐시 저장
                await storage.setDriveSchedules(response.data.data);
                return response.data.data;
            }

            // API 응답이 없으면 캐시된 데이터 반환
            return await storage.getDriveSchedules();
        } catch (error) {
            console.error('[ScheduleService] 운행 일정 조회 오류:', error);

            // 오류 시 캐시된 데이터 반환
            try {
                return await storage.getDriveSchedules();
            } catch (cacheError) {
                return [];
            }
        }
    }

    /**
     * 특정 날짜의 운행 일정 조회 (기존 getSchedulesByDate)
     */
    static async getSchedulesByDate(date) {
        try {
            const response = await scheduleAPI.getSchedulesByDate(date);
            return response.data?.data || [];
        } catch (error) {
            console.error('[ScheduleService] 날짜별 일정 조회 오류:', error);

            // 오류 시 전체 일정에서 필터링
            const allSchedules = await this.getDriveSchedules();
            return allSchedules.filter(schedule => {
                const dateMatch = schedule.departureTime.match(/(\d+)년 (\d+)월 (\d+)일/);
                if (dateMatch) {
                    const year = dateMatch[1];
                    const month = dateMatch[2].padStart(2, '0');
                    const day = dateMatch[3].padStart(2, '0');
                    const scheduleDate = `${year}-${month}-${day}`;
                    return scheduleDate === date;
                }
                return false;
            });
        }
    }

    /**
     * 이번 주 운행 일정 조회 (기존 getWeeklySchedule)
     */
    static async getWeeklySchedule() {
        try {
            const response = await scheduleAPI.getWeeklySchedule();
            return response.data?.data || [];
        } catch (error) {
            console.error('[ScheduleService] 주간 일정 조회 오류:', error);
            return [];
        }
    }

    /**
     * 이번 달 운행 일정 조회 (기존 getMonthlySchedule)
     */
    static async getMonthlySchedule() {
        try {
            const response = await scheduleAPI.getMonthlySchedule();
            return response.data?.data || [];
        } catch (error) {
            console.error('[ScheduleService] 월간 일정 조회 오류:', error);
            return [];
        }
    }

    /**
     * 특정 운행 일정 상세 조회 (기존 getScheduleDetail)
     */
    static async getScheduleDetail(scheduleId) {
        try {
            const response = await scheduleAPI.getScheduleDetail(scheduleId);
            return response.data?.data || null;
        } catch (error) {
            console.error('[ScheduleService] 일정 상세 조회 오류:', error);
            return null;
        }
    }

    /**
     * 운행 일정 변경 요청 (기존 requestScheduleChange)
     */
    static async requestScheduleChange(scheduleId, reason) {
        try {
            const response = await scheduleAPI.requestScheduleChange(scheduleId, { reason });
            return {
                success: true,
                message: response.data?.message || '변경 요청이 전송되었습니다.'
            };
        } catch (error) {
            console.error('[ScheduleService] 일정 변경 요청 오류:', error);
            return {
                success: false,
                message: error.response?.data?.message || '변경 요청 중 오류가 발생했습니다.'
            };
        }
    }

    /**
     * 오늘의 운행 일정 조회
     */
    static async getTodaySchedules() {
        try {
            const response = await scheduleAPI.getTodaySchedules();
            
            if (response.data?.data) {
                return response.data.data;
            }

            // API가 실패하면 전체 일정에서 오늘 날짜 필터링
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            return await this.getSchedulesByDate(todayStr);
        } catch (error) {
            console.error('[ScheduleService] 오늘 일정 조회 오류:', error);
            
            // 오류 시 전체 일정에서 오늘 날짜만 필터링
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            return await this.getSchedulesByDate(todayStr);
        }
    }

    /**
     * 캘린더용 마킹 데이터 생성 (기존 createCalendarMarkedDates)
     */
    static createCalendarMarkedDates(schedules) {
        const marked = {};

        schedules.forEach(schedule => {
            const dateMatch = schedule.departureTime.match(/(\d+)년 (\d+)월 (\d+)일/);
            if (dateMatch) {
                const year = dateMatch[1];
                const month = dateMatch[2].padStart(2, '0');
                const day = dateMatch[3].padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;

                if (!marked[dateStr]) {
                    marked[dateStr] = { marked: true, dots: [] };
                }

                marked[dateStr].dots.push({
                    key: schedule.id,
                    color: '#0064FF'
                });
            }
        });

        return marked;
    }

    /**
     * 캐시된 일정 조회 (로컬 전용)
     */
    static async getCachedSchedules() {
        return await storage.getDriveSchedules();
    }

    /**
     * 일정 캐시 업데이트 (로컬 전용)
     */
    static async updateScheduleCache(schedules) {
        await storage.setDriveSchedules(schedules);
    }
}