import React from 'react';

/**
 * High-clarity Islamic Geometric Pattern (Andalusian 8-Point Star & Girih Lattice)
 * Designed with distinct visibility for both Dark & Light gaming themes.
 */
export default function IslamicPattern({ isDark = true }) {
  // Use distinct, crisp colors and higher opacity so it's clearly visible and beautiful
  const strokeColor = isDark ? 'rgba(255, 153, 0, 0.22)' : 'rgba(30, 41, 59, 0.16)';
  const starFill = isDark ? 'rgba(255, 170, 0, 0.05)' : 'rgba(217, 119, 6, 0.04)';
  const secondaryStroke = isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(15, 23, 42, 0.10)';

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden transition-opacity duration-300"
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
            id="islamic-girih-pattern"
            width="120"
            height="120"
            patternUnits="userSpaceOnUse"
          >
            {/* Outer interlacing diamond frame */}
            <path
              d="M60 0 L120 60 L60 120 L0 60 Z"
              fill="none"
              stroke={secondaryStroke}
              strokeWidth="1.2"
            />

            {/* Central 8-pointed Islamic Star */}
            <polygon
              points="60,18 70,42 96,42 75,58 83,82 60,68 37,82 45,58 24,42 50,42"
              fill={starFill}
              stroke={strokeColor}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />

            {/* Concentric Islamic Octagon */}
            <polygon
              points="60,28 82,38 92,60 82,82 60,92 38,82 28,60 38,38"
              fill="none"
              stroke={strokeColor}
              strokeWidth="1"
              strokeDasharray="2,3"
            />

            {/* Corner Star Petals (Tessellation anchors) */}
            <path
              d="M0 0 L20 10 L10 20 Z M120 0 L100 10 L110 20 Z M120 120 L100 110 L110 100 Z M0 120 L20 110 L10 100 Z"
              fill={starFill}
              stroke={strokeColor}
              strokeWidth="1.2"
            />

            {/* Arabesque floral line connectors */}
            <path
              d="M60 0 L60 18 M60 92 L60 120 M0 60 L24 60 M96 60 L120 60"
              stroke={strokeColor}
              strokeWidth="1.2"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#islamic-girih-pattern)" />
      </svg>
    </div>
  );
}
