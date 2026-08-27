import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getLandlordLeases, terminateLease } from '../../api/leases';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Colors } from '../../constants/Colors';

function StatusBadge({ status }) {
  const map = {
    active: { bg: Colors.successSoft, fg: '#065f46', label: 'Active' },
    expired: { bg: Colors.warningSoft, fg: '#92400e', label: 'Expired' },
    terminated: { bg: Colors.dangerSoft, fg: '#991b1b', label: 'Terminated' },
  };
  const s = map[status] || map.active;
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

function fmt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function LeasesScreen() {
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try { setLeases(await getLandlordLeases()); } catch {} finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleTerminate = (lease) => {
    Alert.alert('Terminate Lease', `Terminate lease for unit ${lease.unit?.unitNumber}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Terminate', style: 'destructive', onPress: async () => {
        try { await terminateLease(lease.id); fetchData(); } catch (err) {
          Alert.alert('Error', err.response?.data?.error || 'Failed');
        }
      }},
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.propBadge}>
          <Ionicons name="home-outline" size={18} color={Colors.brand} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.propName}>{item.unit?.property?.name || 'Property'}</Text>
          <Text style={styles.unitLabel}>Unit {item.unit?.unitNumber || '—'}</Text>
        </View>
        <StatusBadge status={item.status} />
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={14} color={Colors.light.textSecondary} />
          <Text style={styles.detailText}>{fmt(item.startDate)} → {fmt(item.endDate)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={14} color={Colors.light.textSecondary} />
          <Text style={[styles.detailText, { fontWeight: '700', color: Colors.brand }]}>
            UGX {Number(item.monthlyRent).toLocaleString()}/mo
          </Text>
        </View>
      </View>

      {item.status === 'active' && (
        <TouchableOpacity style={styles.terminateBtn} onPress={() => handleTerminate(item)}>
          <Ionicons name="close-circle-outline" size={16} color="#ef4444" />
          <Text style={styles.terminateText}>Terminate</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <ScreenHeader
        icon="document-text-outline"
        title="Leases"
        subtitle={`${leases.length} lease${leases.length !== 1 ? 's' : ''}`}
      />
      <FlatList
        data={leases}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} />}
        ListEmptyComponent={
          <EmptyState icon="document-text-outline" title="No leases" message="Leases will appear once tenants are approved" />
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  propBadge: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: Colors.brandSoft, alignItems: 'center', justifyContent: 'center',
  },
  propName: { fontSize: 15, fontWeight: '700', color: Colors.light.text },
  unitLabel: { fontSize: 13, color: Colors.light.textSecondary, marginTop: 1 },
  details: { gap: 6, marginBottom: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 13, color: Colors.light.textSecondary },
  terminateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#fecaca', backgroundColor: '#fef2f2',
  },
  terminateText: { fontSize: 14, fontWeight: '600', color: '#ef4444' },
});
