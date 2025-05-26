// src/services/driveService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/apiClient';
import { formatDateTime, getTimeDifference } from '../utils/dateUtils';

// 상수 정의
const STORAGE_KEYS = {
  CURRENT_DRIVE: 'currentDriveStatus',
  COMPLETED_DRIVE: 'completedDrive',
  DRIVE_HISTORY: 'driveHistory'
};

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

/**
 * 운행 시작
 * @param {Object} drive - 운행 일정
 * @returns {Promise<Object>} 시작된 운행 정보
 */
export const startDrive = async (drive) => {
  try {
    // 유효성 검사
    if (!drive || !drive.id || !drive.busNumber || !drive.route) {
      throw new Error('유효하지 않은 운행 정보입니다.');
    }

    // 이미 운행 중인지 확인
    const currentDrive = await getCurrentDrive();
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
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_DRIVE, JSON.stringify(activeDrive));
    
    // API 호출
    try {
      const response = await apiClient.post('/api/drives/start', {
        driveId: drive.id,
        startTime,
        location: await getCurrentLocation() // 위치 서비스에서 가져오기
      });
      
      if (response.data?.data) {
        // 서버 응답으로 운행 정보 업데이트
        const updatedDrive = { ...activeDrive, ...response.data.data };
        await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_DRIVE, JSON.stringify(updatedDrive));
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
};

/**
 * 운행 종료
 * @param {Object} drive - 현재 운행 중인 정보
 * @returns {Promise<Object>} 종료된 운행 정보
 */
export const endDrive = async (drive) => {
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
    await AsyncStorage.setItem(STORAGE_KEYS.COMPLETED_DRIVE, JSON.stringify(completedDrive));
    
    // 운행 히스토리에 추가
    await addToHistory(completedDrive);
    
    // 현재 운행 정보 삭제
    await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_DRIVE);
    
    // API 호출
    try {
      const response = await apiClient.post('/api/drives/end', {
        driveId: drive.id,
        endTime,
        duration,
        finalLocation: await getCurrentLocation()
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
};

/**
 * 현재 운행 중인 정보 가져오기
 * @returns {Promise<Object|null>} 현재 운행 중인 정보
 */
export const getCurrentDrive = async () => {
  try {
    const driveString = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_DRIVE);
    return driveString ? JSON.parse(driveString) : null;
  } catch (error) {
    console.error('[DriveService] 현재 운행 정보 조회 오류:', error);
    return null;
  }
};

/**
 * 마지막으로 완료된 운행 정보 가져오기
 * @returns {Promise<Object|null>} 완료된 운행 정보
 */
export const getCompletedDrive = async () => {
  try {
    const driveString = await AsyncStorage.getItem(STORAGE_KEYS.COMPLETED_DRIVE);
    return driveString ? JSON.parse(driveString) : null;
  } catch (error) {
    console.error('[DriveService] 완료된 운행 정보 조회 오류:', error);
    return null;
  }
};

/**
 * 다음 정거장 정보 가져오기
 * @param {string} route - 노선 정보
 * @param {number} elapsedTime - 운행 시작 후 경과 시간 (밀리초)
 * @returns {Object} 다음 정거장 정보
 */
export const getNextStopInfo = (route, elapsedTime) => {
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
};

/**
 * 다음 운행 일정 확인
 * @param {Object} currentDrive - 현재 운행 정보
 * @returns {Promise<Object|null>} 다음 운행 일정
 */
export const getNextDriveSchedule = async (currentDrive) => {
  try {
    // API 호출로 다음 운행 일정 가져오기
    const response = await apiClient.get('/api/drives/next', {
      params: {
        currentDriveId: currentDrive.id,
        busNumber: currentDrive.busNumber
      }
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
          departureTime: formatDateTime(laterToday),
          arrivalTime: formatDateTime(new Date(laterToday.getTime() + 90 * 60000)),
          isButtonActive: false
        };
      }
    }
    
    return null;
  }
};

/**
 * 운행 히스토리에 추가
 * @param {Object} drive - 완료된 운행 정보
 */
const addToHistory = async (drive) => {
  try {
    const historyString = await AsyncStorage.getItem(STORAGE_KEYS.DRIVE_HISTORY);
    const history = historyString ? JSON.parse(historyString) : [];
    
    // 최대 50개까지만 저장
    history.unshift(drive);
    if (history.length > 50) {
      history.pop();
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.DRIVE_HISTORY, JSON.stringify(history));
  } catch (error) {
    console.error('[DriveService] 히스토리 추가 오류:', error);
  }
};

/**
 * 운행 히스토리 조회
 * @param {number} limit - 조회할 개수
 * @returns {Promise<Array>} 운행 히스토리
 */
export const getDriveHistory = async (limit = 10) => {
  try {
    const historyString = await AsyncStorage.getItem(STORAGE_KEYS.DRIVE_HISTORY);
    const history = historyString ? JSON.parse(historyString) : [];
    return history.slice(0, limit);
  } catch (error) {
    console.error('[DriveService] 히스토리 조회 오류:', error);
    return [];
  }
};

/**
 * 현재 위치 가져오기 (임시 헬퍼 함수)
 * @returns {Promise<Object>} 위치 정보
 */
const getCurrentLocation = async () => {
  // locationService에서 가져오기
  try {
    const { getCurrentLocation: getLocation } = await import('./locationService');
    return await getLocation();
  } catch (error) {
    console.warn('[DriveService] 위치 정보 조회 실패:', error);
    return null;
  }
};