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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  BORDER_RADIUS,
  SHADOWS,
  SPACING,
} from '../constants/theme';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { API_URL, GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID } from "@env";

const LoginScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const { userInfo, setUserInfo } = useUser();
  const { googleLogin, isLoading } = useAuth();

  // Google Sign-In 초기화
  useEffect(() => {
    console.log('[LoginScreen] Google SDK 설정 중');
    GoogleSignin.configure({
      iosClientId: GOOGLE_IOS_CLIENT_ID,
      androidClientId: GOOGLE_ANDROID_CLIENT_ID,
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
    });

    console.log('[LoginScreen] 화면 준비 완료');
  }, []);

  // 실제 구글 로그인 처리
  const handleGoogleSignIn = async () => {
    try {
      console.log('[LoginScreen] Google 로그인 시작');
      setLoading(true);

      // Google Play 서비스 확인
      await GoogleSignin.hasPlayServices();
      console.log('[LoginScreen] Google Play 서비스 확인 완료');

      // 기존 로그인 상태 클리어
      await GoogleSignin.signOut();
      console.log('[LoginScreen] 기존 Google 로그인 상태 클리어');

      // Google 로그인 실행
      console.log('[LoginScreen] Google 로그인 SDK 호출');
      const googleResponse = await GoogleSignin.signIn();
      console.log('[LoginScreen] Google 로그인 성공:', googleResponse.user.email);

      // 백엔드에 보낼 Google 응답 형식 맞추기
      const oauthResponse = {
        idToken: googleResponse.idToken,
        user: {
          name: googleResponse.user.name,
          email: googleResponse.user.email
        }
      };

      console.log('[LoginScreen] 백엔드 인증 처리 시작');

      // AuthContext를 통한 로그인
      const result = await googleLogin(oauthResponse);
      const { token, user, additionalInfoRequired } = result;

      console.log('[LoginScreen] 백엔드 인증 성공, 사용자 정보:', user.email);

      // UserContext에도 사용자 정보 저장
      const userContextData = {
        id: user.id || googleResponse.user.id,
        name: user.name || googleResponse.user.name,
        email: user.email || googleResponse.user.email,
        role: user.role || 'GUEST',
        organizationId: user.organizationId || '',
        myStations: user.myStations || []
      };

      console.log('[LoginScreen] UserContext에 데이터 저장:', userContextData.email);
      setUserInfo(userContextData);

      // 추가 정보 입력이 필요한 경우
      if (additionalInfoRequired) {
        console.log('[LoginScreen] 추가 정보 입력 필요, 추가 정보 화면으로 이동');
        navigation.replace('AdditionalInfo');
      } else {
        // 홈 화면으로 이동
        console.log('[LoginScreen] 로그인 완료, 홈 화면으로 이동');
        navigation.replace('Home');
      }
    } catch (error) {
      console.error('[LoginScreen] Google 로그인 오류:', error);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('[LoginScreen] 로그인 취소됨');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('[LoginScreen] 로그인 이미 진행 중');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('[LoginScreen] Play 서비스 사용 불가');
        Alert.alert('오류', 'Google Play 서비스를 사용할 수 없습니다.');
      } else {
        Alert.alert('로그인 실패', '로그인 처리 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
      console.log('[LoginScreen] 로그인 처리 완료');
    }
  };

  const handleSignUp = () => {
    console.log('[LoginScreen] 회원가입 화면으로 이동');
    navigation.navigate('SignUp');
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
            disabled={loading || isLoading}>
            {(loading || isLoading) ? (
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
                  Google로 로그인
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
            <Text style={styles.signUpButtonText}>
              계정이 없으신가요? 회원가입
            </Text>
          </TouchableOpacity>
        </View>
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
    minHeight: 50, // 버튼 최소 높이 설정
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
  signUpButton: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  signUpButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
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
});

export default LoginScreen;