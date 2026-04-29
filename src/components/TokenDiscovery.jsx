import { useState, useMemo } from 'react';
import useTokenDiscovery from '../hooks/useTokenDiscovery';
import { computeRiskScore, generateSignals, getPositionSizeRecommendation } from '../services/riskEngine';
import RiskGauge from './RiskGauge';

function formatNumber(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toFixed(0);
}

function TokenCard({ token, onSelect }) {
  const risk = computeRiskScore(token);
  const signals = generateSignals(token);

  return (
    <div
      onClick={() => onSelect?.(token)}
      className="bg-pulse-card border border-pulse-border rounded-xl p-4 hover:border-pulse-accent/50 transition cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold shrink-0">
            {token.symbol?.[0] || '?'}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate group-hover:text-pulse-accent transition">{token.symbol}</p>
            <p className="text-xs text-slate-500 truncate">{token.name}</p>
          </div>
        </div>
        <RiskGauge score={risk.score} size="sm" />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div>
          <span className="text-slate-500">Price</span>
          <p className="font-medium">${token.priceUsd < 0.001 ? token.priceUsd.toExponential(2) : token.priceUsd.toFixed(4)}</p>
        </div>
        <div>
          <span className="text-slate-500">24h</span>
          <p className={`font-medium ${token.priceChange24h >= 0 ? 'text-pulse-green' : 'text-pulse-red'}`}>
            {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h?.toFixed(1)}%
          </p>
        </div>
        <div>
          <span className="text-slate-500">Vol 24h</span>
          <p className="font-medium">${formatNumber(token.volume24h)}</p>
        </div>
        <div>
          <span className="text-slate-500">Liquidity</span>
          <p className="font-medium">${formatNumber(token.liquidity)}</p>
        </div>
        <div>
          <span className="text-slate-500">FDV</span>
          <p className="font-medium">${formatNumber(token.fdv)}</p>
        </div>
        <div>
          <span className="text-slate-500">Txns 24h</span>
          <p className="font-medium">{formatNumber(token.txns24h)}</p>
        </div>
      </div>

      {signals.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {signals.slice(0, 3).map((s, i) => (
            <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              s.type === 'danger' ? 'bg-red-500/15 text-red-400' :
              s.type === 'alert' ? 'bg-orange-500/15 text-orange-400' :
              s.type === 'warning' ? 'bg-yellow-500/15 text-yellow-400' :
              'bg-emerald-500/15 text-emerald-400'
            }`}>
              {s.label}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-pulse-border text-xs text-slate-500 flex items-center justify-between">
        <span>{token.dexId}</span>
        {token.ageHours !== null && (
          <span>{token.ageHours >= 24 ? Math.round(token.ageHours / 24) + 'd' : token.ageHours + 'h'} old</span>
        )}
      </div>
    </div>
  );
}

export default function TokenDiscovery({ onSelectToken }) {
  const { tokens, loading, error, refresh } = useTokenDiscovery();
  const [sortBy, setSortBy] = useState('volume');
  const [filterRisk, setFilterRisk] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    let list = [...tokens];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => t.name.toLowerCase().includes(q) || t.symbol.toLowerCase().includes(q));
    }

    if (filterRisk !== 'all') {
      list = list.filter(t => {
        const risk = computeRiskScore(t);
        if (filterRisk === 'low') return risk.score <= 25;
        if (filterRisk === 'moderate') return risk.score > 25 && risk.score <= 50;
        if (filterRisk === 'high') return risk.score > 50;
        return true;
      });
    }

    list.sort((a, b) => {
      if (sortBy === 'volume') return (b.volume24h || 0) - (a.volume24h || 0);
      if (sortBy === 'change') return (b.priceChange24h || 0) - (a.priceChange24h || 0);
      if (sortBy === 'liquidity') return (b.liquidity || 0) - (a.liquidity || 0);
      if (sortBy === 'risk') return computeRiskScore(a).score - computeRiskScore(b).score;
      return 0;
    });

    return list;
  }, [tokens, sortBy, filterRisk, searchQuery]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Token Discovery</h2>
        <button
          onClick={refresh}
          disabled={loading}
          className="px-3 py-1.5 text-xs bg-pulse-card border border-pulse-border rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
        >
          {loading ? 'Scanning...' : 'Refresh'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Search tokens..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="bg-pulse-card border border-pulse-border rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pulse-accent flex-1 min-w-[150px]"
        />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="bg-pulse-card border border-pulse-border rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-pulse-accent"
        >
          <option value="volume">Sort: Volume</option>
          <option value="change">Sort: 24h Change</option>
          <option value="liquidity">Sort: Liquidity</option>
          <option value="risk">Sort: Lowest Risk</option>
        </select>
        <select
          value={filterRisk}
          onChange={e => setFilterRisk(e.target.value)}
          className="bg-pulse-card border border-pulse-border rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-pulse-accent"
        >
          <option value="all">All Risk Levels</option>
          <option value="low">Low Risk Only</option>
          <option value="moderate">Moderate Risk</option>
          <option value="high">High Risk</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading && tokens.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-pulse-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-400">Scanning Solana DEXes...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(token => (
            <TokenCard key={token.address} token={token} onSelect={onSelectToken} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500 text-sm">
              No tokens match your filters
            </div>
          )}
        </div>
      )}
    </div>
  );
}
