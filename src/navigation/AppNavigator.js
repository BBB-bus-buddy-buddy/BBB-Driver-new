// src/navigation/AppNavigator.js
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import AdditionalInfoScreen from '../screens/AdditionalInfoScreen';
import HomeScreen from '../screens/HomeScreen';
import StartDriveScreen from '../screens/StartDriveScreen';
import DrivingScreen from '../screens/DrivingScreen';
import EndDriveScreen from '../screens/EndDriveScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import MessageScreen from '../screens/MessageScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/theme';

// 스택 네비게이터 생성
const Stack = createStackNavigator();

const AppNavigator = () => {
  const { token, isLoading: authLoading, additionalInfoRequired } = useAuth();
  const { userInfo, setUserInfo } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState(null);

  // 앱 시작 시 인증 상태 확인
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log('[AppNavigator] 앱 초기화 및 인증 상태 확인 중');
        
        // 사용자 정보 확인
        const storedUserInfo = await AsyncStorage.getItem('userInfo');
        
        if (storedUserInfo && !userInfo.id) {
          console.log('[AppNavigator] 저장된 사용자 정보 발견');
          // UserContext에 사용자 정보 설정
          try {
            const parsedUserInfo = JSON.parse(storedUserInfo);
            console.log('[AppNavigator] 사용자 정보 로드:', parsedUserInfo.email);
            setUserInfo(parsedUserInfo);
          } catch (parseError) {
            console.error('[AppNavigator] 사용자 정보 파싱 오류:', parseError);
            await AsyncStorage.removeItem('userInfo');
          }
        } else if (!storedUserInfo) {
          console.log('[AppNavigator] 저장된 사용자 정보 없음');
        }
      } catch (error) {
        console.error('[AppNavigator] 인증 상태 확인 오류:', error);
        setInitError('앱 초기화 중 오류가 발생했습니다. 다시 시도해주세요.');
      } finally {
        setIsLoading(false);
        console.log('[AppNavigator] 인증 상태 확인 완료');
      }
    };

    checkAuthStatus();
  }, []);

  // 인증 상태 변화 로깅
  useEffect(() => {
    console.log('[AppNavigator] 인증 상태 변경:', {
      token: token ? '있음' : '없음',
      additionalInfoRequired: additionalInfoRequired,
      userInfoExists: !!userInfo.id
    });
  }, [token, additionalInfoRequired, userInfo]);

  // AuthContext 로딩 중이거나 앱 로딩 중이면 로딩 화면 표시
  if (authLoading || isLoading) {
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

  // 인증 상태에 따른 화면 렌더링 - 단일 네비게이터 구조 사용
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!token ? (
        // 인증되지 않은 사용자용 화면
        <>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </>
      ) : additionalInfoRequired ? (
        // 추가 정보 입력이 필요한 사용자
        <Stack.Screen name="AdditionalInfo" component={AdditionalInfoScreen} />
      ) : (
        // 인증된 사용자용 화면
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="StartDrive" component={StartDriveScreen} />
          <Stack.Screen name="Driving" component={DrivingScreen} />
          <Stack.Screen name="EndDrive" component={EndDriveScreen} />
          <Stack.Screen name="Schedule" component={ScheduleScreen} />
          <Stack.Screen name="Message" component={MessageScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;