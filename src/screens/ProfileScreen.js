// src/screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS, SPACING } from '../constants/theme';
import BottomTabBar from '../components/BottomTabBar';
import { useAuth } from '../context/AuthContext'; // 추가된 import

const ProfileScreen = ({ navigation }) => {
  const { userInfo, logout } = useAuth(); // useAuth 훅 사용
  const [activeBottomTab, setActiveBottomTab] = useState('profile');
  const [drivingStats, setDrivingStats] = useState({
    totalDrives: 42,
    thisMonth: 8,
    totalHours: 126,
  });

  useEffect(() => {
    // In a real app, you would fetch the driver's statistics from the API
    // This is just dummy data for demonstration
  }, []);

  const handleTabPress = (tabId) => {
    setActiveBottomTab(tabId);
    
    switch (tabId) {
      case 'home':
        navigation.navigate('Home');
        break;
      case 'schedule':
        navigation.navigate('Schedule');
        break;
      case 'message':
        navigation.navigate('Message');
        break;
      default:
        break;
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '로그아웃',
          onPress: async () => {
            try {
              await logout(); // 수정된 부분: 반환값 체크 없이 프로미스 완료 대기
              navigation.replace('Login');
            } catch (error) {
              Alert.alert('오류', '로그아웃 중 문제가 발생했습니다.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleEditProfile = () => {
    // In a real app, this would navigate to a profile edit screen
    Alert.alert('안내', '프로필 편집 기능은 준비 중입니다.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>프로필</Text>
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.profileSection}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Image
                  source={require('../assets/profile-icon.png')}
                  style={styles.avatarImage}
                />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{userInfo?.name || '운전자'}</Text>
                <Text style={styles.profileLicense}>{userInfo?.licenseType || '1종 대형'}</Text>
              </View>
              <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                <Text style={styles.editButtonText}>편집</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>운행 통계</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{drivingStats.totalDrives}</Text>
                <Text style={styles.statLabel}>총 운행 횟수</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{drivingStats.thisMonth}</Text>
                <Text style={styles.statLabel}>이번 달</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{drivingStats.totalHours}</Text>
                <Text style={styles.statLabel}>총 운행 시간</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>개인 정보</Text>
            <View style={styles.detailCard}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>면허 번호</Text>
                <Text style={styles.detailValue}>{userInfo?.licenseNumber || '12-34-567890-01'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>면허 만료일</Text>
                <Text style={styles.detailValue}>{userInfo?.licenseExpiryDate || '2027-12-31'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>전화번호</Text>
                <Text style={styles.detailValue}>{userInfo?.phoneNumber || '010-1234-5678'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.optionsSection}>
            <TouchableOpacity style={styles.optionItem}>
              <Text style={styles.optionText}>알림 설정</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionItem}>
              <Text style={styles.optionText}>언어 설정</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionItem}>
              <Text style={styles.optionText}>도움말</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionItem} onPress={handleLogout}>
              <Text style={[styles.optionText, { color: COLORS.error }]}>로그아웃</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.appInfoSection}>
            <Text style={styles.appVersion}>버스 운행 관리 시스템 v1.0.0</Text>
          </View>
          
          {/* 하단 여백 */}
          <View style={styles.bottomPadding} />
        </ScrollView>
        
        {/* 하단 탭 바 */}
        <BottomTabBar
          activeTab={activeBottomTab}
          onTabPress={handleTabPress}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  avatarImage: {
    width: 40,
    height: 40,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  profileLicense: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.grey,
  },
  editButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  editButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  statsSection: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
    marginBottom: SPACING.md,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.grey,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: COLORS.divider,
  },
  detailsSection: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  detailCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  detailLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.grey,
  },
  detailValue: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.black,
    fontWeight: FONT_WEIGHT.medium,
  },
  optionsSection: {
    backgroundColor: COLORS.white,
    marginBottom: SPACING.md,
  },
  optionItem: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  optionText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.black,
  },
  appInfoSection: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  appVersion: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.lightGrey,
  },
  bottomPadding: {
    height: 80,
  },
});

export default ProfileScreen;