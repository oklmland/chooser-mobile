import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { Wheel, WheelOption } from '@/types/wheel';
import { generateId } from '@/utils/id';

const WHEELS_KEY = '@chooser/wheels';
const LAST_OPENED_KEY = '@chooser/lastOpenedWheelId';

function defaultWheels(): Wheel[] {
  const now = Date.now();
  return [
    {
      id: generateId(),
      name: 'On mange quoi ?',
      options: ['Pizza', 'Sushi', 'Burger', 'Salade', 'Pâtes', 'Tacos'].map((label) => ({
        id: generateId(),
        label,
      })),
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function useWheelsStorage() {
  const [wheels, setWheels] = useState<Wheel[]>([]);
  const [activeWheelId, setActiveWheelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [wheelsRaw, lastOpenedId] = await Promise.all([
          AsyncStorage.getItem(WHEELS_KEY),
          AsyncStorage.getItem(LAST_OPENED_KEY),
        ]);

        let loaded: Wheel[] = wheelsRaw ? JSON.parse(wheelsRaw) : [];
        if (loaded.length === 0) {
          loaded = defaultWheels();
          await AsyncStorage.setItem(WHEELS_KEY, JSON.stringify(loaded));
        }

        setWheels(loaded);
        const initialId =
          lastOpenedId && loaded.some((w) => w.id === lastOpenedId) ? lastOpenedId : loaded[0].id;
        setActiveWheelId(initialId);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback((next: Wheel[]) => {
    setWheels(next);
    AsyncStorage.setItem(WHEELS_KEY, JSON.stringify(next));
  }, []);

  const selectWheel = useCallback((id: string) => {
    setActiveWheelId(id);
    AsyncStorage.setItem(LAST_OPENED_KEY, id);
  }, []);

  const createWheel = useCallback(
    (name: string) => {
      const now = Date.now();
      const wheel: Wheel = {
        id: generateId(),
        name,
        options: [
          { id: generateId(), label: 'Option 1' },
          { id: generateId(), label: 'Option 2' },
        ],
        createdAt: now,
        updatedAt: now,
      };
      persist([...wheels, wheel]);
      selectWheel(wheel.id);
      return wheel;
    },
    [wheels, persist, selectWheel]
  );

  const renameWheel = useCallback(
    (id: string, name: string) => {
      persist(wheels.map((w) => (w.id === id ? { ...w, name, updatedAt: Date.now() } : w)));
    },
    [wheels, persist]
  );

  const deleteWheel = useCallback(
    (id: string) => {
      const next = wheels.filter((w) => w.id !== id);
      persist(next);
      if (activeWheelId === id && next.length > 0) {
        selectWheel(next[0].id);
      }
    },
    [wheels, activeWheelId, persist, selectWheel]
  );

  const setOptions = useCallback(
    (wheelId: string, options: WheelOption[]) => {
      persist(
        wheels.map((w) => (w.id === wheelId ? { ...w, options, updatedAt: Date.now() } : w))
      );
    },
    [wheels, persist]
  );

  const activeWheel = wheels.find((w) => w.id === activeWheelId) ?? null;

  return {
    wheels,
    activeWheel,
    activeWheelId,
    loading,
    selectWheel,
    createWheel,
    renameWheel,
    deleteWheel,
    setOptions,
  };
}
