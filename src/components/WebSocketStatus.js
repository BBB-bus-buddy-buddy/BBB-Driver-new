// src/components/WebSocketStatus.js
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useWebSocketStatus } from '../hooks/useDriverWebSocket';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '../constants/theme';

const WebSocketStatus = () => {
  const { isConnected, reconnectAttempts, pendingMessages } = useWebSocketStatus();
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  // 연결 상태에 따른 애니메이션
  React.useEffect(() => {
    if (isConnected) {
      // 연결됨 - 펄스 애니메이션 중지
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (reconnectAttempts > 0) {
      // 재연결 중 - 펄스 애니메이션
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.5,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isConnected, reconnectAttempts, pulseAnim]);

  const getStatusColor = () => {
    if (isConnected) return COLORS.success;
    if (reconnectAttempts > 0) return COLORS.warning;
    return COLORS.error;
  };

  const getStatusText = () => {
    if (isConnected) return '실시간 연결됨';
    if (reconnectAttempts > 0) return `재연결 중... (${reconnectAttempts}회)`;
    return '연결 끊김';
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <Animated.View
          style={[
            styles.statusDot,
            {
              backgroundColor: getStatusColor(),
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </View>
      {pendingMessages > 0 && (
        <Text style={styles.pendingText}>대기중: {pendingMessages}개</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  statusText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.black,
    fontWeight: FONT_WEIGHT.medium,
  },
  pendingText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.grey,
    marginLeft: SPACING.sm,
  },
});

export default WebSocketStatus;