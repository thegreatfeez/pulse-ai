import { formatUnits, parseUnits } from 'ethers';
import { USDC_DECIMALS, LOCK_DURATION_LABELS } from './constants';

export function formatUsdc(raw: bigint | undefined | null, fractionDigits = 2): string {
  if (raw === undefined || raw === null) return '—';
  const num = parseFloat(formatUnits(raw, USDC_DECIMALS));
  return num.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function parseUsdcInput(input: string): bigint {
  const sanitized = input.replace(/,/g, '').trim();
  if (!sanitized || isNaN(Number(sanitized))) throw new Error('Invalid amount');
  if (Number(sanitized) <= 0) throw new Error('Amount must be greater than 0');
  return parseUnits(sanitized, USDC_DECIMALS);
}

export function shortenAddress(address: string | undefined | null): string {
  if (!address || address.length < 10) return address ?? '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function lockSecondsToLabel(lockSeconds: bigint): string {
  return LOCK_DURATION_LABELS[lockSeconds.toString()] ?? `${Number(lockSeconds) / 86400} Days`;
}

export function lockSecondsToUnlockDate(lockSeconds: bigint): string {
  const unlockDate = new Date(Date.now() + Number(lockSeconds) * 1000);
  return unlockDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatUnlockDate(unlockAt: bigint): string {
  return new Date(Number(unlockAt) * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function validateMemo(memo: string): string | null {
  const bytes = new TextEncoder().encode(memo);
  if (bytes.length > 256) return `Memo too long (${bytes.length}/256 bytes)`;
  return null;
}

export function memoBytesUsed(memo: string): number {
  return new TextEncoder().encode(memo).length;
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return 'Unlocked';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

const DEPLOYMENT_BLOCK_NUM = 40_599_260n;
const DEPLOYMENT_TIMESTAMP = 1_714_000_000;

export function approximateDateFromBlock(blockNumber: bigint): string {
  const secondsSinceDeploy = Number(blockNumber - DEPLOYMENT_BLOCK_NUM) * 2;
  const date = new Date((DEPLOYMENT_TIMESTAMP + secondsSinceDeploy) * 1000);
  return timeAgo(date);
}

export function isAddressLike(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}
