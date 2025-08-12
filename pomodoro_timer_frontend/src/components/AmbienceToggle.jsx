import React from 'react';

/**
 * PUBLIC_INTERFACE
 * AmbienceToggle
 * Displays mute/unmute and ambient noise toggle with a volume range control.
 */
export default function AmbienceToggle({ isMuted, isAmbientOn, onToggleMute, onToggleAmbient, volume, onVolumeChange }) {
  return (
    <div className="ambience" role="group" aria-label="Sound controls">
      <button className="btn secondary" onClick={onToggleMute} aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}>
        {isMuted ? 'Unmute 🔈' : 'Mute 🔇'}
      </button>
      <button className="btn" onClick={onToggleAmbient} aria-label={isAmbientOn ? 'Disable ambient forest sounds' : 'Enable ambient forest sounds'}>
        {isAmbientOn ? 'Ambient On 🌲' : 'Ambient Off 🌲'}
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        aria-label="Volume"
        value={volume}
        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
        style={{ verticalAlign: 'middle' }}
      />
    </div>
  );
}
