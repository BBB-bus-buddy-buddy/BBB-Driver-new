// src/screens/AdditionalInfoBeta/styles.js
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  // ========== 기본 컨테이너 및 레이아웃 ==========
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },

  // ========== 스텝 인디케이터 ==========
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#ffffff',
  },
  
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 5,
  },
  
  activeStepDot: {
    backgroundColor: '#007AFF',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  
  completedStepDot: {
    backgroundColor: '#4CAF50',
  },

  // ========== 스텝 컨텐츠 ==========
  stepContent: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 24,
  },

  // ========== 입력 필드 관련 ==========
  inputGroup: {
    marginBottom: 20,
  },
  
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333333',
    backgroundColor: '#f9f9f9',
    minHeight: 50,
  },

  // ========== 검증 관련 입력 필드 ==========
  // 오류 상태의 입력 필드
  inputError: {
    borderColor: '#f44336',
    backgroundColor: '#fff5f5',
    borderWidth: 1.5,
  },

  // 검증 성공 상태의 입력 필드
  inputVerified: {
    borderColor: '#4CAF50',
    backgroundColor: '#f8fff8',
    borderWidth: 1.5,
  },

  // 입력 필드와 버튼을 나란히 배치하는 컨테이너
  inputWithButtonContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  // 버튼과 함께 사용되는 입력 필드
  inputWithButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333333',
    backgroundColor: '#f9f9f9',
    minHeight: 50,
  },

  // ========== 메시지 텍스트 ==========
  // 헬퍼 텍스트
  helperText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    lineHeight: 16,
  },

  // 오류 메시지 텍스트
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },

  // 검증 결과 메시지
  verificationMessage: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 4,
  },

  // 성공 메시지
  successMessage: {
    color: '#4CAF50',
  },

  // 오류 메시지 (verificationMessage와 구분)
  errorMessage: {
    color: '#f44336',
  },

  // ========== 버튼 관련 ==========
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    minHeight: 50,
  },
  
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  
  buttonSecondary: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#007AFF',
    flex: 1,
  },
  
  buttonTextSecondary: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 24,
  },

  // ========== 검증 버튼 ==========
  verifyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },

  // 검증 버튼 비활성화 상태
  verifyButtonDisabled: {
    backgroundColor: '#cccccc',
  },

  // 검증 완료 버튼
  verifyButtonSuccess: {
    backgroundColor: '#4CAF50',
  },

  // 검증 버튼 텍스트
  verifyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // 검증 완료 버튼 텍스트
  verifyButtonTextSuccess: {
    color: '#ffffff',
  },

  // ========== Picker 관련 ==========
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
  },
  
  picker: {
    height: 50,
    color: '#333333',
  },

  // iOS용 Picker 버튼 스타일
  pickerButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    minHeight: 50,
  },
  
  pickerButtonText: {
    fontSize: 16,
    color: '#333333',
  },

  // ========== Modal 관련 (iOS Picker용) ==========
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 200,
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  
  modalCancelText: {
    fontSize: 16,
    color: '#666666',
  },
  
  modalDoneText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },

  // ========== 조직 정보 표시 ==========
  organizationInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },

  // 조직명
  organizationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },

  // 조직 설명
  organizationDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
});

export default styles;