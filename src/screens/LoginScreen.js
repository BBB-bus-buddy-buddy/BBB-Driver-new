// src/screens/LoginScreen.js - 업데이트된 버전
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  BORDER_RADIUS,
  SHADOWS,
  SPACING,
} from '../constants/theme';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { AuthService } from '../services';
import { authAPI } from '../api';
import { storage } from '../utils/storage';


// 플랫폼별 상수 정의
const PLATFORM_CONSTANTS = {
  OAUTH_URL: 'http://localhost:8088/oauth2/authorization/google?app=driver',
  REDIRECT_SCHEME: Platform.select({
    ios: 'org.reactjs.native.example.driver://oauth2callback',
    android: 'com.driver://oauth2callback',
  }),
};

const LoginScreen = () => {
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleGoogleSignIn = async () => {
    try {
      console.log(`[LoginScreen] Google 로그인 시작 (플랫폼: ${Platform.OS})`);
      setLoading(true);

      const authUrl = PLATFORM_CONSTANTS.OAUTH_URL;
      const redirectScheme = PLATFORM_CONSTANTS.REDIRECT_SCHEME;

      console.log(`[LoginScreen] 인앱 브라우저 열기: ${authUrl}, 리다이렉트: ${redirectScheme}`);

      const result = await InAppBrowser.openAuth(authUrl, redirectScheme, {
        showTitle: false,
        enableUrlBarHiding: true,
        enableDefaultShare: false,
        ephemeralWebSession: false,
      });

      if (result.type === 'success' && result.url) {
        console.log(`[LoginScreen] 인증 성공, 받은 URL: ${result.url}`);

        const tokenMatch = result.url.match(/[?&]token=([^&]+)/);
        const token = tokenMatch ? tokenMatch[1] : null;

        if (!token) {
          console.error('[LoginScreen] URL에서 토큰을 찾을 수 없음:', result.url);
          throw new Error('토큰을 받지 못했습니다.');
        }

        console.log('[LoginScreen] 토큰 받음, 저장 중');

        await AuthService.setToken(token);

        // 토큰 저장 후 사용자 정보 가져오기
        const userResponse = await authAPI.getUser();
        console.log(`[LoginScreen] 사용자 상세 정보 = ${JSON.stringify(userResponse.data, null, 2)}`);
        const userInfo = userResponse.data?.data;
        console.log(`[LoginScreen] 사용자 역할 = ${userInfo.role}`);

        if (!userInfo) {
          console.error('[LoginScreen] 사용자 정보를 가져올 수 없음');
          throw new Error('사용자 정보를 가져올 수 없습니다.');
        }

        // ✅ 수정된 부분: storage를 직접 사용하여 사용자 정보 저장
        await storage.setUserInfo(userInfo);
        console.log('[LoginScreen] 사용자 정보 저장 완료:', userInfo.email);

        // 역할에 따른 화면 이동 - navigate 사용
        if (userInfo.role === 'ROLE_GUEST') {
          console.log('[LoginScreen] 게스트 유저, 추가 정보 화면으로 이동');
          navigation.navigate('AdditionalInfo');
        } else {
          console.log('[LoginScreen] 일반 유저, 홈 화면으로 이동');
          navigation.navigate('Home');
        }
      } else {
        console.log(`[LoginScreen] 인증 취소 또는 실패: ${result.type}`);
        throw new Error('인증이 취소되었거나 실패했습니다.');
      }
    } catch (error) {
      console.error(`[LoginScreen] Google 로그인 오류: ${error}`);

      if (error.message === '인증이 취소되었거나 실패했습니다.') {
        console.log('[LoginScreen] 로그인 취소됨');
      } else {
        Alert.alert('로그인 실패', '로그인 처리 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
      console.log('[LoginScreen] 로그인 처리 완료');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>버스 운행 관리 시스템</Text>
        <Text style={styles.subtitle}>운전자용</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            disabled={loading}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>로그인 중...</Text>
              </View>
            ) : (
              <>
                <Image
                  source={require('../assets/google-icon.png')}
                  style={styles.googleIcon}
                />
                <Text style={styles.googleButtonText}>
                  Google로 로그인/회원가입
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.infoText}>
          비회원이라면, 구글 로그인 후 자동으로 회원가입 화면으로 전환됩니다.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.grey,
    marginBottom: SPACING.xxxl,
  },
  buttonContainer: {
    width: '100%',
    marginTop: SPACING.lg,
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.small,
    minHeight: 50,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: SPACING.sm,
  },
  googleButtonText: {
    color: COLORS.black,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: SPACING.sm,
    color: COLORS.primary,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
  },
  infoText: {
    marginTop: SPACING.xl,
    fontSize: FONT_SIZE.sm,
    color: COLORS.grey,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
});

export default LoginScreen;