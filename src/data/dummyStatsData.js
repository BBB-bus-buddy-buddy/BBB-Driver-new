// src/data/dummyStatsData.js

/**
 * 운행 통계 더미 데이터 생성 및 관리
 * 개발 및 테스트용 통계 데이터를 제공합니다.
 */

// 기본 운행 통계 데이터
const BASE_STATS = {
    totalDrives: 142,      // 총 운행 횟수
    thisMonth: 28,         // 이번 달 운행 횟수
    totalHours: 426,       // 총 운행 시간
    safetyScore: 98,       // 안전 점수 (0-100)
    onTimeRate: 96.5,      // 정시 운행률 (%)
    totalDistance: 3580,   // 총 운행 거리 (km)
    avgDriveTime: 90,      // 평균 운행 시간 (분)
    fuelEfficiency: 8.2,   // 연비 (km/L)
    incidentCount: 0,      // 사고 발생 횟수
    customerRating: 4.8,   // 고객 평점 (5점 만점)
    earlyArrivalRate: 15.2, // 조기 도착률 (%)
    lateArrivalRate: 3.8,  // 지연 도착률 (%)
  };
  
  // 월별 운행 통계 (최근 12개월)
  const MONTHLY_STATS = [
    { month: '2024-01', drives: 22, hours: 66, distance: 540, safetyScore: 95 },
    { month: '2024-02', drives: 24, hours: 72, distance: 580, safetyScore: 97 },
    { month: '2024-03', drives: 26, hours: 78, distance: 620, safetyScore: 98 },
    { month: '2024-04', drives: 25, hours: 75, distance: 600, safetyScore: 96 },
    { month: '2024-05', drives: 28, hours: 84, distance: 670, safetyScore: 99 },
    { month: '2024-06', drives: 30, hours: 90, distance: 720, safetyScore: 98 },
    { month: '2024-07', drives: 32, hours: 96, distance: 760, safetyScore: 97 },
    { month: '2024-08', drives: 29, hours: 87, distance: 690, safetyScore: 98 },
    { month: '2024-09', drives: 31, hours: 93, distance: 740, safetyScore: 99 },
    { month: '2024-10', drives: 27, hours: 81, distance: 650, safetyScore: 96 },
    { month: '2024-11', drives: 33, hours: 99, distance: 790, safetyScore: 98 },
    { month: '2024-12', drives: 28, hours: 84, distance: 670, safetyScore: 98 }
  ];
  
  // 주간 운행 통계 (최근 4주)
  const WEEKLY_STATS = [
    { week: '2024-W48', drives: 7, hours: 21, distance: 168, avgRating: 4.9 },
    { week: '2024-W49', drives: 6, hours: 18, distance: 144, avgRating: 4.8 },
    { week: '2024-W50', drives: 8, hours: 24, distance: 192, avgRating: 4.7 },
    { week: '2024-W51', drives: 7, hours: 21, distance: 168, avgRating: 4.8 }
  ];
  
  // 노선별 운행 통계
  const ROUTE_STATS = [
    {
      route: '동부캠퍼스 - 서부캠퍼스',
      totalDrives: 45,
      totalHours: 135,
      avgPassengers: 28,
      onTimeRate: 97.8,
      satisfactionScore: 4.9
    },
    {
      route: '서부캠퍼스 - 동부캠퍼스',
      totalDrives: 43,
      totalHours: 129,
      avgPassengers: 32,
      onTimeRate: 96.5,
      satisfactionScore: 4.8
    },
    {
      route: '동부캠퍼스 - 시청',
      totalDrives: 28,
      totalHours: 84,
      avgPassengers: 18,
      onTimeRate: 98.2,
      satisfactionScore: 4.7
    },
    {
      route: '시청 - 동부캠퍼스',
      totalDrives: 26,
      totalHours: 78,
      avgPassengers: 22,
      onTimeRate: 95.4,
      satisfactionScore: 4.6
    }
  ];
  
  /**
   * 기본 운행 통계 생성
   * @returns {Object} 운행 통계 객체
   */
  export const generateDrivingStats = () => {
    // 약간의 랜덤성을 추가하여 실제적인 데이터 시뮬레이션
    const variation = () => Math.random() * 0.1 - 0.05; // -5% ~ +5% 변동
    
    return {
      ...BASE_STATS,
      totalDrives: Math.floor(BASE_STATS.totalDrives * (1 + variation())),
      thisMonth: Math.floor(BASE_STATS.thisMonth * (1 + variation())),
      totalHours: Math.floor(BASE_STATS.totalHours * (1 + variation())),
      safetyScore: Math.min(100, Math.max(0, BASE_STATS.safetyScore + variation() * 10)),
      onTimeRate: Math.min(100, Math.max(0, BASE_STATS.onTimeRate + variation() * 10)),
      totalDistance: Math.floor(BASE_STATS.totalDistance * (1 + variation())),
      customerRating: Math.min(5, Math.max(0, BASE_STATS.customerRating + variation() * 2))
    };
  };
  
  /**
   * 상세 운행 통계 생성 (프로필 화면용)
   * @returns {Object} 상세 통계 객체
   */
  export const generateDetailedStats = () => {
    const baseStats = generateDrivingStats();
    
    return {
      // 기본 통계
      ...baseStats,
      
      // 추가 세부 통계
      weeklyAverage: Math.floor(baseStats.thisMonth / 4),
      monthlyTrend: '+12%', // 전월 대비 증가율
      bestMonth: '2024-11',
      worstMonth: '2024-01',
      
      // 운행 품질 지표
      perfectDrives: Math.floor(baseStats.totalDrives * 0.85), // 완벽한 운행 횟수
      earlyArrivals: Math.floor(baseStats.totalDrives * (baseStats.earlyArrivalRate / 100)),
      lateArrivals: Math.floor(baseStats.totalDrives * (baseStats.lateArrivalRate / 100)),
      
      // 효율성 지표
      fuelSavings: Math.floor(baseStats.totalDistance * 0.15), // 연료 절약량 (L)
      carbonReduction: Math.floor(baseStats.totalDistance * 0.12), // 탄소 절약량 (kg)
      
      // 승객 관련
      totalPassengers: Math.floor(baseStats.totalDrives * 25),
      repeatCustomers: '68%',
      
      // 시간 관련
      peakHourDrives: Math.floor(baseStats.totalDrives * 0.45), // 출퇴근 시간 운행
      nightDrives: Math.floor(baseStats.totalDrives * 0.12), // 야간 운행
      weekendDrives: Math.floor(baseStats.totalDrives * 0.25), // 주말 운행
    };
  };
  
  /**
   * 월별 운행 통계 조회
   * @param {number} monthsBack - 몇 개월 전까지 조회할지 (기본 12개월)
   * @returns {Array} 월별 통계 배열
   */
  export const getMonthlyStats = (monthsBack = 12) => {
    return MONTHLY_STATS.slice(-monthsBack);
  };
  
  /**
   * 주간 운행 통계 조회
   * @param {number} weeksBack - 몇 주 전까지 조회할지 (기본 4주)
   * @returns {Array} 주간 통계 배열
   */
  export const getWeeklyStats = (weeksBack = 4) => {
    return WEEKLY_STATS.slice(-weeksBack);
  };
  
  /**
   * 노선별 운행 통계 조회
   * @returns {Array} 노선별 통계 배열
   */
  export const getRouteStats = () => {
    return [...ROUTE_STATS];
  };
  
  /**
   * 운행 효율성 점수 계산
   * @param {Object} stats - 운행 통계 객체
   * @returns {Object} 효율성 점수 및 등급
   */
  export const calculateEfficiencyScore = (stats = generateDrivingStats()) => {
    // 각 항목별 가중치
    const weights = {
      safetyScore: 0.3,      // 안전성 30%
      onTimeRate: 0.25,      // 정시성 25%
      customerRating: 0.2,   // 고객만족 20%
      fuelEfficiency: 0.15,  // 연비 15%
      incidentCount: 0.1     // 사고율 10%
    };
    
    // 정규화된 점수 계산
    const safetyNorm = stats.safetyScore; // 이미 0-100
    const onTimeNorm = stats.onTimeRate; // 이미 0-100
    const ratingNorm = (stats.customerRating / 5) * 100; // 0-5를 0-100으로
    const fuelNorm = Math.min(100, (stats.fuelEfficiency / 10) * 100); // 연비 정규화
    const incidentNorm = Math.max(0, 100 - (stats.incidentCount * 10)); // 사고율 역산
    
    // 종합 점수 계산
    const totalScore = 
      (safetyNorm * weights.safetyScore) +
      (onTimeNorm * weights.onTimeRate) +
      (ratingNorm * weights.customerRating) +
      (fuelNorm * weights.fuelEfficiency) +
      (incidentNorm * weights.incidentCount);
    
    // 등급 결정
    let grade = 'D';
    if (totalScore >= 95) grade = 'S';
    else if (totalScore >= 90) grade = 'A+';
    else if (totalScore >= 85) grade = 'A';
    else if (totalScore >= 80) grade = 'B+';
    else if (totalScore >= 75) grade = 'B';
    else if (totalScore >= 70) grade = 'C+';
    else if (totalScore >= 60) grade = 'C';
    
    return {
      totalScore: Math.round(totalScore * 10) / 10,
      grade,
      breakdown: {
        safety: Math.round(safetyNorm * 10) / 10,
        onTime: Math.round(onTimeNorm * 10) / 10,
        satisfaction: Math.round(ratingNorm * 10) / 10,
        fuel: Math.round(fuelNorm * 10) / 10,
        incident: Math.round(incidentNorm * 10) / 10
      }
    };
  };
  
  /**
   * 운행 목표 달성률 계산
   * @param {Object} stats - 현재 통계
   * @param {Object} targets - 목표 수치
   * @returns {Object} 목표 달성률
   */
  export const calculateTargetAchievement = (
    stats = generateDrivingStats(),
    targets = {
      monthlyDrives: 30,
      safetyScore: 95,
      onTimeRate: 95,
      customerRating: 4.5
    }
  ) => {
    return {
      monthlyDrives: {
        current: stats.thisMonth,
        target: targets.monthlyDrives,
        achievement: Math.round((stats.thisMonth / targets.monthlyDrives) * 100)
      },
      safetyScore: {
        current: stats.safetyScore,
        target: targets.safetyScore,
        achievement: Math.round((stats.safetyScore / targets.safetyScore) * 100)
      },
      onTimeRate: {
        current: stats.onTimeRate,
        target: targets.onTimeRate,
        achievement: Math.round((stats.onTimeRate / targets.onTimeRate) * 100)
      },
      customerRating: {
        current: stats.customerRating,
        target: targets.customerRating,
        achievement: Math.round((stats.customerRating / targets.customerRating) * 100)
      }
    };
  };
  
  /**
   * 운행 통계 서비스 시뮬레이션
   * API 호출을 시뮬레이션하는 함수들
   */
  export const StatsService = {
    /**
     * 기본 운행 통계 조회 (API 시뮬레이션)
     * @param {number} delay - 응답 지연 시간 (ms)
     * @returns {Promise<Object>} API 응답 형태의 데이터
     */
    async getUserStats(delay = 800) {
      // 실제 API 호출처럼 약간의 지연 추가
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return {
        success: true,
        data: generateDrivingStats(),
        message: '운행 통계 조회 성공'
      };
    },
  
    /**
     * 상세 운행 통계 조회
     * @param {number} delay - 응답 지연 시간 (ms)
     * @returns {Promise<Object>} API 응답 형태의 데이터
     */
    async getDetailedStats(delay = 1000) {
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return {
        success: true,
        data: generateDetailedStats(),
        message: '상세 통계 조회 성공'
      };
    },
  
    /**
     * 월별 통계 조회
     * @param {number} months - 조회할 개월 수
     * @param {number} delay - 응답 지연 시간 (ms)
     * @returns {Promise<Object>} API 응답 형태의 데이터
     */
    async getMonthlyReport(months = 12, delay = 600) {
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return {
        success: true,
        data: getMonthlyStats(months),
        message: '월별 통계 조회 성공'
      };
    },
  
    /**
     * 효율성 리포트 조회
     * @param {number} delay - 응답 지연 시간 (ms)
     * @returns {Promise<Object>} API 응답 형태의 데이터
     */
    async getEfficiencyReport(delay = 700) {
      await new Promise(resolve => setTimeout(resolve, delay));
      
      const stats = generateDrivingStats();
      const efficiency = calculateEfficiencyScore(stats);
      const targets = calculateTargetAchievement(stats);
      
      return {
        success: true,
        data: {
          basicStats: stats,
          efficiency,
          targets,
          routeStats: getRouteStats()
        },
        message: '효율성 리포트 조회 성공'
      };
    }
  };