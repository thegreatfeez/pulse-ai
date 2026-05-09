export const DEPLOYMENT_BLOCK = 40_599_260n;

export const USDC_DECIMALS = 6;

export const LOCK_DURATIONS = {
  LOCK_30_DAYS: 2_592_000n,
  LOCK_60_DAYS: 5_184_000n,
  LOCK_90_DAYS: 7_776_000n,
} as const;

export const LOCK_DURATION_LABELS: Record<string, string> = {
  '2592000': '30 Days',
  '5184000': '60 Days',
  '7776000': '90 Days',
};

export const MAX_UINT256 = 2n ** 256n - 1n;
export const MAX_MEMO_BYTES = 256;

// Coinbase's public Base Sepolia RPC caps eth_getLogs at 1000 blocks per request.
export const LOG_CHUNK_SIZE: bigint = (() => {
  const env = process.env.NEXT_PUBLIC_LOG_CHUNK_SIZE;
  if (env && /^\d+$/.test(env)) return BigInt(env);
  return 999n;
})();

export const BASESCAN_TX_BASE = 'https://sepolia.basescan.org/tx/';
export const BASESCAN_ADDR_BASE = 'https://sepolia.basescan.org/address/';
