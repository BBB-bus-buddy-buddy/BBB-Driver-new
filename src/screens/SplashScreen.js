// src/screens/SplashScreen.js
import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONT_SIZE, FONT_WEIGHT } from '../constants/theme';
import { syncUserInfo, needsSync } from '../services/userService';

const SplashScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        console.log('[SplashScreen] 앱 초기화 시작');
        
        const token = await AsyncStorage.getItem('token');
        
        if (!token) {
          console.log('[SplashScreen] 토큰 없음, 로그인 화면으로 이동');
          navigation.navigate('Login');
          return;
        }

        console.log('[SplashScreen] 토큰 발견, 사용자 정보 동기화 중...');
        
        // 동기화가 필요한지 확인 (5분 이상 경과 시)
        const syncNeeded = await needsSync();
        
        if (syncNeeded) {
          console.log('[SplashScreen] 서버와 동기화 필요');
          
          // 서버에서 최신 사용자 정보 가져오기 및 동기화
          const syncResult = await syncUserInfo();
          
          if (!syncResult.success) {
            if (syncResult.needsLogin) {
              console.log('[SplashScreen] 인증 실패, 로그인 화면으로 이동');
              navigation.navigate('Login');
              return;
            }
            
            // 네트워크 오류 등의 경우 경고 표시
            if (!syncResult.isOffline) {
              Alert.alert(
                '동기화 실패',
                '사용자 정보를 업데이트할 수 없습니다. 일부 정보가 최신이 아닐 수 있습니다.',
                [{ text: '확인' }]
              );
            }
          }
          
          // 역할 변경 감지 시 알림
          if (syncResult.hasChanges && syncResult.userInfo) {
            console.log('[SplashScreen] 사용자 정보 변경 감지됨');
            
            // 역할이 변경된 경우 특별 처리
            const oldUserInfoStr = await AsyncStorage.getItem('userInfo');
            if (oldUserInfoStr) {
              const oldUserInfo = JSON.parse(oldUserInfoStr);
              if (oldUserInfo.role !== syncResult.userInfo.role) {
                console.log('[SplashScreen] 역할 변경:', oldUserInfo.role, '->', syncResult.userInfo.role);
                
                // GUEST에서 다른 역할로 변경된 경우
                if (oldUserInfo.role === 'ROLE_GUEST' && syncResult.userInfo.role !== 'ROLE_GUEST') {
                  Alert.alert(
                    '승인 완료',
                    '운전자 권한이 승인되었습니다. 이제 모든 기능을 사용할 수 있습니다.',
                    [{ text: '확인' }]
                  );
                }
              }
            }
          }
          
          // 동기화 결과에 따른 라우팅
          if (syncResult.userInfo) {
            handleRouting(syncResult.userInfo);
          } else {
            navigation.navigate('Login');
          }
        } else {
          // 동기화 불필요 - 로컬 정보 사용
          console.log('[SplashScreen] 최근 동기화됨, 로컬 정보 사용');
          
          const userInfoStr = await AsyncStorage.getItem('userInfo');
          if (userInfoStr) {
            const userInfo = JSON.parse(userInfoStr);
            handleRouting(userInfo);
          } else {
            navigation.navigate('Login');
          }
        }
        
      } catch (error) {
        console.error('[SplashScreen] 초기화 오류:', error);
        Alert.alert(
          '오류',
          '앱을 시작할 수 없습니다. 다시 시도해주세요.',
          [
            {
              text: '확인',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      }
    };

    // 사용자 정보에 따른 라우팅 처리
    const handleRouting = (userInfo) => {
      console.log('[SplashScreen] 라우팅 처리, 역할:', userInfo.role);
      
      switch (userInfo.role) {
        case 'ROLE_GUEST':
          console.log('[SplashScreen] 게스트 사용자, 추가 정보 화면으로 이동');
          navigation.navigate('AdditionalInfo');
          break;
        
        case 'ROLE_DRIVER':
        case 'ROLE_ADMIN':
          console.log('[SplashScreen] 인증된 사용자, 홈 화면으로 이동');
          navigation.navigate('Home');
          break;
        
        default:
          console.warn('[SplashScreen] 알 수 없는 역할:', userInfo.role);
          navigation.navigate('Home');
          break;
      }
    };

    // 2초 후 로그인 상태 확인 (스플래시 화면 최소 표시 시간)
    const timer = setTimeout(() => {
      checkLoginStatus();
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>버스 운행 관리 시스템</Text>
      <Text style={styles.subtitle}>운전자용</Text>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>시작하는 중...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.grey,
    marginBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: FONT_SIZE.sm,
    color: COLORS.grey,
  },
});

export default SplashScreen;