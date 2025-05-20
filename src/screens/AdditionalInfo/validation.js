// src/screens/AdditionalInfo/validation.js
import { Alert } from 'react-native';

// 정규식 패턴 정의
export const ValidationRegex = {
  // 이름 (한글 2~5자)
  NAME: /^[가-힣]{2,5}$/,
  // 주민등록번호 (000000-0000000 형식, 하이픈 포함 14자리)
  IDENTITY: /^\d{6}-\d{7}$/,
  // 생년월일 (YYYYMMDD 형식, 8자리 숫자)
  BIRTH_DATE: /^\d{8}$/,
  // 전화번호 (000-0000-0000 형식, 하이픈 포함)
  PHONE_NUMBER: /^\d{3}-\d{4}-\d{4}$/,
  // 면허번호 (00-00-000000-00 형식, 하이픈 포함)
  LICENSE_NUMBER: /^\d{2}-\d{2}-\d{6}-\d{2}$/,
  // 면허번호 일련번호 (영문과 숫자 조합, 5-6자리)
  LICENSE_SERIAL: /^[A-Za-z0-9]{5,6}$/,
  // 면허 종류 (예: 1종 보통, 2종 보통 등)
  LICENSE_TYPE: /^[1-2]종\s[가-힣]{2,4}$/,
  // 면허 만료일 (YYYY-MM-DD 형식)
  LICENSE_EXPIRY_DATE: /^\d{4}-\d{2}-\d{2}$/,
};

// 유효성 검사 헬퍼 함수
export const validateInput = (value, regex, fieldName) => {
  if (!value || !regex.test(value)) {
    return {
      isValid: false,
      message: `${fieldName}을(를) 올바르게 입력해주세요.`
    };
  }
  return { isValid: true, message: '' };
};

// 주민등록번호 검증 함수
export const validateIdentityNumber = (identityNumber) => {
  // 하이픈 제거
  const cleaned = identityNumber.replace(/-/g, '');
  
  // 길이 검증
  if (cleaned.length !== 13) {
    return {
      isValid: false,
      message: '주민등록번호는 13자리여야 합니다.'
    };
  }
  
  // 생년월일 부분 검증
  const year = parseInt(cleaned.substring(0, 2));
  const month = parseInt(cleaned.substring(2, 4));
  const day = parseInt(cleaned.substring(4, 6));
  
  if (month < 1 || month > 12) {
    return {
      isValid: false,
      message: '주민등록번호의 월 부분이 유효하지 않습니다.'
    };
  }
  
  if (day < 1 || day > 31) {
    return {
      isValid: false,
      message: '주민등록번호의 일 부분이 유효하지 않습니다.'
    };
  }
  
  // 성별 검증 (7번째 자리)
  const genderCode = parseInt(cleaned.charAt(6));
  if (![1, 2, 3, 4].includes(genderCode)) {
    return {
      isValid: false,
      message: '주민등록번호의 성별 식별 번호가 유효하지 않습니다.'
    };
  }
  
  return { isValid: true, message: '' };
};

// 생년월일 검증 함수
export const validateBirthDate = (birthDate) => {
  if (!ValidationRegex.BIRTH_DATE.test(birthDate)) {
    return {
      isValid: false,
      message: '생년월일은 YYYYMMDD 형식의 8자리여야 합니다.'
    };
  }
  
  const year = parseInt(birthDate.substring(0, 4));
  const month = parseInt(birthDate.substring(4, 6));
  const day = parseInt(birthDate.substring(6, 8));
  
  // 현재 날짜 구하기
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  
  // 연도 검증
  if (year < 1900 || year > currentYear) {
    return {
      isValid: false,
      message: '생년월일의 연도가 유효하지 않습니다.'
    };
  }
  
  // 월 검증
  if (month < 1 || month > 12) {
    return {
      isValid: false,
      message: '생년월일의 월이 유효하지 않습니다.'
    };
  }
  
  // 일 검증
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > lastDayOfMonth) {
    return {
      isValid: false,
      message: `생년월일의 일이 유효하지 않습니다. ${year}년 ${month}월은 ${lastDayOfMonth}일까지입니다.`
    };
  }
  
  return { isValid: true, message: '' };
};

// 면허 만료일 검증 함수
export const validateExpiryDate = (expiryDate) => {
  if (!ValidationRegex.LICENSE_EXPIRY_DATE.test(expiryDate)) {
    return {
      isValid: false,
      message: '만료일은 YYYY-MM-DD 형식이어야 합니다.'
    };
  }
  
  const parts = expiryDate.split('-');
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const day = parseInt(parts[2]);
  
  // 현재 날짜 구하기
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  
  // 연도 검증
  if (year < currentYear || year > currentYear + 10) {
    return {
      isValid: false,
      message: '만료일의 연도가 유효하지 않습니다.'
    };
  }
  
  // 월 검증
  if (month < 1 || month > 12) {
    return {
      isValid: false,
      message: '만료일의 월이 유효하지 않습니다.'
    };
  }
  
  // 일 검증
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > lastDayOfMonth) {
    return {
      isValid: false,
      message: `만료일의 일이 유효하지 않습니다. ${year}년 ${month}월은 ${lastDayOfMonth}일까지입니다.`
    };
  }
  
  // 만료일이 현재 날짜보다 이전인지 검증
  const expiryDateObj = new Date(year, month - 1, day);
  if (expiryDateObj < currentDate) {
    return {
      isValid: false,
      message: '만료일이 이미 지났습니다.'
    };
  }
  
  return { isValid: true, message: '' };
};

// STEP 2 (개인정보) 유효성 검증
export const validateStep2 = (userData, errors, setErrors) => {
  const newErrors = { ...errors };
  let isValid = true;
  
  // 이름 검증
  const nameResult = validateInput(userData.userName, ValidationRegex.NAME, '이름');
  if (!nameResult.isValid) {
    newErrors.userName = nameResult.message;
    isValid = false;
  } else {
    newErrors.userName = '';
  }
  
  // 주민등록번호 검증
  const identityResult = validateIdentityNumber(userData.identity);
  if (!identityResult.isValid) {
    newErrors.identity = identityResult.message;
    isValid = false;
  } else {
    newErrors.identity = '';
  }
  
  // 생년월일 검증
  const birthDateResult = validateBirthDate(userData.birthDate);
  if (!birthDateResult.isValid) {
    newErrors.birthDate = birthDateResult.message;
    isValid = false;
  } else {
    newErrors.birthDate = '';
  }
  
  // 전화번호 검증
  const phoneResult = validateInput(userData.phoneNumber, ValidationRegex.PHONE_NUMBER, '전화번호');
  if (!phoneResult.isValid) {
    newErrors.phoneNumber = phoneResult.message;
    isValid = false;
  } else {
    newErrors.phoneNumber = '';
  }
  
  setErrors(newErrors);
  
  if (!isValid) {
    const firstError = Object.values(newErrors).find(error => error !== '');
    if (firstError) {
      Alert.alert('입력 오류', firstError);
    }
  }
  
  return isValid;
};

// STEP 3 (면허정보) 유효성 검증
export const validateStep3 = (licenseData, errors, setErrors) => {
  const newErrors = { ...errors };
  let isValid = true;
  
  // 면허 번호 검증
  const licenseResult = validateInput(licenseData.licenseNumber, ValidationRegex.LICENSE_NUMBER, '면허 번호');
  if (!licenseResult.isValid) {
    newErrors.licenseNumber = licenseResult.message;
    isValid = false;
  } else {
    newErrors.licenseNumber = '';
  }
  
  // 암호일련번호 검증
  const serialResult = validateInput(licenseData.serialNo, ValidationRegex.LICENSE_SERIAL, '암호일련번호');
  if (!serialResult.isValid) {
    newErrors.serialNo = serialResult.message;
    isValid = false;
  } else {
    newErrors.serialNo = '';
  }
  
  // 면허 종류 검증
  const typeResult = validateInput(licenseData.licenseType, ValidationRegex.LICENSE_TYPE, '면허 종류');
  if (!typeResult.isValid) {
    newErrors.licenseType = typeResult.message;
    isValid = false;
  } else {
    newErrors.licenseType = '';
  }
  
  // 면허 만료일 검증
  const expiryResult = validateExpiryDate(licenseData.licenseExpiryDate);
  if (!expiryResult.isValid) {
    newErrors.licenseExpiryDate = expiryResult.message;
    isValid = false;
  } else {
    newErrors.licenseExpiryDate = '';
  }
  
  setErrors(newErrors);
  
  if (!isValid) {
    const firstError = Object.values(newErrors).find(error => error !== '');
    if (firstError) {
      Alert.alert('입력 오류', firstError);
    }
  }
  
  return isValid;
};

// 전체 양식 검증
export const validateAllInputs = (userData, licenseData, errors, setErrors) => {
  return (
    validateStep2(userData, errors, setErrors) && 
    validateStep3(licenseData, errors, setErrors)
  );
};