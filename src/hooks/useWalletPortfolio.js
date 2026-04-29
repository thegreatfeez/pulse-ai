import { useState, useEffect, useCallback, useRef } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { PROXY_API, TOKEN_PROGRAM_ID } from '../config';

export default function useWalletPortfolio(solPriceUsd) {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [portfolio, setPortfolio] = useState({
    solBalance: 0,
    tokens: [],
    totalValueUsd: 0,
    loading: true,
    error: null,
  });
  const cacheRef = useRef({ data: null, ts: 0 });

  const fetchPortfolio = useCallback(async () => {
    if (!connected || !publicKey) {
      setPortfolio({ solBalance: 0, tokens: [], totalValueUsd: 0, loading: false, error: null });
      return;
    }

    const now = Date.now();
    if (cacheRef.current.data && now - cacheRef.current.ts < 15000) {
      setPortfolio({ ...cacheRef.current.data, loading: false, error: null });
      return;
    }

    setPortfolio(prev => ({ ...prev, loading: true, error: null }));

    try {
      const solBalance = await connection.getBalance(publicKey);
      const solAmt = solBalance / LAMPORTS_PER_SOL;

      const tokenProgramId = new PublicKey(TOKEN_PROGRAM_ID);
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: tokenProgramId,
      });

      const holdings = tokenAccounts.value
        .map(acc => {
          const info = acc.account.data.parsed.info;
          return {
            mint: info.mint,
            amount: parseFloat(info.tokenAmount.uiAmountString || '0'),
            decimals: info.tokenAmount.decimals,
          };
        })
        .filter(t => t.amount > 0);

      // Enrich top 10 holdings with price data from DexScreener
      const enriched = [];
      const topHoldings = holdings.slice(0, 10);

      for (const token of topHoldings) {
        try {
          const url = PROXY_API(`https://api.dexscreener.com/latest/dex/tokens/${token.mint}`);
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            const pair = data.pairs?.find(p => p.chainId === 'solana');
            if (pair) {
              enriched.push({
                ...token,
                name: pair.baseToken.name,
                symbol: pair.baseToken.symbol,
                priceUsd: parseFloat(pair.priceUsd || '0'),
                valueUsd: parseFloat(pair.priceUsd || '0') * token.amount,
                priceChange24h: pair.priceChange?.h24 || 0,
                liquidity: pair.liquidity?.usd || 0,
                volume24h: pair.volume?.h24 || 0,
                pairAddress: pair.pairAddress,
                dexId: pair.dexId,
                pairCreatedAt: pair.pairCreatedAt,
                txns24h: (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0),
                fdv: pair.fdv || 0,
                imageUrl: pair.info?.imageUrl || null,
              });
              continue;
            }
          }
        } catch {
          // Skip enrichment for this token
        }
        enriched.push({
          ...token,
          name: `Token ${token.mint.slice(0, 6)}`,
          symbol: token.mint.slice(0, 4).toUpperCase(),
          priceUsd: 0,
          valueUsd: 0,
          priceChange24h: 0,
          liquidity: 0,
          volume24h: 0,
        });
      }

      const solValueUsd = solAmt * (solPriceUsd || 0);
      const tokenValueUsd = enriched.reduce((sum, t) => sum + (t.valueUsd || 0), 0);

      const result = {
        solBalance: solAmt,
        tokens: enriched,
        totalValueUsd: solValueUsd + tokenValueUsd,
      };

      cacheRef.current = { data: result, ts: now };
      setPortfolio({ ...result, loading: false, error: null });
    } catch (err) {
      console.error('[useWalletPortfolio]', err);
      setPortfolio(prev => ({ ...prev, loading: false, error: err.message }));
    }
  }, [connected, publicKey, connection, solPriceUsd]);

  useEffect(() => {
    fetchPortfolio();
    const interval = setInterval(fetchPortfolio, 30000);
    return () => clearInterval(interval);
  }, [fetchPortfolio]);

  return { ...portfolio, refresh: fetchPortfolio };
}
