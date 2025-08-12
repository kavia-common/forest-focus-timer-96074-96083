import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loadState, saveState } from '../utils/storage';

/**
 * PUBLIC_INTERFACE
 * useAudio
 * Manages a single AudioContext, ambient noise generation, volume/mute, and session end chimes.
 * Uses procedural audio (noise buffers and oscillators) to avoid external audio files.
 */
export function useAudio() {
  const persisted = loadState();
  const ctxRef = useRef(null);
  const gainRef = useRef(null);
  const ambientGainRef = useRef(null);
  const ambientNodeRef = useRef(null);

  const [initialized, setInitialized] = useState(false);
  const [isMuted, setIsMuted] = useState(persisted?.soundMuted ?? false);
  const [volume, setVolumeState] = useState(persisted?.volume ?? 0.6);
  const [isAmbientOn, setAmbientOn] = useState(persisted?.ambientOn ?? false);

  const ensureContext = useCallback(() => {
    if (!ctxRef.current) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(isMuted ? 0 : volume, ctx.currentTime);
      gain.connect(ctx.destination);

      const ambientGain = ctx.createGain();
      ambientGain.gain.setValueAtTime(isMuted || !isAmbientOn ? 0 : volume * 0.25, ctx.currentTime);
      ambientGain.connect(gain);

      ctxRef.current = ctx;
      gainRef.current = gain;
      ambientGainRef.current = ambientGain;
      setInitialized(true);
    } else if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
  }, [isMuted, volume, isAmbientOn]);

  // Persist audio-related preferences
  useEffect(() => {
    const current = loadState() || {};
    saveState({ ...current, soundMuted: isMuted, volume, ambientOn: isAmbientOn });
  }, [isMuted, volume, isAmbientOn]);

  /**
   * PUBLIC_INTERFACE
   * mute
   * Mutes all app sounds.
   */
  const mute = useCallback(() => {
    ensureContext();
    setIsMuted(true);
    if (gainRef.current) gainRef.current.gain.setTargetAtTime(0, ctxRef.current.currentTime, 0.01);
  }, [ensureContext]);

  /**
   * PUBLIC_INTERFACE
   * unmute
   * Unmutes app sounds using the last volume.
   */
  const unmute = useCallback(() => {
    ensureContext();
    setIsMuted(false);
    if (gainRef.current) gainRef.current.gain.setTargetAtTime(volume, ctxRef.current.currentTime, 0.02);
  }, [ensureContext, volume]);

  /**
   * PUBLIC_INTERFACE
   * setVolume
   * Sets app volume (0..1)
   */
  const setVolume = useCallback((v) => {
    ensureContext();
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    if (!isMuted && gainRef.current) {
      gainRef.current.gain.setTargetAtTime(clamped, ctxRef.current.currentTime, 0.02);
    }
    if (ambientGainRef.current) {
      ambientGainRef.current.gain.setTargetAtTime(isAmbientOn && !isMuted ? clamped * 0.25 : 0, ctxRef.current.currentTime, 0.02);
    }
  }, [ensureContext, isMuted, isAmbientOn]);

  // Create/stop ambient noise (brown noise buffer loop)
  const startAmbient = useCallback(() => {
    ensureContext();
    if (!ctxRef.current || !ambientGainRef.current) return;
    if (ambientNodeRef.current) return;
    const buffer = createBrownNoiseBuffer(ctxRef.current, 2); // seconds
    const src = ctxRef.current.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.connect(ambientGainRef.current);
    src.start();
    ambientNodeRef.current = src;

    // Occasional soft bird chirps
    scheduleBirds(ctxRef.current, ambientGainRef.current, () => !isAmbientOn || isMuted);
  }, [ensureContext, isAmbientOn, isMuted]);

  const stopAmbient = useCallback(() => {
    if (ambientNodeRef.current) {
      try { ambientNodeRef.current.stop(); } catch (e) { /* ignore */ }
      ambientNodeRef.current.disconnect();
      ambientNodeRef.current = null;
    }
  }, []);

  /**
   * PUBLIC_INTERFACE
   * toggleAmbient
   * Enable or disable background ambient noise.
   */
  const toggleAmbient = useCallback((on) => {
    ensureContext();
    setAmbientOn(Boolean(on));
    if (ambientGainRef.current && ctxRef.current) {
      ambientGainRef.current.gain.setTargetAtTime(on && !isMuted ? volume * 0.25 : 0, ctxRef.current.currentTime, 0.03);
    }
    if (on) startAmbient(); else stopAmbient();
  }, [ensureContext, isMuted, volume, startAmbient, stopAmbient]);

  /**
   * PUBLIC_INTERFACE
   * playChime
   * Play a pleasant chime at session end. 'focus' -> uplifting; 'break' -> soothing.
   */
  const playChime = useCallback((type = 'focus') => {
    ensureContext();
    if (!ctxRef.current || isMuted) return;
    const ctx = ctxRef.current;
    const now = ctx.currentTime;

    const notes = type === 'focus'
      ? [440, 659.25, 880] // A4, E5, A5
      : [392, 523.25];     // G4, C5

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.setValueAtTime(2000, now);

      osc.frequency.setValueAtTime(freq, now + i * 0.15);
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, now + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.5 * (1 - i * 0.15), now + i * 0.15 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.15 + 0.75);

      osc.connect(lpf);
      lpf.connect(gain);
      gain.connect(gainRef.current);

      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.8);
    });
    // Also send notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      const body = type === 'focus' ? 'Focus session complete. Time for a break 🌿' : 'Break over. Let’s grow again 🌱';
      try { new Notification('Forest Focus', { body }); } catch (e) { /* ignore */ }
    }
  }, [ensureContext, isMuted]);

  // Autostart ambient if persisted on and user interacts
  useEffect(() => {
    const onFirstInteraction = () => {
      if (!initialized) ensureContext();
      if (isAmbientOn && !isMuted) startAmbient();
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
    };
    window.addEventListener('pointerdown', onFirstInteraction, { once: true });
    window.addEventListener('keydown', onFirstInteraction, { once: true });
    return () => {
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
    };
  }, [ensureContext, initialized, isAmbientOn, isMuted, startAmbient]);

  return {
    initialized,
    isMuted,
    mute,
    unmute,
    setVolume,
    volume,
    isAmbientOn,
    toggleAmbient,
    playChime,
  };
}

// Helper: generate brown noise buffer
function createBrownNoiseBuffer(ctx, seconds = 2) {
  const bufferSize = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = data[i];
    data[i] *= 3.5; // gain
  }
  return buffer;
}

// Helper: schedule gentle bird chirps occasionally
function scheduleBirds(ctx, destination, shouldStop) {
  const schedule = () => {
    if (shouldStop()) return;
    const now = ctx.currentTime;
    const when = now + 2 + Math.random() * 6; // between 2-8 seconds
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const freq = 1200 + Math.random() * 800;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, when);
    osc.frequency.exponentialRampToValueAtTime(freq * (0.6 + Math.random() * 0.2), when + 0.15);
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(0.12, when + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.22);
    osc.connect(gain);
    gain.connect(destination);
    osc.start(when);
    osc.stop(when + 0.25);
    setTimeout(schedule, (when - now + 4) * 1000);
  };
  schedule();
}
