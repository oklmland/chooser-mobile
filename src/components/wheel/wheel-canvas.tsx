import { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Circle, G, Path, Svg, Text as SvgText } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { WHEEL_COLORS, colorForIndex } from '@/constants/palette';
import { WheelOption } from '@/types/wheel';
import { computeFinalRotation, describeSlice, polarToCartesian } from '@/utils/wheel-math';

export interface WheelCanvasRef {
  spin: () => void;
}

type Props = {
  options: WheelOption[];
  onSpinStart?: () => void;
  onSpinEnd: (option: WheelOption) => void;
  size?: number;
};

function truncateLabel(label: string): string {
  return label.length > 14 ? `${label.slice(0, 13)}…` : label;
}

export const WheelCanvas = forwardRef<WheelCanvasRef, Props>(function WheelCanvas(
  { options, onSpinStart, onSpinEnd, size = 300 },
  ref
) {
  const rotation = useSharedValue(0);
  const spinningRef = useRef(false);
  const radius = size / 2;
  const segmentAngle = 360 / Math.max(options.length, 1);

  useImperativeHandle(
    ref,
    () => ({
      spin: () => {
        if (spinningRef.current || options.length < 2) {
          return;
        }
        spinningRef.current = true;
        onSpinStart?.();

        const winningIndex = Math.floor(Math.random() * options.length);
        const target = computeFinalRotation(rotation.value, winningIndex, segmentAngle);

        rotation.value = withTiming(
          target,
          { duration: 3500, easing: Easing.out(Easing.cubic) },
          (finished) => {
            if (finished) {
              spinningRef.current = false;
              runOnJS(onSpinEnd)(options[winningIndex]);
            }
          }
        );
      },
    }),
    [options, onSpinStart, onSpinEnd, rotation, segmentAngle]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  if (options.length === 0) {
    return (
      <View style={[styles.placeholder, { width: size, height: size }]}>
        <ThemedText themeColor="textSecondary" style={styles.placeholderText}>
          Ajoutez des options pour commencer
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: size }]}>
      <View style={styles.pointer} />
      <Animated.View style={[{ width: size, height: size }, animatedStyle]}>
        <Svg width={size} height={size}>
          {options.length === 1 ? (
            <G>
              <Circle cx={radius} cy={radius} r={radius} fill={colorForIndex(0, WHEEL_COLORS)} />
              <SvgText
                x={radius}
                y={radius * 0.35}
                fill="#15171C"
                fontSize={16}
                fontWeight="700"
                textAnchor="middle">
                {truncateLabel(options[0].label)}
              </SvgText>
            </G>
          ) : (
            options.map((option, i) => {
              const start = i * segmentAngle;
              const end = start + segmentAngle;
              const mid = start + segmentAngle / 2;
              const labelPos = polarToCartesian(radius, radius, radius * 0.62, mid);

              return (
                <G key={option.id}>
                  <Path
                    d={describeSlice(radius, radius, radius, start, end)}
                    fill={colorForIndex(i, WHEEL_COLORS)}
                    stroke="#15171C"
                    strokeWidth={1}
                  />
                  <SvgText
                    x={labelPos.x}
                    y={labelPos.y}
                    fill="#15171C"
                    fontSize={14}
                    fontWeight="700"
                    textAnchor="middle">
                    {truncateLabel(option.label)}
                  </SvgText>
                </G>
              );
            })
          )}
        </Svg>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderTopWidth: 22,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FF3B30',
    marginBottom: -8,
    zIndex: 1,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(128,128,128,0.3)',
    borderStyle: 'dashed',
  },
  placeholderText: {
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
