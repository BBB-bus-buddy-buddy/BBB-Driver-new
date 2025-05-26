import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL_LOCAL } from '@env';

export const upgradeToDriver = async (data) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const userInfo = await AsyncStorage.getItem('userInfo');

    if (!token) {
      throw new Error('인증 토큰이 없습니다.');
    }
    
    console.log(`[driverService] token = ${token}`);
    console.log(`[driverService] userInfo = ${JSON.stringify(userInfo)}`);

    const response = await fetch(`${API_URL_LOCAL}/api/auth/upgrade-to-driver`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response;

    console.log(`[drvierService] 게스트 -> 운전자 권한 업그레이드 응답\n${JSON.stringify(result)}`);
    
    if (!response.ok) {
      throw new Error(result.message || '드라이버 등록에 실패했습니다.');
    }

    return result;
  } catch (error) {
    console.error('Driver upgrade error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
};