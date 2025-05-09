// src/components/BottomTabBar.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT } from '../constants/theme';

const BottomTabBar = ({ activeTab, onTabPress }) => {
  const tabs = [
    { id: 'home', label: '홈' },
    { id: 'schedule', label: '일정' },
    { id: 'message', label: '메시지' },
    { id: 'profile', label: '프로필' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={styles.tab}
          onPress={() => onTabPress(tab.id)}
        >
          <View
            style={[
              styles.tabContent,
              activeTab === tab.id && styles.activeTabContent,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContent: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  activeTabContent: {
    backgroundColor: COLORS.secondary,
  },
  tabText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.grey,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.semiBold,
  },
});

export default BottomTabBar;