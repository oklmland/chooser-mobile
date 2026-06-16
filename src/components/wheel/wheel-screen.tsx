import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
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
      <Text style={styles.resultLabel}>Résultat</Text>
      <Text style={styles.resultText} numberOfLines={2}>
        {result.label}
      </Text>
    </Animated.View>
  );
}

/** Large prominent TOURNER button */
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
                  : '0 4px 28px rgba(255,255,255,0.25), 0 1px 4px rgba(0,0,0,0.3)',
              } as object)
            : (!disabled && {
                shadowColor: '#FFFFFF',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 12,
                elevation: 8,
              }),
        ]}>
        <Text style={styles.spinButtonText}>
          {spinning ? 'Ça tourne...' : 'TOURNER'}
        </Text>
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
    return <View style={styles.container} />;
  }

  // 85% of screen width, max 340px
  const wheelSize = Math.min(Math.floor(width * 0.85), 340);
  const canSpin = activeWheel.options.length >= 2 && !spinning;

  const handleSpin = () => {
    setResult(null);
    wheelRef.current?.spin();
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Compact header row */}
        <View style={styles.header}>
          <Pressable onPress={() => setManagerVisible(true)} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Mes roues</Text>
          </Pressable>
          <Text style={styles.title} numberOfLines={1}>
            {activeWheel.name}
          </Text>
          <View style={styles.headerButton} />
        </View>

        {/* Wheel + result area (scrollable so it works on small screens) */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Wheel */}
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

          {/* Result banner */}
          {result && (
            <View style={styles.resultArea}>
              <ResultBanner result={result} optionIndex={resultIndex} />
            </View>
          )}

          {/* Options list below the wheel */}
          {activeWheel.options.length > 0 && (
            <View style={styles.optionsList}>
              {activeWheel.options.map((option, i) => (
                <View key={option.id} style={styles.optionRow}>
                  <View
                    style={[
                      styles.optionDot,
                      { backgroundColor: colorForIndex(i, WHEEL_COLORS) },
                    ]}
                  />
                  <Text style={styles.optionLabel} numberOfLines={1}>
                    {option.label}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Bottom action bar */}
        <View style={styles.bottomBar}>
          <SpinButton onPress={handleSpin} disabled={!canSpin} spinning={spinning} />

          {activeWheel.options.length < 2 && (
            <Text style={styles.hint}>
              Ajoutez au moins 2 options pour pouvoir tourner la roue.
            </Text>
          )}

          {/* Prominent edit button */}
          <Pressable onPress={() => setEditorVisible(true)} style={styles.editButton}>
            <Text style={styles.editButtonText}>✏️  Modifier la roue</Text>
          </Pressable>
        </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  headerButton: {
    minWidth: 80,
  },
  headerButtonText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '500',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollArea: {
    flex: 1,
    alignSelf: 'stretch',
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  wheelArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
  },
  resultArea: {
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.two,
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
  },
  optionsList: {
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.three,
    gap: Spacing.one + 2,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  optionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  bottomBar: {
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  spinButtonOuter: {
    alignSelf: 'stretch',
  },
  spinButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three + 4,
    alignItems: 'center',
  },
  spinButtonDisabled: {
    opacity: 0.3,
  },
  spinButtonText: {
    color: '#0D0D1A',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  hint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    textAlign: 'center',
  },
  editButton: {
    alignSelf: 'stretch',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  editButtonText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    fontWeight: '600',
  },
});
