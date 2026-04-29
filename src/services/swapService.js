import { DIALECT_PROXY, SOL_MINT } from '../config';

/**
 * Jupiter swap via Dialect proxy.
 * POST /api/dialect with { action: "jupiter_quote", ... } or { action: "jupiter_swap", ... }
 */

export async function getJupiterQuote(inputMint, outputMint, amount, slippageBps = 100) {
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount: String(amount),
    slippageBps: String(slippageBps),
  });

  const res = await fetch(`${DIALECT_PROXY}?action=jupiter_quote&${params.toString()}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jupiter quote failed: ${text}`);
  }
  return res.json();
}

export async function getJupiterSwapTx(quoteResponse, userPublicKey) {
  const res = await fetch(DIALECT_PROXY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'jupiter_swap',
      quoteResponse,
      userPublicKey: userPublicKey.toBase58(),
      wrapAndUnwrapSol: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jupiter swap tx failed: ${text}`);
  }
  return res.json();
}

export function lamportsFromSol(sol) {
  return Math.round(sol * 1e9);
}

export function formatSol(lamports) {
  return (lamports / 1e9).toFixed(4);
}

export function estimateSwapValue(amountIn, quote) {
  if (!quote?.outAmount) return 0;
  return parseFloat(quote.outAmount);
}
