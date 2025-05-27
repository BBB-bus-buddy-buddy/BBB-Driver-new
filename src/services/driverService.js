import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL_LOCAL } from '@env';

export const upgradeToDriver = async (data) => {
  try {
    // 디버깅을 위한 userInfo 로그 (token은 apiClient에서 자동 처리)
    const userInfo = await AsyncStorage.getItem('userInfo');
    console.log(`[driverService] userInfo = ${JSON.stringify(userInfo)}`);

    const response = await apiClient.post('/api/auth/upgrade-to-driver', data);

    console.log(`[driverService] 게스트 -> 운전자 권한 업그레이드 응답\n${JSON.stringify(response.data)}`);

    return response.data;
  } catch (error) {
    console.error('Driver upgrade error:', error);

    // axios 에러 응답 처리
    const errorMessage = error.response?.data?.message || (error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');

    return {
      success: false,
      message: errorMessage,
    };
  }
};