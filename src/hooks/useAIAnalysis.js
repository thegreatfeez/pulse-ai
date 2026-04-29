import { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { computeRiskScore } from '../services/riskEngine';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function callEdgeFunction(fnName, body) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${fnName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Edge function ${fnName} failed (${res.status})`);
  return data;
}

const analysisCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useTokenAnalysis() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyze = useCallback(async (token) => {
    if (!token) return;

    const cacheKey = token.address || token.mint;
    const cached = analysisCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setAnalysis(cached.data);
      return cached.data;
    }

    setLoading(true);
    setError(null);

    try {
      const risk = computeRiskScore(token);
      const payload = {
        token: {
          ...token,
          riskScore: risk.score,
        },
      };

      const data = await callEdgeFunction('analyze-token', payload);

      const result = data.analysis;
      analysisCache.set(cacheKey, { data: result, ts: Date.now() });
      setAnalysis(result);

      // Store in token_analysis table for history
      const { error: insertErr } = await supabase
        .from('token_analysis')
        .insert({
          token_address: token.address || token.mint,
          token_name: token.name,
          token_symbol: token.symbol,
          rug_score: risk.score,
          ai_signal: result.signal,
          ai_reasoning: result.summary,
          liquidity_usd: token.liquidity || 0,
          volume_24h: token.volume24h || 0,
          price_usd: token.priceUsd || 0,
          price_change_24h: token.priceChange24h || 0,
          market_cap: token.marketCap || token.fdv || 0,
          pair_address: token.pairAddress || null,
          dex_id: token.dexId || null,
          pair_created_at: token.pairCreatedAt || null,
        })
        .then(r => r, e => ({ error: e }));

      if (insertErr) console.warn('[token_analysis insert]', insertErr);

      setLoading(false);
      return result;
    } catch (err) {
      console.error('[useTokenAnalysis]', err);
      setError(err.message);
      setLoading(false);
      return null;
    }
  }, []);

  return { analysis, loading, error, analyze, clearAnalysis: () => setAnalysis(null) };
}

export function useMarketBrief() {
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cacheRef = useRef({ data: null, ts: 0 });

  const fetchBrief = useCallback(async (portfolio, solPrice, topDiscovery) => {
    if (cacheRef.current.data && Date.now() - cacheRef.current.ts < 3 * 60 * 1000) {
      setBrief(cacheRef.current.data);
      return cacheRef.current.data;
    }

    setLoading(true);
    setError(null);

    try {
      // Enrich discovery tokens with risk scores
      const enrichedDiscovery = (topDiscovery || []).slice(0, 8).map(t => ({
        symbol: t.symbol,
        priceUsd: t.priceUsd,
        priceChange24h: t.priceChange24h,
        volume24h: t.volume24h,
        liquidity: t.liquidity,
        riskScore: computeRiskScore(t).score,
      }));

      const enrichedPortfolio = portfolio ? {
        totalValueUsd: portfolio.totalValueUsd,
        solBalance: portfolio.solBalance,
        tokens: (portfolio.tokens || []).map(t => ({
          symbol: t.symbol,
          valueUsd: t.valueUsd,
          priceChange24h: t.priceChange24h,
          riskScore: computeRiskScore(t).score,
        })),
      } : null;

      const data = await callEdgeFunction('market-brief', {
        portfolio: enrichedPortfolio,
        solPrice,
        topDiscovery: enrichedDiscovery,
      });

      const result = data.brief;
      cacheRef.current = { data: result, ts: Date.now() };
      setBrief(result);
      setLoading(false);
      return result;
    } catch (err) {
      console.error('[useMarketBrief]', err);
      setError(err.message);
      setLoading(false);
      return null;
    }
  }, []);

  return { brief, loading, error, fetchBrief };
}
