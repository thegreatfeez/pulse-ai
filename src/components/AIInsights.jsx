import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useMarketBrief, useTokenAnalysis } from '../hooks/useAIAnalysis';
import useAnalysisHistory from '../hooks/useAnalysisHistory';
import useSolPrice from '../hooks/useSolPrice';
import useWalletPortfolio from '../hooks/useWalletPortfolio';
import useTokenDiscovery from '../hooks/useTokenDiscovery';
import RiskGauge from './RiskGauge';
import { computeRiskScore } from '../services/riskEngine';
import usePulseProtocol from '../hooks/usePulseProtocol';
import { buildAdviceCommitmentPayloads } from '../lib/commitmentSchema';

const SIGNAL_CONFIG = {
  STRONG_BUY: { color: 'text-emerald-400', bg: 'bg-emerald-600/15', icon: '▲▲' },
  BUY: { color: 'text-emerald-400', bg: 'bg-emerald-600/10', icon: '▲' },
  HOLD: { color: 'text-yellow-400', bg: 'bg-yellow-600/10', icon: '●' },
  SELL: { color: 'text-orange-400', bg: 'bg-orange-600/10', icon: '▼' },
  STRONG_SELL: { color: 'text-red-400', bg: 'bg-red-600/15', icon: '▼▼' },
  AVOID: { color: 'text-red-600', bg: 'bg-red-600/20', icon: '✕' },
};

const SENTIMENT_CONFIG = {
  bullish: { color: 'text-emerald-400', bg: 'bg-emerald-600/10 border-emerald-600/20', label: 'Bullish', icon: '📈' },
  bearish: { color: 'text-red-400', bg: 'bg-red-600/10 border-red-600/20', label: 'Bearish', icon: '📉' },
  neutral: { color: 'text-slate-400', bg: 'bg-slate-600/10 border-slate-600/20', label: 'Neutral', icon: '➡' },
  mixed: { color: 'text-yellow-400', bg: 'bg-yellow-600/10 border-yellow-600/20', label: 'Mixed', icon: '↕' },
};

function MarketBriefCard({ brief, loading, onRefresh }) {
  if (loading) {
    return (
      <div className="bg-pulse-card border border-pulse-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 border-2 border-pulse-accent border-t-transparent rounded-full animate-spin" />
          <div>
            <p className="font-semibold text-sm">Generating Market Brief...</p>
            <p className="text-xs text-slate-600">Pulse AI is analyzing market conditions</p>
          </div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-4 bg-slate-800 rounded animate-pulse" style={{ width: `${80 - i * 15}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="bg-pulse-card border border-pulse-border rounded-xl p-6 text-center">
        <div className="text-3xl mb-3">🤖</div>
        <h3 className="font-semibold mb-1">AI Market Brief</h3>
        <p className="text-sm text-slate-400 mb-4">Get AI-powered market insights and portfolio analysis</p>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-pulse-accent hover:bg-pulse-accent/90 rounded-lg text-sm font-medium transition"
        >
          Generate Brief
        </button>
      </div>
    );
  }

  const sentiment = SENTIMENT_CONFIG[brief.market_sentiment] || SENTIMENT_CONFIG.neutral;

  return (
    <div className="bg-pulse-card border border-pulse-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-pulse-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{sentiment.icon}</span>
          <h3 className="font-semibold">AI Market Brief</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sentiment.bg} ${sentiment.color}`}>
            {sentiment.label}
          </span>
        </div>
        <button
          onClick={onRefresh}
          className="text-xs text-slate-400 hover:text-white transition px-2 py-1 rounded hover:bg-slate-800"
        >
          Refresh
        </button>
      </div>

      <div className="p-5 space-y-4">
        {brief.sol_outlook && (
          <div className="bg-slate-800/40 rounded-lg p-3">
            <b className="text-xs text-slate-600 uppercase tracking-wider mb-1">SOL Outlook</b>
            <p className="text-sm">{brief.sol_outlook}</p>
          </div>
        )}

        {brief.portfolio_insights?.length > 0 && (
          <div>
            <b className="text-xs text-slate-600 uppercase tracking-wider mb-2">Portfolio Insights</b>
            <div className="space-y-1.5">
              {brief.portfolio_insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-pulse-accent shrink-0 mt-0.5">→</span>
                  <span className="text-slate-300">{insight}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {brief.top_opportunities?.length > 0 && (
          <div>
            <p className="text-xs text-slate-600 uppercase tracking-wider mb-2">Opportunities</p>
            <div className="space-y-1.5">
              {brief.top_opportunities.map((opp, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-pulse-green shrink-0 mt-0.5">◆</span>
                  <span className="text-slate-300">{opp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {brief.risk_warnings?.length > 0 && (
          <div>
            <b className="text-xs text-slate-600 uppercase tracking-wider mb-2">Risk Warnings</b>
            <div className="space-y-1.5">
              {brief.risk_warnings.map((warn, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-pulse-red shrink-0 mt-0.5">⚠</span>
                  <span className="text-slate-300">{warn}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {brief.action_items?.length > 0 && (
          <div className="bg-pulse-accent/5 border border-pulse-accent/20 rounded-lg p-3">
            <p className="text-xs text-pulse-accent uppercase tracking-wider mb-2 font-medium">Action Items</p>
            <div className="space-y-1.5">
              {brief.action_items.map((action, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-pulse-accent shrink-0 mt-0.5">{i + 1}.</span>
                  <span className="text-slate-300">{action}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TokenAnalysisCard({ token, analysis, loading, onAnalyze }) {
  const risk = token ? computeRiskScore(token) : null;
  const signalCfg = analysis ? (SIGNAL_CONFIG[analysis.signal] || SIGNAL_CONFIG.HOLD) : null;

  return (
    <div className="bg-pulse-card border border-pulse-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-pulse-border">
        <h3 className="font-semibold text-sm">Quick Token Analysis</h3>
        <p className="text-xs text-slate-600 mt-0.5">Select a token from Discover to get AI analysis</p>
      </div>

      {!token ? (
        <div className="p-8 text-center text-slate-600 text-sm">
          No token selected. Browse the Discover tab and click a token.
        </div>
      ) : (
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center font-bold">
                {token.symbol?.[0] || '?'}
              </div>
              <div>
                <p className="font-semibold">{token.symbol}</p>
                <p className="text-xs text-slate-400">{token.name}</p>
              </div>
            </div>
            {risk && <RiskGauge score={risk.score} size="sm" />}
          </div>

          {loading ? (
            <div className="flex items-center gap-3 py-4">
              <div className="w-5 h-5 border-2 border-pulse-cyan border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-slate-400">Pulse AI is analyzing {token.symbol}...</span>
            </div>
          ) : analysis ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className={`text-lg px-3 py-1.5 rounded-lg font-bold ${signalCfg.bg} ${signalCfg.color}`}>
                  {signalCfg.icon} {analysis.signal?.replace('_', ' ')}
                </span>
                {analysis.confidence != null && (
                  <span className="text-xs text-slate-400">
                    Confidence: {analysis.confidence}%
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-300">{analysis.summary}</p>

              {analysis.bullish_factors?.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Bullish</p>
                  {analysis.bullish_factors.map((f, i) => (
                    <p key={i} className="text-xs text-pulse-green flex items-start gap-1.5">
                      <span className="shrink-0">+</span> {f}
                    </p>
                  ))}
                </div>
              )}

              {analysis.bearish_factors?.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Bearish</p>
                  {analysis.bearish_factors.map((f, i) => (
                    <p key={i} className="text-xs text-pulse-red flex items-start gap-1.5">
                      <span className="shrink-0">-</span> {f}
                    </p>
                  ))}
                </div>
              )}

              {analysis.suggested_action && (
                <div className="bg-slate-800/40 rounded-lg p-2.5">
                  <p className="text-xs text-slate-400">Suggested Action</p>
                  <p className="text-sm font-medium mt-0.5">{analysis.suggested_action}</p>
                </div>
              )}

              <button
                onClick={() => onAnalyze(token)}
                className="text-xs text-pulse-accent hover:underline"
              >
                Re-analyze
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAnalyze(token)}
              className="w-full py-2.5 bg-pulse-accent/10 border border-pulse-accent/30 rounded-lg text-sm font-medium text-pulse-accent hover:bg-pulse-accent/20 transition"
            >
              Analyze with Pulse AI
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function AnalysisHistoryRow({ item }) {
  const signalCfg = SIGNAL_CONFIG[item.ai_signal] || SIGNAL_CONFIG.HOLD;
  const timeAgo = getTimeAgo(item.analyzed_at);

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/30 transition">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0">
        {item.token_symbol?.[0] || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{item.token_symbol}</span>
          {item.ai_signal && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${signalCfg.bg} ${signalCfg.color}`}>
              {item.ai_signal.replace('_', ' ')}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-600 truncate">{item.ai_reasoning}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs text-slate-400">Risk {item.rug_score}</p>
        <p className="text-[10px] text-slate-600">{timeAgo}</p>
      </div>
    </div>
  );
}

function getTimeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AIInsights({ selectedToken, onSelectToken }) {
  const { connected, publicKey } = useWallet();
  const { price } = useSolPrice();
  const portfolio = useWalletPortfolio(price?.usd);
  const { tokens: discoveryTokens } = useTokenDiscovery();
  const { brief, loading: briefLoading, fetchBrief, clearBrief } = useMarketBrief();
  const { analysis, loading: analysisLoading, analyze, clearAnalysis } = useTokenAnalysis();
  const { history, loading: historyLoading, refresh: refreshHistory } = useAnalysisHistory();
  const { recordAdviceCommitment } = usePulseProtocol();

  const handleGenerateBrief = () => {
    fetchBrief(
      connected ? portfolio : null,
      price?.usd,
      discoveryTokens
    );
  };

  const handleAnalyzeToken = (token) => {
    analyze(token).then(async (result) => {
      if (connected && publicKey && result) {
        try {
          const nonce = BigInt(Date.now());
          const riskScore = computeRiskScore(token).score;
          const { contextPayload, advicePayload } = buildAdviceCommitmentPayloads({
            wallet: publicKey.toBase58(),
            token: token.address || token.mint,
            portfolioValueUsd: portfolio.totalValueUsd,
            solPriceUsd: price?.usd || null,
            analysis: result,
            riskScore,
          });
          const portfolioValueLamports = Math.max(
            0,
            Math.floor((portfolio.totalValueUsd || 0) / (price?.usd || 1) * 1e9)
          );

          await recordAdviceCommitment({
            nonce,
            advicePayload,
            contextPayload,
            portfolioValueLamports,
            riskScore,
          });
        } catch (e) {
          console.warn('[recordAdviceCommitment]', e);
        }
      }

      // Refresh history after new analysis
      setTimeout(refreshHistory, 1000);
    });
  };

  // Auto-analyze when a new token is selected
  useEffect(() => {
    if (selectedToken) {
      handleAnalyzeToken(selectedToken);
    }
  }, [selectedToken?.address, selectedToken?.mint]);

  useEffect(() => {
    if (connected) return;

    clearBrief();
    clearAnalysis();
  }, [connected, clearBrief, clearAnalysis]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Pulse AI Insights</h2>
          <p className="text-sm text-slate-400 mt-0.5">AI-powered market analysis and token signals</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <MarketBriefCard
            brief={brief}
            loading={briefLoading}
            onRefresh={handleGenerateBrief}
          />

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-pulse-card border border-pulse-border rounded-xl p-3 text-center">
              <b className="text-xs text-slate-600">SOL Price</b>
              <p className="text-sm font-bold mt-1">${price?.usd?.toFixed(2) || '--'}</p>
              {price?.change24h != null && (
                <p className={`text-[10px] mt-0.5 ${price.change24h >= 0 ? 'text-pulse-green' : 'text-pulse-red'}`}>
                  {price.change24h >= 0 ? '+' : ''}{price.change24h.toFixed(1)}%
                </p>
              )}
            </div>
            <div className="bg-pulse-card border border-pulse-border rounded-xl p-3 text-center">
              <b className="text-xs text-slate-600">Tokens Tracked</b>
              <p className="text-sm font-bold mt-1">{discoveryTokens.length}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">live pairs</p>
            </div>
            <div className="bg-pulse-card border border-pulse-border rounded-xl p-3 text-center">
              <b className="text-xs text-slate-600">Analyses Run</b>
              <p className="text-sm font-bold mt-1">{history.length}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">this session</p>
            </div>
          </div>
        </div>

        {/* Right Column - Token Analysis */}
        <div className="space-y-4">
          <TokenAnalysisCard
            token={selectedToken}
            analysis={selectedToken ? analysis : null}
            loading={analysisLoading}
            onAnalyze={handleAnalyzeToken}
          />

          {/* Analysis History */}
          <div className="bg-pulse-card border border-pulse-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-pulse-border flex items-center justify-between">
              <h3 className="font-semibold text-sm">Analysis History</h3>
              <button
                onClick={refreshHistory}
                className="text-xs text-slate-400 hover:text-white transition"
              >
                Refresh
              </button>
            </div>
            {historyLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-pulse-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-600">
                No analyses yet. Select a token to get started.
              </div>
            ) : (
              <div className="divide-y divide-pulse-border max-h-[320px] overflow-y-auto">
                {history.map(item => (
                  <AnalysisHistoryRow key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
