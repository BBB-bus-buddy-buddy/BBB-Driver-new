// src/screens/AdditionalInfo/index.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '../../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../api/apiClient';

// API 관련 임포트
import {
  verifyDriverLicense,
  prepareVerificationData,
  verifyAndRankUpDriver
} from '../../api/LicenseVerificationAPI';
import { verifyOrganizationCode } from '../../api/organizationApi';

// 유효성 검증 관련 임포트
import { validateStep2, validateStep3, validateAllInputs } from './validation';

// 단계별 컴포넌트 임포트
import StepOne from './StepOne';
import StepTwo from './StepTwo';
import StepThree from './StepThree';
import StepIndicator from './StepIndicator';

const AdditionalInfoScreen = () => {
  const navigation = useNavigation();

  // 사용자 정보 상태
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  // STEP 진행 상태
  const [currentStep, setCurrentStep] = useState(1); // 1: 개인정보동의, 2: 개인정보입력, 3: 면허정보입력

  // 개인정보 입력 상태
  const [userData, setUserData] = useState({
    userName: '', // 면허 소유자명
    identity: '', // 주민등록번호
    birthDate: '', // 생년월일
    phoneNumber: '' // 전화번호
  });

  // 조직 코드 입력 상태
  const [organizationCode, setOrganizatinCode] = useState('');

  // 면허정보 입력 상태
  const [licenseData, setLicenseData] = useState({
    licenseNumber: '', // 운전면허 번호
    serialNo: '', // 운전면허 일련번호(면허증 우측하단)
    licenseType: '', // 면허 종류
    licenseExpiryDate: '', // 면허 만료일자
    licenseRegion: '', // 운전면허 번호 - 1번째 자리
    licenseYear: '', // 운전면허 번호 - 2번째 자리 
    licenseUnique: '', // 운전면허 번호 - 3번째 자리
    licenseClass: '' // 운전면허 번호 - 4번째 자리
  });

  // 검증 관련 상태
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState({
    organizationVerified: false,
    licenseVerified: false
  });

  // 오류 상태
  const [errors, setErrors] = useState({
    userName: '',
    identity: '',
    birthDate: '',
    phoneNumber: '',
    organizationCode: '',
    licenseNumber: '',
    serialNo: '',
    licenseType: '',
    licenseExpiryDate: ''
  });

  // 사용자 정보 로드
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const storedUserInfo = await AsyncStorage.getItem('userInfo');

        if (storedUserInfo) {
          const parsedUserInfo = JSON.parse(storedUserInfo);
          setUserInfo(parsedUserInfo);
        } else {
          Alert.alert('오류', '사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
          navigation.navigate('Login');
        }
      } catch (error) {
        console.error('[AdditionalInfoScreen] 사용자 정보 로드 오류:', error);
        Alert.alert('오류', '사용자 정보를 불러올 수 없습니다. 다시 로그인해주세요.');
        navigation.navigate('Login');
      }
    };

    getUserInfo();
  }, [navigation]);

  // 조직 코드 검증
  const handleVerifyOrganizationCode = async () => {
    if (!organizationCode.trim()) {
      setErrors({ ...errors, organizationCode: '조직 코드를 입력해주세요.' });
      return;
    }

    try {
      setVerifyingCode(true);
      const response = await verifyOrganizationCode(organizationCode);

      if (response.success) {
        // 성공적으로 조직 코드가 검증됨
        setVerificationStatus({ ...verificationStatus, organizationVerified: true });
        
        // 조직 코드 저장
        if (response.data) {
          setOrganizatinCode(response.data)
        }

        Alert.alert('검증 성공', '유효한 조직 코드입니다.');
      } else {
        // 검증 실패
        setErrors({ ...errors, organizationCode: response.message || '유효하지 않은 조직 코드입니다.' });
        Alert.alert('검증 실패', response.message || '유효하지 않은 조직 코드입니다.');
      }
    } catch (error) {
      console.error('[AdditionalInfoScreen] 조직 코드 검증 오류:', error);
      setErrors({ ...errors, organizationCode: '조직 코드 검증 중 오류가 발생했습니다.' });
      Alert.alert('검증 실패', '조직 코드 검증 중 오류가 발생했습니다.');
    } finally {
      setVerifyingCode(false);
    }
  };

  // 운전면허 검증
  const checkDriverLicense = async () => {
    // 필요한 데이터 검증
    if (!validateStep3(licenseData, errors, setErrors)) {
      return;
    }

    try {
      setLoading(true);

      const verificationData = prepareVerificationData({
        userName: userData.userName,
        identity: userData.identity,
        phoneNo: userData.phoneNumber,
        birthDate: userData.birthDate,
        licenseRegion: licenseData.licenseRegion,
        licenseYear: licenseData.licenseYear,
        licenseUnique: licenseData.licenseUnique,
        licenseClass: licenseData.licenseClass,
        serialNo: licenseData.serialNo
      });

      const result = await verifyDriverLicense(verificationData);

      if (result.success) {
        setVerificationStatus({ ...verificationStatus, licenseVerified: true });
        Alert.alert('면허증 검증 성공', '면허 정보가 성공적으로 검증되었습니다.');
      } else {
        Alert.alert(
          '면허증 검증 실패',
          result.message || '입력하신 운전면허 정보가 일치하지 않습니다.'
        );
      }
    } catch (error) {
      console.error('[AdditionalInfoScreen] 면허 검증 오류:', error);
      Alert.alert('면허 검증 오류', '면허 정보 검증 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!verificationStatus.organizationVerified || !verificationStatus.licenseVerified) {
      Alert.alert('검증 필요', '조직 코드와 면허 정보 모두 검증이 필요합니다.');
      return;
    }

    if (!validateAllInputs(userData, licenseData, errors, setErrors)) return;

    setLoading(true);

    try {
      const formData = {

        // 개인 정보
        userName: userData.userName,
        identity: userData.identity.replace(/-/g, ''),
        phoneNo: userData.phoneNumber.replace(/-/g, ''),
        birthDate: userData.birthDate,

        // 면허 정보
        licenseNo01: licenseData.licenseRegion,
        licenseNo02: licenseData.licenseYear,
        licenseNo03: licenseData.licenseUnique,
        licenseNo04: licenseData.licenseClass,
        serialNo: licenseData.serialNo,

        // 추가 파라미터
        loginType: "5",
        loginTypeLevel: "1",
        telecom: "2"
      };

      const response = await verifyAndRankUpDriver(formData);

      if (response.success) {
        await AsyncStorage.setItem('hasAdditionalInfo', 'true');

        // 사용자 정보 업데이트
        const userResponse = await apiClient.get('/api/auth/user');
        if (userResponse.data?.data) {
          await AsyncStorage.setItem('userInfo', JSON.stringify(userResponse.data.data));
        }

        Alert.alert(
          '등록 성공',
          '운전면허 정보와 조직 코드가 성공적으로 등록되었습니다.',
          [{ text: '확인', onPress: () => navigation.navigate('Home') }]
        );
      } else {
        Alert.alert('저장 실패', response.message || '정보 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('[AdditionalInfoScreen] 추가 정보 저장 오류:', error);
      Alert.alert('오류 발생', '정보 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃 및 로그인 화면으로 이동
  const goBack = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userInfo');
      await AsyncStorage.removeItem('hasAdditionalInfo');
    } catch (error) {
      console.error('AsyncStorage 오류:', error);
    }

    navigation.navigate("Login");
  };

  // 사용자 정보 로딩 중 화면
  if (!userInfo) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>사용자 정보를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* 뒤로가기 */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={goBack}>
            <Text style={styles.backButtonText}>← 뒤로</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>추가 정보 입력</Text>
            <Text style={styles.subtitle}>기업코드 및 면허 정보를 등록해주세요</Text>
          </View>

          {/* STEP 진행 표시 */}
          <StepIndicator currentStep={currentStep} />

          {/* 현재 STEP에 따른 화면 렌더링 */}
          {currentStep === 1 && (
            <StepOne onNext={() => setCurrentStep(2)} />
          )}

          {currentStep === 2 && (
            <StepTwo
              userData={userData}
              setUserData={setUserData}
              errors={errors}
              onPrev={() => setCurrentStep(1)}
              onNext={() => setCurrentStep(3)}
              validateStep={() => validateStep2(userData, errors, setErrors)}
            />
          )}

          {currentStep === 3 && (
            <StepThree
              organizationCode={organizationCode}
              setOrganizatinCode={setOrganizatinCode}
              licenseData={licenseData}
              setLicenseData={setLicenseData}
              verificationStatus={verificationStatus}
              verifyingCode={verifyingCode}
              errors={errors}
              loading={loading}
              onPrev={() => setCurrentStep(2)}
              onSubmit={handleSubmit}
              handleVerifyOrganizationCode={handleVerifyOrganizationCode}
              checkDriverLicense={checkDriverLicense}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  scrollContainer: {
    flexGrow: 1,
    padding: SPACING.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.grey,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.grey,
  },
  backButton: {
    paddingVertical: SPACING.sm,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
  }
});

export default AdditionalInfoScreen;