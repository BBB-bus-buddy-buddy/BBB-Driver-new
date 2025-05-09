import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS, SPACING } from '../constants/theme';
import BottomTabBar from '../components/BottomTabBar';

const MessageScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState('message');

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    // Dummy data - in a real app, this would be fetched from an API
    const dummyMessages = [
      {
        id: 1,
        sender: '관리자',
        preview: '안전 운행 교육 안내',
        date: '오늘',
        unread: true,
      },
      {
        id: 2,
        sender: '운행관리팀',
        preview: '다음 주 운행 일정 변경 안내',
        date: '어제',
        unread: false,
      },
      {
        id: 3,
        sender: '차량관리팀',
        preview: '차량 점검 일정 안내',
        date: '2일 전',
        unread: false,
      },
      {
        id: 4,
        sender: '인사팀',
        preview: '복지 제도 변경 안내',
        date: '1주일 전',
        unread: false,
      },
    ];

    setMessages(dummyMessages);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMessages();
    setRefreshing(false);
  };

  const handleTabPress = (tabId) => {
    setActiveBottomTab(tabId);
    
    switch (tabId) {
      case 'home':
        navigation.navigate('Home');
        break;
      case 'schedule':
        navigation.navigate('Schedule');
        break;
      case 'profile':
        navigation.navigate('Profile');
        break;
      default:
        break;
    }
  };

  const renderMessageItem = ({ item }) => (
    <TouchableOpacity style={styles.messageItem}>
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={styles.senderName}>{item.sender}</Text>
          <Text style={styles.messageDate}>{item.date}</Text>
        </View>
        <Text style={styles.messagePreview} numberOfLines={1}>
          {item.preview}
        </Text>
      </View>
      {item.unread && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>메시지</Text>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="메시지 검색"
            placeholderTextColor={COLORS.lightGrey}
          />
        </View>

        {messages.length > 0 ? (
          <FlatList
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.messageList}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Image
              source={require('../assets/notification-icon.png')}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyText}>메시지가 없습니다.</Text>
          </View>
        )}

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
  searchContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
  },
  searchInput: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.round,
    padding: SPACING.md,
    fontSize: FONT_SIZE.sm,
    color: COLORS.black,
  },
  messageList: {
    paddingBottom: 80, // Space for bottom tab bar
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  senderName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.black,
  },
  messageDate: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.lightGrey,
  },
  messagePreview: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.grey,
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    marginBottom: SPACING.md,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.grey,
    textAlign: 'center',
  },
});

export default MessageScreen;