// src/context/UserContext.js
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 유저 정보 타입 정의
type Station = {
  name: string;
  longitude: number;
  latitude: number;
};

type UserInfo = {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string;
  myStations: Station[];
  licenseInfo?: {
    licenseNumber: string;
    licenseType: string;
    licenseExpiryDate: string;
  };
  phoneNumber?: string;
};

// Context 타입 정의
interface UserContextType {
  userInfo: UserInfo;
  setUserInfo: (info: UserInfo) => void;
  updateUserInfo: (info: Partial<UserInfo>) => void;
  resetUserInfo: () => void;
  isLoggedIn: boolean;
}

// 초기 상태 값
const initialUserInfo: UserInfo = {
  id: '',
  name: '',
  email: '',
  role: '',
  organizationId: '',
  myStations: [],
};

// Context 생성
export const UserContext = createContext<UserContextType>({
  userInfo: initialUserInfo,
  setUserInfo: () => {},
  updateUserInfo: () => {},
  resetUserInfo: () => {},
  isLoggedIn: false,
});

// Provider 컴포넌트
interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [userInfo, setUserInfo] = useState<UserInfo>(initialUserInfo);
  
  // 앱 시작 시 저장된 사용자 정보 로드
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        console.log('[UserContext] 저장된 사용자 정보 로드 중');
        const storedUserInfo = await AsyncStorage.getItem('userInfo');
        
        if (storedUserInfo) {
          const parsedUserInfo = JSON.parse(storedUserInfo);
          console.log('[UserContext] 저장된 사용자 정보 로드 성공:', parsedUserInfo.email);
          setUserInfo(parsedUserInfo);
        } else {
          console.log('[UserContext] 저장된 사용자 정보 없음');
        }
      } catch (error) {
        console.error('[UserContext] 저장된 사용자 정보 로드 오류:', error);
      }
    };
    
    loadUserInfo();
  }, []);
  
  // 사용자 정보 저장 함수
  const setUserInfoWithStorage = (info: UserInfo) => {
    console.log('[UserContext] 사용자 정보 설정:', info.email);
    setUserInfo(info);
    
    // AsyncStorage에 저장
    AsyncStorage.setItem('userInfo', JSON.stringify(info))
      .then(() => console.log('[UserContext] 사용자 정보 AsyncStorage에 저장 성공'))
      .catch(error => console.error('[UserContext] 사용자 정보 AsyncStorage 저장 오류:', error));
  };
  
  // 사용자 정보 업데이트 함수 (부분 업데이트)
  const updateUserInfo = (info: Partial<UserInfo>) => {
    console.log('[UserContext] 사용자 정보 업데이트:', Object.keys(info).join(', '));
    
    setUserInfo(prev => {
      const updated = { ...prev, ...info };
      
      // AsyncStorage에도 저장
      AsyncStorage.setItem('userInfo', JSON.stringify(updated))
        .then(() => console.log('[UserContext] 사용자 정보 AsyncStorage에 저장 성공'))
        .catch(error => console.error('[UserContext] 사용자 정보 AsyncStorage 저장 오류:', error));
      
      return updated;
    });
  };
  
  // 로그아웃 시 초기화를 위한 함수
  const resetUserInfo = () => {
    console.log('[UserContext] 사용자 정보 초기화');
    setUserInfo(initialUserInfo);
    
    // AsyncStorage에서도 삭제
    AsyncStorage.removeItem('userInfo')
      .then(() => console.log('[UserContext] AsyncStorage에서 사용자 정보 삭제 성공'))
      .catch(error => console.error('[UserContext] AsyncStorage에서 사용자 정보 삭제 오류:', error));
  };

  // 로그인 여부 확인
  const isLoggedIn = !!userInfo.id;
  
  // 디버그를 위한 상태 변경 감지
  useEffect(() => {
    console.log('[UserContext] 사용자 정보 변경됨:', {
      id: userInfo.id ? userInfo.id.substring(0, 5) + '...' : 'empty',
      name: userInfo.name || 'empty',
      email: userInfo.email || 'empty',
      role: userInfo.role || 'empty',
      isLoggedIn
    });
  }, [userInfo, isLoggedIn]);

  return (
    <UserContext.Provider 
      value={{ 
        userInfo, 
        setUserInfo: setUserInfoWithStorage, 
        updateUserInfo, 
        resetUserInfo,
        isLoggedIn 
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// 커스텀 훅으로 사용 편의성 제공
export const useUser = () => {
  const context = React.useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};