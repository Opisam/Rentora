import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getLandlordRentPayments, generateRent, markRentPaid } from '../../api/rent';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Colors } from '../../constants/Colors';

function StatusBadge({ status }) {
  const map = {
    pending: { bg: Colors.warningSoft, fg: '#92400e', label: 'Pending' },
    paid: { bg: Colors.successSoft, fg: '#065f46', label: 'Paid' },
    late: { bg: Colors.dangerSoft, fg: '#991b1b', label: 'Late' },
  };
  const s = map[status] || map.pending;
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

export default function RentDashboardScreen() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchData = useCallback(async () => {
    try { setPayments(await getLandlordRentPayments()); } catch {} finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleGenerate = async () => {
    Alert.alert('Generate Rent Records', 'Generate monthly rent records for all active leases?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Generate', onPress: async () => {
        setGenerating(true);
        try {
          const res = await generateRent();
          Alert.alert('Done', res.message || 'Records generated');
          fetchData();
        } catch (err) {
          Alert.alert('Error', err.response?.data?.error || 'Failed');
        } finally { setGenerating(false); }
      }},
    ]);
  };

  const handleMarkPaid = (payment) => {
    Alert.alert('Mark as Paid', `Mark rent for ${fmt(payment.dueDate)} as paid?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark Paid', onPress: async () => {
        try { await markRentPaid(payment.id); fetchData(); } catch (err) {
          Alert.alert('Error', err.response?.data?.error || 'Failed');
        }
      }},
    ]);
  };

  const pendingCount = payments.filter((p) => p.status === 'pending' || p.status === 'late').length;
  const totalCollected = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + Number(p.amountPaid || 0), 0);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardTitle}>{item.lease?.unit?.property?.name || 'Property'}</Text>
          <Text style={styles.cardSub}>Unit {item.lease?.unit?.unitNumber || '—'} · Due {fmt(item.dueDate)}</Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.amount}>UGX {Number(item.amountDue).toLocaleString()}</Text>
          <StatusBadge status={item.status} />
        </View>
      </View>
      {item.status === 'paid' && item.paidDate && (
        <Text style={styles.paidInfo}>Paid on {fmt(item.paidDate)}</Text>
      )}
      {(item.status === 'pending' || item.status === 'late') && (
        <TouchableOpacity style={styles.payBtn} onPress={() => handleMarkPaid(item)}>
          <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
          <Text style={styles.payBtnText}>Mark as Paid</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <ScreenHeader
        icon="cash-outline"
        title="Rent Dashboard"
        subtitle={`${payments.length} payment${payments.length !== 1 ? 's' : ''}`}
        right={
          <TouchableOpacity
            style={[styles.genBtn, generating && { opacity: 0.6 }]}
            onPress={handleGenerate}
            disabled={generating}
          >
            <Ionicons name="refresh-outline" size={18} color="#fff" />
          </TouchableOpacity>
        }
      />

      {payments.length > 0 && (
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Ionicons name="cash-outline" size={18} color="#10b981" />
            <Text style={styles.summaryVal}>UGX {totalCollected.toLocaleString()}</Text>
            <Text style={styles.summaryLbl}>Collected</Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="time-outline" size={18} color="#f59e0b" />
            <Text style={styles.summaryVal}>{pendingCount}</Text>
            <Text style={styles.summaryLbl}>Pending</Text>
          </View>
        </View>
      )}

      <FlatList
        data={payments}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} />}
        ListEmptyComponent={
          <EmptyState icon="cash-outline" title="No rent records" message="Tap refresh to generate rent records" />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  genBtn: {
    backgroundColor: Colors.brand, width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  summaryRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 4 },
  summaryCard: {
    flex: 1, backgroundColor: Colors.light.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.light.border, padding: 14, alignItems: 'center', gap: 4,
  },
  summaryVal: { fontSize: 18, fontWeight: '800', color: Colors.light.text },
  summaryLbl: { fontSize: 11, fontWeight: '600', color: Colors.light.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  list: { padding: 20, paddingBottom: 32 },
  card: {
    backgroundColor: Colors.light.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.light.border, padding: 16, marginBottom: 10,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.light.text },
  cardSub: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  amount: { fontSize: 16, fontWeight: '800', color: Colors.light.text },
  paidInfo: { fontSize: 12, color: '#10b981', marginTop: 8 },
  payBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10, backgroundColor: '#10b981', marginTop: 10,
  },
  payBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
