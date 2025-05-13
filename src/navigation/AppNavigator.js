// src/navigation/AppNavigator.js - 조건부 렌더링 제거하고 모든 화면 등록
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import AdditionalInfoScreen from '../screens/AdditionalInfoScreen';
import HomeScreen from '../screens/HomeScreen';
import StartDriveScreen from '../screens/StartDriveScreen';
import DrivingScreen from '../screens/DrivingScreen';
import EndDriveScreen from '../screens/EndDriveScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import MessageScreen from '../screens/MessageScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/theme';
import apiClient from '../api/apiClient';

// 스택 네비게이터 생성
const Stack = createStackNavigator();

// 앱 네비게이터
const AppNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRouteName, setInitialRouteName] = useState('Splash');
  const [initError, setInitError] = useState(null);

  // 앱 시작 시 인증 상태 확인
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log('[AppNavigator] 앱 초기화 및 인증 상태 확인 중');
        
        // 토큰 확인
        const storedToken = await AsyncStorage.getItem('token');
        
        if (storedToken) {
          console.log('[AppNavigator] 토큰 발견, 유효성 확인 중');
          
          // 토큰을 API 헤더에 설정
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          
          // 사용자 정보 확인
          const storedUserInfo = await AsyncStorage.getItem('userInfo');
          
          if (storedUserInfo) {
            // 저장된 사용자 정보가 있으면 로드
            try {
              const parsedUserInfo = JSON.parse(storedUserInfo);
              console.log('[AppNavigator] 사용자 정보 로드:', parsedUserInfo.email);
              
              // 추가 정보 필요 여부 확인 (GUEST 역할인 경우)
              if (parsedUserInfo.role === 'ROLE_GUEST') {
                console.log('[AppNavigator] 게스트 사용자, 추가 정보 필요');
                setInitialRouteName('AdditionalInfo');
              } else {
                console.log('[AppNavigator] 일반 사용자, 홈 화면으로 이동');
                setInitialRouteName('Home');
              }
            } catch (parseError) {
              console.error('[AppNavigator] 사용자 정보 파싱 오류:', parseError);
              await clearAuthData();
              setInitialRouteName('Login');
            }
          } else {
            // 사용자 정보가 없는 경우 API에서 요청 시도
            try {
              console.log('[AppNavigator] 사용자 정보 API 요청');
              
              const userResponse = await apiClient.get('/api/auth/user');
              if (userResponse.data?.data) {
                const userData = userResponse.data.data;
                console.log('[AppNavigator] API에서 사용자 정보 로드 성공:', userData.email);
                
                // 사용자 정보 저장
                await AsyncStorage.setItem('userInfo', JSON.stringify(userData));
                
                // 추가 정보 필요 여부 확인 (GUEST 역할인 경우)
                if (userData.role === 'ROLE_GUEST') {
                  console.log('[AppNavigator] 게스트 사용자, 추가 정보 필요');
                  setInitialRouteName('AdditionalInfo');
                } else {
                  console.log('[AppNavigator] 일반 사용자, 홈 화면으로 이동');
                  setInitialRouteName('Home');
                }
              } else {
                // API에서 사용자 정보를 가져올 수 없는 경우
                console.log('[AppNavigator] API 응답 없음, 인증 정보 초기화');
                await clearAuthData();
                setInitialRouteName('Login');
              }
            } catch (apiError) {
              // API 호출 실패
              console.error('[AppNavigator] API 요청 오류:', apiError);
              await clearAuthData();
              setInitialRouteName('Login');
            }
          }
        } else {
          console.log('[AppNavigator] 토큰 없음, 로그인 필요');
          await clearAuthData();
          setInitialRouteName('Login');
        }
      } catch (error) {
        console.error('[AppNavigator] 인증 상태 확인 오류:', error);
        setInitError('앱 초기화 중 오류가 발생했습니다. 다시 시도해주세요.');
        await clearAuthData();
        setInitialRouteName('Login');
      } finally {
        setIsLoading(false);
        console.log('[AppNavigator] 인증 상태 확인 완료, 초기 화면:', initialRouteName);
      }
    };
    
    // 인증 데이터 초기화 도우미 함수
    const clearAuthData = async () => {
      // AsyncStorage 정리
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userInfo');
      await AsyncStorage.removeItem('hasAdditionalInfo');
      
      // API 헤더 제거
      delete apiClient.defaults.headers.common['Authorization'];
    };

    checkAuthStatus();
  }, []);

  // 앱 로딩 중이면 로딩 화면 표시
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 10, color: COLORS.grey }}>앱을 불러오는 중입니다...</Text>
      </View>
    );
  }

  // 초기화 오류가 있으면 오류 화면 표시
  if (initError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white, padding: 20 }}>
        <Text style={{ color: COLORS.error, fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
          {initError}
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: COLORS.primary,
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 8,
          }}
          onPress={() => setInitError(null)}>
          <Text style={{ color: COLORS.white }}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 모든 화면을 포함하는 단일 스택 네비게이터
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }} 
      initialRouteName={initialRouteName}
    >
      {/* 모든 화면을 항상 포함 */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="AdditionalInfo" component={AdditionalInfoScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="StartDrive" component={StartDriveScreen} />
      <Stack.Screen name="Driving" component={DrivingScreen} />
      <Stack.Screen name="EndDrive" component={EndDriveScreen} />
      <Stack.Screen name="Schedule" component={ScheduleScreen} />
      <Stack.Screen name="Message" component={MessageScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;