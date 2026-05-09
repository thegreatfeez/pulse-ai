export type Address = `0x${string}`;
export type Hash = `0x${string}`;

export type HistoryEventType =
  | 'flex_deposit'
  | 'flex_withdraw'
  | 'fixed_open'
  | 'fixed_close'
  | 'p2p_sent'
  | 'p2p_received';

export interface HistoryEvent {
  type: HistoryEventType;
  txHash: Hash;
  blockNumber: bigint;
  amount: bigint;
  counterparty?: Address;
  memo?: string;
  positionId?: bigint;
  unlockAt?: bigint;
}

export interface FixedPosition {
  positionId: number;
  amount: bigint;
  unlockAt: bigint;
  withdrawn: boolean;
  isUnlocked: boolean;
}
