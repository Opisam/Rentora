import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Colors } from '../constants/Colors';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>404</Text>
      <Text style={styles.subtitle}>{"This screen doesn't exist."}</Text>
      <Link href="/" style={styles.link}>
        <Text style={styles.linkText}>Go to home</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.background },
  title: { fontSize: 48, fontWeight: '800', color: Colors.light.text },
  subtitle: { fontSize: 16, color: Colors.light.textSecondary, marginTop: 8 },
  link: { marginTop: 20 },
  linkText: { fontSize: 16, fontWeight: '600', color: Colors.brand },
});
