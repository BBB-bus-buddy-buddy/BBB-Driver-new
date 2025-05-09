import React from 'react';
import {View, Text, StyleSheet, Image} from 'react-native';
import {
  COLORS,
  FONT_SIZE,
  BORDER_RADIUS,
  SHADOWS,
  SPACING,
  FONT_WEIGHT,
} from '../constants/theme';

const NotificationItem = ({notification}) => {
  return (
    <View style={[
    styles.notificationItem, 
      notification.unread && styles.unreadNotification
    ]}>
      <Image
        source={require('../assets/notification-icon.png')}
        style={styles.notificationIcon}
      />
      <View style={styles.notificationContent}>
        <Text style={[
          styles.notificationMessage,
          notification.unread && styles.unreadNotificationText
        ]}>
          {notification.message}
        </Text>
        <Text style={styles.notificationTime}>{notification.time}</Text>
      </View>
      {notification.unread && <View style={styles.unreadDot} />}
    </View>
  );
};

const styles = StyleSheet.create({
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  unreadNotification: {
    backgroundColor: COLORS.secondary,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  notificationIcon: {
    width: 24,
    height: 24,
    marginRight: SPACING.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.black,
    marginBottom: 5,
  },
  unreadNotificationText: {
    fontWeight: FONT_WEIGHT.semiBold,
  },
  notificationTime: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.lightGrey,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.sm,
    alignSelf: 'center',
  },
});

export default NotificationItem;