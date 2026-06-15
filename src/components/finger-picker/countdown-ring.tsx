import { StyleSheet, View } from 'react-native';
import Animated, { SharedValue, useAnimatedProps } from 'react-native-reanimated';
import { Circle, Svg } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  progress: SharedValue<number>;
  secondsLeft: number;
  size?: number;
};

export function CountdownRing({ progress, secondsLeft, size = 140 }: Props) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * progress.value,
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]} pointerEvents="none">
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#FFFFFF"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeLinecap="round"
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
          animatedProps={animatedProps}
        />
      </Svg>
      <View style={styles.label} pointerEvents="none">
        <ThemedText style={styles.text}>{secondsLeft}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
  },
  text: {
    fontSize: 56,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
