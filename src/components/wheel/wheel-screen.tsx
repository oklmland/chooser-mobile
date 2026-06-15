import { useRef, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useWheelsStorage } from '@/hooks/use-wheels-storage';
import { WheelOption } from '@/types/wheel';

import { WheelCanvas, WheelCanvasRef } from './wheel-canvas';
import { WheelEditor } from './wheel-editor';
import { WheelListManager } from './wheel-list-manager';

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
            onSpinStart={() => setSpinning(true)}
            onSpinEnd={(option) => {
              setSpinning(false);
              setResult(option);
            }}
          />
        </View>

        <View style={styles.resultArea}>
          {result && (
            <ThemedView type="backgroundElement" style={styles.resultBadge}>
              <ThemedText type="small" themeColor="textSecondary">
                Résultat
              </ThemedText>
              <ThemedText type="subtitle">{result.label}</ThemedText>
            </ThemedView>
          )}
        </View>

        <Pressable
          onPress={handleSpin}
          disabled={!canSpin}
          style={[styles.spinButton, !canSpin && styles.spinButtonDisabled]}>
          <ThemedText type="smallBold" style={styles.spinButtonText}>
            {spinning ? 'Ça tourne...' : 'Tourner la roue'}
          </ThemedText>
        </Pressable>

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
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultBadge: {
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.two,
    gap: Spacing.half,
  },
  spinButton: {
    alignSelf: 'stretch',
    backgroundColor: '#3c87f7',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  spinButtonDisabled: {
    opacity: 0.5,
  },
  spinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  hint: {
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
});
