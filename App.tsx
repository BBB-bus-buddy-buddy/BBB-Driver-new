// App.js
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { UserProvider } from './src/context/UserContext';
import { AuthProvider } from './src/context/AuthContext';
import { LogBox } from 'react-native';

// 경고 필터링 (선택적)
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'Sending `onAnimatedValueUpdate` with no listeners registered',
]);

const App = () => {
  // 앱 시작 시 로깅
  useEffect(() => {
    console.log('[App] 앱 시작');
    
    // 앱 언마운트 시 로깅
    return () => {
      console.log('[App] 앱 종료');
    };
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <UserProvider>
          <NavigationContainer
            onStateChange={(state) => {
              if (state) {
                // 현재 화면 로깅
                const routes = state.routes;
                const currentRouteName = routes[state.index]?.name;
                console.log('[App] 현재 화면:', currentRouteName);
              }
            }}
          >
            <AppNavigator />
          </NavigationContainer>
        </UserProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;