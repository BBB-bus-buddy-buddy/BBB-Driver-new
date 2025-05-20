// src/screens/AdditionalInfo/StepOne.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, BORDER_RADIUS } from '../../constants/theme';

const StepOne = ({ onNext }) => {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>개인정보 수집 및 이용 동의</Text>
      <Text style={styles.infoText}>
        버스트래커 서비스 이용을 위해 아래와 같이 개인정보를 수집 및 이용합니다.
      </Text>
      
      <View style={styles.agreementContainer}>
        <Text style={styles.agreementTitle}>1. 수집 항목</Text>
        <Text style={styles.agreementContent}>
          - 기본 정보: 이름, 생년월일, 주민등록번호, 전화번호{'\n'}
          - 운전면허 정보: 면허번호, 면허종류, 만료일, 암호일련번호
        </Text>
        
        <Text style={styles.agreementTitle}>2. 수집 및 이용 목적</Text>
        <Text style={styles.agreementContent}>
          - 버스 기사 자격 확인{'\n'}
          - 운전면허 진위 확인{'\n'}
          - 서비스 제공 및 계정 관리
        </Text>
        
        <Text style={styles.agreementTitle}>3. 보유 및 이용 기간</Text>
        <Text style={styles.agreementContent}>
          - 회원 탈퇴 시까지 또는 관련 법령에 따른 보존기간
        </Text>
      </View>
      
      <TouchableOpacity
        style={styles.nextButton}
        onPress={onNext}>
        <Text style={styles.nextButtonText}>동의하고 계속하기</Text>
      </TouchableOpacity>
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
  infoText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.darkGrey,
    marginBottom: SPACING.md,
  },
  agreementContainer: {
    backgroundColor: COLORS.lightBg,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginVertical: SPACING.md,
  },
  agreementTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  agreementContent: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.darkGrey,
    marginBottom: SPACING.sm,
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  nextButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
  },
});

export default StepOne;