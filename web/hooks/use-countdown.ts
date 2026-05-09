'use client';
import { useState, useEffect } from 'react';

export function useCountdown(unlockAt: bigint): number {
  const [remaining, setRemaining] = useState<number>(() =>
    Math.max(0, Number(unlockAt) - Math.floor(Date.now() / 1000)),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(Math.max(0, Number(unlockAt) - Math.floor(Date.now() / 1000)));
    }, 1000);
    return () => clearInterval(id);
  }, [unlockAt]);

  return remaining;
}
