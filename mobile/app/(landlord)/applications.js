import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getLandlordApplications, updateApplicationStatus } from '../../api/applications';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Colors } from '../../constants/Colors';

function StatusBadge({ status }) {
  const map = {
    pending: { bg: Colors.warningSoft, fg: '#92400e', label: 'Pending' },
    approved: { bg: Colors.successSoft, fg: '#065f46', label: 'Approved' },
    rejected: { bg: Colors.dangerSoft, fg: '#991b1b', label: 'Rejected' },
  };
  const s = map[status] || map.pending;
  return (
    <View style={[b.badge, { backgroundColor: s.bg }]}>
      <Text style={[b.text, { color: s.fg }]}>{s.label}</Text>
    </View>
  );
}
const b = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  text: { fontSize: 12, fontWeight: '700' },
});

export default function ApplicationsScreen() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try { setApps(await getLandlordApplications()); } catch {} finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleStatus = async (id, status) => {
    const label = status === 'approved' ? 'Approve' : 'Reject';
    Alert.alert(`${label} Application`, `Are you sure you want to ${label.toLowerCase()} this application?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: label, style: status === 'rejected' ? 'destructive' : 'default', onPress: async () => {
        try {
          await updateApplicationStatus(id, status);
          fetchData();
        } catch (err) {
          Alert.alert('Error', err.response?.data?.error || 'Failed');
        }
      }},
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(item.tenant?.name || 'T')[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.tenantName}>{item.tenant?.name || 'Tenant'}</Text>
          <Text style={styles.tenantEmail}>{item.tenant?.email || ''}</Text>
        </View>
        <StatusBadge status={item.status} />
      </View>

      <View style={styles.unitInfo}>
        <Ionicons name="home-outline" size={14} color={Colors.light.textSecondary} />
        <Text style={styles.unitText}>
          Unit {item.unit?.unitNumber} · {item.unit?.property?.name}
        </Text>
      </View>

      {item.message ? <Text style={styles.message}>{`\u201C${item.message}\u201D`}</Text> : null}

      {item.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.rejectBtn} onPress={() => handleStatus(item.id, 'rejected')}>
            <Ionicons name="close-outline" size={18} color="#ef4444" />
            <Text style={styles.rejectText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.approveBtn} onPress={() => handleStatus(item.id, 'approved')}>
            <Ionicons name="checkmark-outline" size={18} color="#fff" />
            <Text style={styles.approveText}>Approve</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <ScreenHeader
        icon="document-text-outline"
        title="Applications"
        subtitle={`${apps.length} application${apps.length !== 1 ? 's' : ''}`}
      />
      <FlatList
        data={apps}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} />}
        ListEmptyComponent={
          <EmptyState icon="document-text-outline" title="No applications" message="Tenant applications will appear here" />
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.brand,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  tenantName: { fontSize: 15, fontWeight: '700', color: Colors.light.text },
  tenantEmail: { fontSize: 12, color: Colors.light.textSecondary },
  unitInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  unitText: { fontSize: 13, color: Colors.light.textSecondary },
  message: { fontSize: 13, color: Colors.light.textSecondary, fontStyle: 'italic', marginBottom: 10, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#fecaca', backgroundColor: '#fef2f2',
  },
  rejectText: { fontSize: 14, fontWeight: '600', color: '#ef4444' },
  approveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 10, borderRadius: 10, backgroundColor: '#10b981',
  },
  approveText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
