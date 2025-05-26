// src/screens/AdditionalInfoBeta/AdditionalInfoBeta.js
import React, { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PersonalInfoStep from './step/PersonalInfoStep';
import LicenseInfoStep from './step/LicenseInfoStep';
import OrganizationStep from './step/OrganizationStep';
import { upgradeToDriver } from '../../services/driverService';
import {
    validateIdentityNumber,
    validateBirthDate,
    validateExpiryDate,
    validateInput,
    ValidationRegex
} from '../AdditionalInfo/validation';
import styles from './styles';

const AdditionalInfoBeta = () => {
    const navigation = useNavigation();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [driverInfo, setDriverInfo] = useState({
        identity: '',
        birthDate: '',
        phoneNumber: '',
        licenseNumber: '',
        licenseSerial: '',
        licenseType: '',
        licenseExpiryDate: '',
        organizationId: '',
        latitude: null,
        longitude: null,
    });

    const [fieldValidation, setFieldValidation] = useState({
        identity: false,
        birthDate: false,
        phoneNumber: false,
        licenseNumber: false,
        licenseSerial: false,
        licenseType: false,
        licenseExpiryDate: false,
        organizationId: false,
    });

    const [validationErrors, setValidationErrors] = useState({});

    // 입력 포맷팅 함수들
    const formatters = {
        identity: (value) => {
            // 숫자만 추출
            const numbers = value.replace(/\D/g, '');
            // 6자리까지는 그대로, 7자리부터 하이픈 추가
            if (numbers.length <= 6) {
                return numbers;
            }
            return `${numbers.slice(0, 6)}-${numbers.slice(6, 13)}`;
        },

        phoneNumber: (value) => {
            // 숫자만 추출
            const numbers = value.replace(/\D/g, '');
            // 3-4-4 패턴으로 하이픈 추가
            if (numbers.length <= 3) {
                return numbers;
            } else if (numbers.length <= 7) {
                return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
            }
            return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
        },

        licenseNumber: (value) => {
            // 숫자만 추출
            const numbers = value.replace(/\D/g, '');
            // 2-2-6-2 패턴으로 하이픈 추가
            if (numbers.length <= 2) {
                return numbers;
            } else if (numbers.length <= 4) {
                return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
            } else if (numbers.length <= 10) {
                return `${numbers.slice(0, 2)}-${numbers.slice(2, 4)}-${numbers.slice(4)}`;
            }
            return `${numbers.slice(0, 2)}-${numbers.slice(2, 4)}-${numbers.slice(4, 10)}-${numbers.slice(10, 12)}`;
        },

        licenseExpiryDate: (value) => {
            // 숫자만 추출
            const numbers = value.replace(/\D/g, '');
            // YYYY-MM-DD 패턴으로 하이픈 추가
            if (numbers.length <= 4) {
                return numbers;
            } else if (numbers.length <= 6) {
                return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
            }
            return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 8)}`;
        },

        birthDate: (value) => {
            // 생년월일은 숫자만 (YYYYMMDD)
            return value.replace(/\D/g, '').slice(0, 8);
        },

        licenseSerial: (value) => {
            // 영문과 숫자만 허용, 대문자로 변환
            return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
        },

        organizationId: (value) => {
            // 영문과 숫자만 허용
            return value.replace(/[^A-Za-z0-9]/g, '');
        }
    };

    // 필드별 검증 함수
    const validateField = (fieldName, value) => {
        let isValid = false;
        let errorMessage = '';

        switch (fieldName) {
            case 'identity':
                if (value) {
                    const result = validateIdentityNumber(value);
                    isValid = result.isValid;
                    errorMessage = result.message;
                }
                break;

            case 'birthDate':
                if (value) {
                    const result = validateBirthDate(value);
                    isValid = result.isValid;
                    errorMessage = result.message;
                }
                break;

            case 'phoneNumber':
                if (value) {
                    const result = validateInput(value, ValidationRegex.PHONE_NUMBER, '전화번호');
                    isValid = result.isValid;
                    errorMessage = result.message;
                }
                break;

            case 'licenseNumber':
                if (value) {
                    const result = validateInput(value, ValidationRegex.LICENSE_NUMBER, '면허번호');
                    isValid = result.isValid;
                    errorMessage = result.message;
                }
                break;

            case 'licenseSerial':
                if (value) {
                    const result = validateInput(value, ValidationRegex.LICENSE_SERIAL, '면허 일련번호');
                    isValid = result.isValid;
                    errorMessage = result.message;
                }
                break;

            case 'licenseType':
                if (value) {
                    // 유효한 면허 종류 목록
                    const validTypes = ['1종대형', '1종보통', '2종보통', '2종소형'];
                    isValid = validTypes.includes(value);
                    if (!isValid) {
                        errorMessage = '유효한 면허 종류를 선택해주세요.';
                    }
                }
                break;

            case 'licenseExpiryDate':
                if (value) {
                    const result = validateExpiryDate(value);
                    isValid = result.isValid;
                    errorMessage = result.message;
                }
                break;

            case 'organizationId':
                if (value && value.trim().length >= 3 && /^[A-Za-z0-9]+$/.test(value.trim())) {
                    isValid = true;
                } else if (value) {
                    errorMessage = '조직 코드는 영문, 숫자 3자리 이상이어야 합니다.';
                }
                break;
        }

        // 검증 상태 업데이트
        setFieldValidation(prev => ({
            ...prev,
            [fieldName]: isValid
        }));

        // 에러 메시지 업데이트
        setValidationErrors(prev => ({
            ...prev,
            [fieldName]: errorMessage
        }));

        return isValid;
    };

    const updateDriverInfo = (field, value) => {
        // 포맷팅 적용
        const formattedValue = formatters[field] ? formatters[field](value) : value;

        setDriverInfo(prev => ({
            ...prev,
            [field]: formattedValue
        }));

        // 필드 변경 시 검증 수행
        validateField(field, formattedValue);
    };

    const handleNextStep = () => {
        if (currentStep < 3) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handlePrevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    // 단계별 유효성 검사 (간소화)
    const validateStep = (step) => {
        switch (step) {
            case 1:
                return fieldValidation.identity && fieldValidation.birthDate && fieldValidation.phoneNumber;
            case 2:
                return fieldValidation.licenseNumber && fieldValidation.licenseSerial &&
                    fieldValidation.licenseType && fieldValidation.licenseExpiryDate;
            case 3:
                return fieldValidation.organizationId;
            default:
                return false;
        }
    };

    const handleSubmit = async () => {
        // 모든 단계 검증
        if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
            Alert.alert('입력 오류', '모든 정보를 올바르게 입력해주세요.');
            return;
        }

        setLoading(true);
        try {
            const response = await upgradeToDriver(driverInfo);

            if (response.success) {
                await AsyncStorage.setItem('userInfo', JSON.stringify(response.data));

                Alert.alert(
                    '등록 완료',
                    '드라이버 등록이 성공적으로 완료되었습니다.',
                    [
                        {
                            text: '확인',
                            onPress: () => navigation.navigate('HomeScreen')
                        }
                    ]
                );
            } else {
                Alert.alert('오류', response.message || '등록 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('Driver registration error:', error);
            Alert.alert('오류', '서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <PersonalInfoStep
                        driverInfo={driverInfo}
                        updateDriverInfo={updateDriverInfo}
                        validationErrors={validationErrors}
                        onNext={handleNextStep}
                        isValid={validateStep(1)}
                    />
                );
            case 2:
                return (
                    <LicenseInfoStep
                        driverInfo={driverInfo}
                        updateDriverInfo={updateDriverInfo}
                        validationErrors={validationErrors}
                        onNext={handleNextStep}
                        onPrev={handlePrevStep}
                        isValid={validateStep(2)}
                    />
                );
            case 3:
                return (
                    <OrganizationStep
                        driverInfo={driverInfo}
                        updateDriverInfo={updateDriverInfo}
                        validationErrors={validationErrors}
                        onSubmit={handleSubmit}
                        onPrev={handlePrevStep}
                        isValid={validateStep(3)}
                        loading={loading}
                    />
                );
            default:
                return null;
        }
    };

    const getStepTitle = () => {
        switch (currentStep) {
            case 1:
                return '개인정보';
            case 2:
                return '면허정보';
            case 3:
                return '소속정보';
            default:
                return '';
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>추가 정보 입력</Text>
                <Text style={styles.subtitle}>
                    드라이버 등록을 위한 정보를 입력해주세요 ({currentStep}/3단계 - {getStepTitle()})
                </Text>
            </View>

            <View style={styles.stepIndicator}>
                {[1, 2, 3].map((step) => (
                    <View
                        key={step}
                        style={[
                            styles.stepDot,
                            step === currentStep && styles.activeStepDot,
                            step < currentStep && styles.completedStepDot
                        ]}
                    />
                ))}
            </View>

            {renderStep()}
        </ScrollView>
    );
};

export default AdditionalInfoBeta;