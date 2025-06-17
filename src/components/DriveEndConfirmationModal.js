// src/components/DriveEndConfirmationModal.js
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS, SPACING } from '../constants/theme';


const DriveEndConfirmationModal = ({ visible, onClose, onConfirm, driveInfo, destinationInfo }) => {
  const [loading, setLoading] = useState(false);
  const [checklist, setChecklist] = useState({
    nearDestination: destinationInfo?.isNear || false,
    allPassengersAlighted: false,
    vehicleInspected: false,
    itemsChecked: false,
  });

  const handleChecklistToggle = (key) => {
    setChecklist(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  const allChecked = Object.values(checklist).every(value => value === true);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 헤더 */}
            <View style={styles.header}>
              <Text style={styles.headerEmoji}>📋</Text>
              <Text style={styles.title}>운행 종료 확인</Text>
            </View>

            {/* 운행 정보 요약 */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>운행 정보</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>버스 번호</Text>
                <Text style={styles.summaryValue}>{driveInfo.busNumber}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>운행 시간</Text>
                <Text style={styles.summaryValue}>{driveInfo.elapsedTime}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>총 탑승객</Text>
                <Text style={styles.summaryValue}>{driveInfo.totalPassengers}명</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>현재 탑승</Text>
                <Text style={[
                  styles.summaryValue,
                  driveInfo.occupiedSeats > 0 && styles.warningText
                ]}>
                  {driveInfo.occupiedSeats}명
                </Text>
              </View>
            </View>

            {/* 목적지 정보 */}
            {destinationInfo && (
              <View style={styles.destinationCard}>
                <Text style={styles.destinationEmoji}>
                  {destinationInfo.isNear ? '✅' : '⚠️'}
                </Text>
                <View style={styles.destinationInfo}>
                  <Text style={styles.destinationLabel}>목적지 도착 상태</Text>
                  <Text style={[
                    styles.destinationStatus,
                    destinationInfo.isNear ? styles.successText : styles.warningText
                  ]}>
                    {destinationInfo.isNear ? '도착 완료' : `${destinationInfo.distanceText} 남음`}
                  </Text>
                </View>
              </View>
            )}

            {/* 체크리스트 */}
            <View style={styles.checklistContainer}>
              <Text style={styles.checklistTitle}>운행 종료 체크리스트</Text>
              
              <TouchableOpacity
                style={styles.checklistItem}
                onPress={() => handleChecklistToggle('nearDestination')}
                disabled={destinationInfo?.isNear}
              >
                <View style={[styles.checkbox, checklist.nearDestination && styles.checkboxChecked]}>
                  {checklist.nearDestination && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[
                  styles.checklistText,
                  checklist.nearDestination && styles.checkedText
                ]}>
                  목적지 도착 확인
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checklistItem}
                onPress={() => handleChecklistToggle('allPassengersAlighted')}
              >
                <View style={[styles.checkbox, checklist.allPassengersAlighted && styles.checkboxChecked]}>
                  {checklist.allPassengersAlighted && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[
                  styles.checklistText,
                  checklist.allPassengersAlighted && styles.checkedText
                ]}>
                  모든 승객 하차 확인
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checklistItem}
                onPress={() => handleChecklistToggle('vehicleInspected')}
              >
                <View style={[styles.checkbox, checklist.vehicleInspected && styles.checkboxChecked]}>
                  {checklist.vehicleInspected && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[
                  styles.checklistText,
                  checklist.vehicleInspected && styles.checkedText
                ]}>
                  차량 내부 점검 완료
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checklistItem}
                onPress={() => handleChecklistToggle('itemsChecked')}
              >
                <View style={[styles.checkbox, checklist.itemsChecked && styles.checkboxChecked]}>
                  {checklist.itemsChecked && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[
                  styles.checklistText,
                  checklist.itemsChecked && styles.checkedText
                ]}>
                  분실물 확인 완료
                </Text>
              </TouchableOpacity>
            </View>

            {/* 경고 메시지 */}
            {driveInfo.occupiedSeats > 0 && (
              <View style={styles.warningCard}>
                <Text style={styles.warningEmoji}>⚠️</Text>
                <Text style={styles.warningMessage}>
                  아직 {driveInfo.occupiedSeats}명의 승객이 탑승 중입니다.
                </Text>
              </View>
            )}

            {!destinationInfo?.isNear && (
              <View style={styles.warningCard}>
                <Text style={styles.warningEmoji}>ℹ️</Text>
                <Text style={styles.warningMessage}>
                  목적지에 도착하지 않았습니다. 조기 종료 시 사유를 입력해야 합니다.
                </Text>
              </View>
            )}

            {/* 버튼 */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.confirmButton,
                  !allChecked && styles.disabledButton
                ]}
                onPress={handleConfirm}
                disabled={!allChecked || loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>운행 종료</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    maxHeight: '90%',
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerEmoji: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
  },
  summaryCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  summaryTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.black,
    marginBottom: SPACING.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  summaryLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.grey,
  },
  summaryValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.black,
  },
  destinationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  destinationEmoji: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  destinationInfo: {
    flex: 1,
  },
  destinationLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.grey,
    marginBottom: SPACING.xs,
  },
  destinationStatus: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
  },
  successText: {
    color: COLORS.success,
  },
  warningText: {
    color: COLORS.warning,
  },
  checklistContainer: {
    marginBottom: SPACING.lg,
  },
  checklistTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.black,
    marginBottom: SPACING.md,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: COLORS.grey,
    borderRadius: BORDER_RADIUS.xs,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  checkboxChecked: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: FONT_WEIGHT.bold,
  },
  checklistText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.grey,
    flex: 1,
  },
  checkedText: {
    color: COLORS.black,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '20',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  warningEmoji: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  warningMessage: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.warning,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.lightGrey,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
  },
  disabledButton: {
    backgroundColor: COLORS.extraLightGrey,
  },
  cancelButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.black,
  },
  confirmButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.white,
  },
});

export default DriveEndConfirmationModal;