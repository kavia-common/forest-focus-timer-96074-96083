import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loadState, saveState } from '../utils/storage';

/**
 * PUBLIC_INTERFACE
 * usePomodoro
 * React hook that manages Pomodoro timer state with robust ticking using performance.now(),
 * persistence via localStorage, and session transitions with event dispatching.
 *
 * Returns the timer state, progress, controls, and settings setters.
 */
export function usePomodoro() {
  const DEFAULT_FOCUS = 25;
  const DEFAULT_BREAK = 5;
  const limits = {
    minFocus: 5,
    maxFocus: 120,
    minBreak: 1,
    maxBreak: 60,
  };

  // Load persisted state
  const persisted = loadState();

  const [focusMinutes, setFocusMinutes] = useState(
    clamp(persisted?.focusMinutes ?? DEFAULT_FOCUS, limits.minFocus, limits.maxFocus)
  );
  const [breakMinutes, setBreakMinutes] = useState(
    clamp(persisted?.breakMinutes ?? DEFAULT_BREAK, limits.minBreak, limits.maxBreak)
  );
  const [mode, setMode] = useState(persisted?.mode ?? 'focus'); // 'focus' | 'break'
  const [isRunning, setIsRunning] = useState(persisted?.isRunning ?? false);
  const [remainingMs, setRemainingMs] = useState(() => {
    if (persisted?.isRunning && persisted?.endAt) {
      // Estimate remaining using system time, but fallback to stored value if drift seems large
      const est = Math.max(0, persisted.endAt - Date.now());
      // Limit insane drift by clamping to [0, storedRemaining or est whichever closer]
      const stored = persisted.remainingMs ?? minutesToMs(mode === 'focus' ? focusMinutes : breakMinutes);
      return Math.min(Math.max(est, 0), Math.max(stored, est));
    }
    return persisted?.remainingMs ?? minutesToMs(mode === 'focus' ? focusMinutes : breakMinutes);
  });
  const [sessionCount, setSessionCount] = useState(persisted?.sessionCount ?? 0);
  const [species] = useState(() => pickSpecies(persisted?.species)); // plant species persists across reloads

  const totalMs = useMemo(
    () => minutesToMs(mode === 'focus' ? focusMinutes : breakMinutes),
    [mode, focusMinutes, breakMinutes]
  );

  const progress = useMemo(() => {
    const p = 1 - remainingMs / totalMs;
    return isFinite(p) ? Math.max(0, Math.min(1, p)) : 0;
  }, [remainingMs, totalMs]);

  // Ticking with performance.now()
  const rafId = useRef(null);
  const ticking = useRef(false);
  const lastPerf = useRef(null);

  const tick = useCallback(() => {
    if (!ticking.current) return;
    const now = performance.now();
    const prev = lastPerf.current ?? now;
    const delta = now - prev;
    lastPerf.current = now;

    setRemainingMs(prevMs => {
      const next = Math.max(0, prevMs - delta);
      if (next === 0 && prevMs > 0) {
        // Session complete
        handleSessionComplete();
      }
      return next;
    });

    rafId.current = requestAnimationFrame(tick);
  }, []);

  const startTicking = useCallback(() => {
    if (ticking.current) return;
    ticking.current = true;
    lastPerf.current = performance.now();
    rafId.current = requestAnimationFrame(tick);
  }, [tick]);

  const stopTicking = useCallback(() => {
    ticking.current = false;
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = null;
    lastPerf.current = null;
  }, []);

  // Save to localStorage periodically and on changes
  useEffect(() => {
    const state = {
      focusMinutes,
      breakMinutes,
      isRunning,
      mode,
      remainingMs,
      endAt: isRunning ? Date.now() + remainingMs : null,
      sessionCount,
      species,
      savedAt: Date.now(),
    };
    saveState(state);
  }, [focusMinutes, breakMinutes, isRunning, mode, remainingMs, sessionCount, species]);

  // Visibility handling to keep accurate ticking
  useEffect(() => {
    const onVisibility = () => {
      lastPerf.current = performance.now();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Controls
  /**
   * PUBLIC_INTERFACE
   * start
   * Start a new or resume current session; if remaining is 0, reset for current mode first.
   */
  const start = useCallback((onStartCb) => {
    setRemainingMs(prev => (prev <= 0 ? totalMs : prev));
    setIsRunning(true);
    startTicking();
    if (onStartCb) onStartCb();
  }, [totalMs, startTicking]);

  /**
   * PUBLIC_INTERFACE
   * pause
   * Pause the timer.
   */
  const pause = useCallback(() => {
    setIsRunning(false);
    stopTicking();
  }, [stopTicking]);

  /**
   * PUBLIC_INTERFACE
   * resume
   * Resume the timer.
   */
  const resume = useCallback(() => {
    setIsRunning(true);
    startTicking();
  }, [startTicking]);

  /**
   * PUBLIC_INTERFACE
   * reset
   * Reset the timer to the beginning of the current mode.
   */
  const reset = useCallback(() => {
    setIsRunning(false);
    stopTicking();
    setRemainingMs(totalMs);
  }, [stopTicking, totalMs]);

  /**
   * PUBLIC_INTERFACE
   * setDurations
   * Update focus and break durations within sensible bounds.
   */
  const setDurations = useCallback((focusM, breakM) => {
    const f = clamp(focusM, limits.minFocus, limits.maxFocus);
    const b = clamp(breakM, limits.minBreak, limits.maxBreak);
    setFocusMinutes(f);
    setBreakMinutes(b);
    // if paused, update remaining to new total for current mode
    setRemainingMs(prev => {
      if (!isRunning) {
        return minutesToMs((mode === 'focus' ? f : b));
      }
      return prev;
    });
  }, [isRunning, mode]);

  // Initialize remaining if persisted indicated running and endAt exists
  useEffect(() => {
    if (persisted?.isRunning && persisted?.endAt && remainingMs > 0) {
      // Keep running on load
      setIsRunning(true);
      startTicking();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSessionComplete = useCallback(() => {
    // Dispatch custom event for App to play chime
    const justCompleted = mode === 'focus' ? 'focus' : 'break';
    window.dispatchEvent(new CustomEvent('pomodoro-session-complete', { detail: { justCompleted } }));

    if (mode === 'focus') {
      setSessionCount(c => c + 1);
      setMode('break');
      setRemainingMs(minutesToMs(breakMinutes));
    } else {
      setMode('focus');
      setRemainingMs(minutesToMs(focusMinutes));
    }
    // Keep running into next session
    lastPerf.current = performance.now();
  }, [mode, breakMinutes, focusMinutes]);

  // Request notification permission on first mount (non-blocking)
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      try { Notification.requestPermission(); } catch (e) { /* ignore */ }
    }
  }, []);

  return {
    mode,
    isRunning,
    remainingMs,
    totalMs,
    sessionCount,
    progress,
    species,
    focusMinutes,
    breakMinutes,
    start,
    pause,
    resume,
    reset,
    setDurations,
  };
}

function minutesToMs(m) {
  return Math.round(m * 60 * 1000);
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));
}

function pickSpecies(persisted) {
  const all = ['fern', 'sapling', 'sprout', 'bamboo'];
  if (persisted && all.includes(persisted)) return persisted;
  return all[Math.floor(Math.random() * all.length)];
}
