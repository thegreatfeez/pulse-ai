import { Contract, type ContractRunner, type InterfaceAbi, JsonRpcProvider } from 'ethers';
import FixedVaultArtifact from './abi/FixedVault.json';
import FlexibleVaultArtifact from './abi/FlexibleVault.json';
import P2PTransferArtifact from './abi/P2PTransfer.json';

// ─── Network ──────────────────────────────────────────────────────────────────

export const BASE_SEPOLIA_CHAIN_ID = 84532;
export const BASE_SEPOLIA_CHAIN_ID_HEX = '0x14a34';

// CORS-friendly Base Sepolia RPCs. https://sepolia.base.org is the official
// endpoint but its CORS headers and getLogs limits can flake from the browser.
// publicnode supports eth_getLogs reliably for our chunk size; Blast was
// retired (returns "Blast API is no longer available") so it's removed.
export const FALLBACK_RPC_URLS = [
  'https://base-sepolia-rpc.publicnode.com',
  'https://sepolia.base.org',
];

export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ?? FALLBACK_RPC_URLS[0];

// ─── Deployed addresses (Base Sepolia) ────────────────────────────────────────

export const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
export const FIXED_VAULT_ADDRESS = '0xAc49f293D7b98119E45eCC4Fd528D480dea9F4A8';
export const FLEXIBLE_VAULT_ADDRESS = '0x56fB93B19bBaF700A4a9214388d664d1A25A699E';
export const P2P_TRANSFER_ADDRESS = '0x0C8d08a5d2e107b6f0F09025230C8458376062e7';

// ─── ABIs ─────────────────────────────────────────────────────────────────────

export const FIXED_VAULT_ABI = (FixedVaultArtifact as { abi: InterfaceAbi }).abi;
export const FLEXIBLE_VAULT_ABI = (FlexibleVaultArtifact as { abi: InterfaceAbi }).abi;
export const P2P_TRANSFER_ABI = (P2PTransferArtifact as { abi: InterfaceAbi }).abi;

// Minimal ERC-20 surface for USDC interactions.
export const USDC_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

// ─── Contract factories ───────────────────────────────────────────────────────

export const getFixedVaultContract = (runner: ContractRunner) =>
  new Contract(FIXED_VAULT_ADDRESS, FIXED_VAULT_ABI, runner);

export const getFlexibleVaultContract = (runner: ContractRunner) =>
  new Contract(FLEXIBLE_VAULT_ADDRESS, FLEXIBLE_VAULT_ABI, runner);

export const getP2PTransferContract = (runner: ContractRunner) =>
  new Contract(P2P_TRANSFER_ADDRESS, P2P_TRANSFER_ABI, runner);

export const getUsdcContract = (runner: ContractRunner) =>
  new Contract(USDC_ADDRESS, USDC_ABI, runner);

// ─── Read-only fallback provider (when wallet not connected) ─────────────────

let _readProvider: JsonRpcProvider | null = null;
export function getReadProvider(): JsonRpcProvider {
  if (!_readProvider) {
    // staticNetwork=true skips the chainId detection RPC call (one fewer round-trip)
    _readProvider = new JsonRpcProvider(RPC_URL, BASE_SEPOLIA_CHAIN_ID, {
      staticNetwork: true,
    });
  }
  return _readProvider;
}

// FallbackProvider: tries the next RPC if the current one errors or is slow.
// Builds lazily on first read because some Next.js SSR contexts choke on
// network construction at module load.
let _fallbackProvider: JsonRpcProvider | null = null;
export function getFallbackReadProvider(): JsonRpcProvider {
  if (_fallbackProvider) return _fallbackProvider;
  _fallbackProvider = new JsonRpcProvider(FALLBACK_RPC_URLS[1], BASE_SEPOLIA_CHAIN_ID, {
    staticNetwork: true,
  });
  return _fallbackProvider;
}
