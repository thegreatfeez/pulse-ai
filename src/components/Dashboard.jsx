import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import useSolPrice from '../hooks/useSolPrice';
import useWalletPortfolio from '../hooks/useWalletPortfolio';
import RiskGauge from './RiskGauge';
import { computeRiskScore, generateSignals } from '../services/riskEngine';
import usePulseProtocol from '../hooks/usePulseProtocol';
import PulseLogo from './PulseLogo';

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
      className="flex flex-col items-start gap-3 rounded-lg border border-transparent p-3 transition hover:border-pulse-border hover:bg-slate-800/50 sm:flex-row sm:items-center"
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pulse-accent to-pulse-cyan flex items-center justify-center text-xs font-bold shrink-0">
        {token.symbol?.[0] || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{token.symbol}</span>
          <span className="text-xs text-slate-500 truncate">{token.name}</span>
          {token.isSimulated && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-300">SIM</span>
          )}
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
              <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded-full ${s.type === 'danger' ? 'bg-red-500/20 text-red-400' :
                  s.type === 'alert' ? 'bg-orange-500/20 text-orange-400' :
                    s.type === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-emerald-500/20 text-emerald-400'
                }`}>{s.label}</span>
            ))}
          </div>
        )}
      </div>
      <div className="w-full shrink-0 text-left sm:w-auto sm:text-right">
        <p className="text-sm font-medium">${(token.valueUsd || 0).toFixed(2)}</p>
        <p className="text-xs text-slate-500">{token.amount?.toFixed(2)} tokens</p>
        <p className="text-[10px] text-pulse-accent mt-0.5">Click to sell back</p>
      </div>
      <div className="self-start sm:self-center">
        <RiskGauge score={risk.score} size="sm" />
      </div>
    </div>
  );
}

export default function Dashboard({ onSelectToken, onSellToken }) {
  const { connected, publicKey } = useWallet();
  const { price } = useSolPrice();
  const portfolio = useWalletPortfolio(price?.usd);
  const {
    initializeUserRiskProfile,
    updateUserRiskProfile,
    loading: protocolLoading,
    profile,
    profilePda,
    riskPolicy,
    riskPolicyPda,
    positionIntents,
    profileLoading,
  } = usePulseProtocol();
  const [riskModeInput, setRiskModeInput] = useState(1);
  const [maxPositionInput, setMaxPositionInput] = useState(500);
  const [maxConcentrationInput, setMaxConcentrationInput] = useState(3000);

  useEffect(() => {
    if (!profile) return;
    setRiskModeInput(profile.riskMode);
    setMaxPositionInput(profile.maxPositionBps);
    setMaxConcentrationInput(profile.maxConcentrationBps);
  }, [profile]);

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4">
        {/* <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pulse-accent to-pulse-cyan flex items-center justify-center text-3xl font-bold mb-6">
          P
        </div> */}
        <PulseLogo />
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
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-bold">Portfolio Dashboard</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={async () => {
              try {
                await initializeUserRiskProfile();
              } catch (e) {
                console.error('[initializeUserRiskProfile]', e);
              }
            }}
            disabled={protocolLoading || profileLoading || !!profile}
            className="rounded-lg border border-pulse-border bg-pulse-card px-3 py-1.5 text-xs transition hover:bg-slate-800 disabled:opacity-50"
          >
            {profileLoading ? 'Checking Profile...' : protocolLoading ? 'Initializing...' : profile ? 'Profile Initialized' : 'Init On-Chain Profile'}
          </button>
          <button
            onClick={portfolio.refresh}
            disabled={portfolio.loading}
            className="rounded-lg border border-pulse-border bg-pulse-card px-3 py-1.5 text-xs transition hover:bg-slate-800 disabled:opacity-50"
          >
            {portfolio.loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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

      <div className="bg-pulse-card border border-pulse-border rounded-xl p-4">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">On-Chain Risk Profile</p>
        {profile ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="text-slate-500 text-xs">Risk Mode</p>
                <p className="font-medium">{profile.riskMode}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Max Position</p>
                <p className="font-medium">{(profile.maxPositionBps / 100).toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Max Concentration</p>
                <p className="font-medium">{(profile.maxConcentrationBps / 100).toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">PDA</p>
                <p className="font-medium">{profilePda?.slice(0, 6)}...{profilePda?.slice(-6)}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Update Profile</p>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={riskModeInput}
                  onChange={(e) => setRiskModeInput(Number(e.target.value))}
                  className="bg-slate-900 border border-pulse-border rounded px-2 py-1.5 text-sm"
                  placeholder="Risk mode"
                />
                <input
                  type="number"
                  min={0}
                  max={10000}
                  value={maxPositionInput}
                  onChange={(e) => setMaxPositionInput(Number(e.target.value))}
                  className="bg-slate-900 border border-pulse-border rounded px-2 py-1.5 text-sm"
                  placeholder="Max position bps"
                />
                <input
                  type="number"
                  min={0}
                  max={10000}
                  value={maxConcentrationInput}
                  onChange={(e) => setMaxConcentrationInput(Number(e.target.value))}
                  className="bg-slate-900 border border-pulse-border rounded px-2 py-1.5 text-sm"
                  placeholder="Max concentration bps"
                />
                <button
                  onClick={async () => {
                    try {
                      await updateUserRiskProfile({
                        riskMode: riskModeInput,
                        maxPositionBps: maxPositionInput,
                        maxConcentrationBps: maxConcentrationInput,
                      });
                    } catch (e) {
                      console.error('[updateUserRiskProfile]', e);
                    }
                  }}
                  disabled={protocolLoading}
                  className="px-3 py-1.5 text-sm bg-pulse-accent/20 border border-pulse-accent/40 rounded hover:bg-pulse-accent/30 disabled:opacity-50"
                >
                  {protocolLoading ? 'Updating...' : 'Update On-Chain'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">No on-chain profile found yet. Initialize it to store your wallet risk policy baseline.</p>
        )}
      </div>

      <div className="bg-pulse-card border border-pulse-border rounded-xl p-4">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">On-Chain Risk Policy</p>
        {riskPolicy ? (
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-slate-500 text-xs">Max Position</p>
              <p className="font-medium">{(riskPolicy.maxPositionBps / 100).toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Max Concentration</p>
              <p className="font-medium">{(riskPolicy.maxConcentrationBps / 100).toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Volatility Scale</p>
              <p className="font-medium">{(riskPolicy.volatilityScaleBps / 100).toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">PDA</p>
              <p className="font-medium">{riskPolicyPda?.slice(0, 6)}...{riskPolicyPda?.slice(-6)}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">No on-chain risk policy initialized for this authority yet.</p>
        )}
      </div>

      <div className="bg-pulse-card border border-pulse-border rounded-xl p-4">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Recent On-Chain Position Intents</p>
        {positionIntents.length > 0 ? (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {positionIntents.map((intent) => (
              <div key={`${intent.nonce}-${intent.tokenMint}`} className="text-xs border border-pulse-border rounded p-2">
                <span className="mr-2">#{intent.nonce}</span>
                <span className="mr-2">{intent.side === 0 ? 'BUY' : 'SELL'}</span>
                <span>{intent.tokenMint.slice(0, 6)}...{intent.tokenMint.slice(-6)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No position intents found yet.</p>
        )}
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
              <TokenRow key={token.mint} token={token} onClick={onSellToken || onSelectToken} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
