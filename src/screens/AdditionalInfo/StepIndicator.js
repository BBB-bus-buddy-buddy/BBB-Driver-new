// src/screens/AdditionalInfo/StepIndicator.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, SPACING } from '../../constants/theme';

const StepIndicator = ({ currentStep }) => {
  return (
    <View style={styles.stepIndicator}>
      <View style={[styles.stepDot, currentStep >= 1 && styles.activeStepDot]}>
        <Text style={[styles.stepNumber, currentStep >= 1 && styles.activeStepNumber]}>1</Text>
      </View>
      <View style={[styles.stepLine, currentStep >= 2 && styles.activeStepLine]} />
      <View style={[styles.stepDot, currentStep >= 2 && styles.activeStepDot]}>
        <Text style={[styles.stepNumber, currentStep >= 2 && styles.activeStepNumber]}>2</Text>
      </View>
      <View style={[styles.stepLine, currentStep >= 3 && styles.activeStepLine]} />
      <View style={[styles.stepDot, currentStep >= 3 && styles.activeStepDot]}>
        <Text style={[styles.stepNumber, currentStep >= 3 && styles.activeStepNumber]}>3</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.lightGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeStepDot: {
    backgroundColor: COLORS.primary,
  },
  stepNumber: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  activeStepNumber: {
    color: COLORS.white,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.lightGrey,
    marginHorizontal: SPACING.xs,
  },
  activeStepLine: {
    backgroundColor: COLORS.primary,
  },
});

export default StepIndicator;