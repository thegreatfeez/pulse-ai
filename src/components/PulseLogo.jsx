import { useId } from 'react';

export default function PulseLogo({ size = 44, className = '' }) {
  const gradientId = useId().replace(/:/g, '');

  return (
    <span
      className={className}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" fill="none" role="presentation">
        <defs>
          <linearGradient id={`pulse-logo-${gradientId}`} x1="10" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--accent-primary-color, #14B8A6)" />
            <stop offset="0.52" stopColor="var(--accent-cyan-color, #67E8F9)" />
            <stop offset="1" stopColor="var(--accent-indigo-color, #6366F1)" />
          </linearGradient>
        </defs>

        <rect x="5" y="5" width="54" height="54" rx="18" fill={`url(#pulse-logo-${gradientId})`} />
        <rect x="7" y="7" width="50" height="50" rx="16" stroke="rgba(248,250,252,0.18)" />

        <circle cx="32" cy="32" r="14" stroke="rgba(248,250,252,0.30)" strokeWidth="1.6" />
        <path
          d="M32 18a14 14 0 0 1 14 14"
          stroke="rgba(248,250,252,0.72)"
          strokeLinecap="round"
          strokeWidth="2.2"
        />
        <path
          d="M17 36h7l3-8 5 14 4-9h11"
          stroke="rgba(248,250,252,0.98)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.8"
        />
        <circle cx="46" cy="21" r="3.3" fill="rgba(248,250,252,0.96)" />
        <circle cx="46" cy="21" r="5.8" stroke="rgba(103,232,249,0.38)" strokeWidth="1.5" />
      </svg>
    </span>
  );
}
