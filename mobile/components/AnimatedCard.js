import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay,
  Easing,
} from 'react-native-reanimated';

export default function AnimatedCard({ children, index = 0, delay = 80, style }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    opacity.value = withDelay(
      index * delay,
      withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) }),
    );
    translateY.value = withDelay(
      index * delay,
      withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) }),
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const animated = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.card, animated, style]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {},
});
