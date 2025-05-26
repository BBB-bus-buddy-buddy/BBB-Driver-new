// src/screens/AdditionalInfoBeta/step/LicenseInfoStep.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import styles from '../styles';

const LicenseInfoStep = ({
  driverInfo,
  updateDriverInfo,
  validationErrors,
  onNext,
  onPrev,
  isValid
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const licenseTypes = [
    { label: "선택하세요", value: "" },
    { label: "1종 대형", value: "1종대형" },
    { label: "1종 보통", value: "1종보통" },
    { label: "2종 보통", value: "2종보통" },
    { label: "2종 소형", value: "2종소형" }
  ];

  const handlePickerValueChange = (value) => {
    updateDriverInfo('licenseType', value);
    if (Platform.OS === 'ios') {
      setShowPicker(false);
    }
  };

  const renderPicker = () => {
    if (Platform.OS === 'ios') {
      return (
        <>
          <TouchableOpacity
            style={[
              styles.pickerButton,
              validationErrors.licenseType && styles.inputError,
              !validationErrors.licenseType && driverInfo.licenseType && styles.inputVerified
            ]}
            onPress={() => setShowPicker(true)}
          >
            <Text style={styles.pickerButtonText}>
              {driverInfo.licenseType || "선택하세요"}
            </Text>
          </TouchableOpacity>

          <Modal
            visible={showPicker}
            transparent={true}
            animationType="slide"
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setShowPicker(false)}>
                    <Text style={styles.modalCancelText}>취소</Text>
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>면허 종류</Text>
                  <TouchableOpacity onPress={() => setShowPicker(false)}>
                    <Text style={styles.modalDoneText}>완료</Text>
                  </TouchableOpacity>
                </View>
                
                <Picker
                  selectedValue={driverInfo.licenseType}
                  onValueChange={handlePickerValueChange}
                  style={styles.picker}
                >
                  {licenseTypes.map((item) => (
                    <Picker.Item 
                      key={item.value} 
                      label={item.label} 
                      value={item.value} 
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </Modal>
        </>
      );
    }

    return (
      <View style={[
        styles.pickerContainer,
        validationErrors.licenseType && styles.inputError,
        !validationErrors.licenseType && driverInfo.licenseType && styles.inputVerified
      ]}>
        <Picker
          selectedValue={driverInfo.licenseType}
          onValueChange={handlePickerValueChange}
          style={styles.picker}
          mode="dropdown"
        >
          {licenseTypes.map((item) => (
            <Picker.Item 
              key={item.value} 
              label={item.label} 
              value={item.value} 
            />
          ))}
        </Picker>
      </View>
    );
  };

  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>운전면허 정보</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>운전면허번호</Text>
        <TextInput
          style={[
            styles.input,
            validationErrors.licenseNumber && styles.inputError,
            !validationErrors.licenseNumber && driverInfo.licenseNumber && styles.inputVerified
          ]}
          placeholder="면허번호 (숫자만 입력)" 
          value={driverInfo.licenseNumber}
          onChangeText={(text) => updateDriverInfo('licenseNumber', text)}
          keyboardType="numeric"
          maxLength={15}
        />
        {validationErrors.licenseNumber ? (
          <Text style={styles.errorText}>{validationErrors.licenseNumber}</Text>
        ) : null}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>면허 일련번호</Text>
        <TextInput
          style={[
            styles.input,
            validationErrors.licenseSerial && styles.inputError,
            !validationErrors.licenseSerial && driverInfo.licenseSerial && styles.inputVerified
          ]}
          placeholder="일련번호 (영문+숫자)"
          value={driverInfo.licenseSerial}
          onChangeText={(text) => updateDriverInfo('licenseSerial', text)}
          autoCapitalize="characters"
          maxLength={6}
        />
        {validationErrors.licenseSerial ? (
          <Text style={styles.errorText}>{validationErrors.licenseSerial}</Text>
        ) : null}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>면허 종류</Text>
        {renderPicker()}
        {validationErrors.licenseType ? (
          <Text style={styles.errorText}>{validationErrors.licenseType}</Text>
        ) : null}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>면허 만료일</Text>
        <TextInput
          style={[
            styles.input,
            validationErrors.licenseExpiryDate && styles.inputError,
            !validationErrors.licenseExpiryDate && driverInfo.licenseExpiryDate && styles.inputVerified
          ]}
          placeholder="만료일 (숫자만 입력)"
          value={driverInfo.licenseExpiryDate}
          onChangeText={(text) => updateDriverInfo('licenseExpiryDate', text)}
          keyboardType="numeric"
          maxLength={10}
        />
        {validationErrors.licenseExpiryDate ? (
          <Text style={styles.errorText}>{validationErrors.licenseExpiryDate}</Text>
        ) : null}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={onPrev}
        >
          <Text style={styles.buttonTextSecondary}>이전</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, !isValid && styles.buttonDisabled]}
          onPress={onNext}
          disabled={!isValid}
        >
          <Text style={styles.buttonText}>다음</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LicenseInfoStep;