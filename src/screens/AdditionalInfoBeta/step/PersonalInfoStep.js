// src/screens/AdditionalInfoBeta/step/PersonalInfoStep.js
import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import styles from '../styles';

const PersonalInfoStep = ({
  driverInfo,
  updateDriverInfo,
  validationErrors,
  onNext,
  isValid
}) => {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>개인 정보</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>주민등록번호</Text>
        <TextInput
          style={[
            styles.input,
            validationErrors.identity && styles.inputError,
            !validationErrors.identity && driverInfo.identity && styles.inputVerified
          ]}
          placeholder="주민등록번호 (숫자만 입력)"
          value={driverInfo.identity}
          onChangeText={(text) => updateDriverInfo('identity', text)}
          keyboardType="numeric"
          maxLength={14}
        />
        {validationErrors.identity ? (
          <Text style={styles.errorText}>{validationErrors.identity}</Text>
        ) : null}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>생년월일</Text>
        <TextInput
          style={[
            styles.input,
            validationErrors.birthDate && styles.inputError,
            !validationErrors.birthDate && driverInfo.birthDate && styles.inputVerified
          ]}
          placeholder="생년월일 (예: 19900101)"
          value={driverInfo.birthDate}
          onChangeText={(text) => updateDriverInfo('birthDate', text)}
          keyboardType="numeric"
          maxLength={8}
        />
        {validationErrors.birthDate ? (
          <Text style={styles.errorText}>{validationErrors.birthDate}</Text>
        ) : null}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>전화번호</Text>
        <TextInput
          style={[
            styles.input,
            validationErrors.phoneNumber && styles.inputError,
            !validationErrors.phoneNumber && driverInfo.phoneNumber && styles.inputVerified
          ]}
          placeholder="전화번호 (숫자만 입력)"
          value={driverInfo.phoneNumber}
          onChangeText={(text) => updateDriverInfo('phoneNumber', text)}
          keyboardType="phone-pad"
          maxLength={13}
        />
        {validationErrors.phoneNumber ? (
          <Text style={styles.errorText}>{validationErrors.phoneNumber}</Text>
        ) : null}
      </View>

      <TouchableOpacity
        style={[styles.button, !isValid && styles.buttonDisabled]}
        onPress={onNext}
        disabled={!isValid}
      >
        <Text style={styles.buttonText}>다음</Text>
      </TouchableOpacity>
    </View>
  );
};

export default PersonalInfoStep;
