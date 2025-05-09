// src/services/authService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// API 엔드포인트 (실제 백엔드 URL로 변경 필요)
const API_URL = 'https://your-backend-api.com';

// API 요청 타임아웃 설정
const API_TIMEOUT = 10000; // 10초

// 토큰 기반 API 요청 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 토큰 추가
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 토큰 만료 처리
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // 토큰 만료 등의 인증 오류 처리
    if (error.response && error.response.status === 401) {
      await AsyncStorage.removeItem('token');
      // 로그인 페이지로 리다이렉트 필요 시 코드 추가
    }
    return Promise.reject(error);
  }
);

const authService = {
  // Google 로그인
  loginWithGoogle: async (googleData) => {
    try {
      console.log('[authService] Google 로그인 요청 시작');
      
      const response = await apiClient.post('/auth/google', googleData);
      
      if (response.data && response.data.token) {
        console.log('[authService] 로그인 성공, 토큰 저장');
        await AsyncStorage.setItem('token', response.data.token);
        return response.data;
      }
      
      throw new Error('Invalid response from server');
    } catch (error) {
      console.error('[authService] Google 로그인 오류:', error);
      throw error;
    }
  },
  
  // 회원가입
  signUp: async (signupData) => {
    try {
      console.log('[authService] 회원가입 요청 시작');
      
      const response = await apiClient.post('/auth/signup', signupData);
      
      return response.data && response.data.success;
    } catch (error) {
      console.error('[authService] 회원가입 오류:', error);
      throw error;
    }
  },
  
  // 인증 상태 확인
  checkAuthStatus: async () => {
    try {
      console.log('[authService] 인증 상태 확인 요청 시작');
      
      const response = await apiClient.get('/auth/status');
      
      return response.data && response.data.user;
    } catch (error) {
      console.error('[authService] 인증 상태 확인 오류:', error);
      return null;
    }
  },
  
  // 추가 정보 저장
  saveAdditionalInfo: async (additionalInfo) => {
    try {
      console.log('[authService] 추가 정보 저장 요청 시작');
      
      const response = await apiClient.post('/users/additional-info', additionalInfo);
      
      return response.data && response.data.success;
    } catch (error) {
      console.error('[authService] 추가 정보 저장 오류:', error);
      throw error;
    }
  },
  
  // 로그아웃
  logout: async () => {
    try {
      console.log('[authService] 로그아웃 요청 시작');
      
      // 백엔드 로그아웃 요청
      await apiClient.post('/auth/logout');
      
      // 로컬 스토리지에서 토큰 제거
      await AsyncStorage.removeItem('token');
      
      console.log('[authService] 로그아웃 성공');
    } catch (error) {
      console.error('[authService] 로그아웃 오류:', error);
      
      // 백엔드 요청 실패해도 로컬 스토리지에서는 토큰 제거
      await AsyncStorage.removeItem('token');
      
      throw error;
    }
  },
};

export default authService;