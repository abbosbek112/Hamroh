import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useGlobalAudio } from './AudioContext';
import { logger } from '../utils/logger';
import { api } from '../services/api';

// Types
export type FocusMode = 'POMODORO' | 'CUSTOM';

interface FocusContextType {
    focusTime: number; // Seconds remaining
    isActive: boolean;
    focusMode: FocusMode;
    customMinutes: number;
    initialTime: number; // Total duration of current session
    toggleTimer: () => void;
    resetTimer: () => void;
    setMode: (mode: FocusMode) => void;
    setCustomMinutes: (minutes: number) => void;
    formatTime: (seconds: number) => string;
}

const FocusContext = createContext<FocusContextType | null>(null);

export const useFocus = () => {
    const context = useContext(FocusContext);
    if (!context) {
        throw new Error('useFocus must be used within a FocusProvider');
    }
    return context;
};

export const FocusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // State
    const [focusTime, setFocusTime] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [focusMode, setFocusMode] = useState<FocusMode>('POMODORO');
    const [customMinutes, setCustomMinutes] = useState<number>(50);
    const [initialTime, setInitialTime] = useState(25 * 60);

    // Refs for interval and precise timing
    const timerEndTimeRef = useRef<number | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const completedRef = useRef(false); // Guard against double-fire

    // Audio access for completion sound
    const { play } = useGlobalAudio();

    // Load state from localStorage on mount
    useEffect(() => {
        const savedState = localStorage.getItem('hamroh_focus_state');
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                const { endTime, mode, customMin, totalDuration, isActive: wasActive } = parsed;

                setFocusMode(mode);
                setCustomMinutes(customMin);
                setInitialTime(totalDuration);

                if (wasActive && endTime) {
                    const now = Date.now();
                    const remaining = Math.ceil((endTime - now) / 1000);

                    if (remaining > 0) {
                        setFocusTime(remaining);
                        setIsActive(true);
                        timerEndTimeRef.current = endTime;
                    } else {
                        // Timer finished while away - XP va focus sessiya saqlash
                        setFocusTime(0);
                        setIsActive(false);
                        localStorage.removeItem('hamroh_focus_state');
                        const sessionMinutes = totalDuration ? Math.floor(totalDuration / 60) : 0;
                        if (sessionMinutes > 0) {
                            api.saveFocusSession(sessionMinutes).catch((e) => logger.error('saveFocusSession', e));
                        }
                    }
                } else {
                    // Paused or stopped state
                    setFocusTime(parsed.remaining || (mode === 'POMODORO' ? 25 * 60 : customMin * 60));
                }
            } catch (e) {
                logger.error('Failed to parse saved focus state', e);
            }
        }
    }, []);

    // Persist state
    useEffect(() => {
        const state = {
            isActive,
            endTime: timerEndTimeRef.current,
            remaining: focusTime,
            mode: focusMode,
            customMin: customMinutes,
            totalDuration: initialTime
        };
        if (isActive) {
            localStorage.setItem('hamroh_focus_state', JSON.stringify(state));
        } else {
            // If not active, we might still want to save preferences, but clearing 'endTime' is crucial
            // For simplicity, we can remove if stopped, or save "paused" state.
            // Let's save paused state too.
            localStorage.setItem('hamroh_focus_state', JSON.stringify(state));
        }
    }, [isActive, focusTime, focusMode, customMinutes, initialTime]);

    const handleTimerComplete = useCallback((sessionMinutes: number) => {
        if (completedRef.current) return;
        completedRef.current = true;

        setIsActive(false);
        setFocusTime(0);
        if (timerEndTimeRef.current) timerEndTimeRef.current = null;
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        try {
            play('/sounds/rain.mp3', { volume: 0.5 });
        } catch {
            // Ignore audio errors
        }
        localStorage.removeItem('hamroh_focus_state');

        if (sessionMinutes > 0) {
            api.saveFocusSession(sessionMinutes).catch((e) => logger.error('saveFocusSession', e));
        }
    }, [play]);

    // Timer Logic
    useEffect(() => {
        completedRef.current = false;
        if (isActive && !intervalRef.current) {
            if (!timerEndTimeRef.current) {
                timerEndTimeRef.current = Date.now() + focusTime * 1000;
            }

            intervalRef.current = setInterval(() => {
                if (timerEndTimeRef.current) {
                    const now = Date.now();
                    const diff = Math.ceil((timerEndTimeRef.current - now) / 1000);

                    if (diff <= 0) {
                        const sessionMinutes = Math.floor(initialTime / 60);
                        handleTimerComplete(sessionMinutes);
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
    }, [isActive, focusTime, handleTimerComplete]);

    const toggleTimer = useCallback(() => {
        setIsActive(prev => !prev);
    }, []);

    const resetTimer = useCallback(() => {
        setIsActive(false);
        timerEndTimeRef.current = null;
        const newTime = focusMode === 'POMODORO' ? 25 * 60 : customMinutes * 60;
        setFocusTime(newTime);
        setInitialTime(newTime);
        localStorage.removeItem('hamroh_focus_state');
    }, [focusMode, customMinutes]);

    const setMode = useCallback((mode: FocusMode) => {
        setIsActive(false);
        setFocusMode(mode);
        const newTime = mode === 'POMODORO' ? 25 * 60 : customMinutes * 60;
        setFocusTime(newTime);
        setInitialTime(newTime);
        timerEndTimeRef.current = null;
    }, [customMinutes]);

    const setCustomMinutesHandler = useCallback((minutes: number) => {
        setCustomMinutes(minutes);
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
            focusTime,
            isActive,
            focusMode,
            customMinutes,
            initialTime,
            toggleTimer,
            resetTimer,
            setMode,
            setCustomMinutes: setCustomMinutesHandler,
            formatTime
        }}>
            {children}
        </FocusContext.Provider>
    );
};
