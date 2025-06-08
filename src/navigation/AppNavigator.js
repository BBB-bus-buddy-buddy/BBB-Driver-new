// src/navigation/AppNavigator.js
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity, Alert } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import StartDriveScreen from '../screens/StartDriveScreen';
import DrivingScreen from '../screens/DrivingScreen';
import EndDriveScreen from '../screens/EndDriveScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { COLORS } from '../constants/theme';

import { AuthService } from '../services/authService';
import AdditionalInfoBeta from '../screens/AdditionalInfoBeta/AdditioncalInfoBeta';
import OperationPlanScreen from '../screens/OperationPlanScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRouteName, setInitialRouteName] = useState('Splash');
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log('[AppNavigator] 앱 초기화 및 인증 상태 확인 중');

        const token = await AuthService.getToken();

        if (!token) {
          console.log('[AppNavigator] 토큰 없음, 로그인 화면으로 이동');
          setInitialRouteName('Login');
          return;
        }

        console.log('[AppNavigator] 토큰 발견, 사용자 정보 동기화 중...');

        const syncResult = await AuthService.syncUserInfo();

        if (syncResult.success && syncResult.userInfo) {
          console.log('[AppNavigator] 동기화 성공, 역할:', syncResult.userInfo.role);

          // 역할에 따른 초기 화면 설정
          if (syncResult.userInfo.role === 'ROLE_GUEST') {
            console.log('[AppNavigator] 게스트 사용자, 추가 정보 필요');
            setInitialRouteName('AdditionalInfo');
          } else {
            console.log('[AppNavigator] 인증된 사용자, 홈 화면으로 이동');
            setInitialRouteName('Home');
          }

          // 사용자 정보 변경 감지
          if (syncResult.hasChanges) {
            console.log('[AppNavigator] 사용자 정보 변경 감지됨');

            // 백그라운드에서 역할이 변경된 경우 알림
            const previousUserInfo = await AuthService.getCurrentUser();
            if (previousUserInfo && previousUserInfo.role !== syncResult.userInfo.role) {
              if (previousUserInfo.role === 'ROLE_GUEST' && syncResult.userInfo.role === 'ROLE_DRIVER') {
                Alert.alert(
                  '권한 승인',
                  '운전자 권한이 승인되었습니다!',
                  [{ text: '확인' }]
                );
              }
            }
          }
        } else if (syncResult.needsLogin) {
          // 인증 실패 또는 토큰 만료
          console.log('[AppNavigator] 인증 실패, 로그인 필요');
          await AuthService.clearUserData();
          setInitialRouteName('Login');
        } else if (syncResult.isOffline) {
          // 오프라인 모드 - 로컬 정보로 진행
          console.log('[AppNavigator] 오프라인 모드, 로컬 정보 사용');
          if (syncResult.userInfo) {
            setInitialRouteName(syncResult.userInfo.role === 'ROLE_GUEST' ? 'AdditionalInfo' : 'Home');
          } else {
            setInitialRouteName('Login');
          }
        }
      } catch (error) {
        console.error('[AppNavigator] 인증 상태 확인 오류:', error);
        setInitError('앱 초기화 중 오류가 발생했습니다. 다시 시도해주세요.');
        await AuthService.clearUserData();
        setInitialRouteName('Login');
      } finally {
        setIsLoading(false);
        console.log('[AppNavigator] 초기화 완료, 시작 화면:', initialRouteName);
      }
    };

    checkAuthStatus();
  }, []);

  // 앱 로딩 중이면 로딩 화면 표시
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>앱을 불러오는 중입니다...</Text>
      </View>
    );
  }

  // 초기화 오류가 있으면 오류 화면 표시
  if (initError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{initError}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setInitError(null);
            setIsLoading(true);
            // 다시 시도
            setTimeout(() => {
              setIsLoading(false);
            }, 100);
          }}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
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
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="AdditionalInfo" component={AdditionalInfoBeta} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="StartDrive" component={StartDriveScreen} />
      <Stack.Screen name="Driving" component={DrivingScreen} />
      <Stack.Screen name="EndDrive" component={EndDriveScreen} />
      <Stack.Screen name="OperationPlan" component={OperationPlanScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
};

const styles = {
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.grey,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 20,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
  },
};

export default AppNavigator;