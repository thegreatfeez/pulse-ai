import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js';
import { getJupiterQuote, getJupiterSwapTx, lamportsFromSol } from '../services/swapService';
import { computeRiskScore, getPositionSizeRecommendation } from '../services/riskEngine';
import { supabase } from '../lib/supabase';
import { SOL_MINT } from '../config';
import RiskGauge from './RiskGauge';

export default function SwapPanel({ selectedToken, portfolioValue = 0 }) {
  const { publicKey, connected, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [amountSol, setAmountSol] = useState('');
  const [slippage, setSlippage] = useState(100); // bps
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | quoting | signing | confirming | done | error
  const [errorMsg, setErrorMsg] = useState('');
  const [txHash, setTxHash] = useState('');

  const risk = selectedToken ? computeRiskScore(selectedToken) : null;
  const posSize = risk ? getPositionSizeRecommendation(risk.score, portfolioValue) : null;

  const outputMint = selectedToken?.address || selectedToken?.mint || '';

  // Auto-fetch quote when amount changes
  useEffect(() => {
    const amt = parseFloat(amountSol);
    if (!amt || amt <= 0 || !outputMint) {
      setQuote(null);
      return;
    }

    const timer = setTimeout(async () => {
      setQuoteLoading(true);
      try {
        const lamports = lamportsFromSol(amt);
        const q = await getJupiterQuote(SOL_MINT, outputMint, lamports, slippage);
        setQuote(q);
      } catch (err) {
        console.warn('[Quote]', err.message);
        setQuote(null);
      }
      setQuoteLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [amountSol, outputMint, slippage]);

  const executeSwap = useCallback(async () => {
    if (!connected || !publicKey || !signTransaction || !quote) return;

    setStatus('signing');
    setErrorMsg('');
    setTxHash('');

    try {
      const swapData = await getJupiterSwapTx(quote, publicKey);
      const txBuf = Buffer.from(swapData.swapTransaction, 'base64');
      const tx = VersionedTransaction.deserialize(txBuf);
      const signed = await signTransaction(tx);

      setStatus('confirming');
      const rawTx = signed.serialize();
      const sig = await connection.sendRawTransaction(rawTx, { skipPreflight: true });
      await connection.confirmTransaction(sig, 'confirmed');

      setTxHash(sig);
      setStatus('done');

      // Log position to Supabase
      const posPayload = {
        wallet: publicKey.toBase58(),
        token_address: outputMint,
        token_symbol: selectedToken?.symbol || 'UNKNOWN',
        token_name: selectedToken?.name || 'Unknown Token',
        side: 'buy',
        amount_in: parseFloat(amountSol),
        input_symbol: 'SOL',
        amount_out: quote.outAmount ? parseFloat(quote.outAmount) / Math.pow(10, selectedToken?.decimals || 6) : 0,
        entry_price: selectedToken?.priceUsd || 0,
        risk_score: risk?.score || 0,
        dex_id: selectedToken?.dexId || 'jupiter',
        tx_hash: sig,
      };

      const { error: insertErr } = await supabase
        .from('positions')
        .insert(posPayload)
        .then(r => r, e => ({ error: e }));

      if (insertErr) console.warn('[Position insert]', insertErr);
    } catch (err) {
      console.error('[Swap]', err);
      setErrorMsg(err.message || 'Swap failed');
      setStatus('error');
    }
  }, [connected, publicKey, signTransaction, quote, connection, amountSol, outputMint, selectedToken, risk]);

  if (!selectedToken) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Swap</h2>
        <div className="bg-pulse-card border border-pulse-border rounded-xl p-8 text-center">
          <p className="text-slate-400 mb-2">Select a token to swap</p>
          <p className="text-xs text-slate-600">
            Browse tokens in the Discover tab and click one to start a swap.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Swap SOL → {selectedToken.symbol}</h2>

      {/* Risk Banner */}
      {risk && (
        <div className={`rounded-xl p-4 border flex items-center gap-4 ${
          risk.score <= 25 ? 'bg-emerald-500/5 border-emerald-500/20' :
          risk.score <= 50 ? 'bg-yellow-500/5 border-yellow-500/20' :
          risk.score <= 75 ? 'bg-orange-500/5 border-orange-500/20' :
          'bg-red-500/5 border-red-500/20'
        }`}>
          <RiskGauge score={risk.score} size="md" />
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: risk.color }}>
              {risk.level} Risk Token
            </p>
            {posSize && portfolioValue > 0 && (
              <p className="text-xs text-slate-400 mt-0.5">
                Suggested max position: {(posSize.pct * 100).toFixed(1)}% (${posSize.amount.toFixed(2)})
              </p>
            )}
          </div>
        </div>
      )}

      {/* Swap Form */}
      <div className="bg-pulse-card border border-pulse-border rounded-xl p-5 space-y-4">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">You Pay (SOL)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amountSol}
            onChange={e => setAmountSol(e.target.value)}
            placeholder="0.00"
            className="w-full bg-slate-800/50 border border-pulse-border rounded-lg px-4 py-3 text-lg font-mono text-white placeholder-slate-600 focus:outline-none focus:border-pulse-accent"
          />
        </div>

        <div className="text-center text-slate-500">↓</div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">You Receive ({selectedToken.symbol})</label>
          <div className="w-full bg-slate-800/50 border border-pulse-border rounded-lg px-4 py-3 text-lg font-mono text-white">
            {quoteLoading ? (
              <span className="text-slate-500">Loading quote...</span>
            ) : quote?.outAmount ? (
              (parseFloat(quote.outAmount) / Math.pow(10, selectedToken?.decimals || 6)).toFixed(4)
            ) : (
              <span className="text-slate-600">Enter amount above</span>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Slippage Tolerance</label>
          <div className="flex gap-2">
            {[50, 100, 200, 500].map(bps => (
              <button
                key={bps}
                onClick={() => setSlippage(bps)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  slippage === bps
                    ? 'bg-pulse-accent text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {(bps / 100).toFixed(1)}%
              </button>
            ))}
          </div>
        </div>

        {/* Swap Button */}
        {!connected ? (
          <div className="text-center text-sm text-slate-500 py-2">Connect wallet to swap</div>
        ) : (
          <button
            onClick={executeSwap}
            disabled={!quote || status === 'signing' || status === 'confirming'}
            className={`w-full py-3 rounded-xl font-semibold text-white transition ${
              !quote
                ? 'bg-slate-700 cursor-not-allowed'
                : status === 'signing' || status === 'confirming'
                ? 'bg-pulse-accent/60 cursor-wait'
                : 'bg-pulse-accent hover:bg-pulse-accent/90'
            }`}
          >
            {status === 'signing' ? 'Signing Transaction...' :
             status === 'confirming' ? 'Confirming on Solana...' :
             status === 'done' ? 'Swap Complete!' :
             'Execute Swap'}
          </button>
        )}

        {/* Status Messages */}
        {status === 'done' && txHash && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
            <p className="text-sm text-pulse-green font-medium">Transaction Confirmed</p>
            <a
              href={`https://solscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-pulse-accent hover:underline mt-1 block"
            >
              View on Solscan
            </a>
          </div>
        )}

        {status === 'error' && errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
            <p className="text-sm text-pulse-red">{errorMsg}</p>
          </div>
        )}
      </div>
    </div>
  );
}
