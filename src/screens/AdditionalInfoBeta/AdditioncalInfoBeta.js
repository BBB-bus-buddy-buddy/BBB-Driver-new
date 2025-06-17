// src/screens/AdditionalInfoBeta/AdditioncalInfoBeta.js 
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ValidationService, AuthService } from '../../services';
import { storage } from '../../utils/storage';
import { swapLocationForBackend } from '../../utils/locationSwapHelper';

import PersonalInfoStep from './step/PersonalInfoStep';
import LicenseInfoStep from './step/LicenseInfoStep';
import OrganizationStep from './step/OrganizationStep';
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
    const [userInfo, setUserInfo] = useState(null);
    const [initialLoading, setInitialLoading] = useState(true);

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

    // 사용자 정보 로드
    useEffect(() => {
        const loadUserInfo = async () => {
            try {
                setInitialLoading(true);
                
                // AuthService를 통해 현재 사용자 정보 가져오기
                const currentUser = await AuthService.getCurrentUser();
                
                if (currentUser) {
                    setUserInfo(currentUser);
                    console.log('[AdditionalInfoBeta] 사용자 정보 로드:', currentUser.email);
                } else {
                    Alert.alert('오류', '사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
                    navigation.navigate('Login');
                }
            } catch (error) {
                console.error('[AdditionalInfoBeta] 사용자 정보 로드 오류:', error);
                Alert.alert('오류', '사용자 정보를 불러올 수 없습니다.');
                navigation.navigate('Login');
            } finally {
                setInitialLoading(false);
            }
        };

        loadUserInfo();
    }, [navigation]);

    // 입력 포맷팅 함수들
    const formatters = {
        identity: (value) => {
            const numbers = value.replace(/\D/g, '');
            if (numbers.length <= 6) {
                return numbers;
            }
            return `${numbers.slice(0, 6)}-${numbers.slice(6, 13)}`;
        },

        phoneNumber: (value) => {
            const numbers = value.replace(/\D/g, '');
            if (numbers.length <= 3) {
                return numbers;
            } else if (numbers.length <= 7) {
                return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
            }
            return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
        },

        licenseNumber: (value) => {
            const numbers = value.replace(/\D/g, '');
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
            const numbers = value.replace(/\D/g, '');
            if (numbers.length <= 4) {
                return numbers;
            } else if (numbers.length <= 6) {
                return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
            }
            return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 8)}`;
        },

        birthDate: (value) => {
            return value.replace(/\D/g, '').slice(0, 8);
        },

        licenseSerial: (value) => {
            return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
        },

        organizationId: (value) => {
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

    // 단계별 유효성 검사
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
            // 위치 정보가 있으면 백엔드 형식으로 변환
            const submitData = { ...driverInfo };
            if (driverInfo.latitude !== null && driverInfo.longitude !== null) {
                const backendLocation = swapLocationForBackend({
                    latitude: driverInfo.latitude,
                    longitude: driverInfo.longitude
                });
                submitData.latitude = backendLocation.latitude;
                submitData.longitude = backendLocation.longitude;
            }

            // ValidationService.upgradeToDriver 사용
            const response = await ValidationService.upgradeToDriver(submitData);

            if (response.success) {
                // 성공 시 storage에 사용자 정보 저장
                if (response.data) {
                    await storage.setUserInfo(response.data);
                    await storage.setHasAdditionalInfo(true);
                }

                // 사용자 정보 동기화
                const syncResult = await AuthService.syncUserInfo();
                
                Alert.alert(
                    '등록 완료',
                    '드라이버 등록이 성공적으로 완료되었습니다.',
                    [
                        {
                            text: '확인',
                            onPress: () => navigation.navigate('Home')
                        }
                    ]
                );
            } else {
                Alert.alert('오류', response.message || '등록 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('[AdditionalInfoBeta] 드라이버 등록 오류:', error);
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

    // 초기 로딩 중
    if (initialLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={{ marginTop: 10, color: '#666' }}>로딩 중...</Text>
            </View>
        );
    }

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