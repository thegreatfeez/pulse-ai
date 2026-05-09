'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWallet } from '@/app/context/WalletContext';
import {
  getFlexibleVaultContract,
  getFixedVaultContract,
  getP2PTransferContract,
  getReadProvider,
} from '@/lib/contracts';
import { DEPLOYMENT_BLOCK, LOG_CHUNK_SIZE } from '@/lib/constants';
import type { HistoryEvent } from '@/types';
import type { EventLog } from 'ethers';

interface DecodedLogShape {
  blockNumber: number;
  transactionHash: string;
  args: Record<string, unknown>;
}

async function fetchEventsChunked(
  contract: ReturnType<typeof getFlexibleVaultContract>,
  filter: ReturnType<ReturnType<typeof getFlexibleVaultContract>['filters'][string]>,
  fromBlock: bigint,
  toBlock: bigint,
): Promise<EventLog[]> {
  const events: EventLog[] = [];
  let cursor = fromBlock;
  while (cursor <= toBlock) {
    const end = cursor + LOG_CHUNK_SIZE - 1n <= toBlock ? cursor + LOG_CHUNK_SIZE - 1n : toBlock;
    try {
      // ethers' queryFilter accepts number args; convert.
      const chunk = (await contract.queryFilter(filter, Number(cursor), Number(end))) as EventLog[];
      events.push(...chunk);
    } catch (err) {
      const msg = String(err);
      if (msg.includes('429') || msg.toLowerCase().includes('rate')) {
        await new Promise((r) => setTimeout(r, 1000));
        const chunk = (await contract.queryFilter(filter, Number(cursor), Number(end))) as EventLog[];
        events.push(...chunk);
      } else {
        throw err;
      }
    }
    cursor = end + 1n;
  }
  return events;
}

export function useHistory() {
  const { address, provider: walletProvider } = useWallet();
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!address) {
      setEvents([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Always go through our configured public RPC for eth_getLogs — the
      // wallet's RPC sometimes returns 502 for log queries on Base Sepolia.
      const reader = getReadProvider();
      const toBlock = BigInt(await reader.getBlockNumber());
      const flexible = getFlexibleVaultContract(reader);
      const fixed = getFixedVaultContract(reader);
      const p2p = getP2PTransferContract(reader);

      const [flexDeposits, flexWithdraws, fixedOpens, fixedCloses, p2pSent, p2pReceived] =
        await Promise.all([
          fetchEventsChunked(flexible, flexible.filters.Deposit(null, address), DEPLOYMENT_BLOCK, toBlock),
          fetchEventsChunked(flexible, flexible.filters.Withdraw(null, null, address), DEPLOYMENT_BLOCK, toBlock),
          fetchEventsChunked(fixed, fixed.filters.PositionOpened(address), DEPLOYMENT_BLOCK, toBlock),
          fetchEventsChunked(fixed, fixed.filters.PositionClosed(address), DEPLOYMENT_BLOCK, toBlock),
          fetchEventsChunked(p2p, p2p.filters.Sent(address), DEPLOYMENT_BLOCK, toBlock),
          fetchEventsChunked(p2p, p2p.filters.Sent(null, address), DEPLOYMENT_BLOCK, toBlock),
        ]);

      const decoded = (
        log: EventLog | DecodedLogShape,
      ): { blockNumber: bigint; txHash: `0x${string}`; args: Record<string, unknown> } => ({
        blockNumber: BigInt(log.blockNumber),
        txHash: log.transactionHash as `0x${string}`,
        args: (log.args ?? {}) as unknown as Record<string, unknown>,
      });

      const all: HistoryEvent[] = [
        ...flexDeposits.map((l) => {
          const d = decoded(l);
          return {
            type: 'flex_deposit' as const,
            txHash: d.txHash,
            blockNumber: d.blockNumber,
            amount: BigInt((d.args.assets ?? d.args[2]) as bigint | string | number),
          };
        }),
        ...flexWithdraws.map((l) => {
          const d = decoded(l);
          return {
            type: 'flex_withdraw' as const,
            txHash: d.txHash,
            blockNumber: d.blockNumber,
            amount: BigInt((d.args.assets ?? d.args[3]) as bigint | string | number),
          };
        }),
        ...fixedOpens.map((l) => {
          const d = decoded(l);
          return {
            type: 'fixed_open' as const,
            txHash: d.txHash,
            blockNumber: d.blockNumber,
            amount: BigInt((d.args.amount ?? d.args[2]) as bigint | string | number),
            positionId:
              d.args.positionId !== undefined
                ? BigInt(d.args.positionId as bigint | string | number)
                : undefined,
            unlockAt:
              d.args.unlockAt !== undefined
                ? BigInt(d.args.unlockAt as bigint | string | number)
                : undefined,
          };
        }),
        ...fixedCloses.map((l) => {
          const d = decoded(l);
          return {
            type: 'fixed_close' as const,
            txHash: d.txHash,
            blockNumber: d.blockNumber,
            amount: BigInt((d.args.amount ?? d.args[2]) as bigint | string | number),
            positionId:
              d.args.positionId !== undefined
                ? BigInt(d.args.positionId as bigint | string | number)
                : undefined,
          };
        }),
        ...p2pSent.map((l) => {
          const d = decoded(l);
          return {
            type: 'p2p_sent' as const,
            txHash: d.txHash,
            blockNumber: d.blockNumber,
            amount: BigInt((d.args.amount ?? d.args[2]) as bigint | string | number),
            counterparty: d.args.to as `0x${string}` | undefined,
            memo: d.args.memo as string | undefined,
          };
        }),
        ...p2pReceived.map((l) => {
          const d = decoded(l);
          return {
            type: 'p2p_received' as const,
            txHash: d.txHash,
            blockNumber: d.blockNumber,
            amount: BigInt((d.args.amount ?? d.args[2]) as bigint | string | number),
            counterparty: d.args.from as `0x${string}` | undefined,
            memo: d.args.memo as string | undefined,
          };
        }),
      ].sort((a, b) => (a.blockNumber > b.blockNumber ? -1 : a.blockNumber < b.blockNumber ? 1 : 0));

      const seen = new Set<string>();
      const deduplicated = all.filter((e) => {
        const key = `${e.txHash}-${e.type}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setEvents(deduplicated);
    } catch (err) {
      console.error('useHistory error', err);
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  }, [address, walletProvider]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refetch();
  }, [address, refetch]);

  return { events, isLoading, error, refetch };
}
