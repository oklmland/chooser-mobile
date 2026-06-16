import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
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
  showResult?: boolean;
};

function truncateLabel(label: string): string {
  return label.length > 14 ? `${label.slice(0, 13)}…` : label;
}

// Confetti particle component
type ParticleProps = {
  color: string;
  startX: number;
  startY: number;
  index: number;
};

const PARTICLE_COUNT = 15;

function ConfettiParticle({ color, startX, startY, index }: ParticleProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);

  // Spread out in different directions
  const angle = (index / PARTICLE_COUNT) * Math.PI * 2;
  const speed = 80 + (index * 11) % 120;
  const targetX = Math.cos(angle) * speed;
  const targetY = Math.sin(angle) * speed - 60; // bias upward

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 80 });
    translateX.value = withTiming(targetX, { duration: 900, easing: Easing.out(Easing.cubic) });
    translateY.value = withSequence(
      withTiming(targetY, { duration: 600, easing: Easing.out(Easing.cubic) }),
      withTiming(targetY + 200, { duration: 400, easing: Easing.in(Easing.quad) })
    );
    rotate.value = withTiming(360 * (index % 2 === 0 ? 2 : -2), { duration: 900 });
    scale.value = withSequence(
      withSpring(1.4, { damping: 8, stiffness: 200 }),
      withTiming(0.2, { duration: 500 })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
    position: 'absolute' as const,
    left: startX - 6,
    top: startY - 6,
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: color,
  }));

  return <Animated.View style={style} />;
}

export const WheelCanvas = forwardRef<WheelCanvasRef, Props>(function WheelCanvas(
  { options, onSpinStart, onSpinEnd, size = 300 },
  ref
) {
  const rotation = useSharedValue(0);
  const spinningRef = useRef(false);
  const radius = size / 2;
  const segmentAngle = 360 / Math.max(options.length, 1);
  const pointerGlow = useSharedValue(0);
  const [confettiKey, setConfettiKey] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const triggerConfetti = useCallback(() => {
    setConfettiKey((k) => k + 1);
    setShowConfetti(true);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      spin: () => {
        if (spinningRef.current || options.length < 2) {
          return;
        }
        spinningRef.current = true;
        setShowConfetti(false);
        onSpinStart?.();

        const winningIndex = Math.floor(Math.random() * options.length);
        const target = computeFinalRotation(rotation.value, winningIndex, segmentAngle);

        rotation.value = withTiming(
          target,
          { duration: 3500, easing: Easing.out(Easing.cubic) },
          (finished) => {
            if (finished) {
              spinningRef.current = false;
              // Glowing pointer pulse
              pointerGlow.value = withRepeat(
                withSequence(
                  withTiming(1, { duration: 300 }),
                  withTiming(0.3, { duration: 300 })
                ),
                6,
                false,
                () => {
                  pointerGlow.value = 0;
                }
              );
              runOnJS(triggerConfetti)();
              runOnJS(onSpinEnd)(options[winningIndex]);
            }
          }
        );
      },
    }),
    [options, onSpinStart, onSpinEnd, rotation, segmentAngle, pointerGlow, triggerConfetti]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const pointerStyle = useAnimatedStyle(() => ({
    ...(Platform.OS === 'web'
      ? ({
          filter:
            pointerGlow.value > 0.1
              ? `drop-shadow(0 0 ${(8 * pointerGlow.value).toFixed(1)}px #FF3B30) drop-shadow(0 0 ${(16 * pointerGlow.value).toFixed(1)}px #FF3B3088)`
              : 'none',
        } as object)
      : {
          shadowColor: '#FF3B30',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: pointerGlow.value,
          shadowRadius: 14,
        }),
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

  const confettiColors = WHEEL_COLORS.slice(0, 6);

  return (
    <View style={[styles.container, { width: size }]}>
      {/* Pointer */}
      <Animated.View style={pointerStyle}>
        <View style={styles.pointer} />
      </Animated.View>
      {/* Flat wheel — no 3D perspective */}
      <View style={styles.wheelWrapper}>
        <Animated.View style={[{ width: size, height: size }, animatedStyle]}>
          <Svg width={size} height={size}>
            {options.length === 1 ? (
              <G>
                <Circle cx={radius} cy={radius} r={radius} fill={colorForIndex(0, WHEEL_COLORS)} />
                <SvgText
                  x={radius}
                  y={radius * 0.35}
                  fill="#ffffff"
                  fontSize={18}
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
                const segColor = colorForIndex(i, WHEEL_COLORS);

                return (
                  <G key={option.id}>
                    <Path
                      d={describeSlice(radius, radius, radius, start, end)}
                      fill={segColor}
                      stroke="rgba(0,0,0,0.2)"
                      strokeWidth={2}
                    />
                    <SvgText
                      x={labelPos.x}
                      y={labelPos.y}
                      fill="#ffffff"
                      fontSize={13}
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

      {/* Confetti burst */}
      {showConfetti && (
        <View
          style={[styles.confettiContainer, { width: size, height: size }]}
          pointerEvents="none">
          {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
            <ConfettiParticle
              key={`${confettiKey}-${i}`}
              color={confettiColors[i % confettiColors.length]}
              startX={size / 2}
              startY={size / 2}
              index={i}
            />
          ))}
        </View>
      )}
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
    borderLeftWidth: 16,
    borderRightWidth: 16,
    borderTopWidth: 26,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FF3B30',
    marginBottom: -10,
    zIndex: 2,
  },
  wheelWrapper: {
    alignItems: 'center',
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
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
