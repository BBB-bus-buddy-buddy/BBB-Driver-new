// src/api/apiClient.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL_PROD, API_URL_LOCAL, API_TIMEOUT } from '@env';

// axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_URL_LOCAL, // 기본값 설정
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  }
});

// 요청 인터셉터 - 토큰 추가
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log(`[apiClient] token = ${token}`);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('토큰 가져오기 오류:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 401 에러 처리
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // 토큰 만료 등으로 인한 인증 실패
    if (error.response && error.response.status === 401) {
      console.log('인증 오류: 토큰이 만료되었거나 유효하지 않습니다.');
      
      // 로컬 스토리지에서 인증 관련 항목 제거
      try {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('userInfo');
        await AsyncStorage.removeItem('hasAdditionalInfo');
      } catch (storageError) {
        console.error('AsyncStorage 오류:', storageError);
      }
      
      // 로그인 페이지로 리다이렉트는 앱 레벨에서 처리해야 함
      // Navigation은 여기서 접근할 수 없으므로 이벤트나 콜백을 통해 처리해야 함
    }
    return Promise.reject(error);
  }
);

export default apiClient;