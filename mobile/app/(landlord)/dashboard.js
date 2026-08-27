import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getProperties } from '../../api/properties';
import { getSummary } from '../../api/reports';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [sumData, propData] = await Promise.all([
        getSummary().catch(() => null),
        getProperties().catch(() => []),
      ]);
      setSummary(sumData);
      setProperties(propData);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) return <LoadingSpinner />;

  const stats = [
    { label: 'Properties', value: summary?.totalProperties ?? properties.length, icon: 'business-outline', color: Colors.brand },
    { label: 'Units', value: summary?.totalUnits ?? '—', icon: 'cube-outline', color: '#7c3aed' },
    { label: 'Occupied', value: summary?.occupiedUnits ?? '—', icon: 'checkmark-circle-outline', color: '#10b981' },
    { label: 'Vacant', value: summary?.vacantUnits ?? '—', icon: 'alert-circle-outline', color: '#f59e0b' },
    { label: 'Revenue', value: summary ? `UGX ${Number(summary.totalRentCollected).toLocaleString()}` : '—', icon: 'cash-outline', color: '#10b981' },
    { label: 'Expenses', value: summary ? `UGX ${Number(summary.totalExpenses).toLocaleString()}` : '—', icon: 'receipt-outline', color: '#ef4444' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} />}
    >
      <ScreenHeader
        icon="grid-outline"
        title="Dashboard"
        subtitle={`Welcome, ${user?.name || 'Landlord'}`}
        right={
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        }
      />

      <View style={styles.statsGrid}>
        {stats.map((s, i) => (
          <View key={i} style={[styles.statCard, i % 3 !== 2 && { marginRight: 0 }]}>
            <View style={[styles.statIcon, { backgroundColor: s.color + '15' }]}>
              <Ionicons name={s.icon} size={20} color={s.color} />
            </View>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {summary && (
        <View style={styles.profitCard}>
          <Text style={styles.profitLabel}>Net Profit</Text>
          <Text style={[styles.profitValue, { color: summary.netProfit >= 0 ? '#10b981' : '#ef4444' }]}>
            {summary.netProfit >= 0 ? '+' : ''}UGX {Number(summary.netProfit).toLocaleString()}
          </Text>
          <Text style={styles.profitSub}>Occupancy Rate: {summary.occupancyRate}</Text>
        </View>
      )}

      {properties.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Properties</Text>
          {properties.slice(0, 3).map((p) => (
            <View key={p.id} style={styles.propRow}>
              <View style={styles.propIcon}>
                <Ionicons name="business-outline" size={18} color={Colors.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.propName}>{p.name}</Text>
                <Text style={styles.propAddr}>{p.address}, {p.city}</Text>
              </View>
              <View style={styles.propUnitsBadge}>
                <Text style={styles.propUnitsText}>{p.units?.length || 0} units</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { paddingBottom: 32 },
  logoutBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    paddingHorizontal: 20, marginTop: 8,
  },
  statCard: {
    width: '31%', backgroundColor: Colors.light.surface,
    borderRadius: 14, padding: 14, alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: Colors.light.border,
  },
  statIcon: {
    width: 34, height: 34, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  statValue: { fontSize: 18, fontWeight: '800', color: Colors.light.text },
  statLabel: { fontSize: 10, fontWeight: '600', color: Colors.light.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  profitCard: {
    marginHorizontal: 20, marginTop: 14,
    backgroundColor: Colors.light.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.light.border, padding: 18,
    alignItems: 'center',
  },
  profitLabel: { fontSize: 13, fontWeight: '600', color: Colors.light.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  profitValue: { fontSize: 28, fontWeight: '900', marginTop: 4 },
  profitSub: { fontSize: 13, color: Colors.light.textSecondary, marginTop: 4 },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.light.text, marginBottom: 12 },
  propRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.light.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.light.border,
    padding: 14, marginBottom: 8,
  },
  propIcon: {
    width: 36, height: 36, borderRadius: 9,
    backgroundColor: Colors.brandSoft, alignItems: 'center', justifyContent: 'center',
  },
  propName: { fontSize: 14, fontWeight: '700', color: Colors.light.text },
  propAddr: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 1 },
  propUnitsBadge: {
    backgroundColor: Colors.light.background, paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 8,
  },
  propUnitsText: { fontSize: 12, fontWeight: '600', color: Colors.light.textSecondary },
});
