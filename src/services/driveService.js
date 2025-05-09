// src/services/driveService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDateTime, getTimeDifference } from '../utils/dateUtils';

/**
 * 운행 시작
 * @param {Object} drive - 운행 일정
 * @returns {Promise<Object>} 시작된 운행 정보
 */
export const startDrive = async (drive) => {
  try {
    const startTime = new Date().toISOString();
    
    const activeDrive = {
      id: drive.id,
      busNumber: drive.busNumber,
      route: drive.route,
      departureTime: drive.departureTime,
      arrivalTime: drive.arrivalTime,
      startTime,
      status: 'driving',
    };
    
    // 현재 운행 정보 저장
    await AsyncStorage.setItem('currentDriveStatus', JSON.stringify(activeDrive));
    
    // API 호출 (백엔드 연동 시)
    // await api.startDrive(drive.id);
    
    return activeDrive;
  } catch (error) {
    console.error('Error starting drive:', error);
    throw new Error('운행을 시작할 수 없습니다.');
  }
};

/**
 * 운행 종료
 * @param {Object} drive - 현재 운행 중인 정보
 * @returns {Promise<Object>} 종료된 운행 정보
 */
export const endDrive = async (drive) => {
  try {
    const endTime = new Date().toISOString();
    const duration = getTimeDifference(drive.startTime, endTime);
    
    const completedDrive = {
      ...drive,
      endTime,
      status: 'completed',
      duration,
    };
    
    // 완료된 운행 정보 저장
    await AsyncStorage.setItem('completedDrive', JSON.stringify(completedDrive));
    await AsyncStorage.removeItem('currentDriveStatus');
    
    // API 호출 (백엔드 연동 시)
    // await api.endDrive(drive.id);
    
    return completedDrive;
  } catch (error) {
    console.error('Error ending drive:', error);
    throw new Error('운행을 종료할 수 없습니다.');
  }
};

/**
 * 현재 운행 중인 정보 가져오기
 * @returns {Promise<Object|null>} 현재 운행 중인 정보
 */
export const getCurrentDrive = async () => {
  try {
    const driveString = await AsyncStorage.getItem('currentDriveStatus');
    return driveString ? JSON.parse(driveString) : null;
  } catch (error) {
    console.error('Error getting current drive:', error);
    return null;
  }
};

/**
 * 마지막으로 완료된 운행 정보 가져오기
 * @returns {Promise<Object|null>} 완료된 운행 정보
 */
export const getCompletedDrive = async () => {
  try {
    const driveString = await AsyncStorage.getItem('completedDrive');
    return driveString ? JSON.parse(driveString) : null;
  } catch (error) {
    console.error('Error getting completed drive:', error);
    return null;
  }
};

/**
 * 다음 정거장 정보 가져오기 (백엔드 연동 전 임시 데이터)
 * @param {string} route - 노선 정보
 * @param {number} currentTime - 현재 시간 타임스탬프
 * @returns {Object} 다음 정거장 정보
 */
export const getNextStopInfo = (route, currentTime) => {
  // 백엔드 연동 전 임시 로직
  // 실제로는 현재 위치, 운행 시간 등에 따라 다음 정거장과 도착 예정 시간 계산 필요
  
  // 출발 후 30초 이내
  if (currentTime < 30000) {
    return {
      name: route.includes('서부캠퍼스') ? '서부캠퍼스 정문' : '동부캠퍼스 정문',
      timeRemaining: '5',
    };
  }
  // 출발 후 30초~1분
  else if (currentTime < 60000) {
    return {
      name: route.includes('서부캠퍼스') ? '공과대학 앞' : '인문대학 앞',
      timeRemaining: '8',
    };
  }
  // 출발 후 1분 이후
  else {
    return {
      name: route.includes('서부캠퍼스') ? '동부캠퍼스 정문' : '서부캠퍼스 정문',
      timeRemaining: '12',
    };
  }
};

/**
 * 다음 운행 일정 확인 (백엔드 연동 전 임시 데이터)
 * @param {Object} currentDrive - 현재 운행 정보
 * @returns {Promise<Object|null>} 다음 운행 일정
 */
export const getNextDriveSchedule = async (currentDrive) => {
  try {
    // 백엔드 연동 전 임시 로직
    // 실제로는 API 호출로 다음 운행 일정 가져와야 함
    
    // 50% 확률로 다음 운행이 있다고 가정
    const hasNext = Math.random() > 0.5;
    
    if (hasNext) {
      // 현재 시간 + 2시간을 다음 운행 시작 시간으로 설정
      const currentTime = new Date();
      const laterToday = new Date();
      laterToday.setHours(laterToday.getHours() + 2);
      
      const nextDrive = {
        id: currentDrive.id + 1,
        busNumber: currentDrive.busNumber === '101번' ? '102번' : '103번',
        route: currentDrive.route.split(' - ').reverse().join(' - '), // 반대 방향 노선
        departureTime: formatDateTime(laterToday),
        arrivalTime: formatDateTime(new Date(laterToday.getTime() + 90 * 60000)), // 1시간 30분 후
        isButtonActive: false, // 시간이 아직 안 되었으므로 비활성화
      };
      
      return nextDrive;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting next drive schedule:', error);
    return null;
  }
};