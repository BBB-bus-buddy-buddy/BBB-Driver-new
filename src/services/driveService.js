// src/services/driveService.js
import { driveAPI } from '../api';
import { storage } from '../utils/storage';

export class DriveService {
  /**
   * 운행 시작
   */
  static async startDrive(operationId, isEarlyStart = false) {
    try {
      // 현재 위치 가져오기
      const location = await this._getCurrentLocation();
      
      const response = await driveAPI.startDrive({
        operationId,
        isEarlyStart,
        currentLocation: location
      });

      if (response.data?.data) {
        // 현재 운행 정보 저장
        await storage.setCurrentDrive(response.data.data);
        return response.data.data;
      }

      throw new Error(response.data?.message || '운행을 시작할 수 없습니다.');
    } catch (error) {
      console.error('[DriveService] 운행 시작 오류:', error);
      throw new Error(error.response?.data?.message || error.message || '운행을 시작할 수 없습니다.');
    }
  }

  /**
   * 운행 종료
   */
  static async endDrive(operationId, endReason = null) {
    try {
      // 현재 위치 가져오기
      const location = await this._getCurrentLocation();

      const response = await driveAPI.endDrive({
        operationId,
        currentLocation: location,
        endReason
      });

      if (response.data?.data) {
        // 운행 정보 저장
        await storage.setCompletedDrive(response.data.data);
        // 현재 운행 정보 삭제
        await storage.removeCurrentDrive();
        
        return response.data.data;
      }

      throw new Error(response.data?.message || '운행을 종료할 수 없습니다.');
    } catch (error) {
      console.error('[DriveService] 운행 종료 오류:', error);
      throw new Error(error.response?.data?.message || error.message || '운행을 종료할 수 없습니다.');
    }
  }

  /**
   * 위치 업데이트
   */
  static async updateLocation(operationId, busNumber, location) {
    try {
      const response = await driveAPI.updateLocation({
        operationId,
        busNumber,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: location.timestamp || Date.now()
        },
        speed: location.speed || 0,
        heading: location.heading || 0,
        accuracy: location.accuracy || 0
      });

      return response.data?.data;
    } catch (error) {
      console.error('[DriveService] 위치 업데이트 오류:', error);
      // 위치 업데이트 실패는 조용히 처리 (운행 중단하지 않음)
      return null;
    }
  }

  /**
   * 다음 운행 일정 확인
   */
  static async getNextDriveSchedule(currentOperationId, busNumber) {
    try {
      const response = await driveAPI.getNextDrive({
        currentOperationId,
        busNumber
      });

      return response.data?.data || null;
    } catch (error) {
      console.error('[DriveService] 다음 운행 일정 조회 오류:', error);
      return null;
    }
  }

  /**
   * 현재 운행 중인 정보 가져오기
   */
  static async getCurrentDrive() {
    return await storage.getCurrentDrive();
  }

  /**
   * 마지막으로 완료된 운행 정보 가져오기
   */
  static async getCompletedDrive() {
    return await storage.getCompletedDrive();
  }

  /**
   * 현재 위치 가져오기 (헬퍼 메서드)
   */
  static async _getCurrentLocation() {
    try {
      const { getCurrentLocation } = await import('./locationService');
      return await getCurrentLocation();
    } catch (error) {
      console.warn('[DriveService] 위치 정보 조회 실패:', error);
      return null;
    }
  }
}