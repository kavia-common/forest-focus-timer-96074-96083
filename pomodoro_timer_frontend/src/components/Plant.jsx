import React, { useMemo } from 'react';

/**
 * PUBLIC_INTERFACE
 * Plant
 * Displays an SVG plant that scales and subtly animates as the session progresses.
 */
export default function Plant({ progress, species = 'fern', mode = 'focus' }) {
  const scale = useMemo(() => 0.6 + 0.6 * Math.min(1, Math.max(0, progress)), [progress]);

  return (
    <div className="plant-wrap" aria-hidden="true">
      <div
        className="plant"
        data-mode={mode}
        style={{ transform: `scale(${scale}) translateY(${(1 - progress) * 4}px)` }}
      >
        {renderSpecies(species)}
      </div>
    </div>
  );
}

function renderSpecies(species) {
  switch (species) {
    case 'fern':
      return (
        <svg viewBox="0 0 200 200" width="100%" height="100%">
          <g transform="translate(100,180)">
            <path d="M0 0 C -4 -30 -6 -90 0 -140 C 6 -90 4 -30 0 0 Z" fill="#2E7D6B"/>
            {Array.from({ length: 8 }).map((_, i) => {
              const y = -20 - i * 14;
              const w = 10 + i * 5;
              return (
                <g key={i}>
                  <path d={`M0 ${y} q -${w} -6 -${w*1.4} -12`} stroke="#3F8F6B" strokeWidth="4" fill="none" strokeLinecap="round"/>
                  <path d={`M0 ${y} q ${w} -6 ${w*1.4} -12`} stroke="#3F8F6B" strokeWidth="4" fill="none" strokeLinecap="round"/>
                </g>
              );
            })}
          </g>
        </svg>
      );
    case 'sprout':
      return (
        <svg viewBox="0 0 200 200" width="100%" height="100%">
          <g transform="translate(100,180)">
            <rect x="-3" y="-80" width="6" height="80" fill="#2E7D6B" rx="3"/>
            <ellipse cx="-12" cy="-78" rx="16" ry="10" fill="#8CC7A2"/>
            <ellipse cx="12" cy="-78" rx="16" ry="10" fill="#8CC7A2"/>
          </g>
        </svg>
      );
    case 'bamboo':
      return (
        <svg viewBox="0 0 200 200" width="100%" height="100%">
          <g transform="translate(100,180)">
            {Array.from({ length: 4 }).map((_, i) => (
              <g key={i} transform={`translate(${(i - 1.5) * 16},0)`}>
                <rect x="-3" y="-140" width="6" height="140" fill="#4E9E7B" rx="3"/>
                {Array.from({ length: 5 }).map((__, j) => (
                  <ellipse key={j} cx="0" cy={-110 + j * 28} rx="8" ry="4" fill="#3F8F6B" />
                ))}
              </g>
            ))}
          </g>
        </svg>
      );
    case 'sapling':
    default:
      return (
        <svg viewBox="0 0 200 200" width="100%" height="100%">
          <g transform="translate(100,180)">
            <path d="M0 0 C -2 -40 -2 -80 0 -120 C 2 -80 2 -40 0 0 Z" fill="#2E7D6B"/>
            <path d="M0 -110 C -26 -110 -26 -90 0 -90" fill="#8CC7A2"/>
            <path d="M0 -90 C 26 -90 26 -70 0 -70" fill="#8CC7A2"/>
          </g>
        </svg>
      );
  }
}
