// src/context/AuthContext.js
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/authService';

// Google OAuth 응답 타입 정의
interface GoogleOAuthResponse {
  idToken: string;
  user: {
    email: string;
    name: string;
  };
}

// 로그인 응답 타입 정의
interface LoginResponse {
  token: string;
  user: any;
  additionalInfoRequired: boolean;
}

// 인증 컨텍스트 타입 정의
interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  additionalInfoRequired: boolean; 
  googleLogin: (googleData: GoogleOAuthResponse) => Promise<LoginResponse>;
  testLogin: (userInfo: any) => Promise<LoginResponse>;
  signUp: (googleData: GoogleOAuthResponse) => Promise<boolean>;
  saveAdditionalInfo: (additionalInfo: any) => Promise<boolean>;
  logout: () => Promise<void>;
}

// Context 생성
export const AuthContext = createContext<AuthContextType>({
  isLoading: false,
  isAuthenticated: false,
  token: null,
  additionalInfoRequired: false,
  googleLogin: async () => ({ token: '', user: {}, additionalInfoRequired: false }),
  testLogin: async () => ({ token: '', user: {}, additionalInfoRequired: false }),
  signUp: async () => false,
  saveAdditionalInfo: async () => false,
  logout: async () => {},
});

// Provider 컴포넌트
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [additionalInfoRequired, setAdditionalInfoRequired] = useState<boolean>(false);

  // 앱 시작 시 인증 상태 확인
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log('[AuthContext] 인증 상태 확인 중');
        setIsLoading(true);
        
        // 저장된 토큰 확인
        const storedToken = await AsyncStorage.getItem('token');
        if (storedToken) {
          console.log('[AuthContext] 토큰 발견, 유효성 확인 중');
          setToken(storedToken);
          
          try {
            // 토큰 유효성 확인
            const userInfo = await authService.checkAuthStatus();
            if (userInfo) {
              console.log('[AuthContext] 유효한 토큰, 자동 로그인 성공');
              setIsAuthenticated(true);
            
              // 추가 정보 필요 여부 확인
              const hasAdditionalInfo = await AsyncStorage.getItem('hasAdditionalInfo');
              setAdditionalInfoRequired(hasAdditionalInfo !== 'true');
            } else {
              console.log('[AuthContext] 토큰 유효하지 않음, 로그아웃 처리');
              await clearAuthData();
            }
          } catch (error) {
            console.error('[AuthContext] 토큰 유효성 확인 오류:', error);
            await clearAuthData();
          }
        } else {
          console.log('[AuthContext] 토큰 없음, 로그인 필요');
          await clearAuthData();
        }
      } catch (error) {
        console.error('[AuthContext] 인증 상태 확인 오류:', error);
        await clearAuthData();
      } finally {
        setIsLoading(false);
        console.log('[AuthContext] 인증 상태 확인 완료');
      }
    };
    
    // 인증 데이터 초기화 도우미 함수
    const clearAuthData = async () => {
      setToken(null);
      setIsAuthenticated(false);
      setAdditionalInfoRequired(false);
    };
    
    checkAuthStatus();
  }, []);

  // 인증 상태 변화 로깅
  useEffect(() => {
    console.log('[AuthContext] 인증 상태 변경:', {
      isAuthenticated,
      token: token ? '존재' : '없음',
      additionalInfoRequired
    });
  }, [isAuthenticated, token, additionalInfoRequired]);

  // Google 로그인 처리
  const googleLogin = async (googleData: GoogleOAuthResponse): Promise<LoginResponse> => {
    try {
      console.log('[AuthContext] Google 로그인 시작:', googleData.user.email);
      setIsLoading(true);
      
      // 백엔드 인증 처리
      const result = await authService.loginWithGoogle(googleData);
      console.log('[AuthContext] Google 로그인 성공, 토큰 저장');
      
      // 로컬 저장소에 토큰 저장
      await AsyncStorage.setItem('token', result.token);
      
      // 인증 상태 업데이트
      setToken(result.token);
      setIsAuthenticated(true);
      setAdditionalInfoRequired(result.additionalInfoRequired);
      
      // 추가 정보 필요 여부 저장
      if (!result.additionalInfoRequired) {
        await AsyncStorage.setItem('hasAdditionalInfo', 'true');
      }
      
      return result;
    } catch (error) {
      console.error('[AuthContext] Google 로그인 오류:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 테스트 로그인 (백엔드 통신 없음)
  const testLogin = async (userInfo: any): Promise<LoginResponse> => {
    try {
      console.log('[AuthContext] 테스트 로그인 시작:', userInfo.email);
      setIsLoading(true);
      
      // 테스트용 토큰 생성
      const testToken = `test_token_${Date.now()}`;
      
      // 로컬 저장소에 정보 저장
      try {
        await AsyncStorage.setItem('token', testToken);
        await AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
        await AsyncStorage.setItem('hasAdditionalInfo', 'true');
        
        console.log('[AuthContext] 테스트 사용자 정보 저장 성공');
      } catch (storageError) {
        console.error('[AuthContext] AsyncStorage 저장 오류:', storageError);
        throw new Error('사용자 정보 저장 중 오류가 발생했습니다.');
      }
      
      // 인증 상태 업데이트
      setToken(testToken);
      setIsAuthenticated(true);
      setAdditionalInfoRequired(false);
      
      console.log('[AuthContext] 테스트 로그인 성공');
      
      return {
        token: testToken,
        user: userInfo,
        additionalInfoRequired: false
      };
    } catch (error) {
      console.error('[AuthContext] 테스트 로그인 오류:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 회원가입 처리
  const signUp = async (googleData: GoogleOAuthResponse): Promise<boolean> => {
    try {
      console.log('[AuthContext] 회원가입 시작:', googleData.user.email);
      setIsLoading(true);
      
      // 회원가입 데이터 준비
      const signupData = {
        email: googleData.user.email,
        name: googleData.user.name,
        idToken: googleData.idToken
      };
      
      // 백엔드 회원가입 처리
      const success = await authService.signUp(signupData);
      console.log('[AuthContext] 회원가입 결과:', success ? '성공' : '실패');
      
      if (success) {
        setAdditionalInfoRequired(true);
      }
      
      return success;
    } catch (error) {
      console.error('[AuthContext] 회원가입 오류:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // 추가 정보 저장 처리
const saveAdditionalInfo = async (additionalInfo: any): Promise<boolean> => {
    try {
      console.log('[AuthContext] 추가 정보 저장 시작:', additionalInfo.email || '이메일 없음');
      setIsLoading(true);
      
      // 백엔드 추가 정보 저장 처리
      const success = await authService.saveAdditionalInfo(additionalInfo);
      console.log('[AuthContext] 추가 정보 저장 결과:', success ? '성공' : '실패');
      
      if (success) {
        await AsyncStorage.setItem('hasAdditionalInfo', 'true');
        setAdditionalInfoRequired(false);
      }
      
      return success;
    } catch (error) {
      console.error('[AuthContext] 추가 정보 저장 오류:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 로그아웃 처리
  const logout = async (): Promise<void> => {
    try {
      console.log('[AuthContext] 로그아웃 시작');
      setIsLoading(true);
      
      // 백엔드 로그아웃 처리 (가능한 경우)
      try {
        await authService.logout();
      } catch (apiError) {
        console.warn('[AuthContext] 백엔드 로그아웃 실패, 로컬 로그아웃 진행:', apiError);
      }
      
      // 로컬 스토리지 데이터 삭제
      const keysToRemove = ['token', 'userInfo', 'hasAdditionalInfo'];
      await Promise.all(keysToRemove.map(key => AsyncStorage.removeItem(key)));
      
      // 인증 상태 초기화
      setToken(null);
      setIsAuthenticated(false);
      setAdditionalInfoRequired(false);
      
      console.log('[AuthContext] 로그아웃 완료');
    } catch (error) {
      console.error('[AuthContext] 로그아웃 오류:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 컨텍스트 값 제공
  const contextValue: AuthContextType = {
    isLoading,
    isAuthenticated,
    token,
    additionalInfoRequired,
    googleLogin,
    testLogin,
    signUp,
    saveAdditionalInfo,
    logout
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 커스텀 훅으로 사용 편의성 제공
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};