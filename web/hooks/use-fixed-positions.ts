'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWallet } from '@/app/context/WalletContext';
import { getFixedVaultContract, getReadProvider } from '@/lib/contracts';
import type { FixedPosition } from '@/types';

const REFRESH_INTERVAL = 15_000;

interface RawPosition {
  amount: bigint;
  unlockAt: bigint;
  withdrawn: boolean;
}

export function useFixedPositions() {
  const { address, provider } = useWallet();
  const [positions, setPositions] = useState<FixedPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!address) {
      setPositions([]);
      return;
    }
    setIsLoading(true);
    try {
      const reader = provider ?? getReadProvider();
      const contract = getFixedVaultContract(reader);
      const raw = (await contract.getPositions(address)) as RawPosition[];
      const now = Math.floor(Date.now() / 1000);
      setPositions(
        raw.map((p, i) => ({
          positionId: i,
          amount: BigInt(p.amount),
          unlockAt: BigInt(p.unlockAt),
          withdrawn: p.withdrawn,
          isUnlocked: now >= Number(p.unlockAt),
        })),
      );
    } catch (err) {
      console.error('useFixedPositions error', err);
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

  const activePositions = positions.filter((p) => !p.withdrawn);
  const closedPositions = positions.filter((p) => p.withdrawn);
  const lockedPositions = activePositions.filter((p) => !p.isUnlocked);
  const unlockedPositions = activePositions.filter((p) => p.isUnlocked);
  const totalLocked = activePositions.reduce((sum, p) => sum + p.amount, 0n);

  return {
    positions,
    activePositions,
    closedPositions,
    lockedPositions,
    unlockedPositions,
    totalLocked,
    isLoading,
    refetch,
  };
}
