import type { TransactionResponse } from 'ethers';

interface EthersErrorShape {
  code?: string | number;
  reason?: string;
  shortMessage?: string;
  message?: string;
  info?: { error?: { message?: string }; code?: number };
  revert?: { name?: string; args?: unknown[] };
}

const CONTRACT_ERROR_COPY: Record<string, string> = {
  ZeroAmount: 'Amount must be greater than 0.',
  ZeroAddress: 'Recipient address cannot be zero.',
  SelfTransfer: 'Cannot send USDC to yourself.',
  MemoTooLong: 'Memo exceeds 256 bytes. Please shorten it.',
  InvalidLockDuration: 'Invalid lock duration. Choose 30, 60, or 90 days.',
  AmountTooLarge: 'Amount is too large for a single position.',
  PositionNotFound: 'Position not found.',
  AlreadyWithdrawn: 'This position has already been withdrawn.',
  NotYetUnlocked: 'This position is still locked. Please wait until the unlock date.',
  ERC20InsufficientAllowance: 'Insufficient USDC approval. Please approve first.',
  ERC20InsufficientBalance: 'Insufficient USDC balance.',
};

export function parseContractError(error: unknown): string {
  if (!error) return 'Unknown error occurred.';

  const e = error as EthersErrorShape;

  // User rejected from wallet (MetaMask error code 4001 / ACTION_REJECTED)
  if (e.code === 'ACTION_REJECTED' || e.code === 4001 || e.info?.code === 4001) {
    return 'Transaction rejected by wallet.';
  }
  const msg = (e.shortMessage ?? e.message ?? '').toLowerCase();
  if (msg.includes('user rejected') || msg.includes('user denied') || msg.includes('rejected the request')) {
    return 'Transaction rejected by wallet.';
  }

  // Custom error name from revert data
  const errorName = e.revert?.name;
  if (errorName && CONTRACT_ERROR_COPY[errorName]) {
    return CONTRACT_ERROR_COPY[errorName];
  }

  // Heuristic: scan reason text for known custom errors
  const reasonText = (e.reason ?? e.shortMessage ?? e.message ?? '').toString();
  for (const [name, copy] of Object.entries(CONTRACT_ERROR_COPY)) {
    if (reasonText.includes(name)) return copy;
  }

  if (msg.includes('insufficient funds')) {
    return 'Insufficient ETH for gas.';
  }
  if (msg.includes('network changed')) {
    return 'Network changed during transaction. Please try again on Base Sepolia.';
  }

  return e.shortMessage ?? e.reason ?? e.message ?? String(error);
}

export async function waitForTx(tx: TransactionResponse) {
  const receipt = await tx.wait();
  if (!receipt) throw new Error('Transaction was dropped.');
  if (receipt.status === 0) throw new Error('Transaction reverted on-chain.');
  return receipt;
}
