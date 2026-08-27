import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  Alert, RefreshControl, Modal, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getVacantUnits } from '../../api/properties';
import { applyToUnit } from '../../api/applications';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Colors } from '../../constants/Colors';

export default function BrowseScreen() {
  const [units, setUnits] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterBedrooms, setFilterBedrooms] = useState(null);
  const [applyModal, setApplyModal] = useState(null);
  const [applyMessage, setApplyMessage] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);

  const fetchUnits = useCallback(async () => {
    try {
      const data = await getVacantUnits();
      const normalized = Array.isArray(data) ? data.map((u) => ({
        ...u,
        bedrooms: Number(u.bedrooms),
        bathrooms: Number(u.bathrooms),
        rentAmount: Number(u.rentAmount),
        unitNumber: String(u.unitNumber),
      })) : [];
      setUnits(normalized);
      setFiltered(normalized);
    } catch {
      Alert.alert('Error', 'Could not load available units');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchUnits(); }, [fetchUnits]);

  useEffect(() => {
    let result = units;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.property?.name?.toLowerCase().includes(q) ||
          u.property?.city?.toLowerCase().includes(q) ||
          u.property?.address?.toLowerCase().includes(q) ||
          u.unitNumber?.toLowerCase().includes(q)
      );
    }
    if (filterBedrooms !== null) {
      result = result.filter((u) => filterBedrooms === 4 ? u.bedrooms >= 4 : u.bedrooms === filterBedrooms);
    }
    setFiltered(result);
  }, [search, filterBedrooms, units]);

  const onRefresh = () => { setRefreshing(true); fetchUnits(); };

  const handleApply = async () => {
    if (!applyModal) return;
    setApplyLoading(true);
    try {
      await applyToUnit(applyModal.id, applyMessage.trim() || null);
      Alert.alert('Applied!', 'Your application has been submitted.');
      setApplyModal(null);
      setApplyMessage('');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to apply';
      Alert.alert('Error', msg);
    } finally {
      setApplyLoading(false);
    }
  };

  const bedroomFilters = [null, 1, 2, 3, 4];

  const renderUnit = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>
          <Ionicons name="home-outline" size={20} color={Colors.brand} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.property?.name || 'Property'}</Text>
          <Text style={styles.cardAddress}>
            {item.property?.address}{item.property?.city ? `, ${item.property.city}` : ''}
          </Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailPill}>
          <Ionicons name="bed-outline" size={14} color={Colors.light.textSecondary} />
          <Text style={styles.detailText}>{item.bedrooms} {item.bedrooms === 1 ? 'bed' : 'beds'}</Text>
        </View>
        <View style={styles.detailPill}>
          <Ionicons name="water-outline" size={14} color={Colors.light.textSecondary} />
          <Text style={styles.detailText}>{item.bathrooms} {item.bathrooms === 1 ? 'bath' : 'baths'}</Text>
        </View>
        <View style={styles.detailPill}>
          <Ionicons name="home" size={14} color={Colors.light.textSecondary} />
          <Text style={styles.detailText}>Unit {item.unitNumber}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.rent}>
          UGX {item.rentAmount.toLocaleString()}<Text style={styles.rentPerMonth}>/mo</Text>
        </Text>
        <TouchableOpacity
          style={styles.applyBtn}
          onPress={() => setApplyModal(item)}
          activeOpacity={0.8}
        >
          <Text style={styles.applyBtnText}>Apply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <ScreenHeader icon="search-outline" title="Browse Units" subtitle={`${filtered.length} available`} />

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color="#9ca3af" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by city, property, or unit..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow} contentContainerStyle={styles.filtersContent}>
        {bedroomFilters.map((b) => (
          <TouchableOpacity
            key={String(b)}
            style={[styles.filterPill, filterBedrooms === b && styles.filterPillActive]}
            onPress={() => setFilterBedrooms(b)}
          >
            <Text style={[styles.filterText, filterBedrooms === b && styles.filterTextActive]}>
              {b === null ? 'All' : `${b} bed`}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderUnit}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} />}
        ListEmptyComponent={
          <EmptyState
            icon="home-outline"
            title="No units found"
            message="Try adjusting your search or filters"
          />
        }
      />

      <Modal visible={!!applyModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Apply to Unit</Text>
            {applyModal && (
              <Text style={styles.modalSubtitle}>
                Unit {applyModal.unitNumber} at {applyModal.property?.name}
              </Text>
            )}

            <Text style={styles.inputLabel}>Message (optional)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Tell the landlord why you'd be a great tenant..."
              placeholderTextColor="#9ca3af"
              value={applyMessage}
              onChangeText={setApplyMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setApplyModal(null); setApplyMessage(''); }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, applyLoading && styles.btnDisabled]}
                onPress={handleApply}
                disabled={applyLoading}
              >
                <Text style={styles.submitBtnText}>
                  {applyLoading ? 'Submitting...' : 'Submit Application'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.light.surface, marginHorizontal: 20, marginTop: 4,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.light.border,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.light.text },
  filtersRow: { marginTop: 10, maxHeight: 44 },
  filtersContent: { paddingHorizontal: 20, gap: 8 },
  filterPill: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: Colors.light.surface, borderWidth: 1, borderColor: Colors.light.border,
  },
  filterPillActive: { backgroundColor: Colors.brand, borderColor: Colors.brand },
  filterText: { fontSize: 13, fontWeight: '600', color: Colors.light.textSecondary },
  filterTextActive: { color: '#fff' },
  list: { padding: 20, paddingBottom: 32 },
  card: {
    backgroundColor: Colors.light.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.light.border,
    padding: 16, marginBottom: 14,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  cardIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: Colors.brandSoft, alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.light.text },
  cardAddress: { fontSize: 13, color: Colors.light.textSecondary, marginTop: 1 },
  cardDetails: { flexDirection: 'row', gap: 10, marginBottom: 14, flexWrap: 'wrap' },
  detailPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.light.background, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8,
  },
  detailText: { fontSize: 12, fontWeight: '500', color: Colors.light.textSecondary },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: Colors.light.border, paddingTop: 12,
  },
  rent: { fontSize: 20, fontWeight: '800', color: Colors.light.text },
  rentPerMonth: { fontSize: 13, fontWeight: '500', color: Colors.light.textSecondary },
  applyBtn: {
    backgroundColor: Colors.brand, paddingHorizontal: 22, paddingVertical: 10,
    borderRadius: 10,
  },
  applyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: {
    backgroundColor: Colors.light.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 36,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: '#d1d5db',
    alignSelf: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.light.text },
  modalSubtitle: { fontSize: 14, color: Colors.light.textSecondary, marginTop: 2, marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.light.text, marginBottom: 6 },
  textArea: {
    backgroundColor: Colors.light.background, borderWidth: 1, borderColor: Colors.light.border,
    borderRadius: 12, padding: 14, fontSize: 14, color: Colors.light.text,
    minHeight: 100, marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.light.border, alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: Colors.light.textSecondary },
  submitBtn: {
    flex: 2, paddingVertical: 14, borderRadius: 12,
    backgroundColor: Colors.brand, alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
});
