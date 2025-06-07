// src/services/statisticsService.js
import { storage } from '../utils/storage';
import { StatsService } from '../data/dummyStatsData';

/**
 * 운행 통계 관리 서비스
 * 
 * @description
 * - 더미 데이터를 사용한 통계 서비스
 * - 통계 데이터 캐싱 및 오프라인 지원
 * - 일관된 통계 데이터 제공
 */
export class StatisticsService {
  
  /**
   * 사용자 기본 운행 통계 조회
   * 
   * @returns {Promise<Object>} 통계 데이터
   */
  static async getUserStats() {
    try {
      console.log('[StatisticsService] 운행 통계 데이터 조회');
      
      // 더미 데이터 서비스 호출
      const dummyResponse = await StatsService.getUserStats();
      
      // 캐시에 저장
      await this._cacheStats('basic', dummyResponse.data);
      
      return {
        success: true,
        data: dummyResponse.data,
        message: '운행 통계 데이터 조회 성공'
      };
    } catch (error) {
      console.error('[StatisticsService] 통계 조회 오류:', error);
      
      // 오류 시 캐시된 데이터로 폴백
      return await this._handleStatsError('basic', error);
    }
  }

  /**
   * 상세 운행 통계 조회
   * 
   * @returns {Promise<Object>} 상세 통계 데이터
   */
  static async getDetailedStats() {
    try {
      console.log('[StatisticsService] 상세 운행 통계 조회');
      
      const dummyResponse = await StatsService.getDetailedStats();
      await this._cacheStats('detailed', dummyResponse.data);
      
      return {
        success: true,
        data: dummyResponse.data,
        message: '상세 통계 조회 성공'
      };
    } catch (error) {
      console.error('[StatisticsService] 상세 통계 조회 오류:', error);
      return await this._handleStatsError('detailed', error);
    }
  }

  /**
   * 월별 운행 통계 조회
   * 
   * @param {number} months - 조회할 개월 수
   * @returns {Promise<Object>} 월별 통계 데이터
   */
  static async getMonthlyStats(months = 12) {
    try {
      console.log('[StatisticsService] 월별 통계 조회');
      
      const dummyResponse = await StatsService.getMonthlyReport(months);
      await this._cacheStats('monthly', dummyResponse.data);
      
      return {
        success: true,
        data: dummyResponse.data,
        message: '월별 통계 조회 성공'
      };
    } catch (error) {
      console.error('[StatisticsService] 월별 통계 조회 오류:', error);
      return await this._handleStatsError('monthly', error);
    }
  }

  /**
   * 효율성 리포트 조회
   * 
   * @returns {Promise<Object>} 효율성 리포트 데이터
   */
  static async getEfficiencyReport() {
    try {
      console.log('[StatisticsService] 효율성 리포트 조회');
      
      const dummyResponse = await StatsService.getEfficiencyReport();
      await this._cacheStats('efficiency', dummyResponse.data);
      
      return {
        success: true,
        data: dummyResponse.data,
        message: '효율성 리포트 조회 성공'
      };
    } catch (error) {
      console.error('[StatisticsService] 효율성 리포트 조회 오류:', error);
      return await this._handleStatsError('efficiency', error);
    }
  }

  /**
   * 통계 데이터 새로고침
   * 
   * @param {string} type - 통계 타입 ('basic', 'detailed', 'monthly', 'efficiency')
   * @returns {Promise<Object>} 새로고침된 통계 데이터
   */
  static async refreshStats(type = 'basic') {
    try {
      // 캐시 삭제
      await this._clearStatsCache(type);
      
      // 새로운 데이터 조회
      switch (type) {
        case 'basic':
          return await this.getUserStats();
        case 'detailed':
          return await this.getDetailedStats();
        case 'monthly':
          return await this.getMonthlyStats();
        case 'efficiency':
          return await this.getEfficiencyReport();
        default:
          throw new Error(`알 수 없는 통계 타입: ${type}`);
      }
    } catch (error) {
      console.error('[StatisticsService] 통계 새로고침 오류:', error);
      return {
        success: false,
        message: '통계 새로고침 중 오류가 발생했습니다.',
        error
      };
    }
  }

  /**
   * 캐시된 통계 데이터 조회
   * 
   * @param {string} type - 통계 타입
   * @returns {Promise<Object|null>} 캐시된 데이터 또는 null
   */
  static async getCachedStats(type) {
    try {
      const cacheKey = `stats_${type}`;
      const cachedData = await storage._safeGetItem(cacheKey);
      
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        
        // 캐시 만료 확인 (1시간)
        const cacheTime = new Date(parsed.timestamp);
        const now = new Date();
        const hoursDiff = (now - cacheTime) / (1000 * 60 * 60);
        
        if (hoursDiff < 1) {
          return parsed.data;
        } else {
          // 만료된 캐시 삭제
          await this._clearStatsCache(type);
        }
      }
      
      return null;
    } catch (error) {
      console.error('[StatisticsService] 캐시 조회 오류:', error);
      return null;
    }
  }

  // =============== Private Methods ===============

  /**
   * 통계 데이터 캐싱
   * @private
   */
  static async _cacheStats(type, data) {
    try {
      const cacheKey = `stats_${type}`;
      const cacheData = {
        data,
        timestamp: new Date().toISOString(),
        type
      };
      
      await storage._safeSetItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('[StatisticsService] 캐시 저장 오류:', error);
    }
  }

  /**
   * 통계 캐시 삭제
   * @private
   */
  static async _clearStatsCache(type) {
    try {
      const cacheKey = `stats_${type}`;
      await storage._safeRemoveItem(cacheKey);
    } catch (error) {
      console.error('[StatisticsService] 캐시 삭제 오류:', error);
    }
  }

  /**
   * 통계 조회 오류 처리
   * @private
   */
  static async _handleStatsError(type, error) {
    try {
      // 1. 캐시된 데이터 확인
      const cachedData = await this.getCachedStats(type);
      if (cachedData) {
        console.log('[StatisticsService] 캐시된 데이터 사용');
        return {
          success: true,
          data: cachedData,
          message: '캐시된 통계 데이터 사용'
        };
      }

      // 2. 폴백 더미 데이터 사용
      console.log('[StatisticsService] 폴백 더미 데이터 사용');
      let dummyResponse;
      
      switch (type) {
        case 'detailed':
          dummyResponse = await StatsService.getDetailedStats(0);
          break;
        case 'monthly':
          dummyResponse = await StatsService.getMonthlyReport();
          break;
        case 'efficiency':
          dummyResponse = await StatsService.getEfficiencyReport(0);
          break;
        default:
          dummyResponse = await StatsService.getUserStats(0);
      }

      return {
        success: true,
        data: dummyResponse.data,
        message: '오류 발생으로 폴백 데이터 사용',
        originalError: error.message
      };
    } catch (fallbackError) {
      console.error('[StatisticsService] 폴백 데이터 조회 실패:', fallbackError);
      
      return {
        success: false,
        message: '통계 데이터를 불러올 수 없습니다.',
        error: fallbackError
      };
    }
  }
}