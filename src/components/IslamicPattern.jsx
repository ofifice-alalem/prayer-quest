import React from 'react';

/**
 * Modern Ambient Gaming Background (Steam / HUD Style)
 * Pure gradient glows and ambient lighting with ZERO distracting wallpaper patterns.
 */
export default function IslamicPattern({ isDark = true }) {
  if (!isDark) {
    // Light Gaming Mode: Clean, subtle warm atmospheric lighting
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div 
          className="absolute -top-40 right-0 w-[500px] h-[500px] rounded-full blur-[140px] opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(255, 122, 0, 0.25), transparent 70%)' }}
        />
        <div 
          className="absolute top-1/2 -left-40 w-[450px] h-[450px] rounded-full blur-[140px] opacity-25"
          style={{ background: 'radial-gradient(circle, rgba(14, 165, 233, 0.2), transparent 70%)' }}
        />
      </div>
    );
  }

  // Dark Gaming HUD Mode: Deep atmospheric neon glow
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Top Right Orange Glow */}
      <div 
        className="absolute -top-40 right-1/4 w-[600px] h-[600px] rounded-full blur-[160px] opacity-25"
        style={{ background: 'radial-gradient(circle, rgba(255, 122, 0, 0.4), transparent 70%)' }}
      />
      {/* Bottom Left Deep Cyan / Navy Glow */}
      <div 
        className="absolute bottom-0 -left-20 w-[500px] h-[500px] rounded-full blur-[150px] opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(14, 165, 233, 0.35), transparent 70%)' }}
      />
    </div>
  );
}
