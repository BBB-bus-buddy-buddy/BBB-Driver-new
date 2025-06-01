/**
 * Storage 모듈 메인 진입점
 * 
 * @module storage
 * @description AsyncStorage 중앙 관리 시스템
 */

import { StorageManager } from './StorageManager';
import { storageHelpers } from './helpers';

// 싱글톤 인스턴스 생성
export const storage = new StorageManager();

// 헬퍼 함수들 export
export { storageHelpers };

// 디버깅용 export (개발 환경에서만 사용)
export { KEYS, CURRENT_STORAGE_VERSION } from './keys';

// 앱 시작 시 자동 초기화
storage.initialize().catch(error => {
  console.error('[Storage] 자동 초기화 실패:', error);
});