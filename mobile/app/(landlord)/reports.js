import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPropertyReports, getSummary } from '../../api/reports';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Colors } from '../../constants/Colors';

export default function ReportsScreen() {
  const [summary, setSummary] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [s, r] = await Promise.all([
        getSummary().catch(() => null),
        getPropertyReports().catch(() => []),
      ]);
      setSummary(s);
      setReports(r);
    } catch {} finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) return <LoadingSpinner />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} />}
    >
      <ScreenHeader icon="bar-chart-outline" title="Reports" subtitle="Portfolio profitability" />

      {summary ? (
        <>
          <View style={styles.summaryGrid}>
            {[
              { label: 'Properties', value: summary.totalProperties, icon: 'business-outline', color: Colors.brand },
              { label: 'Total Units', value: summary.totalUnits, icon: 'cube-outline', color: '#7c3aed' },
              { label: 'Occupancy', value: summary.occupancyRate, icon: 'pie-chart-outline', color: '#10b981' },
              { label: 'Revenue', value: `UGX ${Number(summary.totalRentCollected).toLocaleString()}`, icon: 'cash-outline', color: '#10b981' },
              { label: 'Expenses', value: `UGX ${Number(summary.totalExpenses).toLocaleString()}`, icon: 'receipt-outline', color: '#ef4444' },
            ].map((s, i) => (
              <View key={i} style={styles.summaryCard}>
                <Ionicons name={s.icon} size={18} color={s.color} />
                <Text style={styles.summaryVal}>{s.value}</Text>
                <Text style={styles.summaryLbl}>{s.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.profitCard}>
            <Text style={styles.profitLabel}>Net Profit</Text>
            <Text style={[styles.profitValue, { color: summary.netProfit >= 0 ? '#10b981' : '#ef4444' }]}>
              {summary.netProfit >= 0 ? '+' : ''}UGX {Number(summary.netProfit).toLocaleString()}
            </Text>
          </View>
        </>
      ) : (
        <EmptyState icon="bar-chart-outline" title="No data" message="Add properties and payments to see reports" />
      )}

      {reports.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Per Property</Text>
          {reports.map((r) => (
            <View key={r.propertyId} style={styles.propCard}>
              <Text style={styles.propName}>{r.propertyName}</Text>
              <View style={styles.propStats}>
                <View style={styles.propStat}>
                  <Text style={styles.propStatVal}>{r.occupiedUnits}/{r.totalUnits}</Text>
                  <Text style={styles.propStatLbl}>Occupied</Text>
                </View>
                <View style={styles.propStat}>
                  <Text style={styles.propStatVal}>{r.occupancyRate}</Text>
                  <Text style={styles.propStatLbl}>Rate</Text>
                </View>
                <View style={styles.propStat}>
                  <Text style={[styles.propStatVal, { color: '#10b981' }]}>UGX {Number(r.totalRentCollected).toLocaleString()}</Text>
                  <Text style={styles.propStatLbl}>Revenue</Text>
                </View>
                <View style={styles.propStat}>
                  <Text style={[styles.propStatVal, { color: r.netProfit >= 0 ? '#10b981' : '#ef4444' }]}>
                    UGX {Number(r.netProfit).toLocaleString()}
                  </Text>
                  <Text style={styles.propStatLbl}>Net Profit</Text>
                </View>
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
  summaryGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, marginTop: 8,
  },
  summaryCard: {
    width: '31%', backgroundColor: Colors.light.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.light.border, padding: 14, alignItems: 'center', gap: 4,
  },
  summaryVal: { fontSize: 15, fontWeight: '800', color: Colors.light.text },
  summaryLbl: { fontSize: 10, fontWeight: '600', color: Colors.light.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  profitCard: {
    marginHorizontal: 20, marginTop: 14, backgroundColor: Colors.light.surface,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.light.border, padding: 18, alignItems: 'center',
  },
  profitLabel: { fontSize: 13, fontWeight: '600', color: Colors.light.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  profitValue: { fontSize: 28, fontWeight: '900', marginTop: 4 },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.light.text, marginBottom: 12 },
  propCard: {
    backgroundColor: Colors.light.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.light.border, padding: 16, marginBottom: 10,
  },
  propName: { fontSize: 15, fontWeight: '700', color: Colors.light.text, marginBottom: 10 },
  propStats: { flexDirection: 'row', justifyContent: 'space-between' },
  propStat: { alignItems: 'center' },
  propStatVal: { fontSize: 14, fontWeight: '800', color: Colors.light.text },
  propStatLbl: { fontSize: 10, fontWeight: '600', color: Colors.light.textSecondary, textTransform: 'uppercase', marginTop: 2 },
});
