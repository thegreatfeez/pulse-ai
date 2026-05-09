'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWallet } from '@/app/context/WalletContext';
import { getUsdcContract, getReadProvider } from '@/lib/contracts';

const REFRESH_INTERVAL = 15_000;

export function useUsdcBalance() {
  const { address, provider } = useWallet();
  const [balance, setBalance] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!address) {
      setBalance(null);
      return;
    }
    setIsLoading(true);
    try {
      // Prefer the wallet's provider for reads (no CORS, no rate limit).
      const reader = provider ?? getReadProvider();
      const contract = getUsdcContract(reader);
      const result = (await contract.balanceOf(address)) as bigint;
      setBalance(result);
    } catch (err) {
      console.error('useUsdcBalance error', err);
    } finally {
      setIsLoading(false);
    }
  }, [address, provider]);

  useEffect(() => {
    if (!address) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBalance(null);
      return;
    }
    void refetch();
    const id = setInterval(refetch, REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [address, refetch]);

  return { balance, isLoading, refetch };
}
