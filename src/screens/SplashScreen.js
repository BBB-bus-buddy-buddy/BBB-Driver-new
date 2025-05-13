// src/screens/SplashScreen.js - useNavigation 추가 및 navigate로 변경
import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // useNavigation 추가
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONT_SIZE, FONT_WEIGHT } from '../constants/theme';

const SplashScreen = () => {
  const navigation = useNavigation(); // useNavigation 훅 

  useEffect(() => {
    // 로그인 상태 확인
    const checkLoginStatus = async () => {
      try {
        console.log('[SplashScreen] 로그인 상태 확인 중');
        const token = await AsyncStorage.getItem('token');
        
        // 토큰이 있으면 사용자 정보 확인
        if (token) {
          console.log('[SplashScreen] 토큰 발견, 사용자 정보 확인 중');
          const userInfoStr = await AsyncStorage.getItem('userInfo');
          
          if (userInfoStr) {
            console.log('[SplashScreen] 사용자 정보 발견, 역할 확인 중');
            const userInfo = JSON.parse(userInfoStr);
            
            // 사용자 유형에 따른 화면 이동
            if (userInfo.role === 'ROLE_GUEST') {
              // 추가 정보 입력이 필요한 사용자
              console.log('[SplashScreen] 게스트 사용자, 추가 정보 화면으로 이동');
              navigation.navigate('AdditionalInfo');
            } else {
              // 일반 사용자
              console.log('[SplashScreen] 일반 사용자, 홈 화면으로 이동');
              navigation.navigate('Home');
            }
          } else {
            // 토큰은 있지만 사용자 정보가 없는 경우 로그인 화면으로 이동
            console.log('[SplashScreen] 사용자 정보 없음, 로그인 화면으로 이동');
            navigation.navigate('Login');
          }
        } else {
          // 토큰이 없으면 로그인 화면으로 이동
          console.log('[SplashScreen] 토큰 없음, 로그인 화면으로 이동');
          navigation.navigate('Login');
        }
      } catch (error) {
        console.error('[SplashScreen] 로그인 상태 확인 오류:', error);
        navigation.navigate('Login');
      }
    };

    // 2초 후 로그인 상태 확인
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
      <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
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
  loader: {
    marginTop: 20,
  },
});

export default SplashScreen;