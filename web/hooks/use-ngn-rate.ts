'use client';

import { useEffect, useState } from 'react';

const REFRESH_INTERVAL = 60_000; // 1 minute
const FALLBACK_RATE = 1500; // sane fallback if the API is down (NGN per 1 USDC)
const STORAGE_KEY = 'stash_ngn_rate';

interface CachedRate {
  rate: number;
  timestamp: number;
}

async function fetchNgnRate(): Promise<number> {
  // Free, no-auth FX endpoint. Returns rates relative to USD.
  // Fallback to a backup endpoint if the primary fails.
  const endpoints = [
    'https://open.er-api.com/v6/latest/USD',
    'https://api.exchangerate-api.com/v4/latest/USD',
  ];
  for (const url of endpoints) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) continue;
      const json = (await res.json()) as { rates?: Record<string, number> };
      const ngn = json.rates?.NGN;
      if (typeof ngn === 'number' && ngn > 0) return ngn;
    } catch {
      // try next
    }
  }
  throw new Error('all rate endpoints failed');
}

export function useNgnRate() {
  const [rate, setRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Try cache first for instant render
    if (typeof window !== 'undefined') {
      const cached = window.localStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as CachedRate;
          if (Date.now() - parsed.timestamp < REFRESH_INTERVAL * 5) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setRate(parsed.rate);
          }
        } catch {
          /* ignore */
        }
      }
    }

    const tick = async () => {
      setIsLoading(true);
      try {
        const r = await fetchNgnRate();
        if (cancelled) return;
        setRate(r);
        setError(null);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ rate: r, timestamp: Date.now() }),
          );
        }
      } catch (err) {
        if (cancelled) return;
        setError(String(err));
        // Keep last known rate, never zero out the UI
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void tick();
    const id = setInterval(tick, REFRESH_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return {
    rate: rate ?? FALLBACK_RATE,
    hasLiveRate: rate !== null,
    isLoading,
    error,
  };
}
