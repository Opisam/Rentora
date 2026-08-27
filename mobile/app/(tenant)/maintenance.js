import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity,
  Alert, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMyMaintenanceRequests, createMaintenanceRequest } from '../../api/maintenance';
import { getMyLeases } from '../../api/leases';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Colors } from '../../constants/Colors';

function StatusBadge({ status }) {
  const map = {
    open: { bg: Colors.infoSoft, fg: '#1e40af', label: 'Open' },
    in_progress: { bg: Colors.brandSoft, fg: Colors.brandDarker, label: 'In Progress' },
    resolved: { bg: Colors.successSoft, fg: '#065f46', label: 'Resolved' },
  };
  const s = map[status] || map.open;
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

function PriorityDot({ priority }) {
  const color = priority === 'high' ? '#ef4444' : priority === 'medium' ? '#f59e0b' : '#6b7280';
  return (
    <View style={[priorityStyles.dot, { backgroundColor: color }]} />
  );
}

const priorityStyles = StyleSheet.create({
  dot: { width: 6, height: 6, borderRadius: 3 },
});

const PRIORITIES = ['low', 'medium', 'high'];

export default function MaintenanceScreen() {
  const [requests, setRequests] = useState([]);
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');

  const fetchData = useCallback(async () => {
    try {
      const [reqData, leaseData] = await Promise.all([
        getMyMaintenanceRequests(),
        getMyLeases(),
      ]);
      setRequests(reqData);
      setLeases(leaseData);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const activeLease = leases.find((l) => l.status === 'active');

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!activeLease) {
      Alert.alert('Error', 'You need an active lease to submit a request');
      return;
    }
    setSubmitting(true);
    try {
      await createMaintenanceRequest({
        unitId: activeLease.unitId,
        title: title.trim(),
        description: description.trim(),
        priority,
      });
      Alert.alert('Submitted', 'Your maintenance request has been sent');
      setModalVisible(false);
      setTitle('');
      setDescription('');
      setPriority('medium');
      fetchData();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = () => {
    if (!activeLease) {
      Alert.alert('No Active Lease', 'You need an active lease to submit a maintenance request');
      return;
    }
    setModalVisible(true);
  };

  const renderRequest = ({ item }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.requestLeft}>
          <PriorityDot priority={item.priority} />
          <Text style={styles.requestTitle}>{item.title}</Text>
        </View>
        <StatusBadge status={item.status} />
      </View>
      {item.description ? (
        <Text style={styles.requestDesc} numberOfLines={2}>{item.description}</Text>
      ) : null}
      <View style={styles.requestMeta}>
        <Ionicons name="home-outline" size={13} color={Colors.light.textSecondary} />
        <Text style={styles.requestMetaText}>
          {item.unit?.property?.name || 'Property'} · Unit {item.unit?.unitNumber || '—'}
        </Text>
        <Text style={styles.requestMetaText}>· {item.priority} priority</Text>
      </View>
    </View>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <ScreenHeader
        icon="construct-outline"
        title="Maintenance"
        subtitle={`${requests.length} request${requests.length !== 1 ? 's' : ''}`}
        right={
          <TouchableOpacity style={styles.addBtn} onPress={openModal}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={requests}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderRequest}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} />}
        ListEmptyComponent={
          <EmptyState
            icon="construct-outline"
            title="No maintenance requests"
            message="Tap the + button to submit a request"
          />
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>New Maintenance Request</Text>
            {activeLease && (
              <Text style={styles.modalSubtitle}>
                Unit {activeLease.unit?.unitNumber} at {activeLease.unit?.property?.name}
              </Text>
            )}

            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Leaky faucet"
              placeholderTextColor="#9ca3af"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe the issue in detail..."
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={styles.inputLabel}>Priority</Text>
            <View style={styles.priorityRow}>
              {PRIORITIES.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.priorityPill, priority === p && styles.priorityPillActive]}
                  onPress={() => setPriority(p)}
                >
                  <Text style={[styles.priorityText, priority === p && styles.priorityTextActive]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.btnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                <Text style={styles.submitBtnText}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
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
  addBtn: {
    backgroundColor: Colors.brand, width: 34, height: 34,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  list: { padding: 20, paddingBottom: 32 },
  requestCard: {
    backgroundColor: Colors.light.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.light.border,
    padding: 16, marginBottom: 10,
  },
  requestHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  requestLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  requestTitle: { fontSize: 15, fontWeight: '700', color: Colors.light.text, flex: 1 },
  requestDesc: { fontSize: 13, color: Colors.light.textSecondary, marginTop: 8, lineHeight: 18 },
  requestMeta: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: Colors.light.border,
  },
  requestMetaText: { fontSize: 12, color: Colors.light.textSecondary },

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
  inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.light.text, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: Colors.light.background, borderWidth: 1, borderColor: Colors.light.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: Colors.light.text,
  },
  textArea: {
    backgroundColor: Colors.light.background, borderWidth: 1, borderColor: Colors.light.border,
    borderRadius: 12, padding: 14, fontSize: 14, color: Colors.light.text,
    minHeight: 90,
  },
  priorityRow: { flexDirection: 'row', gap: 10 },
  priorityPill: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: Colors.light.background, borderWidth: 1, borderColor: Colors.light.border,
    alignItems: 'center',
  },
  priorityPillActive: { backgroundColor: Colors.brand, borderColor: Colors.brand },
  priorityText: { fontSize: 13, fontWeight: '600', color: Colors.light.textSecondary },
  priorityTextActive: { color: '#fff' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
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
