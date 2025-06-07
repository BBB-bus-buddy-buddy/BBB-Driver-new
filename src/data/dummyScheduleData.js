// src/data/dummyScheduleData.js

// 현재 날짜 기준으로 동적 날짜 생성 헬퍼
const getDateString = (daysFromToday = 0, hours = 0, minutes = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  date.setHours(hours, minutes, 0, 0);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(hours).padStart(2, '0');
  const minute = String(minutes).padStart(2, '0');
  
  return `${year}년 ${month}월 ${day}일 ${hour}:${minute}`;
};

// 노선 정보
export const ROUTES = {
  ROUTE_1: '동부캠퍼스 - 서부캠퍼스',
  ROUTE_2: '서부캠퍼스 - 동부캠퍼스',
  ROUTE_3: '동부캠퍼스 - 시청',
  ROUTE_4: '시청 - 동부캠퍼스',
  ROUTE_5: '서부캠퍼스 - 터미널',
  ROUTE_6: '터미널 - 서부캠퍼스'
};

// 버스 번호
export const BUS_NUMBERS = ['101번', '102번', '103번', '201번', '202번', '301번'];

// 운행 시간표 템플릿 (시작 시간)
const SCHEDULE_TIMES = [
  { hour: 6, minute: 30 },
  { hour: 7, minute: 0 },
  { hour: 8, minute: 0 },
  { hour: 9, minute: 30 },
  { hour: 10, minute: 0 },
  { hour: 11, minute: 30 },
  { hour: 13, minute: 0 },
  { hour: 14, minute: 0 },
  { hour: 15, minute: 30 },
  { hour: 16, minute: 0 },
  { hour: 17, minute: 30 },
  { hour: 18, minute: 0 },
  { hour: 19, minute: 30 },
  { hour: 20, minute: 0 },
  { hour: 21, minute: 30 }
];

// 노선별 운행 시간 (분)
const ROUTE_DURATION = {
  [ROUTES.ROUTE_1]: 90,  // 1시간 30분
  [ROUTES.ROUTE_2]: 90,
  [ROUTES.ROUTE_3]: 60,  // 1시간
  [ROUTES.ROUTE_4]: 60,
  [ROUTES.ROUTE_5]: 45,  // 45분
  [ROUTES.ROUTE_6]: 45
};

// 더미 운행 일정 생성 함수
export const generateDummySchedules = () => {
  const schedules = [];
  let scheduleId = 1;
  
  // 오늘부터 7일간의 일정 생성
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    // 각 날짜별로 버스와 노선 조합
    const dailyBusRoutes = [
      { bus: BUS_NUMBERS[0], route: ROUTES.ROUTE_1 },
      { bus: BUS_NUMBERS[0], route: ROUTES.ROUTE_2 },
      { bus: BUS_NUMBERS[1], route: ROUTES.ROUTE_3 },
      { bus: BUS_NUMBERS[1], route: ROUTES.ROUTE_4 },
      { bus: BUS_NUMBERS[2], route: ROUTES.ROUTE_5 },
      { bus: BUS_NUMBERS[2], route: ROUTES.ROUTE_6 }
    ];
    
    // 각 버스/노선 조합에 대해 일정 생성
    dailyBusRoutes.forEach((busRoute, busIndex) => {
      // 하루에 3-4개의 운행 일정 생성
      const timesPerDay = busIndex < 2 ? 4 : 3; // 주요 노선은 4회, 나머지는 3회
      const selectedTimes = SCHEDULE_TIMES.filter((_, index) => 
        index % Math.floor(SCHEDULE_TIMES.length / timesPerDay) === busIndex % timesPerDay
      ).slice(0, timesPerDay);
      
      selectedTimes.forEach((time) => {
        const departureTime = getDateString(dayOffset, time.hour, time.minute);
        const duration = ROUTE_DURATION[busRoute.route] || 60;
        const arrivalHour = time.hour + Math.floor((time.minute + duration) / 60);
        const arrivalMinute = (time.minute + duration) % 60;
        const arrivalTime = `${String(arrivalHour).padStart(2, '0')}:${String(arrivalMinute).padStart(2, '0')}`;
        
        schedules.push({
          id: String(scheduleId++),
          busNumber: busRoute.bus,
          route: busRoute.route,
          departureTime: departureTime,
          arrivalTime: arrivalTime,
          status: 'scheduled', // scheduled, in_progress, completed, cancelled
          driverId: 'driver_001', // 현재 운전자 ID
          notes: ''
        });
      });
    });
  }
  
  return schedules.sort((a, b) => {
    // 날짜와 시간으로 정렬
    const dateA = new Date(a.departureTime.replace(/년|월|일/g, '-').replace(/\s/g, 'T'));
    const dateB = new Date(b.departureTime.replace(/년|월|일/g, '-').replace(/\s/g, 'T'));
    return dateA - dateB;
  });
};

// 오늘의 운행 일정만 필터링
export const getTodaySchedules = (allSchedules) => {
  const today = new Date();
  const todayStr = `${today.getFullYear()}년 ${String(today.getMonth() + 1).padStart(2, '0')}월 ${String(today.getDate()).padStart(2, '0')}일`;
  
  return allSchedules.filter(schedule => 
    schedule.departureTime.startsWith(todayStr)
  );
};

// 특정 날짜의 운행 일정 필터링
export const getSchedulesByDate = (allSchedules, dateStr) => {
  return allSchedules.filter(schedule => {
    const scheduleDate = schedule.departureTime.split(' ').slice(0, 3).join(' ');
    const targetDate = dateStr.replace(/-/g, '년 ').replace(/-(\d{2})$/, '월 $1일');
    return scheduleDate === targetDate;
  });
};

// 운행 상태별 필터링
export const getSchedulesByStatus = (allSchedules, status) => {
  return allSchedules.filter(schedule => schedule.status === status);
};

// 다음 운행 일정 찾기
export const getNextSchedule = (allSchedules) => {
  const now = new Date();
  const futureSchedules = allSchedules.filter(schedule => {
    const scheduleTime = new Date(
      schedule.departureTime
        .replace(/년|월|일/g, '-')
        .replace(/\s/g, 'T')
        .replace(/-+/g, '-')
    );
    return scheduleTime > now;
  });
  
  return futureSchedules.length > 0 ? futureSchedules[0] : null;
};

// 운행 통계 생성
export const generateDrivingStats = () => {
  return {
    totalDrives: 142,
    thisMonth: 28,
    totalHours: 426,
    safetyScore: 98,
    onTimeRate: 96.5,
    totalDistance: 3580 // km
  };
};