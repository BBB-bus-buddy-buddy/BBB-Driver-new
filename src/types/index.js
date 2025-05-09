// src/types/index.js

// 이 파일은 타입 정의를 위한 주석으로 문서화 되어 있습니다.
// JavaScript에서는 실제 런타임 타입 체크가 없지만, 
// 코드 문서화 및 개발 가이드를 위해 타입 정보를 주석으로 제공합니다.

/**
 * @typedef {Object} DriveSchedule
 * @property {number} id - 운행 ID
 * @property {string} busNumber - 버스 번호
 * @property {string} route - 노선 정보
 * @property {string} departureTime - 출발 시간
 * @property {string} arrivalTime - 도착 예정 시간
 * @property {boolean} isButtonActive - 버튼 활성화 여부
 */

/**
 * @typedef {Object} ActiveDrive
 * @property {number} id - 운행 ID
 * @property {string} busNumber - 버스 번호
 * @property {string} route - 노선 정보
 * @property {string} departureTime - 출발 시간
 * @property {string} arrivalTime - 도착 예정 시간
 * @property {string} startTime - 실제 운행 시작 시간 (ISO 문자열)
 * @property {'driving'} status - 운행 상태
 */

/**
 * @typedef {Object} CompletedDrive
 * @property {number} id - 운행 ID
 * @property {string} busNumber - 버스 번호
 * @property {string} route - 노선 정보
 * @property {string} departureTime - 출발 시간
 * @property {string} arrivalTime - 도착 예정 시간
 * @property {string} startTime - 실제 운행 시작 시간 (ISO 문자열)
 * @property {string} endTime - 실제 운행 종료 시간 (ISO 문자열)
 * @property {'completed'} status - 운행 상태
 * @property {string} duration - 운행 시간 (HH:MM:SS 형식)
 */

/**
 * @typedef {Object} UserInfo
 * @property {string} [name] - 사용자 이름
 * @property {string} licenseNumber - 면허 번호
 * @property {string} licenseType - 면허 종류
 * @property {string} licenseExpiryDate - 면허 만료일
 * @property {string} phoneNumber - 전화번호
 */

/**
 * @typedef {Object} NextStopInfo
 * @property {string} name - 다음 정거장 이름
 * @property {string} timeRemaining - 남은 시간 (분)
 */

/**
 * @typedef {Object} WeatherInfo
 * @property {string} temp - 온도
 * @property {string} condition - 날씨 상태
 */

/**
 * @typedef {Object} Notification
 * @property {number} id - 알림 ID
 * @property {string} message - 알림 메시지
 * @property {string} time - 알림 시간 
 */

