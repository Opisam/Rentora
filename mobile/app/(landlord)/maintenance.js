import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getLandlordMaintenanceRequests, updateMaintenanceStatus } from '../../api/maintenance';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Colors } from '../../constants/Colors';

const STATUSES = ['open', 'in_progress', 'resolved'];

function StatusBadge({ status }) {
  const map = {
    open: { bg: Colors.infoSoft, fg: '#1e40af', label: 'Open' },
    in_progress: { bg: Colors.brandSoft, fg: Colors.brandDarker, label: 'In Progress' },
    resolved: { bg: Colors.successSoft, fg: '#065f46', label: 'Resolved' },
  };
  const s = map[status] || map.open;
  return (
    <View style={[bd.badge, { backgroundColor: s.bg }]}>
      <Text style={[bd.text, { color: s.fg }]}>{s.label}</Text>
    </View>
  );
}
const bd = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  text: { fontSize: 12, fontWeight: '700' },
});

function PriorityDot({ priority }) {
  const c = priority === 'high' ? '#ef4444' : priority === 'medium' ? '#f59e0b' : '#6b7280';
  return <View style={[pd.dot, { backgroundColor: c }]} />;
}
const pd = StyleSheet.create({ dot: { width: 6, height: 6, borderRadius: 3 } });

export default function MaintenanceScreen() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try { setRequests(await getLandlordMaintenanceRequests()); } catch {} finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleStatusChange = (item) => {
    const options = STATUSES.filter((s) => s !== item.status);
    Alert.alert(
      'Update Status',
      `Change "${item.title}" from ${item.status.replace('_', ' ')} to:`,
      [
        ...options.map((s) => ({
          text: s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          onPress: async () => {
            try { await updateMaintenanceStatus(item.id, s); fetchData(); }
            catch (err) { Alert.alert('Error', err.response?.data?.error || 'Failed'); }
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <PriorityDot priority={item.priority} />
          <Text style={styles.cardTitle}>{item.title}</Text>
        </View>
        <StatusBadge status={item.status} />
      </View>

      {item.description ? <Text style={styles.desc} numberOfLines={2}>{item.description}</Text> : null}

      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Ionicons name="person-outline" size={13} color={Colors.light.textSecondary} />
          <Text style={styles.metaText}>{item.tenant?.name || 'Tenant'}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="home-outline" size={13} color={Colors.light.textSecondary} />
          <Text style={styles.metaText}>{item.unit?.property?.name} · Unit {item.unit?.unitNumber}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.statusBtn} onPress={() => handleStatusChange(item)}>
        <Ionicons name="swap-horizontal-outline" size={14} color={Colors.brand} />
        <Text style={styles.statusBtnText}>Update Status</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) return <LoadingSpinner />;

  const openCount = requests.filter((r) => r.status === 'open').length;

  return (
    <View style={styles.container}>
      <ScreenHeader
        icon="construct-outline"
        title="Maintenance"
        subtitle={openCount > 0 ? `${openCount} open request${openCount !== 1 ? 's' : ''}` : `${requests.length} request${requests.length !== 1 ? 's' : ''}`}
      />
      <FlatList
        data={requests}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} />}
        ListEmptyComponent={
          <EmptyState icon="construct-outline" title="No maintenance requests" message="Tenant requests will appear here" />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  list: { padding: 20, paddingBottom: 32 },
  card: {
    backgroundColor: Colors.light.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.light.border, padding: 16, marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.light.text, flex: 1 },
  desc: { fontSize: 13, color: Colors.light.textSecondary, marginTop: 8, lineHeight: 18 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.light.border },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: Colors.light.textSecondary },
  statusBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.light.border,
    marginTop: 12,
  },
  statusBtnText: { fontSize: 13, fontWeight: '600', color: Colors.brand },
});
