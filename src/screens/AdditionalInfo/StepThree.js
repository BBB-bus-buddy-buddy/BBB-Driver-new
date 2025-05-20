import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, BORDER_RADIUS } from '../../constants/theme';

// 운전면허번호 입력 컴포넌트
const LicenseNumberInput = ({ value, onChange, onParsed, errorMessage }) => {
  const formatLicenseNumber = (text) => {
    // 숫자와 하이픈만 허용
    const cleanedText = text.replace(/[^\d-]/g, '');
    
    // 하이픈 제거
    const numbers = cleanedText.replace(/-/g, '');
    
    // 하이픈 추가 (12-34-567890-12 형식)
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
    } else if (numbers.length <= 10) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 4)}-${numbers.slice(4)}`;
    } else {
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 4)}-${numbers.slice(4, 10)}-${numbers.slice(10, 12)}`;
    }
  };
  
  const handleChange = (text) => {
    const formattedLicense = formatLicenseNumber(text);
    onChange(formattedLicense);
    
    // 면허번호 파싱 (12-34-567890-12 형식)
    const numbers = formattedLicense.replace(/-/g, '');
    if (numbers.length >= 12) {
      const parsedValues = {
        licenseRegion: numbers.slice(0, 2), // 지역코드
        licenseYear: numbers.slice(2, 4), // 연도코드
        licenseUnique: numbers.slice(4, 10), // 고유번호
        licenseClass: numbers.slice(10, 12) // 분류코드
      };
      
      onParsed(parsedValues);
    }
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
        maxLength={15} // 12-34-567890-12 (15 characters with hyphens)
      />
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
};

// 면허 만료일 입력 컴포넌트
const LicenseExpiryDateInput = ({ value, onChangeText, errorMessage }) => {
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

const StepThree = ({ 
  licenseData, 
  setLicenseData, 
  verificationStatus, 
  verifyingCode,
  errors, 
  loading,
  onPrev, 
  onSubmit,
  handleVerifyOrganizationCode,
  checkDriverLicense
}) => {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>면허정보 입력</Text>
      
      {/* 조직 코드 */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>조직 코드</Text>
        <View style={styles.rowContainer}>
          <View style={styles.inputWithButtonContainer}>
            <TextInput
              style={[
                styles.inputWithButton,
                errors.organizationCode ? styles.inputError : null,
                verificationStatus.organizationVerified ? styles.inputVerified : null
              ]}
              value={licenseData.organizationCode}
              onChangeText={(text) => setLicenseData({...licenseData, organizationCode: text})}
              placeholder="기업 코드를 입력하세요"
              placeholderTextColor={COLORS.lightGrey}
              editable={!verificationStatus.organizationVerified}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.verifyCodeButton,
              verificationStatus.organizationVerified ? styles.verifiedButton : null
            ]}
            onPress={handleVerifyOrganizationCode}
            disabled={verifyingCode || verificationStatus.organizationVerified}>
            {verifyingCode ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.verifyCodeButtonText}>
                {verificationStatus.organizationVerified ? "확인됨" : "코드 확인"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
        {errors.organizationCode ? <Text style={styles.errorText}>{errors.organizationCode}</Text> : null}
      </View>
      
      {/* 면허 번호 */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>면허 번호</Text>
        <LicenseNumberInput
          value={licenseData.licenseNumber}
          onChange={(text) => setLicenseData({...licenseData, licenseNumber: text})}
          onParsed={(parsedValues) => {
            setLicenseData({
              ...licenseData,
              licenseRegion: parsedValues.licenseRegion,
              licenseYear: parsedValues.licenseYear,
              licenseUnique: parsedValues.licenseUnique,
              licenseClass: parsedValues.licenseClass
            });
          }}
          errorMessage={errors.licenseNumber}
        />
      </View>
      
      {/* 암호일련번호 */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>암호일련번호</Text>
        <TextInput
          style={[styles.input, errors.serialNo ? styles.inputError : null]}
          value={licenseData.serialNo}
          onChangeText={(text) => setLicenseData({...licenseData, serialNo: text})}
          placeholder="면허증 오른쪽 하단 일련번호"
          placeholderTextColor={COLORS.lightGrey}
        />
        {errors.serialNo ? <Text style={styles.errorText}>{errors.serialNo}</Text> : null}
      </View>
      
      {/* 면허 종류 */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>면허 종류</Text>
        <TextInput
          style={[styles.input, errors.licenseType ? styles.inputError : null]}
          value={licenseData.licenseType}
          onChangeText={(text) => setLicenseData({...licenseData, licenseType: text})}
          placeholder="예: 1종 대형"
          placeholderTextColor={COLORS.lightGrey}
        />
        {errors.licenseType ? <Text style={styles.errorText}>{errors.licenseType}</Text> : null}
      </View>
      
      {/* 면허 만료일 */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>면허 만료일</Text>
        <LicenseExpiryDateInput
          value={licenseData.licenseExpiryDate}
          onChangeText={(text) => setLicenseData({...licenseData, licenseExpiryDate: text})}
          errorMessage={errors.licenseExpiryDate}
        />
      </View>

      {/* 면허 인증 버튼 */}
      <TouchableOpacity
        style={[
          styles.verifyButton,
          verificationStatus.licenseVerified ? styles.verifiedButton : null
        ]}
        onPress={checkDriverLicense}
        disabled={loading || verificationStatus.licenseVerified}>
        {loading ? (
          <ActivityIndicator color={COLORS.white} size="small" />
        ) : (
          <Text style={styles.verifyButtonText}>
            {verificationStatus.licenseVerified ? "면허 확인됨" : "면허 진위확인 조회하기"}
          </Text>
        )}
      </TouchableOpacity>
      
      {/* 버튼 영역 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.backStepButton}
          onPress={onPrev}>
          <Text style={styles.backStepButtonText}>이전</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.submitButton,
            (!verificationStatus.organizationVerified || !verificationStatus.licenseVerified) ?
              styles.disabledButton : null]}
          onPress={onSubmit}
          disabled={loading || !verificationStatus.organizationVerified || !verificationStatus.licenseVerified}>
          {loading ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Text style={styles.submitButtonText}>정보 등록 완료</Text>
          )}
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
  inputVerified: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.lightSuccess,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.xs,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWithButtonContainer: {
    flex: 1,
  },
  inputWithButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
    color: COLORS.black,
  },
  verifyCodeButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginLeft: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  verifyCodeButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  verifyButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    minHeight: 48,
  },
  verifyButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
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
  submitButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginLeft: SPACING.sm,
    minHeight: 48,
  },
  disabledButton: {
    backgroundColor: COLORS.lightGrey,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
  },
  verifiedButton: {
    backgroundColor: COLORS.success,
  },
});

export default StepThree;