// src/services/driveService.js
import { driverAPI, routesAPI } from '../api';
import { storage } from '../utils/storage';
import { getTimeDifference } from '../utils/dateUtils';

// 상수 정의
const DRIVE_STATUS = {
  WAITING: 'waiting',
  DRIVING: 'driving',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// 정거장 스케줄 설정 (임시 데이터)
const STOP_SCHEDULES = {
  '동부캠퍼스 - 서부캠퍼스': [
    { timeAfter: 0, name: '동부캠퍼스 정문', estimatedTime: 0 },
    { timeAfter: 300000, name: '인문대학 앞', estimatedTime: 5 }, // 5분 후
    { timeAfter: 600000, name: '중앙도서관', estimatedTime: 10 },
    { timeAfter: 900000, name: '학생회관', estimatedTime: 15 },
    { timeAfter: 1200000, name: '서부캠퍼스 정문', estimatedTime: 20 }
  ],
  '서부캠퍼스 - 동부캠퍼스': [
    { timeAfter: 0, name: '서부캠퍼스 정문', estimatedTime: 0 },
    { timeAfter: 300000, name: '공과대학 앞', estimatedTime: 5 },
    { timeAfter: 600000, name: '자연과학관', estimatedTime: 10 },
    { timeAfter: 900000, name: '체육관', estimatedTime: 15 },
    { timeAfter: 1200000, name: '동부캠퍼스 정문', estimatedTime: 20 }
  ]
};

export class DriveService {
  /**
   * 운행 시작 (기존 startDrive)
   */
  static async startDrive(drive) {
    try {
      // 유효성 검사
      if (!drive || !drive.id || !drive.busNumber || !drive.route) {
        throw new Error('유효하지 않은 운행 정보입니다.');
      }

      // 이미 운행 중인지 확인
      const currentDrive = await this.getCurrentDrive();
      if (currentDrive && currentDrive.status === DRIVE_STATUS.DRIVING) {
        throw new Error('이미 운행 중입니다. 현재 운행을 먼저 종료해주세요.');
      }

      const startTime = new Date().toISOString();

      const activeDrive = {
        id: drive.id,
        busNumber: drive.busNumber,
        route: drive.route,
        departureTime: drive.departureTime,
        arrivalTime: drive.arrivalTime,
        startTime,
        status: DRIVE_STATUS.DRIVING,
        currentStopIndex: 0,
        totalStops: STOP_SCHEDULES[drive.route]?.length || 0
      };

      // 현재 운행 정보 저장
      await storage.setCurrentDrive(activeDrive);

      // API 호출
      try {
        const location = await this._getCurrentLocation();
        const response = await driverAPI.startDrive({
          driveId: drive.id,
          startTime,
          location
        });

        if (response.data?.data) {
          // 서버 응답으로 운행 정보 업데이트
          const updatedDrive = { ...activeDrive, ...response.data.data };
          await storage.setCurrentDrive(updatedDrive);
          return updatedDrive;
        }
      } catch (apiError) {
        console.warn('[DriveService] API 호출 실패, 로컬 데이터로 진행:', apiError);
      }

      return activeDrive;
    } catch (error) {
      console.error('[DriveService] 운행 시작 오류:', error);
      throw new Error(error.message || '운행을 시작할 수 없습니다.');
    }
  }

  /**
   * 운행 종료 (기존 endDrive)
   */
  static async endDrive(drive) {
    try {
      if (!drive || !drive.startTime) {
        throw new Error('유효하지 않은 운행 정보입니다.');
      }

      const endTime = new Date().toISOString();
      const duration = getTimeDifference(drive.startTime, endTime);

      const completedDrive = {
        ...drive,
        endTime,
        status: DRIVE_STATUS.COMPLETED,
        duration,
      };

      // 완료된 운행 정보 저장
      await storage.setCompletedDrive(completedDrive);

      // 운행 히스토리에 추가
      await this._addToHistory(completedDrive);

      // 현재 운행 정보 삭제
      await storage.removeCurrentDrive();

      // API 호출
      try {
        const location = await this._getCurrentLocation();
        const response = await driverAPI.endDrive({
          driveId: drive.id,
          endTime,
          duration,
          finalLocation: location
        });

        if (response.data?.data) {
          return { ...completedDrive, ...response.data.data };
        }
      } catch (apiError) {
        console.warn('[DriveService] API 호출 실패, 로컬 데이터로 진행:', apiError);
      }

      return completedDrive;
    } catch (error) {
      console.error('[DriveService] 운행 종료 오류:', error);
      throw new Error(error.message || '운행을 종료할 수 없습니다.');
    }
  }

  /**
   * 현재 운행 중인 정보 가져오기 (기존 getCurrentDrive)
   */
  static async getCurrentDrive() {
    return await storage.getCurrentDrive();
  }

  /**
   * 마지막으로 완료된 운행 정보 가져오기 (기존 getCompletedDrive)
   */
  static async getCompletedDrive() {
    return await storage.getCompletedDrive();
  }

  /**
   * 다음 정거장 정보 가져오기 (기존 getNextStopInfo)
   */
  static getNextStopInfo(route, elapsedTime) {
    try {
      const schedule = STOP_SCHEDULES[route];

      if (!schedule || schedule.length === 0) {
        return {
          name: '정보 없음',
          timeRemaining: '-',
          currentStop: 0,
          totalStops: 0
        };
      }

      // 현재 정거장 찾기
      let currentStopIndex = 0;
      for (let i = schedule.length - 1; i >= 0; i--) {
        if (elapsedTime >= schedule[i].timeAfter) {
          currentStopIndex = i;
          break;
        }
      }

      // 다음 정거장 정보
      const nextStopIndex = Math.min(currentStopIndex + 1, schedule.length - 1);
      const nextStop = schedule[nextStopIndex];
      const timeUntilNext = Math.max(0, nextStop.timeAfter - elapsedTime);
      const minutesRemaining = Math.ceil(timeUntilNext / 60000);

      return {
        name: nextStop.name,
        timeRemaining: String(minutesRemaining),
        currentStop: currentStopIndex + 1,
        totalStops: schedule.length,
        isLastStop: nextStopIndex === schedule.length - 1
      };
    } catch (error) {
      console.error('[DriveService] 다음 정거장 정보 조회 오류:', error);
      return {
        name: '오류',
        timeRemaining: '-',
        currentStop: 0,
        totalStops: 0
      };
    }
  }

  /**
   * 다음 운행 일정 확인 (기존 getNextDriveSchedule)
   */
  static async getNextDriveSchedule(currentDrive) {
    try {
      // API 호출로 다음 운행 일정 가져오기
      const response = await driverAPI.getNextDrive({
        currentDriveId: currentDrive.id,
        busNumber: currentDrive.busNumber
      });

      if (response.data?.data) {
        return response.data.data;
      }

      // API 응답이 없으면 null 반환
      return null;
    } catch (error) {
      console.error('[DriveService] 다음 운행 일정 조회 오류:', error);

      // 개발 중 임시 데이터 (API 오류 시)
      if (process.env.NODE_ENV === 'development') {
        const hasNext = Math.random() > 0.5;

        if (hasNext) {
          const currentTime = new Date();
          const laterToday = new Date();
          laterToday.setHours(laterToday.getHours() + 2);

          return {
            id: String(parseInt(currentDrive.id) + 1),
            busNumber: currentDrive.busNumber,
            route: currentDrive.route.split(' - ').reverse().join(' - '),
            departureTime: this._formatDateTime(laterToday),
            arrivalTime: this._formatDateTime(new Date(laterToday.getTime() + 90 * 60000)),
            isButtonActive: false
          };
        }
      }

      return null;
    }
  }

  /**
   * 운행 일정 목록 조회
   */
  static async getSchedules() {
    try {
      const response = await routesAPI.getSchedules();
      const schedules = response.data?.data || [];

      // 캐시 저장
      await storage.setDriveSchedules(schedules);

      return schedules;
    } catch (error) {
      console.error('[DriveService] 운행 일정 조회 오류:', error);

      // 캐시된 데이터 반환
      return await storage.getDriveSchedules();
    }
  }

  /**
   * 운행 히스토리 조회 (기존 getDriveHistory)
   */
  static async getDriveHistory(limit = 10) {
    try {
      const history = await storage.getDriveHistory();
      return history.slice(0, limit);
    } catch (error) {
      console.error('[DriveService] 히스토리 조회 오류:', error);
      return [];
    }
  }

  /**
   * 운행 히스토리에 추가 (기존 addToHistory)
   */
  static async _addToHistory(drive) {
    try {
      const history = await storage.getDriveHistory();

      // 최대 50개까지만 저장
      history.unshift(drive);
      if (history.length > 50) {
        history.pop();
      }

      await storage.setDriveHistory(history);
    } catch (error) {
      console.error('[DriveService] 히스토리 추가 오류:', error);
    }
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

  /**
   * 날짜 형식화 헬퍼 (기존 formatDateTime)
   */
  static _formatDateTime(date) {
    const d = typeof date === 'string' ? new Date(date) : date;

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
  }
}