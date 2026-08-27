import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMyRentPayments } from '../../api/rent';
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
    <View style={[badgeStyles.badge, { backgroundColor: s.bg }]}>
      <Text style={[badgeStyles.text, { color: s.fg }]}>{s.label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  text: { fontSize: 12, fontWeight: '700' },
});

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function RentHistoryScreen() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const data = await getMyRentPayments();
      setPayments(data);
    } catch {
      // silently fail — empty state will show
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amountPaid || 0), 0);

  const totalDue = payments
    .filter((p) => p.status !== 'paid')
    .reduce((sum, p) => sum + Number(p.amountDue || 0), 0);

  const renderPayment = ({ item }) => (
    <View style={styles.paymentCard}>
      <View style={styles.paymentLeft}>
        <View style={[styles.statusDot, {
          backgroundColor: item.status === 'paid' ? '#10b981' : item.status === 'late' ? '#ef4444' : '#f59e0b',
        }]} />
        <View>
          <Text style={styles.paymentTitle}>
            {item.lease?.unit?.property?.name || 'Rent Payment'}
          </Text>
          <Text style={styles.paymentSubtitle}>
            Unit {item.lease?.unit?.unitNumber || '—'}  ·  Due {formatDate(item.dueDate)}
          </Text>
          {item.status === 'paid' && item.paidDate && (
            <Text style={styles.paidDate}>Paid {formatDate(item.paidDate)}</Text>
          )}
        </View>
      </View>
      <View style={styles.paymentRight}>
        <Text style={[styles.amount, item.status === 'paid' && styles.amountPaid]}>
          UGX {Number(item.amountDue).toLocaleString()}
        </Text>
        <StatusBadge status={item.status} />
      </View>
    </View>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <ScreenHeader icon="cash-outline" title="Rent History" subtitle="Your payment records" />

      {payments.length > 0 && (
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#10b981" />
            <Text style={styles.summaryValue}>UGX {totalPaid.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Total Paid</Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="time-outline" size={18} color="#f59e0b" />
            <Text style={styles.summaryValue}>UGX {totalDue.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Outstanding</Text>
          </View>
        </View>
      )}

      <FlatList
        data={payments}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderPayment}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} />}
        ListEmptyComponent={
          <EmptyState
            icon="cash-outline"
            title="No payment history"
            message="Your rent payment records will appear here"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  summaryRow: {
    flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 4,
  },
  summaryCard: {
    flex: 1, backgroundColor: Colors.light.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.light.border, padding: 14,
    alignItems: 'center', gap: 4,
  },
  summaryValue: { fontSize: 18, fontWeight: '800', color: Colors.light.text },
  summaryLabel: { fontSize: 11, fontWeight: '600', color: Colors.light.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  list: { padding: 20, paddingBottom: 32 },
  paymentCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.light.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.light.border,
    padding: 16, marginBottom: 10,
  },
  paymentLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  paymentTitle: { fontSize: 14, fontWeight: '700', color: Colors.light.text },
  paymentSubtitle: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 },
  paidDate: { fontSize: 11, color: '#10b981', fontWeight: '500', marginTop: 2 },
  paymentRight: { alignItems: 'flex-end', gap: 6 },
  amount: { fontSize: 16, fontWeight: '800', color: Colors.light.text },
  amountPaid: { color: '#10b981' },
});
