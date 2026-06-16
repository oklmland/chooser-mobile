import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  message: string;
};

export function LoserMessage({ message }: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(40);
  const scale = useSharedValue(0.85);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 });
    translateY.value = withSpring(0, { damping: 16, stiffness: 180 });
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  }, [opacity, translateY, scale]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.container, style]} pointerEvents="none">
      <Text style={styles.loserLabel}>PERDU !</Text>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.hint}>Touchez pour rejouer</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    left: 24,
    right: 24,
    alignItems: 'center',
    gap: 12,
  },
  loserLabel: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 52,
    fontWeight: '900',
  },
  message: {
    fontSize: 22,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  hint: {
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 16,
  },
});
