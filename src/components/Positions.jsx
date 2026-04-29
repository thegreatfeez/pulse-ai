import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { supabase } from '../lib/supabase';
import RiskGauge from './RiskGauge';
import usePulseProtocol from '../hooks/usePulseProtocol';
import { SOLANA_CLUSTER } from '../config';

function formatDate(ts) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Positions() {
  const { publicKey, connected } = useWallet();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const walletAddr = publicKey?.toBase58();
  const { positionIntents, refreshPositionIntents } = usePulseProtocol();

  const fetchPositions = useCallback(async () => {
    if (!walletAddr) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .eq('wallet', walletAddr)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Positions] fetch error:', error.message);
    } else {
      setPositions(data || []);
    }
    setLoading(false);
  }, [walletAddr]);

  useEffect(() => {
    if (connected) {
      fetchPositions();
      refreshPositionIntents();
    }
    else { setPositions([]); setLoading(false); }
  }, [connected, fetchPositions, refreshPositionIntents]);

  if (!connected) {
    return (
      <div className="text-center py-20 text-slate-500">
        Connect your wallet to view positions
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Trade Positions</h2>
        <button
          onClick={() => {
            fetchPositions();
            refreshPositionIntents();
          }}
          disabled={loading}
          className="px-3 py-1.5 text-xs bg-pulse-card border border-pulse-border rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {SOLANA_CLUSTER === 'devnet' && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
          <p className="text-xs text-yellow-300 mb-2">Devnet Simulation Positions</p>
          {positionIntents.length === 0 ? (
            <p className="text-xs text-slate-400">No devnet intent positions yet.</p>
          ) : (
            <div className="space-y-1.5">
              {positionIntents.slice(0, 10).map((intent) => (
                <div key={`${intent.nonce}-${intent.tokenMint}`} className="text-xs flex items-center justify-between">
                  <span className={intent.side === 0 ? 'text-pulse-green' : 'text-pulse-red'}>
                    {intent.side === 0 ? 'BUY' : 'SELL'}
                  </span>
                  <span className="text-slate-300">{intent.tokenMint.slice(0, 6)}...{intent.tokenMint.slice(-6)}</span>
                  <span className="text-slate-400">#{intent.nonce}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-pulse-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : positions.length === 0 ? (
        <div className="bg-pulse-card border border-pulse-border rounded-xl p-8 text-center">
          <p className="text-slate-400 mb-2">No positions recorded yet</p>
          <p className="text-xs text-slate-600">
            Positions are automatically logged when you execute swaps through the Swap panel.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {SOLANA_CLUSTER === 'devnet' && positionIntents.map((intent) => (
            <div key={`intent-${intent.nonce}-${intent.tokenMint}`} className="bg-pulse-card border border-yellow-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    intent.side === 0 ? 'bg-pulse-green/15 text-pulse-green' : 'bg-pulse-red/15 text-pulse-red'
                  }`}>
                    {intent.side === 0 ? 'BUY' : 'SELL'}
                  </span>
                  <span className="font-semibold">{intent.tokenMint.slice(0, 6)}...{intent.tokenMint.slice(-6)}</span>
                  <span className="text-[10px] text-yellow-300">SIMULATED</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">Intent Nonce</span>
                  <p className="font-medium">{intent.nonce}</p>
                </div>
                <div>
                  <span className="text-slate-500">Amount (raw)</span>
                  <p className="font-medium">{intent.amountLamports}</p>
                </div>
                <div>
                  <span className="text-slate-500">Slippage</span>
                  <p className="font-medium">{(intent.expectedSlippageBps / 100).toFixed(2)}%</p>
                </div>
              </div>
            </div>
          ))}
          {positions.map(pos => (
            <div key={pos.id} className="bg-pulse-card border border-pulse-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    pos.side === 'buy' ? 'bg-pulse-green/15 text-pulse-green' : 'bg-pulse-red/15 text-pulse-red'
                  }`}>
                    {pos.side?.toUpperCase()}
                  </span>
                  <span className="font-semibold">{pos.token_symbol}</span>
                  <span className="text-xs text-slate-500">{pos.token_name}</span>
                </div>
                {pos.risk_score != null && <RiskGauge score={pos.risk_score} size="sm" />}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">Amount In</span>
                  <p className="font-medium">{pos.amount_in} {pos.input_symbol || 'SOL'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Amount Out</span>
                  <p className="font-medium">{pos.amount_out} {pos.token_symbol}</p>
                </div>
                <div>
                  <span className="text-slate-500">Entry Price</span>
                  <p className="font-medium">${pos.entry_price?.toFixed(6)}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>{formatDate(pos.created_at)}</span>
                <span>{pos.dex_id}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
