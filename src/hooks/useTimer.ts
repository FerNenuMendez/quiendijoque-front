import { useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export const useTimer = (
  initialSeconds: number,
  isChecking: boolean,
  isFinished: boolean
) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isTimeUp, setIsTimeUp] = useState(false);

  const endTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appState = useRef(AppState.currentState);

  const startTimer = (seconds: number) => {
    endTimeRef.current = Date.now() + seconds * 1000;
    setTimeLeft(seconds);
    setIsTimeUp(false);
    updateTimer();
  };

  const stopTimer = () => {
    endTimeRef.current = null;
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const updateTimer = () => {
    if (!endTimeRef.current || isChecking || isFinished) return;

    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));

    setTimeLeft(remaining);

    if (remaining === 0) {
      setIsTimeUp(true);
      endTimeRef.current = null;
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  };

  useEffect(() => {
    if (isChecking || isFinished) {
      stopTimer();
      return;
    }

    intervalRef.current = setInterval(updateTimer, 200);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isChecking, isFinished]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          updateTimer();
        }
        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [isChecking, isFinished]);

  return { timeLeft, isTimeUp, startTimer, stopTimer };
};
