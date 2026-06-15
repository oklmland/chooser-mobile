import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue, withTiming } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { LOSER_MESSAGES } from '@/constants/loser-messages';
import { PLAYER_COLORS, colorForIndex } from '@/constants/palette';

import { CountdownRing } from './countdown-ring';
import { LoserMessage } from './loser-message';
import { FingerPhase, TouchCircle } from './touch-circle';

const MAX_TOUCHES = 10;
const COUNTDOWN_MS = 4000;

export function FingerPickerScreen() {
  const [phase, setPhase] = useState<FingerPhase>('waiting');
  const [activeIds, setActiveIds] = useState<number[]>([]);
  const [loserId, setLoserId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(4);

  const positions = useSharedValue<Record<number, { x: number; y: number }>>({});
  const progress = useSharedValue(0);
  const phaseSV = useSharedValue<FingerPhase>('waiting');

  const activeIdsRef = useRef<number[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    activeIdsRef.current = activeIds;
  }, [activeIds]);

  useEffect(() => {
    phaseSV.value = phase;
  }, [phase, phaseSV]);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const finishRound = useCallback(() => {
    clearTimers();
    const current = activeIdsRef.current;
    if (current.length < 2) {
      progress.value = 0;
      setPhase('waiting');
      return;
    }
    const loser = current[Math.floor(Math.random() * current.length)];
    const text = LOSER_MESSAGES[Math.floor(Math.random() * LOSER_MESSAGES.length)];
    setLoserId(loser);
    setMessage(text);
    setPhase('result');
  }, [clearTimers, progress]);

  const startCountdown = useCallback(() => {
    setPhase('countdown');
    setSecondsLeft(4);
    progress.value = 0;
    progress.value = withTiming(1, { duration: COUNTDOWN_MS });

    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => Math.max(s - 1, 1));
    }, 1000);

    timeoutRef.current = setTimeout(finishRound, COUNTDOWN_MS);
  }, [finishRound, progress]);

  const cancelCountdown = useCallback(() => {
    clearTimers();
    progress.value = 0;
    setPhase('waiting');
    setSecondsLeft(4);
  }, [clearTimers, progress]);

  const resetGame = useCallback(() => {
    clearTimers();
    progress.value = 0;
    setPhase('waiting');
    setLoserId(null);
    setMessage('');
    setSecondsLeft(4);
  }, [clearTimers, progress]);

  useEffect(() => {
    if (phase === 'waiting' && activeIds.length >= 2) {
      startCountdown();
    } else if (phase === 'countdown' && activeIds.length < 2) {
      cancelCountdown();
    }
  }, [phase, activeIds, startCountdown, cancelCountdown]);

  const handleTouchesChanged = useCallback((ids: number[]) => {
    setActiveIds(ids);
  }, []);

  const gesture = Gesture.Manual()
    .onTouchesDown((event) => {
      const next = { ...positions.value };
      event.allTouches.forEach((touch) => {
        next[touch.id] = { x: touch.x, y: touch.y };
      });
      positions.value = next;
      handleTouchesChanged(Object.keys(next).map(Number));

      if (phaseSV.value === 'result') {
        resetGame();
      }
    })
    .onTouchesMove((event) => {
      const next = { ...positions.value };
      event.allTouches.forEach((touch) => {
        next[touch.id] = { x: touch.x, y: touch.y };
      });
      positions.value = next;
    })
    .onTouchesUp((event) => {
      const next = { ...positions.value };
      event.changedTouches.forEach((touch) => {
        delete next[touch.id];
      });
      positions.value = next;
      handleTouchesChanged(Object.keys(next).map(Number));
    })
    .onTouchesCancelled((event) => {
      const next = { ...positions.value };
      event.changedTouches.forEach((touch) => {
        delete next[touch.id];
      });
      positions.value = next;
      handleTouchesChanged(Object.keys(next).map(Number));
    });

  const showInstructions = phase !== 'result' && activeIds.length < 2;

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.container}>
        {showInstructions && (
          <View style={styles.instructions} pointerEvents="none">
            <ThemedText type="title" style={styles.instructionsTitle}>
              Qui perd ?
            </ThemedText>
            <ThemedText style={styles.instructionsText}>
              Chacun pose un doigt sur l&apos;écran.{'\n'}Au bout de 4 secondes, un(e) perdant(e)
              est désigné(e).
            </ThemedText>
            <ThemedText type="small" style={styles.instructionsHint}>
              Il faut au moins 2 doigts pour commencer.
            </ThemedText>
          </View>
        )}

        {phase === 'countdown' && (
          <View style={styles.center} pointerEvents="none">
            <CountdownRing progress={progress} secondsLeft={secondsLeft} />
          </View>
        )}

        {phase === 'result' && <LoserMessage message={message} />}

        {activeIds.slice(0, MAX_TOUCHES).map((id) => (
          <TouchCircle
            key={id}
            touchId={id}
            positions={positions}
            phase={phase}
            isLoser={id === loserId}
            color={colorForIndex(id, PLAYER_COLORS)}
          />
        ))}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#15171C',
    overflow: 'hidden',
  },
  center: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructions: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 24,
    right: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  instructionsTitle: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  instructionsText: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
  instructionsHint: {
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
});
