'use client';

import { useMemo, useEffect, useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { useNgnRate } from '@/hooks/use-ngn-rate';
import { useWallet } from '@/app/context/WalletContext';
import { USDC_DECIMALS } from '@/lib/constants';

const STORAGE_KEY = 'stash_ngn_baseline';

interface Baseline {
  address: string;
  rate: number; // NGN per USDC
  timestamp: number;
}

function readBaseline(address: string): Baseline | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Baseline;
    return parsed.address === address ? parsed : null;
  } catch {
    return null;
  }
}

function writeBaseline(b: Baseline) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(b));
}

export function NgnStat({ totalUsdcRaw }: { totalUsdcRaw: bigint }) {
  const { rate, hasLiveRate } = useNgnRate();
  const { address } = useWallet();
  const [baseline, setBaseline] = useState<Baseline | null>(null);

  useEffect(() => {
    if (!address) return;
    const existing = readBaseline(address);
    if (existing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBaseline(existing);
    } else if (hasLiveRate && totalUsdcRaw > 0n) {
      // First time we see USDC for this wallet → snapshot the current rate.
      const fresh: Baseline = { address, rate, timestamp: Date.now() };
      writeBaseline(fresh);
       
      setBaseline(fresh);
    }
  }, [address, hasLiveRate, rate, totalUsdcRaw]);

  const totalUsdcNumber = Number(totalUsdcRaw) / 10 ** USDC_DECIMALS;
  const ngnNow = totalUsdcNumber * rate;
  const ngnBaseline = baseline ? totalUsdcNumber * baseline.rate : null;
  const delta = ngnBaseline === null ? null : ngnNow - ngnBaseline;
  const positive = delta !== null && delta >= 0;

  const ngnNowFormatted = useMemo(
    () =>
      ngnNow.toLocaleString('en-NG', {
        style: 'currency',
        currency: 'NGN',
        maximumFractionDigits: 0,
      }),
    [ngnNow],
  );

  const deltaFormatted = useMemo(
    () =>
      delta === null
        ? null
        : `${positive ? '+' : ''}${delta.toLocaleString('en-NG', {
            style: 'currency',
            currency: 'NGN',
            maximumFractionDigits: 0,
          })}`,
    [delta, positive],
  );

  if (!address || totalUsdcRaw === 0n) {
    return (
      <div className="ngn-stat">
        <div className="ngn-stat-row">
          <span className="ngn-stat-label">Naira-equivalent</span>
          <span className="ngn-stat-value">—</span>
        </div>
        <p className="ngn-stat-note">
          Connect a wallet and add USDC to track Naira-denominated change at market rates.
        </p>
      </div>
    );
  }

  return (
    <div className="ngn-stat">
      <div className="ngn-stat-row">
        <span className="ngn-stat-label">Naira-equivalent (today)</span>
        <span className="ngn-stat-value">{ngnNowFormatted}</span>
      </div>
      {baseline && delta !== null && (
        <div className="ngn-stat-row">
          <span className="ngn-stat-label">Change since deposit</span>
          <span className={`ngn-stat-delta ${positive ? 'pos' : 'neg'}`}>
            {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {deltaFormatted}
          </span>
        </div>
      )}
      <p className="ngn-stat-note">
        Rate: ₦{rate.toLocaleString('en-NG', { maximumFractionDigits: 2 })}/USDC{' '}
        {hasLiveRate ? '· live' : '· cached'}.
        {' '}NGN value reflects market depreciation, not on-chain protocol yield.
      </p>
    </div>
  );
}
