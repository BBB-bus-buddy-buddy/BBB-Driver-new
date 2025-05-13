// src/screens/AdditionalInfoScreen.js - useNavigation 추가 및 navigate로 변경 (계속)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native'; // useNavigation 추가
import {
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  BORDER_RADIUS,
  SPACING,
} from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/apiClient';

const AdditionalInfoScreen = () => {
  const navigation = useNavigation(); // useNavigation 훅 사용
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseType, setLicenseType] = useState('');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    // 저장된 사용자 정보 가져오기
    const getUserInfo = async () => {
      try {
        const storedUserInfo = await AsyncStorage.getItem('userInfo');
        const token = await AsyncStorage.getItem('token');
        console.log(`[AdditionalInfoScreen] token = ${token}`);
        if (storedUserInfo) {
          const parsedUserInfo = JSON.parse(storedUserInfo);
          setUserInfo(parsedUserInfo);
          console.log('[AdditionalInfoScreen] 저장된 사용자 정보 로드:', parsedUserInfo.email);
        } else {
          // 저장된 사용자 정보가 없으면 로그인 화면으로 이동
          console.error('[AdditionalInfoScreen] 저장된 사용자 정보 없음');
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

  const validateInputs = () => {
    console.log('[AdditionalInfoScreen] 입력 데이터 검증 시작');
    
    if (!licenseNumber.trim()) {
      console.log('[AdditionalInfoScreen] 면허 번호 누락');
      Alert.alert('입력 오류', '면허 번호를 입력해주세요.');
      return false;
    }
    if (!licenseType.trim()) {
      console.log('[AdditionalInfoScreen] 면허 종류 누락');
      Alert.alert('입력 오류', '면허 종류를 입력해주세요.');
      return false;
    }
    if (!licenseExpiryDate.trim()) {
      console.log('[AdditionalInfoScreen] 면허 만료일 누락');
      Alert.alert('입력 오류', '면허 만료일을 입력해주세요.');
      return false;
    }
    if (!phoneNumber.trim()) {
      console.log('[AdditionalInfoScreen] 전화번호 누락');
      Alert.alert('입력 오류', '전화번호를 입력해주세요.');
      return false;
    }
    
    // 면허 만료일 형식 검사 (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(licenseExpiryDate)) {
      console.log('[AdditionalInfoScreen] 면허 만료일 형식 오류:', licenseExpiryDate);
      Alert.alert('입력 오류', '면허 만료일을 YYYY-MM-DD 형식으로 입력해주세요.');
      return false;
    }
    
    // 전화번호 형식 검사 (010-0000-0000)
    const phoneRegex = /^\d{3}-\d{4}-\d{4}$/;
    if (!phoneRegex.test(phoneNumber)) {
      console.log('[AdditionalInfoScreen] 전화번호 형식 오류:', phoneNumber);
      Alert.alert('입력 오류', '전화번호를 010-0000-0000 형식으로 입력해주세요.');
      return false;
    }
    
    console.log('[AdditionalInfoScreen] 입력 데이터 검증 성공');
    return true;
  };

  const handleSubmit = async () => {
    if (!validateInputs()) return;

    console.log('[AdditionalInfoScreen] 추가 정보 제출 시작');
    setLoading(true);

    try {
      // 추가 정보 객체 생성
      const additionalInfo = {
        code: licenseNumber,
        licenseType,
        licenseExpiryDate,
        phoneNumber,
      };
      
      console.log('[AdditionalInfoScreen] 추가 정보 객체 생성:', additionalInfo);

      // API 호출로 데이터 저장
      const response = await apiClient.post('/api/auth/rankUp', additionalInfo);
      
      // 성공 여부 확인
      const success = response.data?.success || false;
      
      if (success) {
        console.log('[AdditionalInfoScreen] 추가 정보 저장 성공');
        
        // 성공 시 로컬에 상태 저장
        await AsyncStorage.setItem('hasAdditionalInfo', true);
        
        // 사용자 정보 업데이트 (API에서 최신 정보 가져오기)
        const userResponse = await apiClient.get('/api/auth/user');
        if (userResponse.data?.data) {
          const updatedUserInfo = userResponse.data.data;
          await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
          console.log('[AdditionalInfoScreen] 사용자 정보 업데이트 완료');
        }
        
        // 홈 화면으로 이동 - navigate 사용
        navigation.navigate('Home');
      } else {
        console.error('[AdditionalInfoScreen] 추가 정보 저장 실패');
        Alert.alert('저장 실패', '정보 저장에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('[AdditionalInfoScreen] 추가 정보 저장 오류:', error);
    } finally {
      setLoading(false);
      console.log('[AdditionalInfoScreen] 추가 정보 제출 처리 완료');
    }
  };

  // 사용자 정보가 로드되지 않았으면 로딩 표시
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

  const goBack = async () => {
    console.log('[AdditionalInfoScreen] 뒤로 가기');

    try {
      console.log('[AdditionalInfoScreen] AsyncStorage 청소 중...');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userInfo');
      await AsyncStorage.removeItem('hasAdditionalInfo');
      console.log('[AdditionalInfoScreen] AsyncStorage 청소 완료!');
    } catch (storageError) {
      console.error('AsyncStorage 오류:', storageError);
    }

    navigation.navigate("Login");
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
          
          {/* Header*/}
          <View style={styles.header}>
            <Text style={styles.title}>추가 정보 입력</Text>
            <Text style={styles.subtitle}>기업코드 및 면허 정보를 등록해주세요</Text>
          </View>
          
          {/* 추가정보: 면허: 번호/종류/만료일, 전화번호 */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>면허 번호</Text>
              <TextInput
                style={styles.input}
                value={licenseNumber}
                onChangeText={(text) => {
                  setLicenseNumber(text);
                  console.log('[AdditionalInfoScreen] 면허 번호 입력:', text);
                }}
                placeholder="예: 12-34-567890-01"
                placeholderTextColor={COLORS.lightGrey}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>면허 종류</Text>
              <TextInput
                style={styles.input}
                value={licenseType}
                onChangeText={(text) => {
                  setLicenseType(text);
                  console.log('[AdditionalInfoScreen] 면허 종류 입력:', text);
                }}
                placeholder="예: 1종 대형"
                placeholderTextColor={COLORS.lightGrey}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>면허 만료일</Text>
              <TextInput
                style={styles.input}
                value={licenseExpiryDate}
                onChangeText={(text) => {
                  setLicenseExpiryDate(text);
                  console.log('[AdditionalInfoScreen] 면허 만료일 입력:', text);
                }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.lightGrey}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>전화번호</Text>
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(text);
                  console.log('[AdditionalInfoScreen] 전화번호 입력:', text);
                }}
                placeholder="010-0000-0000"
                placeholderTextColor={COLORS.lightGrey}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.submitButtonText}>정보 등록 완료</Text>
            )}
          </TouchableOpacity>
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
  formContainer: {
    marginBottom: SPACING.xl,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
    color: COLORS.black,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
    minHeight: 50, // 버튼 최소 높이 설정
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
  },
  backButton: {
    paddingVertical: SPACING.sm,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
  },
});

export default AdditionalInfoScreen;