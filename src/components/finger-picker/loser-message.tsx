import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';

type Props = {
  message: string;
};

export function LoserMessage({ message }: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 350 });
    translateY.value = withTiming(0, { duration: 350 });
  }, [opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
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
    top: '20%',
    left: 24,
    right: 24,
    alignItems: 'center',
    gap: 12,
  },
  loserLabel: {
    color: '#FF3B30',
    textAlign: 'center',
  },
  message: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  hint: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 24,
  },
});
