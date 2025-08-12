import React from 'react';

/**
 * PUBLIC_INTERFACE
 * ProgressCircle
 * Renders a circular progress indicator using SVG with an optional overlay (children).
 */
export default function ProgressCircle({ progress, size = 260, strokeWidth = 12, children, mode = 'focus' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(1, Math.max(0, progress)));

  return (
    <div className="progress-ring" data-mode={mode} aria-label={`Progress ${Math.round(progress * 100)} percent`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-hidden="true">
        <circle
          className="bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          className="fg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      {children}
    </div>
  );
}
