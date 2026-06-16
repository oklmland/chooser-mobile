import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';

type Props = {
  message: string;
};

export function LoserMessage({ message }: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(60);
  const rotation = useSharedValue(-6);
  const scale = useSharedValue(0.7);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 250 });
    translateY.value = withSpring(0, { damping: 14, stiffness: 180 });
    scale.value = withSpring(1, { damping: 10, stiffness: 200 });
    // Wobble rotation entry
    rotation.value = withSequence(
      withTiming(-6, { duration: 0 }),
      withSpring(4, { damping: 8, stiffness: 220 }),
      withDelay(80, withSpring(-2, { damping: 10, stiffness: 200 })),
      withDelay(60, withSpring(0, { damping: 14, stiffness: 180 }))
    );
  }, [opacity, translateY, scale, rotation]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.container, style]} pointerEvents="none">
      <ThemedText type="title" style={styles.loserLabel}>
        PERDU !
      </ThemedText>
      <ThemedText style={styles.message}>{message}</ThemedText>
      <ThemedText type="small" style={styles.hint}>
        Touchez l&apos;écran pour rejouer
      </ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '18%',
    left: 24,
    right: 24,
    alignItems: 'center',
    gap: 14,
  },
  loserLabel: {
    color: '#FF3B30',
    textAlign: 'center',
    fontSize: 56,
    fontWeight: '900',
    textShadowColor: 'rgba(255,59,48,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  message: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  hint: {
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: 28,
  },
});
