import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getNotifications } from '../api/notifications';


export default function NotificationBadge({ visible }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!visible) return;
    let mounted = true;
    getNotifications()
      .then((n) => { if (mounted) setCount(n.filter((x) => !x.read).length); })
      .catch(() => {});
    return () => { mounted = false; };
  }, [visible]);

  if (!visible || count === 0) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute', top: 2, right: -4,
    backgroundColor: '#ef4444', borderRadius: 10,
    minWidth: 18, height: 18, paddingHorizontal: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  text: { color: '#fff', fontSize: 10, fontWeight: '800' },
});
