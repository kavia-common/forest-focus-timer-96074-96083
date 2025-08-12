import React, { useEffect, useState } from 'react';

/**
 * PUBLIC_INTERFACE
 * Settings
 * Renders inputs for focus and break durations (in minutes) and an apply button.
 */
export default function Settings({ focusMinutes, breakMinutes, onChange, disabled }) {
  const [focus, setFocus] = useState(focusMinutes);
  const [brk, setBrk] = useState(breakMinutes);

  useEffect(() => { setFocus(focusMinutes); }, [focusMinutes]);
  useEffect(() => { setBrk(breakMinutes); }, [breakMinutes]);

  const apply = () => {
    const f = clamp(focus, 5, 120);
    const b = clamp(brk, 1, 60);
    onChange(f, b);
  };

  return (
    <div className="settings" aria-label="Timer settings">
      <label>
        <span>Focus (min)</span>
        <input type="number" min={5} max={120} value={focus} onChange={e => setFocus(Number(e.target.value))} disabled={disabled} />
      </label>
      <label>
        <span>Break (min)</span>
        <input type="number" min={1} max={60} value={brk} onChange={e => setBrk(Number(e.target.value))} disabled={disabled} />
      </label>
      <button className="btn" onClick={apply} disabled={disabled} aria-label="Apply durations">Apply</button>
    </div>
  );
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));
}
