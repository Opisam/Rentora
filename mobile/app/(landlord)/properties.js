import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity,
  Alert, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getProperties, createProperty, updateProperty, deleteProperty,
  createUnit, updateUnit, deleteUnit,
} from '../../api/properties';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Colors } from '../../constants/Colors';

const EMPTY_PROP = { name: '', address: '', city: '' };
const EMPTY_UNIT = { unitNumber: '', bedrooms: '1', bathrooms: '1', rentAmount: '', status: 'vacant' };

export default function PropertiesScreen() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [propModal, setPropModal] = useState(null);
  const [propForm, setPropForm] = useState(EMPTY_PROP);
  const [propSaving, setPropSaving] = useState(false);

  const [unitModal, setUnitModal] = useState(null);
  const [unitForm, setUnitForm] = useState(EMPTY_UNIT);
  const [unitSaving, setUnitSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try { setProperties(await getProperties()); } catch {} finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  // ── Property CRUD ──
  const openAddProp = () => { setPropForm(EMPTY_PROP); setPropModal('add'); };
  const openEditProp = (p) => { setPropForm({ name: p.name, address: p.address, city: p.city }); setPropModal({ type: 'edit', id: p.id }); };

  const saveProp = async () => {
    if (!propForm.name.trim() || !propForm.address.trim() || !propForm.city.trim()) {
      Alert.alert('Error', 'All fields are required'); return;
    }
    setPropSaving(true);
    try {
      if (propModal === 'add') {
        await createProperty(propForm);
      } else {
        await updateProperty(propModal.id, propForm);
      }
      setPropModal(null); fetchData();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed');
    } finally { setPropSaving(false); }
  };

  const handleDeleteProp = (p) => {
    Alert.alert('Delete Property', `Delete "${p.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteProperty(p.id); fetchData(); } catch { Alert.alert('Error', 'Failed'); }
      }},
    ]);
  };

  // ── Unit CRUD ──
  const openAddUnit = (propertyId) => { setUnitForm(EMPTY_UNIT); setUnitModal({ type: 'add', propertyId }); };
  const openEditUnit = (u) => {
    setUnitForm({ unitNumber: u.unitNumber, bedrooms: String(u.bedrooms), bathrooms: String(u.bathrooms), rentAmount: String(u.rentAmount), status: u.status || 'vacant' });
    setUnitModal({ type: 'edit', id: u.id, propertyId: u.propertyId });
  };

  const saveUnit = async () => {
    if (!unitForm.unitNumber.trim() || !unitForm.rentAmount.trim()) {
      Alert.alert('Error', 'Unit number and rent amount are required'); return;
    }
    setUnitSaving(true);
    try {
      const payload = {
        unitNumber: unitForm.unitNumber.trim(),
        bedrooms: parseInt(unitForm.bedrooms) || 1,
        bathrooms: parseInt(unitForm.bathrooms) || 1,
        rentAmount: parseFloat(unitForm.rentAmount.replace(/,/g, '')) || 0,
        status: unitForm.status || 'vacant',
      };
      if (unitModal.type === 'add') {
        await createUnit(unitModal.propertyId, payload);
      } else {
        await updateUnit(unitModal.id, payload);
      }
      setUnitModal(null); fetchData();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed');
    } finally { setUnitSaving(false); }
  };

  const handleDeleteUnit = (u) => {
    Alert.alert('Delete Unit', `Delete unit ${u.unitNumber}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteUnit(u.id); fetchData(); } catch { Alert.alert('Error', 'Failed'); }
      }},
    ]);
  };

  const renderProperty = ({ item }) => {
    const occupied = item.units?.filter((u) => u.status === 'occupied').length || 0;
    const total = item.units?.length || 0;
    return (
      <View style={styles.propCard}>
        <View style={styles.propHeader}>
          <View style={styles.propIconWrap}>
            <Ionicons name="business-outline" size={20} color={Colors.brand} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.propName}>{item.name}</Text>
            <Text style={styles.propAddr}>{item.address}, {item.city}</Text>
          </View>
          <View style={styles.propActions}>
            <TouchableOpacity onPress={() => openEditProp(item)} style={styles.iconBtn}>
              <Ionicons name="pencil-outline" size={16} color={Colors.brand} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteProp(item)} style={[styles.iconBtn, { backgroundColor: '#fef2f2' }]}>
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.propStats}>
          <View style={styles.propStat}>
            <Text style={styles.propStatVal}>{total}</Text>
            <Text style={styles.propStatLbl}>Total</Text>
          </View>
          <View style={styles.propStat}>
            <Text style={[styles.propStatVal, { color: '#10b981' }]}>{occupied}</Text>
            <Text style={styles.propStatLbl}>Occupied</Text>
          </View>
          <View style={styles.propStat}>
            <Text style={[styles.propStatVal, { color: '#f59e0b' }]}>{total - occupied}</Text>
            <Text style={styles.propStatLbl}>Vacant</Text>
          </View>
        </View>

        <View style={styles.unitsHeader}>
          <Text style={styles.unitsTitle}>Units</Text>
          <TouchableOpacity onPress={() => openAddUnit(item.id)} style={styles.addUnitBtn}>
            <Ionicons name="add" size={16} color={Colors.brand} />
            <Text style={styles.addUnitText}>Add Unit</Text>
          </TouchableOpacity>
        </View>

        {item.units?.length > 0 ? item.units.map((u) => (
          <View key={u.id} style={styles.unitRow}>
            <View style={styles.unitInfo}>
              <Text style={styles.unitNum}>Unit {u.unitNumber}</Text>
              <Text style={styles.unitDetails}>{u.bedrooms}bd {u.bathrooms}ba · UGX {Number(u.rentAmount).toLocaleString()}/mo</Text>
            </View>
            <View style={[styles.unitStatus, { backgroundColor: u.status === 'occupied' ? Colors.warningSoft : Colors.successSoft }]}>
              <Text style={[styles.unitStatusText, { color: u.status === 'occupied' ? '#92400e' : '#065f46' }]}>
                {u.status === 'occupied' ? 'Occupied' : 'Vacant'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => openEditUnit(u)} style={styles.unitEditBtn}>
              <Ionicons name="pencil-outline" size={14} color={Colors.light.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteUnit(u)} style={styles.unitDelBtn}>
              <Ionicons name="trash-outline" size={14} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )) : (
          <Text style={styles.noUnits}>No units yet</Text>
        )}
      </View>
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <ScreenHeader
        icon="business-outline"
        title="Properties"
        subtitle={`${properties.length} properties`}
        right={
          <TouchableOpacity style={styles.addBtn} onPress={openAddProp}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={properties}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderProperty}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} />}
        ListEmptyComponent={
          <EmptyState icon="business-outline" title="No properties" message="Tap + to add your first property" />
        }
      />

      {/* ── Add/Edit Property Modal ── */}
      <Modal visible={!!propModal} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modal}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>{propModal === 'add' ? 'Add Property' : 'Edit Property'}</Text>
            {['name', 'address', 'city'].map((field) => (
              <View key={field}>
                <Text style={styles.label}>{field.charAt(0).toUpperCase() + field.slice(1)}</Text>
                <TextInput
                  style={styles.input}
                  value={propForm[field]}
                  onChangeText={(v) => setPropForm({ ...propForm, [field]: v })}
                  placeholder={field === 'city' ? 'e.g. Springfield' : field === 'name' ? 'e.g. Sunset Apartments' : 'e.g. 123 Main St'}
                  placeholderTextColor="#9ca3af"
                />
              </View>
            ))}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setPropModal(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, propSaving && { opacity: 0.6 }]} onPress={saveProp} disabled={propSaving}>
                <Text style={styles.saveText}>{propSaving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Add/Edit Unit Modal ── */}
      <Modal visible={!!unitModal} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modal}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>{unitModal?.type === 'add' ? 'Add Unit' : 'Edit Unit'}</Text>
            <Text style={styles.label}>Unit Number</Text>
            <TextInput style={styles.input} value={unitForm.unitNumber} onChangeText={(v) => setUnitForm({ ...unitForm, unitNumber: v })} placeholder="e.g. 3A" placeholderTextColor="#9ca3af" />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Bedrooms</Text>
                <TextInput style={styles.input} value={unitForm.bedrooms} onChangeText={(v) => setUnitForm({ ...unitForm, bedrooms: v })} keyboardType="numeric" placeholderTextColor="#9ca3af" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Bathrooms</Text>
                <TextInput style={styles.input} value={unitForm.bathrooms} onChangeText={(v) => setUnitForm({ ...unitForm, bathrooms: v })} keyboardType="numeric" placeholderTextColor="#9ca3af" />
              </View>
            </View>
            <Text style={styles.label}>Monthly Rent (UGX)</Text>
            <TextInput style={styles.input} value={unitForm.rentAmount} onChangeText={(v) => setUnitForm({ ...unitForm, rentAmount: v })} keyboardType="decimal-pad" placeholder="e.g. 1200" placeholderTextColor="#9ca3af" />
            <Text style={styles.label}>Status</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {['vacant', 'occupied'].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusBtn, unitForm.status === s && styles.statusBtnActive]}
                  onPress={() => setUnitForm({ ...unitForm, status: s })}
                >
                  <Ionicons name={unitForm.status === s ? 'radio-button-on' : 'radio-button-off'} size={16} color={unitForm.status === s ? Colors.brand : Colors.light.textSecondary} />
                  <Text style={[styles.statusBtnText, unitForm.status === s && styles.statusBtnTextActive]}>{s.charAt(0).toUpperCase() + s.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setUnitModal(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, unitSaving && { opacity: 0.6 }]} onPress={saveUnit} disabled={unitSaving}>
                <Text style={styles.saveText}>{unitSaving ? 'Saving...' : 'Save'}</Text>
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
  addBtn: { backgroundColor: Colors.brand, width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 20, paddingBottom: 32 },
  propCard: {
    backgroundColor: Colors.light.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.light.border, padding: 16, marginBottom: 14,
  },
  propHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  propIconWrap: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: Colors.brandSoft, alignItems: 'center', justifyContent: 'center',
  },
  propName: { fontSize: 16, fontWeight: '700', color: Colors.light.text },
  propAddr: { fontSize: 13, color: Colors.light.textSecondary, marginTop: 1 },
  propActions: { flexDirection: 'row', gap: 6 },
  iconBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: Colors.brandSoft, alignItems: 'center', justifyContent: 'center',
  },
  propStats: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: Colors.light.background, borderRadius: 10, padding: 10, marginBottom: 12,
  },
  propStat: { alignItems: 'center' },
  propStatVal: { fontSize: 16, fontWeight: '800', color: Colors.light.text },
  propStatLbl: { fontSize: 10, fontWeight: '600', color: Colors.light.textSecondary, textTransform: 'uppercase' },
  unitsHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: Colors.light.border, paddingTop: 12, marginBottom: 8,
  },
  unitsTitle: { fontSize: 14, fontWeight: '700', color: Colors.light.text },
  addUnitBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addUnitText: { fontSize: 13, fontWeight: '600', color: Colors.brand },
  unitRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 8, borderTopWidth: 1, borderTopColor: Colors.light.border,
  },
  unitInfo: { flex: 1 },
  unitNum: { fontSize: 13, fontWeight: '600', color: Colors.light.text },
  unitDetails: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 1 },
  unitStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  unitStatusText: { fontSize: 11, fontWeight: '600' },
  unitEditBtn: { padding: 4 },
  unitDelBtn: { padding: 4 },
  noUnits: { fontSize: 13, color: '#9ca3af', fontStyle: 'italic', paddingVertical: 8 },

  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modal: {
    backgroundColor: Colors.light.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 36,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#d1d5db', alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.light.text, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.light.text, marginTop: 12, marginBottom: 4 },
  input: {
    backgroundColor: Colors.light.background, borderWidth: 1, borderColor: Colors.light.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.light.text,
  },
  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  statusBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 12, borderWidth: 1,
    borderColor: Colors.light.border, backgroundColor: Colors.light.background,
  },
  statusBtnActive: { borderColor: Colors.brand, backgroundColor: Colors.brandSoft },
  statusBtnText: { fontSize: 14, fontWeight: '600', color: Colors.light.textSecondary },
  statusBtnTextActive: { color: Colors.brand },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.light.border, alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600', color: Colors.light.textSecondary },
  saveBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.brand, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
