import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL, GOOGLE_OAUTH2_LOGIN_ENDPOINT, API_TIMEOUT } from "@env";


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
    if (error.response && error.response.status === 401) {
      await AsyncStorage.removeItem('token');
      // 여기서 로그인 화면으로 리다이렉트할 수 있지만, 
      // 일반적으로 컴포넌트에서 처리하는 것이 좋습니다.
    }
    return Promise.reject(error);
  }
);

const authService = {
  // Google 로그인
  loginWithGoogle: async (googleData) => {
    try {
      console.log('[authService] Google 로그인 요청 시작:', googleData.user.email);

      const response = await apiClient.post(GOOGLE_OAUTH2_LOGIN_ENDPOINT, {
        idToken: googleData.idToken,
        email: googleData.user.email,
        name: googleData.user.name
      });

      if (response.data && response.data.token) {
        console.log('[authService] 로그인 성공, 토큰 저장');
        await AsyncStorage.setItem('token', response.data.token);

        // 사용자 정보도 로컬 저장소에 저장
        if (response.data.user) {
          await AsyncStorage.setItem('userInfo', JSON.stringify(response.data.user));
        }

        return {
          token: response.data.token,
          user: response.data.user,
          additionalInfoRequired: response.data.additionalInfoRequired || false
        };
      }

      throw new Error('서버 응답에 토큰이 없습니다');
    } catch (error) {
      console.error('[authService] Google 로그인 오류:', error);
      throw error;
    }
  },

  // 회원가입
  signUp: async (signupData) => {
    try {
      console.log('[authService] 회원가입 요청 시작:', signupData.user.email);

      const response = await apiClient.post('/auth/signup', {
        idToken: signupData.idToken,
        email: signupData.user.email,
        name: signupData.user.name
      });

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

      const response = await apiClient.get('/api/auth/user');

      if (response.data && response.data.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('[authService] 인증 상태 확인 오류:', error);
      return null;
    }
  },

  // 추가 정보 저장 (운전자 라이센스 등)
  saveAdditionalInfo: async (additionalInfo) => {
    try {
      console.log('[authService] 추가 정보 저장 요청 시작:', additionalInfo.email);

      const response = await apiClient.post('/api/auth/rankUp', {
        code: additionalInfo.licenseNumber,
        licenseType: additionalInfo.licenseType,
        licenseExpiryDate: additionalInfo.licenseExpiryDate,
        phoneNumber: additionalInfo.phoneNumber
      });

      return response.data && response.data.data;
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
      await apiClient.post('/api/auth/logout');

      // 로컬 스토리지에서 토큰 및 사용자 정보 제거
      const keysToRemove = ['token', 'userInfo', 'hasAdditionalInfo'];
      await Promise.all(keysToRemove.map(key => AsyncStorage.removeItem(key)));

      console.log('[authService] 로그아웃 성공');
    } catch (error) {
      console.error('[authService] 로그아웃 오류:', error);

      // 백엔드 요청 실패해도 로컬 스토리지에서는 토큰 제거
      const keysToRemove = ['token', 'userInfo', 'hasAdditionalInfo'];
      await Promise.all(keysToRemove.map(key => AsyncStorage.removeItem(key)));

      throw error;
    }
  }
};

export default authService;