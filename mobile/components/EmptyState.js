import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export default function EmptyState({ icon = 'folder-open-outline', title, message }) {
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={52} color="#c7cbd4" />
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  title: { fontSize: 16, fontWeight: '600', color: Colors.light.textSecondary, marginTop: 12 },
  message: { fontSize: 14, color: '#9ca3af', marginTop: 6, textAlign: 'center', lineHeight: 20 },
});
