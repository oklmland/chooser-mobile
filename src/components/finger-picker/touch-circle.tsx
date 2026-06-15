import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
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
  const scale = useSharedValue(1);

  useEffect(() => {
    if (phase === 'result') {
      if (isLoser) {
        scale.value = withSpring(1.5);
      } else {
        opacity.value = withTiming(0, { duration: 400 });
      }
    } else {
      opacity.value = withTiming(1, { duration: 150 });
      scale.value = withTiming(1, { duration: 150 });
    }
  }, [phase, isLoser, opacity, scale]);

  const style = useAnimatedStyle(() => {
    const pos = positions.value[touchId] ?? { x: -CIRCLE_SIZE, y: -CIRCLE_SIZE };
    return {
      transform: [
        { translateX: pos.x - CIRCLE_SIZE / 2 },
        { translateY: pos.y - CIRCLE_SIZE / 2 },
        { scale: scale.value },
      ],
      opacity: opacity.value,
      backgroundColor: isLoser && phase === 'result' ? LOSER_COLOR : color,
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
    opacity: 0.85,
  },
});
