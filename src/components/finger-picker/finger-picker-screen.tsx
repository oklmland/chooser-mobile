import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

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

  // Red flash overlay for loser reveal
  const flashOpacity = useSharedValue(0);

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

    // Trigger red flash overlay
    flashOpacity.value = withSequence(
      withTiming(0.45, { duration: 120 }),
      withTiming(0, { duration: 500 })
    );
  }, [clearTimers, progress, flashOpacity]);

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

  const showHint = phase === 'waiting' && activeIds.length === 0;

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.container}>
        {/* Gradient background: coral red at top → warm orange at bottom */}
        <View style={styles.gradientTop} pointerEvents="none" />
        <View style={styles.gradientBottom} pointerEvents="none" />

        {/* Subtle hint when no fingers down */}
        {showHint && (
          <View style={styles.hintContainer} pointerEvents="none">
            <Text style={styles.hintText}>Posez vos doigts</Text>
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

        {/* Red flash overlay on loser reveal */}
        <Animated.View style={[styles.flashOverlay, flashStyle]} pointerEvents="none" />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF3B5E',
    overflow: 'hidden',
  },
  // Two-layer gradient simulation: coral red at top, warm orange at bottom
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: '50%',
    backgroundColor: '#FF3B5E',
  },
  gradientBottom: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FF8C00',
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
  hintContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  flashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FF3B30',
  },
});
