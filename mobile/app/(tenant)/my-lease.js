import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { getMyLeases } from '../../api/leases';
import { getDocuments, uploadDocument } from '../../api/documents';
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
    <View style={[badgeStyles.badge, { backgroundColor: s.bg }]}>
      <Text style={[badgeStyles.text, { color: s.fg }]}>{s.label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  text: { fontSize: 12, fontWeight: '700' },
});

export default function MyLeaseScreen() {
  const [leases, setLeases] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const leaseData = await getMyLeases();
      setLeases(leaseData);
      if (leaseData.length > 0) {
        const docs = await getDocuments(leaseData[0].id);
        setDocuments(docs);
      }
    } catch {
      Alert.alert('Error', 'Could not load lease data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !leases.length) return;

      setUploading(true);
      const formData = new FormData();
      formData.append('file', {
        uri: result.assets[0].uri,
        name: result.assets[0].name,
        type: result.assets[0].mimeType || 'application/octet-stream',
      });

      await uploadDocument(leases[0].id, formData);
      Alert.alert('Uploaded', 'Document uploaded successfully');
      const docs = await getDocuments(leases[0].id);
      setDocuments(docs);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const activeLease = leases.find((l) => l.status === 'active') || leases[0];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} />}
    >
      <ScreenHeader icon="document-text-outline" title="My Lease" subtitle="Your lease details" />

      {!activeLease ? (
        <EmptyState
          icon="document-text-outline"
          title="No active lease"
          message="Apply to a unit and get approved to start a lease"
        />
      ) : (
        <>
          <View style={styles.leaseCard}>
            <View style={styles.leaseHeader}>
              <View style={styles.propertyBadge}>
                <Ionicons name="business-outline" size={22} color={Colors.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.propertyName}>{activeLease.unit?.property?.name || 'Property'}</Text>
                <Text style={styles.propertyAddress}>
                  {activeLease.unit?.property?.address}{activeLease.unit?.property?.city ? `, ${activeLease.unit.property.city}` : ''}
                </Text>
              </View>
              <StatusBadge status={activeLease.status} />
            </View>

            <View style={styles.divider} />

            <View style={styles.unitRow}>
              <Ionicons name="home-outline" size={16} color={Colors.light.textSecondary} />
              <Text style={styles.unitText}>
                Unit {activeLease.unit?.unitNumber}  ·  {activeLease.unit?.bedrooms} bed  ·  {activeLease.unit?.bathrooms} bath
              </Text>
            </View>
          </View>

          <View style={styles.detailsCard}>
            <Text style={styles.cardSectionTitle}>Lease Terms</Text>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color={Colors.light.textSecondary} />
              <Text style={styles.detailLabel}>Start Date</Text>
              <Text style={styles.detailValue}>{activeLease.startDate}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color={Colors.light.textSecondary} />
              <Text style={styles.detailLabel}>End Date</Text>
              <Text style={styles.detailValue}>{activeLease.endDate}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="cash-outline" size={16} color={Colors.light.textSecondary} />
              <Text style={styles.detailLabel}>Monthly Rent</Text>
              <Text style={[styles.detailValue, { fontWeight: '800', color: Colors.brand }]}>
                UGX {Number(activeLease.monthlyRent).toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.detailsCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.cardSectionTitle}>Documents</Text>
              <TouchableOpacity onPress={handleUpload} disabled={uploading}>
                <Ionicons name="cloud-upload-outline" size={22} color={Colors.brand} />
              </TouchableOpacity>
            </View>
            {documents.length === 0 ? (
              <Text style={styles.noDocs}>No documents uploaded yet</Text>
            ) : (
              documents.map((doc) => {
                const name = doc.filename || doc.name || `Document #${doc.id}`;
                const ext = name.split('.').pop()?.toLowerCase();
                const icon = ext === 'pdf' ? 'document-text-outline'
                  : ['jpg','jpeg','png','gif'].includes(ext) ? 'image-outline'
                  : 'document-attachment-outline';
                return (
                  <View key={doc.id} style={styles.docRow}>
                    <Ionicons name={icon} size={18} color={Colors.brand} />
                    <Text style={styles.docName} numberOfLines={1}>{name}</Text>
                    {doc.url && (
                      <TouchableOpacity onPress={() => {}}>
                        <Ionicons name="open-outline" size={16} color={Colors.brand} />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { paddingBottom: 32 },
  leaseCard: {
    backgroundColor: Colors.light.surface, marginHorizontal: 20, marginTop: 8,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.light.border, padding: 18,
  },
  leaseHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  propertyBadge: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.brandSoft, alignItems: 'center', justifyContent: 'center',
  },
  propertyName: { fontSize: 17, fontWeight: '700', color: Colors.light.text },
  propertyAddress: { fontSize: 13, color: Colors.light.textSecondary, marginTop: 1 },
  divider: { height: 1, backgroundColor: Colors.light.border, marginVertical: 14 },
  unitRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  unitText: { fontSize: 14, color: Colors.light.textSecondary },
  detailsCard: {
    backgroundColor: Colors.light.surface, marginHorizontal: 20, marginTop: 14,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.light.border, padding: 18,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  cardSectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.light.text, marginBottom: 12 },
  detailRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.light.border,
  },
  detailLabel: { flex: 1, fontSize: 14, color: Colors.light.textSecondary },
  detailValue: { fontSize: 14, fontWeight: '600', color: Colors.light.text },
  noDocs: { fontSize: 14, color: '#9ca3af', fontStyle: 'italic' },
  docRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.light.border,
  },
  docName: { flex: 1, fontSize: 14, color: Colors.light.text, fontWeight: '500' },
});
