// src/screens/AdditionalInfoScreen.js
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
import {
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  BORDER_RADIUS,
  SPACING,
} from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AdditionalInfoScreen = ({ navigation }) => {
  const { saveAdditionalInfo, isLoading: authLoading } = useAuth();
  const { userInfo, updateUserInfo } = useUser();
  
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseType, setLicenseType] = useState('');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('[AdditionalInfoScreen] 화면 로드, 사용자 정보:', userInfo.email);
  }, [userInfo]);

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
        licenseNumber,
        licenseType,
        licenseExpiryDate,
        phoneNumber,
        email: userInfo.email // 이메일 정보 포함
      };
      
      console.log('[AdditionalInfoScreen] 추가 정보 객체 생성:', additionalInfo.email);

      try {
        // 백엔드 API 호출 (실제 서비스)
        const token = await AsyncStorage.getItem('token');
        
        if (token) {
          console.log('[AdditionalInfoScreen] 토큰 발견, 백엔드에 추가 정보 저장 요청');
          // AuthContext의 저장 함수 사용
          const success = await saveAdditionalInfo(additionalInfo);
          
          if (success) {
            console.log('[AdditionalInfoScreen] 추가 정보 저장 성공');
            // UserContext 정보 업데이트
            updateUserInfo({
              role: 'DRIVER', // 운전자 역할로 업데이트
              licenseInfo: {
                licenseNumber,
                licenseType,
                licenseExpiryDate
              },
              phoneNumber
            });
            
            console.log('[AdditionalInfoScreen] 사용자 정보 업데이트 완료, 홈 화면으로 이동');
            // 홈 화면으로 이동
            navigation.replace('Home');
          } else {
            console.error('[AdditionalInfoScreen] 추가 정보 저장 실패');
            Alert.alert('저장 실패', '정보 저장에 실패했습니다. 다시 시도해주세요.');
          }
        } else {
          // 테스트 모드 (토큰이 없는 경우)
          console.log('[AdditionalInfoScreen] 토큰 없음, 테스트 모드로 처리');
          throw new Error('토큰이 없습니다.');
        }
      } catch (apiError) {
        console.error('[AdditionalInfoScreen] 추가 정보 저장 오류:', apiError);
        
        // 테스트 모드로 처리 (백엔드 연결 실패 시)
        Alert.alert(
          '테스트 모드 정보 저장',
          '백엔드 연결에 실패했지만 테스트를 위해 정보가 저장되었습니다.',
          [
            {
              text: '확인',
              onPress: async () => {
                console.log('[AdditionalInfoScreen] 테스트 모드로 추가 정보 저장');
                // 로컬에 추가 정보 저장
                await AsyncStorage.setItem('additionalInfo', JSON.stringify(additionalInfo));
                await AsyncStorage.setItem('hasAdditionalInfo', 'true');
                
                // UserContext 업데이트
                updateUserInfo({
                  role: 'DRIVER',
                  licenseInfo: {
                    licenseNumber,
                    licenseType,
                    licenseExpiryDate
                  },
                  phoneNumber
                });
                
                // 임시 토큰 생성 및 저장 (테스트용)
                const mockToken = 'test_token_' + Date.now();
                await AsyncStorage.setItem('token', mockToken);
                
                console.log('[AdditionalInfoScreen] 추가 정보 저장 완료, 홈 화면으로 이동');
                // 홈 화면으로 이동
                navigation.replace('Home');
              },
            },
          ],
        );
      }
    } catch (error) {
      console.error('[AdditionalInfoScreen] 추가 정보 처리 오류:', error);
      Alert.alert(
        '처리 실패',
        '정보 저장 중 오류가 발생했습니다. 다시 시도해주세요.',
      );
    } finally {
      setLoading(false);
      console.log('[AdditionalInfoScreen] 추가 정보 제출 처리 완료');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* 뒤로가기 */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              console.log('[AdditionalInfoScreen] 뒤로 가기');
              navigation.goBack();
            }}>
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
            disabled={loading || authLoading}>
            {loading || authLoading ? (
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