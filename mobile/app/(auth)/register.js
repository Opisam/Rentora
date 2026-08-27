import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, StatusBar, ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';

const ROLES = [
  { value: 'tenant', label: 'Tenant', icon: 'key-outline', desc: 'I\'m looking for a place to rent' },
  { value: 'landlord', label: 'Landlord', icon: 'business-outline', desc: 'I own properties to rent out' },
];

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('tenant');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password, role);
    } catch (err) {
      if (!err.response) {
        Alert.alert('Registration Failed', 'Cannot connect to server. Please check your connection and try again.');
      } else {
        Alert.alert('Registration Failed', err.response?.data?.error || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.brandRow}>
          <View style={styles.brandBadge}>
            <Ionicons name="heart" size={24} color="#fff" />
          </View>
          <Text style={styles.brandName}>Rentora</Text>
        </View>

        <Text style={styles.heading}>Create account</Text>
        <Text style={styles.sub}>Get started for free</Text>

        <Text style={styles.label}>I am a...</Text>
        <View style={styles.roleRow}>
          {ROLES.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={[styles.roleCard, role === r.value && styles.roleCardActive]}
              onPress={() => setRole(r.value)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={r.icon}
                size={28}
                color={role === r.value ? Colors.brand : '#9ca3af'}
              />
              <Text style={[styles.roleLabel, role === r.value && styles.roleLabelActive]}>
                {r.label}
              </Text>
              <Text style={styles.roleDesc}>{r.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="John Doe"
          placeholderTextColor="#9ca3af"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoComplete="name"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor="#9ca3af"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordWrap}>
          <TextInput
            style={styles.passwordInput}
            placeholder="At least 6 characters"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="new-password"
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#9ca3af"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={styles.link}>Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  inner: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28 },
  brandBadge: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.brand,
    alignItems: 'center', justifyContent: 'center',
  },
  brandName: { fontSize: 26, fontWeight: '800', color: Colors.light.text, letterSpacing: -0.5 },
  heading: { fontSize: 28, fontWeight: '800', color: Colors.light.text, letterSpacing: -0.5 },
  sub: { fontSize: 15, color: Colors.light.textSecondary, marginTop: 4, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.light.text, marginBottom: 6, marginTop: 16 },
  roleRow: { flexDirection: 'row', gap: 12 },
  roleCard: {
    flex: 1, padding: 16, borderRadius: 14,
    backgroundColor: Colors.light.surface,
    borderWidth: 2, borderColor: Colors.light.border,
    alignItems: 'center', gap: 6,
  },
  roleCardActive: { borderColor: Colors.brand, backgroundColor: Colors.brandSoft },
  roleLabel: { fontSize: 15, fontWeight: '700', color: Colors.light.textSecondary },
  roleLabelActive: { color: Colors.brand },
  roleDesc: { fontSize: 11, color: '#9ca3af', textAlign: 'center' },
  input: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1, borderColor: Colors.light.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: Colors.light.text,
  },
  passwordWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderWidth: 1, borderColor: Colors.light.border, borderRadius: 12,
  },
  passwordInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.light.text },
  eyeBtn: { paddingHorizontal: 14 },
  btn: {
    backgroundColor: Colors.brand, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 28,
    shadowColor: Colors.brand, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { fontSize: 14, color: Colors.light.textSecondary },
  link: { fontSize: 14, fontWeight: '700', color: Colors.brand },
});
