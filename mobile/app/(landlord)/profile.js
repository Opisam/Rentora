import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import ScreenHeader from '../../components/ScreenHeader';
import { Colors } from '../../constants/Colors';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const initials = (user?.name || 'U')[0].toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader icon="person-outline" title="Profile" />

      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{user?.name || 'User'}</Text>
        <Text style={styles.email}>{user?.email || ''}</Text>
        <View style={styles.roleBadge}>
          <Ionicons name="business-outline" size={12} color={Colors.brand} />
          <Text style={styles.roleText}>Landlord</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        {[
          { icon: 'person-outline', label: 'Name', value: user?.name },
          { icon: 'mail-outline', label: 'Email', value: user?.email },
          { icon: 'shield-outline', label: 'Role', value: 'Landlord' },
        ].map((item, i) => (
          <View key={i} style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name={item.icon} size={18} color={Colors.light.textSecondary} />
              <Text style={styles.rowLabel}>{item.label}</Text>
            </View>
            <Text style={styles.rowValue}>{item.value || '—'}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { paddingBottom: 32 },
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.brand,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '800' },
  name: { fontSize: 20, fontWeight: '800', color: Colors.light.text },
  email: { fontSize: 14, color: Colors.light.textSecondary, marginTop: 4 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.brandSoft, paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 12, marginTop: 10,
  },
  roleText: { fontSize: 12, fontWeight: '700', color: Colors.brand },
  section: { paddingHorizontal: 20, marginTop: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.light.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.light.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.light.border, padding: 14, marginBottom: 8,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowLabel: { fontSize: 14, fontWeight: '600', color: Colors.light.text },
  rowValue: { fontSize: 14, color: Colors.light.textSecondary },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 20, marginTop: 24, paddingVertical: 14,
    borderRadius: 12, borderWidth: 1, borderColor: '#fecaca', backgroundColor: '#fef2f2',
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#ef4444' },
});
