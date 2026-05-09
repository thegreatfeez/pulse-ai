import { useState, useCallback, useRef } from 'react';
import { computeRiskScore } from '../services/riskEngine';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile';
const HISTORY_KEY = 'pulse_ai_analysis_history';

function parseJsonContent(content) {
  try {
    return JSON.parse(content);
  } catch {
    const cleaned = String(content || '').replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  }
}

async function callGroq(prompt) {
  if (!GROQ_API_KEY) {
    throw new Error('Missing VITE_GROQ_API_KEY in .env');
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 700,
      temperature: 0.2,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || `Groq request failed (${res.status})`);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq returned empty response');
  return parseJsonContent(content);
}

function saveAnalysisHistory(item) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const prev = raw ? JSON.parse(raw) : [];
    const next = [item, ...prev].slice(0, 50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch (e) {
    console.warn('[saveAnalysisHistory]', e);
  }
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
      const prompt = `You are a Solana DeFi risk analyst. Analyze this token and return JSON only.

TOKEN DATA:
- Symbol: ${token.symbol}
- Name: ${token.name}
- Price: $${token.priceUsd}
- 24h Change: ${token.priceChange24h}%
- 1h Change: ${token.priceChange1h || 'N/A'}%
- 24h Volume: $${token.volume24h}
- Liquidity: $${token.liquidity}
- FDV: $${token.fdv}
- 24h Transactions: ${token.txns24h} (Buys: ${token.buys24h}, Sells: ${token.sells24h})
- DEX: ${token.dexId}
- Age: ${token.ageHours ? `${token.ageHours} hours` : 'Unknown'}
- Risk Score: ${risk.score}/100

Return valid JSON in this shape:
{
  "signal": "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL" | "AVOID",
  "confidence": 0-100,
  "summary": "2-3 sentence summary",
  "bullish_factors": ["factor1", "factor2"],
  "bearish_factors": ["factor1", "factor2"],
  "risk_assessment": "1 sentence risk note",
  "suggested_action": "What a trader should do right now in 1 sentence"
}`;

      const result = await callGroq(prompt);
      analysisCache.set(cacheKey, { data: result, ts: Date.now() });
      setAnalysis(result);

      saveAnalysisHistory({
        id: `${Date.now()}-${token.address || token.mint || token.symbol}`,
        analyzed_at: new Date().toISOString(),
        token_address: token.address || token.mint,
        token_name: token.name,
        token_symbol: token.symbol,
        rug_score: risk.score,
        ai_signal: result.signal || 'HOLD',
        ai_reasoning: result.summary || 'No summary returned',
      });

      setLoading(false);
      return result;
    } catch (err) {
      console.error('[useTokenAnalysis]', err);
      setError(err.message);
      setLoading(false);
      return null;
    }
  }, []);

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setLoading(false);
    setError(null);
  }, []);

  return { analysis, loading, error, analyze, clearAnalysis };
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

      const prompt = `You are a Solana market analyst. Return JSON only.

SOL price: ${solPrice || 'unknown'}
Portfolio: ${JSON.stringify(enrichedPortfolio)}
Top discovery tokens: ${JSON.stringify(enrichedDiscovery)}

Return JSON in this shape:
{
  "market_sentiment": "bullish" | "bearish" | "neutral" | "mixed",
  "sol_outlook": "1-2 sentence outlook",
  "portfolio_insights": ["insight1", "insight2"],
  "top_opportunities": ["opportunity1", "opportunity2"],
  "risk_warnings": ["warning1", "warning2"],
  "action_items": ["action1", "action2"]
}`;

      const result = await callGroq(prompt);
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

  const clearBrief = useCallback(() => {
    cacheRef.current = { data: null, ts: 0 };
    setBrief(null);
    setLoading(false);
    setError(null);
  }, []);

  return { brief, loading, error, fetchBrief, clearBrief };
}
