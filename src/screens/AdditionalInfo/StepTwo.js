import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, BORDER_RADIUS } from '../../constants/theme';

// 생년월일 입력 컴포넌트
const BirthDateInput = ({ value, onChangeText, errorMessage }) => {
  const handleChange = (text) => {
    // 숫자만 입력 허용
    const numericValue = text.replace(/[^0-9]/g, '');
    
    // 최대 8자리까지만 허용
    if (numericValue.length <= 8) {
      onChangeText(numericValue);
    }
  };
  
  return (
    <View>
      <TextInput
        style={[styles.input, errorMessage ? styles.inputError : null]}
        value={value}
        onChangeText={handleChange}
        placeholder="생년월일 8자리(YYYYMMDD)"
        placeholderTextColor={COLORS.lightGrey}
        keyboardType="numeric"
        maxLength={8}
      />
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
};

// 전화번호 입력 컴포넌트
const PhoneNumberInput = ({ value, onChangeText, errorMessage }) => {
  const formatPhoneNumber = (text) => {
    // 숫자만 추출
    const numbers = text.replace(/[^\d]/g, '');
    
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  };
  
  const handleChange = (text) => {
    const formattedNumber = formatPhoneNumber(text);
    onChangeText(formattedNumber);
  };
  
  return (
    <View>
      <TextInput
        style={[styles.input, errorMessage ? styles.inputError : null]}
        value={value}
        onChangeText={handleChange}
        placeholder="010-0000-0000"
        placeholderTextColor={COLORS.lightGrey}
        keyboardType="phone-pad"
        maxLength={13} // 010-0000-0000 (13 characters with hyphens)
      />
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
};

// 주민등록번호 입력 컴포넌트
const IdentityNumberInput = ({ value, onChangeText, errorMessage }) => {
  const formatIdentityNumber = (text) => {
    // 숫자만 추출
    const numbers = text.replace(/[^\d]/g, '');
    
    if (numbers.length <= 6) {
      return numbers;
    } else {
      return `${numbers.slice(0, 6)}-${numbers.slice(6, 13)}`;
    }
  };
  
  const handleChange = (text) => {
    const cleanedText = text.replace(/[^\d-]/g, '');
    if (cleanedText.length <= 14) { // 000000-0000000 (14 characters with hyphen)
      const formattedNumber = formatIdentityNumber(cleanedText);
      onChangeText(formattedNumber);
    }
  };
  
  return (
    <View>
      <TextInput
        style={[styles.input, errorMessage ? styles.inputError : null]}
        value={value}
        onChangeText={handleChange}
        placeholder="000000-0000000"
        placeholderTextColor={COLORS.lightGrey}
        keyboardType="numeric"
        maxLength={14} // 000000-0000000 (14 characters with hyphen)
        secureTextEntry
      />
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
};

const StepTwo = ({ 
  userData, 
  setUserData, 
  errors, 
  onPrev, 
  onNext, 
  validateStep 
}) => {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>개인정보 입력</Text>
      
      {/* 이름 */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>이름</Text>
        <TextInput
          style={[styles.input, errors.userName ? styles.inputError : null]}
          value={userData.userName}
          onChangeText={(text) => setUserData({...userData, userName: text})}
          placeholder="면허증에 기재된 이름"
          placeholderTextColor={COLORS.lightGrey}
        />
        {errors.userName ? <Text style={styles.errorText}>{errors.userName}</Text> : null}
      </View>
      
      {/* 주민등록번호 */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>주민등록번호</Text>
        <IdentityNumberInput
          value={userData.identity}
          onChangeText={(text) => setUserData({...userData, identity: text})}
          errorMessage={errors.identity}
        />
      </View>
      
      {/* 생년월일 */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>생년월일</Text>
        <BirthDateInput
          value={userData.birthDate}
          onChangeText={(text) => setUserData({...userData, birthDate: text})}
          errorMessage={errors.birthDate}
        />
      </View>
      
      {/* 전화번호 */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>전화번호</Text>
        <PhoneNumberInput
          value={userData.phoneNumber}
          onChangeText={(text) => setUserData({...userData, phoneNumber: text})}
          errorMessage={errors.phoneNumber}
        />
      </View>
      
      {/* 하단 버튼 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.backStepButton}
          onPress={onPrev}>
          <Text style={styles.backStepButtonText}>이전</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => {
            if (validateStep()) {
              onNext();
            }
          }}>
          <Text style={styles.nextButtonText}>다음</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stepContainer: {
    marginBottom: SPACING.xl,
  },
  stepTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.md,
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
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.xs,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
  },
  backStepButton: {
    flex: 1,
    backgroundColor: COLORS.lightGrey,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  backStepButtonText: {
    color: COLORS.darkGrey,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
  },
  nextButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  nextButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
  },
});

export default StepTwo;