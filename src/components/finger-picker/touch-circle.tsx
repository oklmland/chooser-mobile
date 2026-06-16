import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  SharedValue,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export const CIRCLE_SIZE = 130;

export type FingerPhase = 'waiting' | 'countdown' | 'result';

type Props = {
  touchId: number;
  positions: SharedValue<Record<number, { x: number; y: number }>>;
  phase: FingerPhase;
  isLoser: boolean;
  color: string;
};

export function TouchCircle({ touchId, positions, phase, isLoser }: Props) {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.5);
  const pulseScale = useSharedValue(1);
  // 0 = transparent (waiting), 1 = semi-white (countdown end), 2 = solid white (loser)
  const fillProgress = useSharedValue(0);

  // Appear with a spring pop on mount
  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase === 'waiting') {
      fillProgress.value = withTiming(0, { duration: 200 });
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 800 }),
          withTiming(1.0, { duration: 800 })
        ),
        -1,
        false
      );
    } else if (phase === 'countdown') {
      pulseScale.value = withTiming(1, { duration: 200 });
      // Animate fill over 4 seconds matching the countdown timer
      fillProgress.value = withTiming(1, { duration: 4000 });
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
    }
  }, [phase, pulseScale, fillProgress]);

  useEffect(() => {
    if (phase === 'result') {
      if (isLoser) {
        // Scale up to 1.2x, fill becomes solid white
        scale.value = withSpring(1.2, { damping: 10, stiffness: 180 });
        fillProgress.value = withTiming(2, { duration: 200 });
      } else {
        opacity.value = withTiming(0, { duration: 350 });
      }
    } else if (phase === 'waiting') {
      opacity.value = withTiming(1, { duration: 150 });
      scale.value = withSpring(1, { damping: 14, stiffness: 200 });
    }
  }, [phase, isLoser, opacity, scale, fillProgress]);

  const style = useAnimatedStyle(() => {
    const pos = positions.value[touchId] ?? { x: -CIRCLE_SIZE, y: -CIRCLE_SIZE };

    // Build background color: transparent → rgba(255,255,255,0.25) → white
    let bgColor: string;
    if (fillProgress.value >= 2) {
      bgColor = 'white';
    } else if (fillProgress.value > 0) {
      // alpha: 0 → 64 (hex) = 0 → ~25% opacity
      const alphaInt = Math.round(interpolate(fillProgress.value, [0, 1], [0, 64]));
      const hex = alphaInt.toString(16).padStart(2, '0');
      bgColor = `#ffffff${hex}`;
    } else {
      bgColor = 'transparent';
    }

    const borderWidth = fillProgress.value >= 2 ? 0 : 9;

    return {
      transform: [
        { translateX: pos.x - CIRCLE_SIZE / 2 },
        { translateY: pos.y - CIRCLE_SIZE / 2 },
        { scale: scale.value * pulseScale.value },
      ],
      opacity: opacity.value,
      backgroundColor: bgColor,
      borderWidth,
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
    borderColor: 'white',
    borderWidth: 9,
    backgroundColor: 'transparent',
  },
});
