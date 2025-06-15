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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS, SPACING } from '../constants/theme';
import BottomTabBar from '../components/BottomTabBar';
import { AuthService, StatisticsService } from '../services';

const ProfileScreen = ({ navigation }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeBottomTab, setActiveBottomTab] = useState('profile');
  const [drivingStats, setDrivingStats] = useState({
    totalDrives: 0,
    thisMonth: 0,
    totalHours: 0,
  });

  useEffect(() => {
    // 저장된 사용자 정보 가져오기
    const getUserInfo = async () => {
      try {
        setLoading(true);
        const storedUserInfo = await AuthService.getCurrentUser();
        if (storedUserInfo) {
          setUserInfo(storedUserInfo);
          console.log('[ProfileScreen] 저장된 사용자 정보 로드:', storedUserInfo.email);
        } else {
          // 저장된 사용자 정보가 없으면 로그인 화면으로 이동
          console.error('[ProfileScreen] 저장된 사용자 정보 없음');
          Alert.alert('오류', '사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
          navigation.replace('Login');
          return;
        }

        // 운행 통계 정보 로드
        await loadDrivingStats();

      } catch (error) {
        console.error('[ProfileScreen] 사용자 정보 로드 오류:', error);
        Alert.alert('오류', '정보를 불러올 수 없습니다. 다시 로그인해주세요.');
        navigation.replace('Login');
      } finally {
        setLoading(false);
      }
    };

    getUserInfo();
  }, [navigation]);

  // 운행 통계 로드 함수
  const loadDrivingStats = async () => {
    try {
      console.log('[ProfileScreen] 운행 통계 로드 중...');

      // StatisticsService 사용
      const statsResponse = await StatisticsService.getUserStats();

      if (statsResponse.success && statsResponse.data) {
        setDrivingStats(statsResponse.data);
        console.log('[ProfileScreen] 운행 통계 로드 완료:', {
          totalDrives: statsResponse.data.totalDrives,
          thisMonth: statsResponse.data.thisMonth
        });
      } else {
        throw new Error(statsResponse.message || '통계 데이터 조회 실패');
      }
    } catch (statsError) {
      console.error('[ProfileScreen] 운행 통계 로드 오류:', statsError);
      Alert.alert('통계 오류', '운행 통계를 불러올 수 없습니다.');
    }
  };

  const handleTabPress = (tabId) => {
    setActiveBottomTab(tabId);

    switch (tabId) {
      case 'home':
        navigation.navigate('Home');
        break;
      case 'operationPlan':
        navigation.navigate('OperationPlan');
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
              setLoading(true);
              const result = await AuthService.logout();

              if (result.success) {
                // 로그인 화면으로 이동
                navigation.replace('Login');
              } else {
                // 실패해도 로그인 화면으로 이동 (로컬 데이터는 정리됨)
                navigation.replace('Login');
              }
            } catch (error) {
              console.error('[ProfileScreen] 로그아웃 오류:', error);

              // API 오류가 발생해도 로컬 스토리지 정리 후 로그인 화면으로 이동
              try {
                await AuthService.clearUserData();
              } catch (clearError) {
                console.warn('[ProfileScreen] 데이터 정리 오류 (무시됨):', clearError);
              }

              navigation.replace('Login');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleEditProfile = () => {
    // 프로필 편집 기능
    Alert.alert('안내', '프로필 편집 기능은 준비 중입니다.');
  };

  // 운행 통계 새로고침 함수
  const handleRefreshStats = async () => {
    try {
      setLoading(true);
      await loadDrivingStats();
    } catch (error) {
      console.error('[ProfileScreen] 통계 새로고침 오류:', error);
      Alert.alert('오류', '통계 정보를 새로고침할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 로딩 중이면 로딩 화면 표시
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>정보를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>프로필</Text>
          {/* 새로고침 버튼 */}
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefreshStats}>
            <Text style={styles.refreshButtonText}>새로고침</Text>
          </TouchableOpacity>
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
                <Text style={styles.profileLicense}>{userInfo?.licenseInfo?.licenseType || '1종 대형'}</Text>
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

            {/* 추가 통계 정보 표시 */}
            <View style={styles.additionalStatsContainer}>
              <View style={styles.additionalStatRow}>
                <View style={styles.additionalStatItem}>
                  <Text style={styles.additionalStatValue}>{drivingStats.safetyScore.toFixed(1) || 0}</Text>
                  <Text style={styles.additionalStatLabel}>안전 점수</Text>
                </View>
                <View style={styles.additionalStatItem}>
                  <Text style={styles.additionalStatValue}>
                    {drivingStats.onTimeRate !== undefined && drivingStats.onTimeRate.toFixed(1) !== null
                      ? drivingStats.onTimeRate.toFixed(1)
                      : '0.0'}%
                  </Text>
                  <Text style={styles.additionalStatLabel}>정시 운행률</Text>
                </View>
              </View>

              <View style={styles.additionalStatRow}>
                <View style={styles.additionalStatItem}>
                  <Text style={styles.additionalStatValue}>{drivingStats.totalDistance || 0}km</Text>
                  <Text style={styles.additionalStatLabel}>총 운행 거리</Text>
                </View>
                <View style={styles.additionalStatItem}>
                  <Text style={styles.additionalStatValue}>
                    {drivingStats.customerRating !== undefined && drivingStats.customerRating !== null
                      ? drivingStats.customerRating.toFixed(1)
                      : '0.0'}
                  </Text>
                  <Text style={styles.additionalStatLabel}>고객 평점</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>개인 정보</Text>
            <View style={styles.detailCard}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>면허 번호</Text>
                <Text style={styles.detailValue}>{userInfo?.licenseInfo?.licenseNumber || '12-34-567890-01'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>면허 만료일</Text>
                <Text style={styles.detailValue}>{userInfo?.licenseInfo?.licenseExpiryDate || '2027-12-31'}</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.grey,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  // 새로고침 버튼 스타일
  refreshButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
  },
  refreshButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
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
    marginBottom: SPACING.md,
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
  // 추가 통계 컨테이너 스타일
  additionalStatsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  additionalStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  additionalStatItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
  },
  additionalStatValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  additionalStatLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.grey,
    textAlign: 'center',
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