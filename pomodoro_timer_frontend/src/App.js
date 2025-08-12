import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import { usePomodoro } from './hooks/usePomodoro';
import { useAudio } from './hooks/useAudio';
import { randomQuote } from './utils/quotes';
import ProgressCircle from './components/ProgressCircle';
import Plant from './components/Plant';
import Controls from './components/Controls';
import Settings from './components/Settings';
import AmbienceToggle from './components/AmbienceToggle';
import Leaves from './components/Leaves';

/**
 * PUBLIC_INTERFACE
 * App
 * The forest-themed Pomodoro timer root component. It composes the timer, plant visuals,
 * ambient audio, quotes, and controls in a calming layout.
 */
function App() {
  const {
    mode,
    isRunning,
    remainingMs,
    totalMs,
    sessionCount,
    progress,
    species,
    start,
    pause,
    resume,
    reset,
    setDurations,
    focusMinutes,
    breakMinutes,
  } = usePomodoro();

  const {
    initialized,
    mute,
    unmute,
    isMuted,
    setVolume,
    volume,
    toggleAmbient,
    isAmbientOn,
    playChime,
  } = useAudio();

  const [quote, setQuote] = useState(randomQuote('focus'));

  // Update quotes when session mode changes or starts
  useEffect(() => {
    setQuote(randomQuote(mode));
  }, [mode, sessionCount]);

  // Play chime on session boundaries and send notification
  useEffect(() => {
    // Hook returns progress that resets on new session
    // We listen when progress is nearly 0 (start) or complete via reset in hook by session change event
  }, []);

  // Ensure audio context initializes on user gesture when controls used
  const onStart = () => {
    if (!initialized && isMuted) {
      // ensure we can unmute if user had it muted previously; no-op
    }
    start(() => {
      // Called on start of a session
    });
  };

  const onPause = () => pause();
  const onResume = () => resume();
  const onReset = () => reset();

  const onSessionEnd = (type) => {
    // play chime based on session type
    playChime(type === 'focus' ? 'focus' : 'break');
  };

  // Subscribe to onSessionEnd events via custom browser event dispatched by usePomodoro
  useEffect(() => {
    const handler = (e) => onSessionEnd(e.detail?.justCompleted || 'focus');
    window.addEventListener('pomodoro-session-complete', handler);
    return () => window.removeEventListener('pomodoro-session-complete', handler);
  }, []);

  const title = useMemo(() => {
    const mins = Math.floor(remainingMs / 60000);
    const secs = Math.floor((remainingMs % 60000) / 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} • ${mode === 'focus' ? 'Focus' : 'Break'} • Forest Focus`;
  }, [remainingMs, mode]);

  useEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <div className="ForestApp" role="application" aria-label="Forest Focus Pomodoro timer">
      {/* Background animated layers */}
      <div className="bg-gradient" aria-hidden="true" />
      <div className="bg-texture" aria-hidden="true" />
      {mode === 'break' ? <Leaves count={12} /> : null}

      {/* Top bar: Quotes and Sound */}
      <header className="top-bar">
        <div className="quote" aria-live="polite" aria-atomic="true">
          <span className="quote-mark">“</span>
          <span className="quote-text">{quote}</span>
          <span className="quote-mark">”</span>
        </div>
        <div className="sound-controls">
          <AmbienceToggle
            isMuted={isMuted}
            isAmbientOn={isAmbientOn}
            onToggleMute={() => (isMuted ? unmute() : mute())}
            onToggleAmbient={() => toggleAmbient(!isAmbientOn)}
            volume={volume}
            onVolumeChange={setVolume}
          />
        </div>
      </header>

      {/* Center timer with plant overlay */}
      <main className="center-stage">
        <div className="timer-container" aria-label="Timer area">
          <ProgressCircle
            progress={progress}
            mode={mode}
            size={260}
            strokeWidth={12}
          >
            <div className="time-readout" aria-live="assertive">
              <div className="mode-label" data-mode={mode}>
                {mode === 'focus' ? 'Focus' : 'Break'}
              </div>
              <div className="time">
                {new Date(remainingMs).toISOString().substr(14, 5)}
              </div>
              <div className="session-count" aria-label={`Completed sessions ${sessionCount}`}>
                Sessions: {sessionCount}
              </div>
            </div>
            <Plant progress={progress} species={species} mode={mode} />
          </ProgressCircle>
        </div>

        {/* Controls and settings */}
        <div className="bottom-controls">
          <Controls
            isRunning={isRunning}
            onStart={onStart}
            onPause={onPause}
            onResume={onResume}
            onReset={onReset}
          />
          <Settings
            focusMinutes={focusMinutes}
            breakMinutes={breakMinutes}
            onChange={(f, b) => setDurations(f, b)}
            disabled={isRunning}
          />
        </div>
      </main>

      <footer className="footer">
        <span>Forest Focus • Be present like a tree, steady and growing.</span>
      </footer>
    </div>
  );
}

export default App;
