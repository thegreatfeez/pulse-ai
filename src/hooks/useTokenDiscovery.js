import { useState, useEffect, useCallback, useRef } from 'react';
import { PROXY_API } from '../config';

const SEARCH_QUERIES = ['SOL', 'solana meme', 'solana new'];

export default function useTokenDiscovery() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cacheRef = useRef({ data: null, ts: 0 });

  const fetchTokens = useCallback(async () => {
    const now = Date.now();
    if (cacheRef.current.data && now - cacheRef.current.ts < 60000) {
      setTokens(cacheRef.current.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const allPairs = [];
      const seenAddresses = new Set();

      for (const query of SEARCH_QUERIES) {
        try {
          const url = PROXY_API(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`);
          const res = await fetch(url);
          if (!res.ok) continue;
          const data = await res.json();

          const solanaPairs = (data.pairs || []).filter(
            p => p.chainId === 'solana' && !seenAddresses.has(p.baseToken.address)
          );

          for (const pair of solanaPairs) {
            seenAddresses.add(pair.baseToken.address);
            allPairs.push(pair);
          }
        } catch {
          // Skip this query
        }
      }

      // Sort by volume, take top 50
      const sorted = allPairs
        .sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))
        .slice(0, 50);

      const mapped = sorted.map(pair => ({
        address: pair.baseToken.address,
        name: pair.baseToken.name,
        symbol: pair.baseToken.symbol,
        priceUsd: parseFloat(pair.priceUsd || '0'),
        priceChange24h: pair.priceChange?.h24 || 0,
        priceChange1h: pair.priceChange?.h1 || 0,
        volume24h: pair.volume?.h24 || 0,
        liquidity: pair.liquidity?.usd || 0,
        fdv: pair.fdv || 0,
        marketCap: pair.marketCap || pair.fdv || 0,
        pairAddress: pair.pairAddress,
        dexId: pair.dexId,
        pairCreatedAt: pair.pairCreatedAt,
        txns24h: (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0),
        buys24h: pair.txns?.h24?.buys || 0,
        sells24h: pair.txns?.h24?.sells || 0,
        imageUrl: pair.info?.imageUrl || null,
        dexUrl: pair.url,
        ageHours: pair.pairCreatedAt
          ? Math.round((Date.now() - pair.pairCreatedAt) / 3600000)
          : null,
      }));

      cacheRef.current = { data: mapped, ts: now };
      setTokens(mapped);
    } catch (err) {
      console.error('[useTokenDiscovery]', err);
      setError(err.message);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTokens();
    const interval = setInterval(fetchTokens, 60000);
    return () => clearInterval(interval);
  }, [fetchTokens]);

  return { tokens, loading, error, refresh: fetchTokens };
}
