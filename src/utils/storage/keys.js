/**
 * AsyncStorage 키 상수 정의
 * 
 * @description 앱 전체에서 사용되는 로컬 스토리지 키를 중앙 관리
 * @usage 직접 사용하지 않고, storage 객체의 메서드를 통해 접근
 */
export const KEYS = {
    /**
     * 사용자 인증 토큰
     * @type {string} JWT 토큰 문자열
     * @usage 로그인 시 저장, API 요청 시 헤더에 포함
     * @screens LoginScreen(저장), 모든 API 호출(사용)
     */
    TOKEN: 'token',

    /**
     * 사용자 정보 객체
     * @type {Object} {email, name, role, licenseInfo, phoneNumber, organizationId}
     * @usage 로그인 후 저장, 프로필 화면 및 권한 체크에 사용
     * @screens LoginScreen(저장), ProfileScreen(조회), HomeScreen(조회)
     */
    USER_INFO: 'userInfo',

    /**
     * 현재 진행 중인 운행 정보
     * @type {Object|null} {id, busNumber, route, startTime, status}
     * @usage 운행 시작 시 저장, 운행 종료 시 삭제
     * @screens StartDriveScreen(저장), DrivingScreen(조회/수정), EndDriveScreen(삭제)
     */
    CURRENT_DRIVE: 'currentDriveStatus',

    /**
     * 운행 일정 목록
     * @type {Array<Object>} [{id, busNumber, route, departureTime, arrivalTime}]
     * @usage API로 받은 일정을 캐싱, 오프라인 시 사용
     * @screens HomeScreen(조회), ScheduleScreen(조회/저장)
     */
    DRIVE_SCHEDULES: 'driveSchedules',

    /**
     * 운행 기록 (최대 50개)
     * @type {Array<Object>} 완료된 운행 정보 배열
     * @usage 운행 종료 시 추가, 통계 및 이력 조회용
     * @screens EndDriveScreen(추가), ProfileScreen(통계 조회)
     */
    DRIVE_HISTORY: 'driveHistory',

    /**
     * 마지막 사용자 정보 동기화 시간
     * @type {string} ISO 날짜 문자열 (예: "2024-01-01T12:00:00.000Z")
     * @usage 5분마다 서버와 동기화 필요 여부 판단
     * @screens SplashScreen(확인), AppNavigator(동기화)
     */
    LAST_SYNC: 'lastUserSync',

    /**
     * 추가 정보 입력 완료 여부
     * @type {string} "true" | "false" 문자열
     * @usage ROLE_GUEST 사용자가 운전면허 정보 입력 완료했는지 확인
     * @screens AdditionalInfoScreen(저장), AppNavigator(라우팅 결정)
     */
    HAS_ADDITIONAL_INFO: 'hasAdditionalInfo',

    /**
     * 마지막으로 완료된 운행 정보
     * @type {Object} {id, busNumber, route, startTime, endTime, duration}
     * @usage 운행 종료 직후 결과 화면에 표시
     * @screens EndDriveScreen(저장/조회)
     */
    COMPLETED_DRIVE: 'completedDrive',

    /**
     * 스토리지 스키마 버전
     * @type {string} 버전 문자열 (예: "1.0.0")
     * @usage 앱 업데이트 시 데이터 마이그레이션 관리
     * @internal 시스템 내부 사용
     */
    STORAGE_VERSION: 'storageVersion'
};

// 현재 스토리지 버전
export const CURRENT_STORAGE_VERSION = '1.0.0';