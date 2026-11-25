import React from 'react';

/**
 * Refined Golden Lotus Emblem
 */
export function LotusEmblem({ className = 'w-6 h-6', color = '#C6A56B' }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Center petal */}
      <path
        d="M32 10C26 20 26 34 32 44C38 34 38 20 32 10Z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinejoin="round"
        fill={`${color}22`}
      />
      {/* Inner left & right petals */}
      <path
        d="M32 44C22 38 16 26 19 16C25 22 29 32 32 44Z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M32 44C42 38 48 26 45 16C39 22 35 32 32 44Z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Outer left & right petals */}
      <path
        d="M32 45C18 44 10 34 10 24C18 28 26 36 32 45Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M32 45C46 44 54 34 54 24C46 28 38 36 32 45Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Base stem / water ripple */}
      <path
        d="M16 51C22 49 42 49 48 51"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="32" cy="54" r="1.8" fill={color} />
    </svg>
  );
}

/**
 * Sacred Mandala SVG Backdrop Watermark
 */
export function MandalaWatermark({ className = 'w-96 h-96 opacity-10', color = '#C6A56B' }) {
  const petals = Array.from({ length: 12 });
  const innerPetals = Array.from({ length: 8 });

  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="100" cy="100" r="92" stroke={color} strokeWidth="0.7" strokeDasharray="3 3" />
      <circle cx="100" cy="100" r="78" stroke={color} strokeWidth="0.8" />
      <circle cx="100" cy="100" r="52" stroke={color} strokeWidth="0.8" />
      <circle cx="100" cy="100" r="24" stroke={color} strokeWidth="1" />
      <circle cx="100" cy="100" r="6" fill={color} fillOpacity="0.5" />

      {petals.map((_, i) => (
        <g key={`outer-${i}`} transform={`rotate(${i * 30} 100 100)`}>
          <path
            d="M100 12 C108 28, 108 42, 100 48 C92 42, 92 28, 100 12 Z"
            stroke={color}
            strokeWidth="0.9"
          />
          <circle cx="100" cy="8" r="1.5" fill={color} />
        </g>
      ))}

      {innerPetals.map((_, i) => (
        <g key={`inner-${i}`} transform={`rotate(${i * 45} 100 100)`}>
          <path
            d="M100 48 C106 58, 106 70, 100 76 C94 70, 94 58, 100 48 Z"
            stroke={color}
            strokeWidth="0.9"
          />
        </g>
      ))}
    </svg>
  );
}

/**
 * Ornamental Indian Section Divider
 */
export function SanskritDivider({ label, className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <div className="h-px flex-1 max-w-[120px] bg-gradient-to-r from-transparent to-[#C6A56B]/60" />
      <div className="flex items-center gap-2.5 text-[#C6A56B]">
        <span className="w-1.5 h-1.5 rotate-45 bg-[#C6A56B]" />
        <LotusEmblem className="w-5 h-5" />
        {label && (
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C6A56B]">
            {label}
          </span>
        )}
        <span className="w-1.5 h-1.5 rotate-45 bg-[#C6A56B]" />
      </div>
      <div className="h-px flex-1 max-w-[120px] bg-gradient-to-l from-transparent to-[#C6A56B]/60" />
    </div>
  );
}

/**
 * Rajasthani / Vedic Temple Arch Header Accent
 */
export function TempleArchCorner({ className = '' }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M2 46V18C2 9.163 9.163 2 18 2H46"
        stroke="#C6A56B"
        strokeWidth="1.5"
        strokeOpacity="0.55"
      />
      <path
        d="M8 46V20C8 13.373 13.373 8 20 8H46"
        stroke="#C6A56B"
        strokeWidth="1"
        strokeOpacity="0.35"
      />
      <circle cx="14" cy="14" r="2" fill="#C6A56B" fillOpacity="0.6" />
    </svg>
  );
}
