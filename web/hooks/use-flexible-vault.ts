'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWallet } from '@/app/context/WalletContext';
import { getFlexibleVaultContract, getReadProvider } from '@/lib/contracts';

const REFRESH_INTERVAL = 15_000;

export function useFlexibleVault() {
  const { address, provider } = useWallet();
  const [shares, setShares] = useState<bigint | null>(null);
  const [totalAssets, setTotalAssets] = useState<bigint | null>(null);
  const [maxWithdrawUsdc, setMaxWithdraw] = useState<bigint | null>(null);
  const [depositedUsdc, setDeposited] = useState<bigint>(0n);
  const [isLoading, setIsLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!address) {
      setShares(null);
      setTotalAssets(null);
      setMaxWithdraw(null);
      setDeposited(0n);
      return;
    }
    setIsLoading(true);
    try {
      const reader = provider ?? getReadProvider();
      const contract = getFlexibleVaultContract(reader);
      const [bal, ta, mw] = (await Promise.all([
        contract.balanceOf(address),
        contract.totalAssets(),
        contract.maxWithdraw(address),
      ])) as [bigint, bigint, bigint];

      setShares(bal);
      setTotalAssets(ta);
      setMaxWithdraw(mw);

      if (bal > 0n) {
        const dep = (await contract.convertToAssets(bal)) as bigint;
        setDeposited(dep);
      } else {
        setDeposited(0n);
      }
    } catch (err) {
      console.error('useFlexibleVault error', err);
    } finally {
      setIsLoading(false);
    }
  }, [address, provider]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refetch();
    if (!address) return;
    const id = setInterval(refetch, REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [address, refetch]);

  return { shares, totalAssets, maxWithdrawUsdc, depositedUsdc, isLoading, refetch };
}
