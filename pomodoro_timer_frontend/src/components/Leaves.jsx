import React, { useMemo } from 'react';

/**
 * PUBLIC_INTERFACE
 * Leaves
 * Renders a set of animated leaf elements that drift down the screen.
 */
export default function Leaves({ count = 10 }) {
  const leaves = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const left = Math.random() * 100;
      const duration = 9 + Math.random() * 9;
      const delay = Math.random() * -10;
      const drift = (Math.random() * 60 - 30).toFixed(1) + 'vw';
      const rotate = Math.random() * 360;
      const scale = 0.8 + Math.random() * 0.7;
      return { id: i, left, duration, delay, drift, rotate, scale };
    });
  }, [count]);

  return (
    <div className="leaves" aria-hidden="true">
      {leaves.map(l => (
        <div
          key={l.id}
          className="leaf"
          style={{
            left: l.left + '%',
            animationDuration: l.duration + 's',
            animationDelay: l.delay + 's',
            '--x drift': l.drift,
            transform: `rotate(${l.rotate}deg) scale(${l.scale})`,
          }}
        />
      ))}
    </div>
  );
}
