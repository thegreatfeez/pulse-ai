import { computeRiskScore, generateSignals, getPositionSizeRecommendation } from '../services/riskEngine';
import RiskGauge from './RiskGauge';

function formatNumber(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toFixed(0);
}

function RiskBreakdownBar({ label, score, max }) {
  const pct = (score / max) * 100;
  const color = pct <= 33 ? 'bg-pulse-green' : pct <= 66 ? 'bg-yellow-500' : 'bg-pulse-red';

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium w-8 text-right">{score}/{max}</span>
    </div>
  );
}

export default function TokenDetail({ token, portfolioValue = 0, onSwap, onAnalyze, onClose }) {
  if (!token) return null;

  const risk = computeRiskScore(token);
  const signals = generateSignals(token);
  const posSize = getPositionSizeRecommendation(risk.score, portfolioValue);
  const address = token.address || token.mint;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-pulse-bg border border-pulse-border rounded-t-2xl md:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-pulse-bg/95 backdrop-blur px-5 py-4 flex items-center justify-between border-b border-pulse-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold">
              {token.symbol?.[0] || '?'}
            </div>
            <div>
              <h3 className="font-bold">{token.symbol}</h3>
              <p className="text-xs text-slate-400">{token.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">&times;</button>
        </div>

        <div className="p-5 space-y-5">
          {/* Price & Change */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">
                ${token.priceUsd < 0.001 ? token.priceUsd?.toExponential(2) : token.priceUsd?.toFixed(6)}
              </p>
              <div className="flex gap-3 mt-1">
                <span className={`text-sm font-medium ${(token.priceChange1h || 0) >= 0 ? 'text-pulse-green' : 'text-pulse-red'}`}>
                  {(token.priceChange1h || 0) >= 0 ? '+' : ''}{(token.priceChange1h || 0).toFixed(1)}% 1h
                </span>
                <span className={`text-sm font-medium ${(token.priceChange24h || 0) >= 0 ? 'text-pulse-green' : 'text-pulse-red'}`}>
                  {(token.priceChange24h || 0) >= 0 ? '+' : ''}{(token.priceChange24h || 0).toFixed(1)}% 24h
                </span>
              </div>
            </div>
            <RiskGauge score={risk.score} size="lg" />
          </div>

          {/* Signals */}
          {signals.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {signals.map((s, i) => (
                <span key={i} className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  s.type === 'danger' ? 'bg-red-500/15 text-red-400' :
                  s.type === 'alert' ? 'bg-orange-500/15 text-orange-400' :
                  s.type === 'warning' ? 'bg-yellow-500/15 text-yellow-400' :
                  'bg-emerald-500/15 text-emerald-400'
                }`}>{s.label}</span>
              ))}
            </div>
          )}

          {/* Market Data */}
          <div className="grid grid-cols-3 gap-3">
            {[
              ['Volume 24h', `$${formatNumber(token.volume24h || 0)}`],
              ['Liquidity', `$${formatNumber(token.liquidity || 0)}`],
              ['FDV', `$${formatNumber(token.fdv || 0)}`],
              ['Txns 24h', formatNumber(token.txns24h || 0)],
              ['Buys', formatNumber(token.buys24h || 0)],
              ['Sells', formatNumber(token.sells24h || 0)],
            ].map(([label, val]) => (
              <div key={label} className="bg-slate-800/50 rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-semibold mt-0.5">{val}</p>
              </div>
            ))}
          </div>

          {/* Risk Breakdown */}
          <div className="bg-slate-800/30 rounded-xl p-4 space-y-2.5">
            <h4 className="text-sm font-semibold mb-3">Risk Breakdown</h4>
            <RiskBreakdownBar label="Liquidity" score={risk.breakdown.liquidity} max={25} />
            <RiskBreakdownBar label="Volume" score={risk.breakdown.volume} max={25} />
            <RiskBreakdownBar label="Age" score={risk.breakdown.age} max={20} />
            <RiskBreakdownBar label="Txn Ratio" score={risk.breakdown.txnRatio} max={15} />
            <RiskBreakdownBar label="FDV/Liq" score={risk.breakdown.fdvRatio} max={15} />
          </div>

          {/* Position Sizing */}
          {portfolioValue > 0 && (
            <div className="bg-pulse-accent/10 border border-pulse-accent/20 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-pulse-accent mb-2">Position Size Recommendation</h4>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Suggested allocation</span>
                <span className="font-bold">{(posSize.pct * 100).toFixed(1)}% / ${posSize.amount.toFixed(2)}</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Based on {risk.level.toLowerCase()} risk profile and 2% base position sizing.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => onSwap?.(token)}
              className="flex-1 bg-pulse-accent hover:bg-pulse-accent/90 text-white font-semibold py-3 rounded-xl transition"
            >
              Swap Token
            </button>
            <button
              onClick={() => onAnalyze?.(token)}
              className="px-4 py-3 bg-pulse-cyan/10 border border-pulse-cyan/30 text-pulse-cyan rounded-xl hover:bg-pulse-cyan/20 transition text-sm font-medium"
            >
              AI Analysis
            </button>
            <a
              href={`https://solscan.io/token/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 bg-pulse-card border border-pulse-border rounded-xl hover:bg-slate-800 transition text-sm flex items-center"
            >
              Solscan
            </a>
          </div>

          {/* Address */}
          <div className="text-xs text-slate-600 break-all text-center">
            {address}
          </div>
        </div>
      </div>
    </div>
  );
}
