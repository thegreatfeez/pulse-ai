import { useWallet } from '@solana/wallet-adapter-react';
import useSolPrice from '../hooks/useSolPrice';
import useWalletPortfolio from '../hooks/useWalletPortfolio';
import RiskGauge from './RiskGauge';
import { computeRiskScore, generateSignals } from '../services/riskEngine';

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="bg-pulse-card border border-pulse-border rounded-xl p-4">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-xl font-bold ${accent || 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function TokenRow({ token, onClick }) {
  const risk = computeRiskScore(token);
  const signals = generateSignals(token);

  return (
    <div
      onClick={() => onClick?.(token)}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition cursor-pointer border border-transparent hover:border-pulse-border"
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pulse-accent to-pulse-cyan flex items-center justify-center text-xs font-bold shrink-0">
        {token.symbol?.[0] || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{token.symbol}</span>
          <span className="text-xs text-slate-500 truncate">{token.name}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-400">${token.priceUsd?.toFixed(6)}</span>
          <span className={`text-xs ${token.priceChange24h >= 0 ? 'text-pulse-green' : 'text-pulse-red'}`}>
            {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h?.toFixed(1)}%
          </span>
        </div>
        {signals.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {signals.slice(0, 2).map((s, i) => (
              <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                s.type === 'danger' ? 'bg-red-500/20 text-red-400' :
                s.type === 'alert' ? 'bg-orange-500/20 text-orange-400' :
                s.type === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-emerald-500/20 text-emerald-400'
              }`}>{s.label}</span>
            ))}
          </div>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-medium">${(token.valueUsd || 0).toFixed(2)}</p>
        <p className="text-xs text-slate-500">{token.amount?.toFixed(2)} tokens</p>
      </div>
      <RiskGauge score={risk.score} size="sm" />
    </div>
  );
}

export default function Dashboard({ onSelectToken }) {
  const { connected, publicKey } = useWallet();
  const { price } = useSolPrice();
  const portfolio = useWalletPortfolio(price?.usd);

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pulse-accent to-pulse-cyan flex items-center justify-center text-3xl font-bold mb-6">
          P
        </div>
        <h2 className="text-2xl font-bold mb-2">Welcome to Solana Pulse AI</h2>
        <p className="text-slate-400 text-center max-w-md mb-8">
          Connect your Solana wallet to access real-time risk analysis, portfolio tracking,
          token discovery with AI-powered signals, and Jupiter-powered swaps.
        </p>
        <div className="grid grid-cols-2 gap-3 max-w-sm w-full text-center">
          <div className="bg-pulse-card rounded-xl p-4 border border-pulse-border">
            <div className="text-2xl mb-2">🛡</div>
            <p className="text-sm font-medium">Risk Scoring</p>
            <p className="text-xs text-slate-500">5-factor analysis</p>
          </div>
          <div className="bg-pulse-card rounded-xl p-4 border border-pulse-border">
            <div className="text-2xl mb-2">📊</div>
            <p className="text-sm font-medium">Portfolio</p>
            <p className="text-xs text-slate-500">Real-time tracking</p>
          </div>
          <div className="bg-pulse-card rounded-xl p-4 border border-pulse-border">
            <div className="text-2xl mb-2">🔍</div>
            <p className="text-sm font-medium">Discovery</p>
            <p className="text-xs text-slate-500">Trending tokens</p>
          </div>
          <div className="bg-pulse-card rounded-xl p-4 border border-pulse-border">
            <div className="text-2xl mb-2">⚡</div>
            <p className="text-sm font-medium">Swap</p>
            <p className="text-xs text-slate-500">Jupiter-powered</p>
          </div>
        </div>
      </div>
    );
  }

  const avgRisk = portfolio.tokens.length > 0
    ? Math.round(portfolio.tokens.reduce((sum, t) => sum + computeRiskScore(t).score, 0) / portfolio.tokens.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Portfolio Dashboard</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}
          </p>
        </div>
        <button
          onClick={portfolio.refresh}
          disabled={portfolio.loading}
          className="px-3 py-1.5 text-xs bg-pulse-card border border-pulse-border rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
        >
          {portfolio.loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Value"
          value={`$${portfolio.totalValueUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
        />
        <StatCard
          label="SOL Balance"
          value={`${portfolio.solBalance.toFixed(4)}`}
          sub={`$${((portfolio.solBalance) * (price?.usd || 0)).toFixed(2)}`}
        />
        <StatCard
          label="Token Holdings"
          value={portfolio.tokens.length.toString()}
          sub="tracked tokens"
        />
        <div className="bg-pulse-card border border-pulse-border rounded-xl p-4 flex items-center gap-3">
          <RiskGauge score={avgRisk} size="md" />
          <div>
            <p className="text-xs text-slate-400">Avg Portfolio Risk</p>
            <p className="text-sm font-medium mt-1">
              {avgRisk <= 25 ? 'Conservative' : avgRisk <= 50 ? 'Moderate' : avgRisk <= 75 ? 'Aggressive' : 'Extreme'}
            </p>
          </div>
        </div>
      </div>

      {/* Token Holdings */}
      <div className="bg-pulse-card border border-pulse-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-pulse-border">
          <h3 className="font-semibold text-sm">Token Holdings</h3>
        </div>
        {portfolio.loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-pulse-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : portfolio.tokens.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No token holdings found
          </div>
        ) : (
          <div className="divide-y divide-pulse-border">
            {portfolio.tokens.map(token => (
              <TokenRow key={token.mint} token={token} onClick={onSelectToken} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
