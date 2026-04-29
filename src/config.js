const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.eitherway.ai';

export const PROXY_API = (url) => `${API_BASE_URL}/api/proxy-api?url=${encodeURIComponent(url)}`;
export const PROXY_CDN = (url) => `${API_BASE_URL}/api/proxy-cdn?url=${encodeURIComponent(url)}`;
export const DIALECT_PROXY = `${API_BASE_URL}/api/dialect`;

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const SOL_MINT = 'So11111111111111111111111111111111111111112';
export const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

export const RPC_ENDPOINT = import.meta.env.VITE_HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com';

export const RISK_THRESHOLDS = {
  LOW: 25,
  MODERATE: 50,
  HIGH: 75,
  EXTREME: 100,
};

export const POSITION_SIZE_PCT = 0.02; // 2% of portfolio per trade
