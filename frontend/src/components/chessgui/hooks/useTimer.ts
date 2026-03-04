import { useState, useEffect, useRef, useCallback } from 'react';
import { TimerState } from '../types';

const DEFAULT_TIME_MS = 10 * 60 * 1000;

/**
 * Manages chess clock for both players.
 * Counts down locally in 100ms ticks and exposes a `syncTimer` method
 * to reconcile with server timer data
*/
export function useTimer(gameOver: boolean) {
  const [whiteTimeMs, setWhiteTimeMs] = useState(DEFAULT_TIME_MS);
  const [blackTimeMs, setBlackTimeMs] = useState(DEFAULT_TIME_MS);
  const [currentTurn, setCurrentTurn] = useState<string>('w');
  const [timerRunning, setTimerRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (!timerRunning || gameOver) return;

    intervalRef.current = setInterval(() => {
      if (currentTurn === 'w') {
        setWhiteTimeMs((prev: number) => Math.max(0, prev - 100));
      } else {
        setBlackTimeMs((prev: number) => Math.max(0, prev - 100));
      }
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timerRunning, currentTurn, gameOver]);

  const syncTimer = useCallback((data: TimerState) => {
    setWhiteTimeMs(data.whiteTimeMs);
    setBlackTimeMs(data.blackTimeMs);
    setCurrentTurn(data.currentTurn);
    setTimerRunning(data.timerRunning);
  }, []);

  return {
    whiteTimeMs,
    blackTimeMs,
    currentTurn,
    timerRunning,
    setTimerRunning,
    syncTimer,
  };
}
