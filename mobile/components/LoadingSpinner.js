import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

export default function LoadingSpinner({ size = 'large' }) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size={size} color={Colors.brand} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
});
