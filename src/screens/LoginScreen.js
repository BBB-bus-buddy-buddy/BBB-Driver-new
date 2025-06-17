// src/screens/LoginScreen.js
import React, { useState, useEffect } from 'react';
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
import { API_URL_PROD, GOOGLE_OAUTH2_LOGIN_ENDPOINT } from '@env';

const PLATFORM_CONSTANTS = {
  // OAuth는 항상 프로덕션 URL 사용 (Google이 로컬호스트 OAuth를 지원하지 않음)
  OAUTH_URL: `${API_URL_PROD}${GOOGLE_OAUTH2_LOGIN_ENDPOINT}?app=driver`,
  REDIRECT_SCHEME: Platform.select({
    ios: 'org.reactjs.native.example.driver://oauth2callback',
    android: 'com.driver://oauth2callback',
  }),
};

// LoginScreen 컴포넌트 내부
const LoginScreen = () => {
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  // 디버깅을 위한 로그 추가
  useEffect(() => {
    console.log('[LoginScreen] 환경:', __DEV__ ? '개발' : '프로덕션');
    console.log('[LoginScreen] OAuth URL:', PLATFORM_CONSTANTS.OAUTH_URL);
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      console.log(`[LoginScreen] Google 로그인 시작 (플랫폼: ${Platform.OS})`);
      console.log(`[LoginScreen] OAuth URL: ${PLATFORM_CONSTANTS.OAUTH_URL}`);
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

        console.log('[LoginScreen] 토큰 받음, AuthService.login 호출');

        // AuthService.login() 사용
        const loginResult = await AuthService.login(token);

        if (loginResult.success) {
          console.log('[LoginScreen] 로그인 성공:', loginResult.userInfo.email);

          // 스토리지 경고가 있는 경우 사용자에게 알림
          if (loginResult.storageWarning) {
            Alert.alert(
              '임시 저장',
              loginResult.storageWarning,
              [
                {
                  text: '확인',
                  onPress: () => navigateAfterLogin(loginResult)
                }
              ]
            );
          } else {
            navigateAfterLogin(loginResult);
          }
        } else {
          throw new Error(loginResult.message || '로그인 처리에 실패했습니다.');
        }
      } else {
        console.log(`[LoginScreen] 인증 취소 또는 실패: ${result.type}`);
        throw new Error('인증이 취소되었거나 실패했습니다.');
      }
    } catch (error) {
      console.error(`[LoginScreen] Google 로그인 오류: ${error}`);

      if (error.message === '인증이 취소되었거나 실패했습니다.') {
        console.log('[LoginScreen] 로그인 취소됨');
      } else if (error.message?.includes('manifest.json')) {
        // manifest.json 에러인 경우 특별 처리
        Alert.alert(
          '저장소 오류',
          '데이터 저장소에 문제가 발생했습니다. 앱을 재시작해주세요.\n\n문제가 계속되면 시뮬레이터를 리셋하거나 앱을 재설치해주세요.',
          [
            {
              text: '확인',
              style: 'default',
            }
          ]
        );
      } else {
        Alert.alert('로그인 실패', error.message || '로그인 처리 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
      console.log('[LoginScreen] 로그인 처리 완료');
    }
  };

  const navigateAfterLogin = (loginResult) => {
    // 역할에 따른 화면 이동
    if (loginResult.needsAdditionalInfo) {
      console.log('[LoginScreen] 게스트 유저, 추가 정보 화면으로 이동');
      navigation.navigate('AdditionalInfo');
    } else {
      console.log('[LoginScreen] 일반 유저, 홈 화면으로 이동');
      navigation.navigate('Home');
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

        {/* 디버그 정보 - 개발 환경에서만 표시 */}
        {__DEV__ && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>개발 환경</Text>
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  '스토리지 리셋',
                  '모든 로컬 데이터를 삭제하시겠습니까?',
                  [
                    { text: '취소', style: 'cancel' },
                    {
                      text: '삭제',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          const { storage } = await import('../utils/storage');
                          await storage.clearAllData();
                          Alert.alert('완료', '스토리지가 초기화되었습니다.');
                        } catch (error) {
                          Alert.alert('오류', '스토리지 초기화 실패');
                        }
                      }
                    }
                  ]
                );
              }}
              style={styles.debugButton}
            >
              <Text style={styles.debugButtonText}>스토리지 리셋</Text>
            </TouchableOpacity>
          </View>
        )}
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
  debugInfo: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  debugText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.lightGrey,
    marginBottom: SPACING.xs,
  },
  debugButton: {
    padding: SPACING.xs,
    backgroundColor: COLORS.lightGrey + '20',
    borderRadius: BORDER_RADIUS.xs,
  },
  debugButtonText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.lightGrey,
  },
});

export default LoginScreen;