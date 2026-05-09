'use client';

import { formatUsdc } from '@/lib/format';

export interface AllocationSegment {
  key: string;
  label: string;
  value: bigint; // raw USDC (6 decimals)
  color: string; // any CSS color (var(--…) is fine)
}

const SIZE = 160;
const STROKE = 18;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;
const CENTER = SIZE / 2;

export function AllocationChart({
  segments,
  totalLabel = 'Total',
}: {
  segments: AllocationSegment[];
  totalLabel?: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0n);
  const isEmpty = total === 0n;

  // Pre-compute slice geometry. Using bigint math up to fraction so we don't
  // lose precision on large balances.
  const slices = segments.reduce<
    Array<AllocationSegment & { fraction: number; segLen: number; dashOffset: number; pct: number }>
  >((acc, s) => {
    const fraction = isEmpty ? 0 : Number((s.value * 100_000n) / total) / 100_000;
    const segLen = CIRC * fraction;
    const dashOffset = acc.length === 0 ? 0 : acc[acc.length - 1].dashOffset + acc[acc.length - 1].segLen;
    acc.push({ ...s, fraction, segLen, dashOffset, pct: fraction * 100 });
    return acc;
  }, []);

  return (
    <div className="allocation-chart" role="figure" aria-label="USDC asset allocation">
      <div className="allocation-svg-wrap">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          width={SIZE}
          height={SIZE}
          aria-hidden
        >
          {/* base ring */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="var(--border)"
            strokeWidth={STROKE}
          />
          {/* slices */}
          {!isEmpty &&
            slices.map((s) =>
              s.segLen > 0 ? (
                <circle
                  key={s.key}
                  cx={CENTER}
                  cy={CENTER}
                  r={RADIUS}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={STROKE}
                  strokeDasharray={`${s.segLen} ${CIRC - s.segLen}`}
                  strokeDashoffset={-s.dashOffset}
                  transform={`rotate(-90 ${CENTER} ${CENTER})`}
                />
              ) : null,
            )}
        </svg>
        <div className="allocation-center">
          <span className="allocation-center-label">{totalLabel}</span>
          <strong className="allocation-center-value">{formatUsdc(total)}</strong>
          <span className="allocation-center-unit">USDC</span>
        </div>
      </div>

      <ul className="allocation-legend" aria-label="Allocation breakdown">
        {slices.map((s) => (
          <li key={s.key}>
            <span className="allocation-dot" style={{ background: s.color }} aria-hidden />
            <span className="allocation-label">{s.label}</span>
            <span className="allocation-amount">{formatUsdc(s.value)} USDC</span>
            <span className="allocation-pct">{isEmpty ? '0%' : `${s.pct.toFixed(1)}%`}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
