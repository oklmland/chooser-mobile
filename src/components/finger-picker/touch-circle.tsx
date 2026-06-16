import { useEffect } from 'react';
import { Platform, StyleSheet } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { LOSER_COLOR } from '@/constants/palette';

export const CIRCLE_SIZE = 90;

export type FingerPhase = 'waiting' | 'countdown' | 'result';

type Props = {
  touchId: number;
  positions: SharedValue<Record<number, { x: number; y: number }>>;
  phase: FingerPhase;
  isLoser: boolean;
  color: string;
};

export function TouchCircle({ touchId, positions, phase, isLoser, color }: Props) {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.5);
  const pulseScale = useSharedValue(1);

  // Appear with a spring pop on mount
  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pulse animation while waiting
  useEffect(() => {
    if (phase === 'waiting') {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.07, { duration: 700 }),
          withTiming(1.0, { duration: 700 })
        ),
        -1,
        false
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
    }
  }, [phase, pulseScale]);

  useEffect(() => {
    if (phase === 'result') {
      if (isLoser) {
        // Explode outward then settle
        scale.value = withSequence(
          withSpring(2.2, { damping: 5, stiffness: 160 }),
          withSpring(1.4, { damping: 12, stiffness: 180 })
        );
      } else {
        opacity.value = withTiming(0, { duration: 350 });
      }
    } else if (phase === 'waiting') {
      opacity.value = withTiming(1, { duration: 150 });
      scale.value = withSpring(1, { damping: 14, stiffness: 200 });
    }
  }, [phase, isLoser, opacity, scale]);

  const style = useAnimatedStyle(() => {
    const pos = positions.value[touchId] ?? { x: -CIRCLE_SIZE, y: -CIRCLE_SIZE };
    const activeColor = isLoser && phase === 'result' ? LOSER_COLOR : color;

    return {
      transform: [
        { translateX: pos.x - CIRCLE_SIZE / 2 },
        { translateY: pos.y - CIRCLE_SIZE / 2 },
        { scale: scale.value * pulseScale.value },
      ],
      opacity: opacity.value,
      backgroundColor: activeColor,
      // Neon glow via shadow on native, boxShadow on web
      ...(Platform.OS === 'web'
        ? ({
            boxShadow: `0 0 18px 8px ${activeColor}99, 0 0 44px 16px ${activeColor}44`,
          } as object)
        : {
            shadowColor: activeColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: 20,
            elevation: 12,
          }),
    };
  });

  return <Animated.View style={[styles.circle, style]} />;
}

const styles = StyleSheet.create({
  circle: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    opacity: 0.95,
  },
});
