import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Controls
 * Provides start, pause, resume, and reset buttons for the timer.
 */
export default function Controls({ isRunning, onStart, onPause, onResume, onReset }) {
  return (
    <div className="controls" role="group" aria-label="Timer controls">
      {!isRunning ? (
        <button className="btn" onClick={onStart} aria-label="Start timer">Start</button>
      ) : (
        <button className="btn secondary" onClick={onPause} aria-label="Pause timer">Pause</button>
      )}
      {!isRunning ? (
        <button className="btn secondary" onClick={onResume} aria-label="Resume timer">Resume</button>
      ) : null}
      <button className="btn danger" onClick={onReset} aria-label="Reset timer">Reset</button>
    </div>
  );
}
