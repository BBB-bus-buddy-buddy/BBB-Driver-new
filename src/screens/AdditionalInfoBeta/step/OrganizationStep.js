// src/screens/AdditionalInfoBeta/step/OrganizationStep.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ValidationService } from '../../../services';
import styles from '../styles';

const OrganizationStep = ({
    driverInfo,
    updateDriverInfo,
    validationErrors,
    onSubmit,
    onPrev,
    isValid,
    loading
}) => {
    const [verificationState, setVerificationState] = useState({
        isVerifying: false,
        isVerified: false,
        verificationMessage: '',
        organizationData: null
    });

    useEffect(() => {
        setVerificationState(prev => ({
            ...prev,
            isVerified: false,
            verificationMessage: '',
            organizationData: null
        }));
    }, [driverInfo.organizationId]);

    const handleVerifyOrganization = async () => {
        if (!driverInfo.organizationId?.trim()) {
            setVerificationState(prev => ({
                ...prev,
                verificationMessage: '조직 코드를 입력해주세요.',
                isVerified: false
            }));
            return;
        }

        setVerificationState(prev => ({
            ...prev,
            isVerifying: true,
            verificationMessage: '',
            isVerified: false
        }));

        try {
            // ✅ ValidationService.verifyOrganization 사용
            const result = await ValidationService.verifyOrganization(driverInfo.organizationId.trim());

            if (result.success) {
                setVerificationState({
                    isVerifying: false,
                    isVerified: true,
                    verificationMessage: result.message || '유효한 조직 코드입니다.',
                    organizationData: result.data
                });
            } else {
                setVerificationState({
                    isVerifying: false,
                    isVerified: false,
                    verificationMessage: result.message || '유효하지 않은 조직 코드입니다.',
                    organizationData: null
                });
            }
        } catch (error) {
            console.error('조직 코드 검증 오류:', error);
            setVerificationState({
                isVerifying: false,
                isVerified: false,
                verificationMessage: '검증 중 오류가 발생했습니다.',
                organizationData: null
            });
        }
    };

    const canSubmit = isValid && verificationState.isVerified && !loading;

    return (
        <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>소속 정보</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>조직 코드</Text>

                <View style={styles.inputWithButtonContainer}>
                    <TextInput
                        style={[
                            styles.inputWithButton,
                            verificationState.isVerified && styles.inputVerified,
                            validationErrors.organizationId && styles.inputError
                        ]}
                        placeholder="조직 코드 (영문+숫자)"
                        value={driverInfo.organizationId}
                        onChangeText={(text) => updateDriverInfo('organizationId', text)}
                        autoCapitalize="characters"
                        editable={!verificationState.isVerifying}
                    />

                    <TouchableOpacity
                        style={[
                            styles.verifyButton,
                            verificationState.isVerifying && styles.verifyButtonDisabled,
                            verificationState.isVerified && styles.verifyButtonSuccess
                        ]}
                        onPress={handleVerifyOrganization}
                        disabled={verificationState.isVerifying || !isValid}
                    >
                        {verificationState.isVerifying ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <Text style={[
                                styles.verifyButtonText,
                                verificationState.isVerified && styles.verifyButtonTextSuccess
                            ]}>
                                {verificationState.isVerified ? '검증 완료' : '조직 코드 검사'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                {validationErrors.organizationId ? (
                    <Text style={styles.errorText}>{validationErrors.organizationId}</Text>
                ) : verificationState.verificationMessage ? (
                    <Text style={[
                        styles.verificationMessage,
                        verificationState.isVerified ? styles.successMessage : styles.errorMessage
                    ]}>
                        {verificationState.verificationMessage}
                    </Text>
                ) : (
                    <Text style={styles.helperText}>
                        소속된 조직에서 제공한 코드를 입력해주세요
                    </Text>
                )}

                {verificationState.isVerified && verificationState.organizationData && (
                    <View style={styles.organizationInfo}>
                        <Text style={styles.organizationName}>
                            {verificationState.organizationData.name || '조직명 불명'}
                        </Text>
                        {verificationState.organizationData.description && (
                            <Text style={styles.organizationDescription}>
                                {verificationState.organizationData.description}
                            </Text>
                        )}
                    </View>
                )}
            </View>

            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={[styles.button, styles.buttonSecondary]}
                    onPress={onPrev}
                    disabled={loading || verificationState.isVerifying}
                >
                    <Text style={styles.buttonTextSecondary}>이전</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, !canSubmit && styles.buttonDisabled]}
                    onPress={onSubmit}
                    disabled={!canSubmit}
                >
                    {loading ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text style={styles.buttonText}>등록 완료</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default OrganizationStep;