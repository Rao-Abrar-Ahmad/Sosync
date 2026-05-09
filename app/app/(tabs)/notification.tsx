import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Theme from '@/config/theme';
import { useUser } from '@/context/UserContext';
import { subscribeToNotifications, markNotificationAsRead, NotificationDocument, NotificationType } from '@/config/dbutils';
import { formatDate } from '@/constants/utils';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotificationScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [notifications, setNotifications] = useState<NotificationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = subscribeToNotifications(user.id as any, (data) => {
      setNotifications(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // Subscription handles updates, so we just wait a bit for effect
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleNotificationPress = async (item: NotificationDocument) => {
    if (!item.is_read) {
      await markNotificationAsRead(item.id);
    }

    if (item.report_id) {
      router.push(`/report/${item.report_id}` as any);
    } else if (item.sos_id) {
      router.push('/(tabs)/map');
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'SOS_ALERT': return { name: 'warning' as const, color: '#f44336', bg: '#ffebee' };
      case 'DISASTER_REPORT': return { name: 'bolt' as const, color: '#ff9800', bg: '#fff3e0' };
      case 'STATUS_UPDATE': return { name: 'check-circle' as const, color: '#4caf50', bg: '#e8f5e9' };
      default: return { name: 'bell' as const, color: '#2196f3', bg: '#e3f2fd' };
    }
  };

  const renderItem = ({ item }: { item: NotificationDocument }) => {
    const icon = getIcon(item.type);
    return (
      <TouchableOpacity
        style={[styles.notificationCard, !item.is_read && styles.unreadCard]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: icon.bg }]}>
          <FontAwesome name={icon.name} size={18} color={icon.color} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.message, !item.is_read && styles.unreadText]}>{item.message}</Text>
          <Text style={styles.time}>{formatDate(item.created_at)}</Text>
        </View>
        {!item.is_read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.variants.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity style={styles.clearBtn}>
          <Text style={styles.clearTxt}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <FontAwesome name="bell-slash-o" size={40} color={Theme.variants.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySubtitle}>You'll see safety updates and alerts here.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontFamily: Theme.typography.inter.bold,
    fontSize: 24,
    color: Theme.variants.text,
  },
  clearBtn: {
    padding: 8,
  },
  clearTxt: {
    fontFamily: Theme.typography.inter.medium,
    fontSize: 13,
    color: Theme.variants.primary,
  },
  listContent: {
    paddingBottom: 20,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
    alignItems: 'center',
    backgroundColor: '#fff',
    gap: 16,
  },
  unreadCard: {
    backgroundColor: '#f0f7ff',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 14,
    color: Theme.variants.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  unreadText: {
    fontFamily: Theme.typography.inter.semibold,
    color: '#000',
  },
  time: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 12,
    color: Theme.variants.textMuted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.variants.primary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    paddingHorizontal: 40,
    backgroundColor: '#fff',
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: Theme.typography.inter.bold,
    fontSize: 18,
    color: Theme.variants.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 14,
    color: Theme.variants.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
