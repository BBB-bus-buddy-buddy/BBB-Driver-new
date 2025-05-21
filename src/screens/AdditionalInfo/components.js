// src/screens/AdditionalInfo/components.js
import React, { useEffect } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING } from '../../constants/theme';

// 생년월일 입력 컴포넌트
export const BirthDateInput = ({ value, onChangeText, errorMessage }) => {
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
export const PhoneNumberInput = ({ value, onChangeText, errorMessage }) => {
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
export const IdentityNumberInput = ({ value, onChangeText, errorMessage }) => {
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

// 운전면허번호 입력 컴포넌트
export const LicenseNumberInput = ({ value, onChange, onParsed, errorMessage }) => {
  // 면허번호 포맷팅 함수
  const formatLicenseNumber = (text) => {
    // 숫자만 추출
    const numbersOnly = text.replace(/[^0-9]/g, '');
    
    // 포맷팅된 결과 생성
    let formatted = '';
    
    if (numbersOnly.length <= 2) {
      formatted = numbersOnly;
    } else if (numbersOnly.length <= 4) {
      formatted = `${numbersOnly.slice(0, 2)}-${numbersOnly.slice(2)}`;
    } else if (numbersOnly.length <= 10) {
      formatted = `${numbersOnly.slice(0, 2)}-${numbersOnly.slice(2, 4)}-${numbersOnly.slice(4)}`;
    } else {
      formatted = `${numbersOnly.slice(0, 2)}-${numbersOnly.slice(2, 4)}-${numbersOnly.slice(4, 10)}-${numbersOnly.slice(10)}`;
    }
    
    return formatted;
  };
  
  // 값이 변경될 때마다 파싱 실행
  useEffect(() => {
    if (value) {
      const numbersOnly = value.replace(/[^0-9]/g, '');
      
      if (numbersOnly.length >= 4) {
        const parsedValues = {
          licenseRegion: numbersOnly.slice(0, 2),
          licenseYear: numbersOnly.slice(2, 4),
          licenseUnique: numbersOnly.length > 4 ? numbersOnly.slice(4, Math.min(10, numbersOnly.length)) : '',
          licenseClass: numbersOnly.length > 10 ? numbersOnly.slice(10) : ''
        };
        
        onParsed(parsedValues);
      }
    }
  }, [value]); // onParsed 의존성 제거
  
  const handleChange = (text) => {
    const formattedText = formatLicenseNumber(text);
    onChange(formattedText);
  };
  
  return (
    <View>
      <TextInput
        style={[styles.input, errorMessage ? styles.inputError : null]}
        value={value}
        onChangeText={handleChange}
        placeholder="12-34-567890-12"
        placeholderTextColor={COLORS.lightGrey}
        keyboardType="numeric"
        maxLength={16} // 12-34-567890-12 형식은 최대 16자
      />
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
};

// 면허 만료일 입력 컴포넌트
export const LicenseExpiryDateInput = ({ value, onChangeText, errorMessage }) => {
  const formatExpiryDate = (text) => {
    // 숫자와 하이픈만 허용
    const cleanedText = text.replace(/[^\d-]/g, '');
    // 하이픈 제거 후 숫자만 추출
    const numbers = cleanedText.replace(/-/g, '');
    // 하이픈 추가 (YYYY-MM-DD 형식)
    if (numbers.length <= 4) {
      return numbers;
    } else if (numbers.length <= 6) {
      return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
    } else {
      return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 8)}`;
    }
  };
  
  const handleChange = (text) => {
    const formattedDate = formatExpiryDate(text);
    onChangeText(formattedDate);
  };
  
  return (
    <View>
      <TextInput
        style={[styles.input, errorMessage ? styles.inputError : null]}
        value={value}
        onChangeText={handleChange}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={COLORS.lightGrey}
        keyboardType="numeric"
        maxLength={10} // YYYY-MM-DD (10 characters with hyphens)
      />
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
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
});