import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getNotifications, markAsRead } from '../../api/notifications';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Colors } from '../../constants/Colors';

function timeAgo(date) {
  if (!date) return '';
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try { setNotifications(await getNotifications()); } catch {} finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handlePress = async (item) => {
    if (!item.read) {
      try { await markAsRead(item.id); fetchData(); } catch {}
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, !item.read && styles.unread]}
      onPress={() => handlePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.iconWrap}>
        <Ionicons
          name={item.read ? 'notifications-outline' : 'notifications'}
          size={18}
          color={!item.read ? Colors.brand : Colors.light.textSecondary}
        />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, !item.read && { fontWeight: '700' }]} numberOfLines={1}>
          {item.title || 'Notification'}
        </Text>
        <Text style={styles.message} numberOfLines={2}>{item.message || ''}</Text>
        <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
      </View>
      {!item.read && <View style={styles.dot} />}
    </TouchableOpacity>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <ScreenHeader
        icon="notifications-outline"
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : `${notifications.length} notification${notifications.length !== 1 ? 's' : ''}`}
      />
      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} />}
        ListEmptyComponent={
          <EmptyState icon="notifications-outline" title="No notifications" message="You're all caught up" />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  list: { padding: 20, paddingBottom: 32 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: Colors.light.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.light.border, padding: 14, marginBottom: 10,
  },
  unread: { backgroundColor: Colors.brandSoft, borderColor: Colors.brand + '30' },
  iconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.light.background, alignItems: 'center', justifyContent: 'center',
  },
  content: { flex: 1 },
  title: { fontSize: 14, fontWeight: '600', color: Colors.light.text },
  message: { fontSize: 13, color: Colors.light.textSecondary, marginTop: 3, lineHeight: 18 },
  time: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.brand, marginTop: 4 },
});
