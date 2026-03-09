import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FocusMode = 'POMODORO' | 'CUSTOM';

interface FocusContextType {
  focusTime: number;
  isActive: boolean;
  focusMode: FocusMode;
  customMinutes: number;
  initialTime: number;
  toggleTimer: () => void;
  resetTimer: () => void;
  setMode: (mode: FocusMode) => void;
  setCustomMinutes: (minutes: number) => void;
  formatTime: (seconds: number) => string;
}

const FocusContext = createContext<FocusContextType | null>(null);

export const useFocus = () => {
  const context = useContext(FocusContext);
  if (!context) throw new Error('useFocus must be used within a FocusProvider');
  return context;
};

export const FocusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [focusTime, setFocusTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [focusMode, setFocusModeState] = useState<FocusMode>('POMODORO');
  const [customMinutes, setCustomMinutesState] = useState<number>(50);
  const [initialTime, setInitialTime] = useState(25 * 60);
  const timerEndTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('hamroh_focus_state').then((saved) => {
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setFocusModeState(parsed.mode || 'POMODORO');
          setCustomMinutesState(parsed.customMin || 50);
          setInitialTime(parsed.totalDuration || 25 * 60);
          if (parsed.isActive && parsed.endTime) {
            const remaining = Math.ceil((parsed.endTime - Date.now()) / 1000);
            if (remaining > 0) {
              setFocusTime(remaining);
              setIsActive(true);
              timerEndTimeRef.current = parsed.endTime;
            } else {
              setFocusTime(0);
            }
          } else {
            setFocusTime(parsed.remaining || 25 * 60);
          }
        } catch (e) {
          console.error('Failed to parse focus state', e);
        }
      }
    });
  }, []);

  useEffect(() => {
    const state = {
      isActive,
      endTime: timerEndTimeRef.current,
      remaining: focusTime,
      mode: focusMode,
      customMin: customMinutes,
      totalDuration: initialTime,
    };
    AsyncStorage.setItem('hamroh_focus_state', JSON.stringify(state));
  }, [isActive, focusTime, focusMode, customMinutes, initialTime]);

  useEffect(() => {
    if (isActive && !intervalRef.current) {
      if (!timerEndTimeRef.current) {
        timerEndTimeRef.current = Date.now() + focusTime * 1000;
      }
      intervalRef.current = setInterval(() => {
        if (timerEndTimeRef.current) {
          const diff = Math.ceil((timerEndTimeRef.current - Date.now()) / 1000);
          if (diff <= 0) {
            setIsActive(false);
            setFocusTime(0);
            timerEndTimeRef.current = null;
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            AsyncStorage.removeItem('hamroh_focus_state');
          } else {
            setFocusTime(diff);
          }
        }
      }, 1000);
    } else if (!isActive && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      timerEndTimeRef.current = null;
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive]);

  const toggleTimer = useCallback(() => setIsActive((prev) => !prev), []);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    timerEndTimeRef.current = null;
    const newTime = focusMode === 'POMODORO' ? 25 * 60 : customMinutes * 60;
    setFocusTime(newTime);
    setInitialTime(newTime);
    AsyncStorage.removeItem('hamroh_focus_state');
  }, [focusMode, customMinutes]);

  const setMode = useCallback((mode: FocusMode) => {
    setIsActive(false);
    setFocusModeState(mode);
    const newTime = mode === 'POMODORO' ? 25 * 60 : customMinutes * 60;
    setFocusTime(newTime);
    setInitialTime(newTime);
    timerEndTimeRef.current = null;
  }, [customMinutes]);

  const setCustomMinutes = useCallback((minutes: number) => {
    setCustomMinutesState(minutes);
    if (focusMode === 'CUSTOM') {
      setIsActive(false);
      setFocusTime(minutes * 60);
      setInitialTime(minutes * 60);
      timerEndTimeRef.current = null;
    }
  }, [focusMode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <FocusContext.Provider value={{
      focusTime, isActive, focusMode, customMinutes, initialTime,
      toggleTimer, resetTimer, setMode, setCustomMinutes, formatTime,
    }}>
      {children}
    </FocusContext.Provider>
  );
};
