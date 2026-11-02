import React from 'react';

/**
 * Islamic Geometric Star Pattern (SVG)
 * Subtle watermark background overlay that adapts to dark/light modes.
 */
export default function IslamicPattern({ opacity = 0.04 }) {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{ opacity }}
      aria-hidden="true"
    >
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern
            id="islamic-star-pattern"
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            {/* 8-pointed Islamic Star Geometry */}
            <path
              d="M40 0 L52 28 L80 40 L52 52 L40 80 L28 52 L0 40 L28 28 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              className="text-game-orange"
            />
            <circle
              cx="40"
              cy="40"
              r="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
              className="text-amber-400"
            />
            {/* Corner interlock petals */}
            <path
              d="M0 0 L10 10 M80 0 L70 10 M80 80 L70 70 M0 80 L10 70"
              stroke="currentColor"
              strokeWidth="0.8"
              className="text-cyan-400"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#islamic-star-pattern)" />
      </svg>
    </div>
  );
}

