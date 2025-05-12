// src/screens/SignUpScreen.js
import React, { useState } from 'react';
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
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';

const SignUpScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const { signUp, isLoading } = useAuth();
  const { setUserInfo } = useUser();

  const handleGoogleSignUp = async () => {
    try {
      console.log('[SignUpScreen] Google 회원가입 시작');
      setLoading(true);

      // Google Play 서비스 확인
      await GoogleSignin.hasPlayServices();
      console.log('[SignUpScreen] Google Play 서비스 확인 완료');

      // 기존 로그인 상태 클리어
      await GoogleSignin.signOut();
      console.log('[SignUpScreen] 기존 Google 로그인 상태 클리어');

      // Google 로그인 실행
      console.log('[SignUpScreen] Google 로그인 SDK 호출');
      const googleResponse = await GoogleSignin.signIn();
      console.log('[SignUpScreen] Google 로그인 성공:', googleResponse.user.email);

      // 백엔드에 보낼 Google 응답 형식 맞추기
      const oauthResponse = {
        idToken: googleResponse.idToken,
        user: {
          name: googleResponse.user.name,
          email: googleResponse.user.email
        }
      };

      // 회원가입 처리
      console.log('[SignUpScreen] 백엔드 회원가입 요청 시작');
      const success = await signUp(oauthResponse);
      console.log('[SignUpScreen] 백엔드 회원가입 결과:', success ? '성공' : '실패');

      if (success) {
        // UserContext에도 기본 사용자 정보 저장
        const userContextData = {
          id: '',
          name: oauthResponse.user.name,
          email: oauthResponse.user.email,
          role: 'GUEST', // 추가 정보 입력 전 기본 역할
          organizationId: '',
          myStations: []
        };
        
        console.log('[SignUpScreen] UserContext에 기본 정보 저장:', userContextData.email);
        setUserInfo(userContextData);

        Alert.alert(
          '회원가입 성공',
          '회원가입이 완료되었습니다. 이제 추가 정보를 입력해주세요.',
          [
            {
              text: '확인',
              onPress: () => {
                // 추가 정보 입력 화면으로 이동
                console.log('[SignUpScreen] 추가 정보 입력 화면으로 이동');
                navigation.navigate('AdditionalInfo');
              }
            }
          ]
        );
      } else {
        Alert.alert('회원가입 실패', '회원가입 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('[SignUpScreen] Google 회원가입 오류:', error);

      // 오류 처리
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('[SignUpScreen] 회원가입 취소됨');
        Alert.alert('알림', '회원가입이 취소되었습니다.');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('[SignUpScreen] 회원가입 이미 진행 중');
        Alert.alert('알림', '회원가입이 이미 진행 중입니다.');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('[SignUpScreen] Play 서비스 사용 불가');
        Alert.alert('오류', 'Google Play 서비스를 사용할 수 없습니다.');
      } else {
        Alert.alert(
          '회원가입 실패',
          error.message || '알 수 없는 오류가 발생했습니다.',
        );
      }
    } finally {
      setLoading(false);
      console.log('[SignUpScreen] 회원가입 처리 완료');
    }
  };

  const handleLoginPress = () => {
    console.log('[SignUpScreen] 로그인 화면으로 이동');
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            console.log('[SignUpScreen] 뒤로 가기');
            navigation.goBack();
          }}>
          <Text style={styles.backButtonText}>← 뒤로</Text>
        </TouchableOpacity>

        <View style={styles.contentContainer}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>회원가입</Text>
          <Text style={styles.description}>
            버스 운행 관리 시스템 운전자용 앱에 오신 것을 환영합니다. 구글
            계정으로 빠르게 가입하세요.
          </Text>

          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignUp}
            disabled={loading || isLoading}>
            {(loading || isLoading) ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>처리 중...</Text>
              </View>
            ) : (
              <>
                <Image
                  source={require('../assets/google-icon.png')}
                  style={styles.googleIcon}
                />
                <Text style={styles.googleButtonText}>
                  Google로 회원가입
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLoginPress}>
            <Text style={styles.loginButtonText}>
              이미 계정이 있으신가요? 로그인
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
    padding: SPACING.lg,
  },
  backButton: {
    paddingVertical: SPACING.sm,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
    marginBottom: SPACING.lg,
  },
  description: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.grey,
    textAlign: 'center',
    marginBottom: SPACING.xxxl,
    lineHeight: 20,
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
    width: '100%',
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
  loginButton: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  loginButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.sm,
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

export default SignUpScreen;