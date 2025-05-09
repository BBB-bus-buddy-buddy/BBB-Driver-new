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
      console.log('[SignUpScreen] Google 로그인 성공:', googleResponse.data.user.email);

      // 백엔드에 보낼 Google 응답 형식 맞추기 (필요한 필드만 포함)
      const oauthResponse = {
        idToken: googleResponse.data.idToken,
        user: {
          name: googleResponse.data.user.name,
          email: googleResponse.data.user.email
        }
      };

      // 회원가입 처리
      try {
        // AuthContext의 signUp 함수 호출
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

          // 추가 정보 입력 화면으로 이동
          console.log('[SignUpScreen] 추가 정보 입력 화면으로 이동');
          navigation.navigate('AdditionalInfo');
        }
      } catch (apiError) {
        console.error('[SignUpScreen] 백엔드 회원가입 오류:', apiError);
        
        // 백엔드 연결 실패 시 테스트 모드로 처리
        Alert.alert(
          '테스트 회원가입 성공',
          '백엔드 연결은 실패했지만 테스트를 위해 회원가입 성공으로 처리합니다. 추가 정보 입력 화면으로 이동합니다.',
          [
            {
              text: '확인',
              onPress: () => {
                // 테스트용 기본 사용자 정보 저장
                const tempUserData = {
                  id: 'temp_' + Date.now(),
                  name: oauthResponse.user.name,
                  email: oauthResponse.user.email,
                  role: 'GUEST',
                  organizationId: '',
                  myStations: []
                };
                
                console.log('[SignUpScreen] 테스트 모드로 사용자 정보 저장:', tempUserData.email);
                setUserInfo(tempUserData);
                
                navigation.navigate('AdditionalInfo');
              },
            },
          ],
        );
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
      console.log('[SignUpScreen] 테스트 회원가입 처리 완료');
    }
  };

  // 테스트 회원가입 처리
  const testGoogleSignUp = async () => {
    try {
      console.log('[SignUpScreen] 테스트 회원가입 시작');
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
      console.log('[SignUpScreen] Google 로그인 성공:', googleResponse.data.user.email);

      // 테스트용 기본 사용자 정보 저장
      const tempUserData = {
        id: 'temp_' + Date.now(),
        name: googleResponse.data.user.name,
        email: googleResponse.data.user.email,
        role: 'GUEST',
        organizationId: '',
        myStations: []
      };
      
      console.log('[SignUpScreen] 테스트 모드로 사용자 정보 저장:', tempUserData.email);
      setUserInfo(tempUserData);
      
      // 추가 정보 입력 화면으로 이동
      navigation.navigate('AdditionalInfo');
    } catch (error) {
      console.error('[SignUpScreen] 테스트 회원가입 오류:', error);
      Alert.alert('회원가입 실패', '처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
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

          {/* 테스트 회원가입 버튼 */}
          <TouchableOpacity
            style={[
              styles.googleButton,
              {backgroundColor: '#f5f5f5', marginTop: 10},
            ]}
            onPress={testGoogleSignUp}
            disabled={loading || isLoading}>
            {(loading || isLoading) ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>처리 중...</Text>
              </View>
            ) : (
              <Text style={styles.googleButtonText}>
                테스트 회원가입 (백엔드 통신 X)
              </Text>
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