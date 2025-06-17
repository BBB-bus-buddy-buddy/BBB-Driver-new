// src/api/client.js
import axios from 'axios';
import { storage } from '../utils/storage';
import { API_URL_PROD, API_URL_LOCAL, API_TIMEOUT } from '@env';

// 환경에 따른 API URL 자동 선택
const getApiUrl = () => {
  // __DEV__는 개발 모드에서 true, 프로덕션 빌드에서 false
  const apiUrl = __DEV__ ? API_URL_LOCAL : API_URL_PROD;

  console.log('[API Client] 환경:', __DEV__ ? '개발' : '프로덕션');
  console.log('[API Client] API URL:', apiUrl);

  return apiUrl;
};

// axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: getApiUrl(),
  timeout: parseInt(API_TIMEOUT) || 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// 요청 인터셉터 - 토큰 추가
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await storage.getToken();
      console.log(`[API Client] Request to ${config.url}, token exists: ${!!token}`);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('[API Client] 토큰 가져오기 오류:', error);
    }
    return config;
  },
  (error) => {
    console.error('[API Client] 요청 인터셉터 오류:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 401 에러 처리
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Client] Response from ${response.config.url}: ${response.status}`);
    return response;
  },
  async (error) => {
    console.error(`[API Client] Response error from ${error.config?.url}:`, error.response?.status);

    // 토큰 만료 등으로 인한 인증 실패
    if (error.response && error.response.status === 401) {
      console.log('[API Client] 401 인증 오류 발생 - 토큰 삭제');

      // 로컬 스토리지에서 인증 관련 항목 제거
      try {
        await storage.clearUserData();
      } catch (storageError) {
        console.error('[API Client] 스토리지 정리 오류:', storageError);
      }

      // 401 에러는 서비스 레이어에서 처리하도록 그대로 전파
    }

    return Promise.reject(error);
  }
);

export default apiClient;