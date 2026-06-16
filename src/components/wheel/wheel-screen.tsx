import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WHEEL_COLORS, colorForIndex } from '@/constants/palette';
import { Spacing } from '@/constants/theme';
import { useWheelsStorage } from '@/hooks/use-wheels-storage';
import { WheelOption } from '@/types/wheel';

import { WheelCanvas, WheelCanvasRef } from './wheel-canvas';
import { WheelEditor } from './wheel-editor';
import { WheelListManager } from './wheel-list-manager';

/** Animated result banner that slides up with spring */
function ResultBanner({
  result,
  optionIndex,
}: {
  result: WheelOption;
  optionIndex: number;
}) {
  const translateY = useSharedValue(120);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.88);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 16, stiffness: 220 });
    opacity.value = withTiming(1, { duration: 250 });
    scale.value = withSpring(1, { damping: 14, stiffness: 200 });
  }, [result.id, translateY, opacity, scale]);

  const bannerColor = colorForIndex(optionIndex, WHEEL_COLORS);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.resultBanner, { backgroundColor: bannerColor }, style]}>
      <ThemedText style={styles.resultLabel}>Résultat</ThemedText>
      <ThemedText style={styles.resultText} numberOfLines={2}>
        {result.label}
      </ThemedText>
    </Animated.View>
  );
}

/** Spin button with press-scale animation */
function SpinButton({
  onPress,
  disabled,
  spinning,
}: {
  onPress: () => void;
  disabled: boolean;
  spinning: boolean;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 14, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 250 });
      }}
      style={styles.spinButtonOuter}>
      <Animated.View
        style={[
          styles.spinButton,
          disabled && styles.spinButtonDisabled,
          animatedStyle,
          Platform.OS === 'web'
            ? ({
                boxShadow: disabled
                  ? 'none'
                  : '0 4px 24px rgba(60,135,247,0.45), 0 1px 4px rgba(0,0,0,0.2)',
              } as object)
            : (!disabled && {
                shadowColor: '#3c87f7',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.5,
                shadowRadius: 12,
                elevation: 8,
              }),
        ]}>
        {/* Gradient-like shimmer using nested view */}
        {!disabled && (
          <View style={styles.spinButtonHighlight} />
        )}
        <ThemedText style={styles.spinButtonText}>
          {spinning ? 'Ça tourne...' : '🎡  Tourner la roue'}
        </ThemedText>
      </Animated.View>
    </Pressable>
  );
}

export function WheelScreen() {
  const { width } = useWindowDimensions();
  const {
    wheels,
    activeWheel,
    activeWheelId,
    loading,
    selectWheel,
    createWheel,
    renameWheel,
    deleteWheel,
    setOptions,
  } = useWheelsStorage();

  const wheelRef = useRef<WheelCanvasRef>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<WheelOption | null>(null);
  const [resultIndex, setResultIndex] = useState(0);
  const [editorVisible, setEditorVisible] = useState(false);
  const [managerVisible, setManagerVisible] = useState(false);

  if (loading || !activeWheel) {
    return <ThemedView style={styles.container} />;
  }

  const wheelSize = Math.min(width - Spacing.five * 2, 340);
  const canSpin = activeWheel.options.length >= 2 && !spinning;

  const handleSpin = () => {
    setResult(null);
    wheelRef.current?.spin();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => setManagerVisible(true)} style={styles.headerButton}>
            <ThemedText type="link">Mes roues</ThemedText>
          </Pressable>
          <ThemedText type="subtitle" style={styles.title} numberOfLines={1}>
            {activeWheel.name}
          </ThemedText>
          <Pressable onPress={() => setEditorVisible(true)} style={styles.headerButton}>
            <ThemedText type="link">Modifier</ThemedText>
          </Pressable>
        </View>

        <View style={styles.wheelArea}>
          <WheelCanvas
            ref={wheelRef}
            options={activeWheel.options}
            size={wheelSize}
            showResult={!!result}
            onSpinStart={() => setSpinning(true)}
            onSpinEnd={(option) => {
              setSpinning(false);
              const idx = activeWheel.options.findIndex((o) => o.id === option.id);
              setResultIndex(idx >= 0 ? idx : 0);
              setResult(option);
            }}
          />
        </View>

        <View style={styles.resultArea}>
          {result && <ResultBanner result={result} optionIndex={resultIndex} />}
        </View>

        <SpinButton onPress={handleSpin} disabled={!canSpin} spinning={spinning} />

        {activeWheel.options.length < 2 && (
          <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
            Ajoutez au moins 2 options pour pouvoir tourner la roue.
          </ThemedText>
        )}
      </SafeAreaView>

      <WheelEditor
        visible={editorVisible}
        options={activeWheel.options}
        onChange={(options) => setOptions(activeWheel.id, options)}
        onClose={() => setEditorVisible(false)}
      />

      <WheelListManager
        visible={managerVisible}
        wheels={wheels}
        activeWheelId={activeWheelId}
        onSelect={selectWheel}
        onCreate={createWheel}
        onRename={renameWheel}
        onDelete={deleteWheel}
        onClose={() => setManagerVisible(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    paddingTop: Spacing.three,
  },
  headerButton: {
    minWidth: 70,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
  },
  wheelArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultArea: {
    minHeight: 80,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  resultBanner: {
    alignSelf: 'stretch',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two + 2,
    alignItems: 'center',
    gap: 2,
  },
  resultLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  resultText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  spinButtonOuter: {
    alignSelf: 'stretch',
    marginBottom: Spacing.three,
  },
  spinButton: {
    backgroundColor: '#3c87f7',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three + 2,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  spinButtonHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderTopLeftRadius: Spacing.three,
    borderTopRightRadius: Spacing.three,
  },
  spinButtonDisabled: {
    opacity: 0.45,
  },
  spinButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  hint: {
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
});
