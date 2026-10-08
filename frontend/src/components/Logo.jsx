import React, { useId } from 'react';

// The FamilyStream mark: an "F" monogram whose middle arm is a play button.
// Built like a folded ribbon — the arms tuck under the stem with a soft
// fold shadow — and drawn on a 100×100 grid shared with the app icon
// (public/brand/app-icon.svg), so the two never drift apart. Brand colors
// are fixed (they don't follow the per-profile accent theme), the same way a
// streaming service's logo stays constant whatever the UI around it does.
export function LogoMark({ className = 'w-8 h-8', title }) {
  // useId keeps gradient ids unique when the mark renders more than once on
  // a page (navbar + splash + login); colons aren't valid in url(#…) refs.
  const id = useId().replace(/:/g, '');
  return (
    <svg
      viewBox="18 12 64 76"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#B7A8FF" />
          <stop offset="1" stopColor="#5B3DF5" />
        </linearGradient>
        <linearGradient id={`${id}a`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7A5CFF" />
          <stop offset="1" stopColor="#C9BCFF" />
        </linearGradient>
        <linearGradient id={`${id}p`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF9A6B" />
          <stop offset="1" stopColor="#FF3D8B" />
        </linearGradient>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.55" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="26" y="18" width="50" height="15" rx="4" fill={`url(#${id}a)`} />
      <path
        d="M40 40 L40 66 L64 53 Z"
        fill={`url(#${id}p)`}
        stroke={`url(#${id}p)`}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <rect x="38" y="18" width="10" height="15" fill={`url(#${id}f)`} />
      <path d="M38 39 L38 67 L46 62.6 L46 43.4 Z" fill={`url(#${id}f)`} opacity="0.55" />
      <rect x="26" y="18" width="14" height="64" rx="4" fill={`url(#${id}s)`} />
    </svg>
  );
}

export function Wordmark({ className = 'text-xl' }) {
  return (
    <span className={`font-display font-semibold tracking-tight leading-none ${className}`}>
      <span className="text-white">Family</span>
      <span className="bg-gradient-to-r from-[#B7A8FF] via-[#FF9A6B] to-[#FF3D8B] bg-clip-text text-transparent">
        Stream
      </span>
    </span>
  );
}

export default function Logo({ markClassName = 'w-7 h-7', wordmarkClassName = 'text-xl', hideWordmarkOnMobile = false }) {
  return (
    <span className="flex items-center gap-2">
      <LogoMark className={markClassName} title="FamilyStream" />
      <span className={hideWordmarkOnMobile ? 'hidden sm:inline' : undefined}>
        <Wordmark className={wordmarkClassName} />
      </span>
    </span>
  );
}
