import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, VersionedTransaction } from '@solana/web3.js';
import { getJupiterQuote, getJupiterSwapTx, lamportsFromSol } from '../services/swapService';
import { computeRiskScore, getPositionSizeRecommendation } from '../services/riskEngine';
import { supabase } from '../lib/supabase';
import { SOL_MINT, SOLANA_CLUSTER } from '../config';
import RiskGauge from './RiskGauge';
import useSolPrice from '../hooks/useSolPrice';
import usePulseProtocol from '../hooks/usePulseProtocol';

export default function SwapPanel({ selectedToken, portfolioValue = 0, initialSide = 'buy' }) {
  const { publicKey, connected, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [amountSol, setAmountSol] = useState('');
  const [slippage, setSlippage] = useState(100); // bps
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | quoting | signing | confirming | done | error
  const [errorMsg, setErrorMsg] = useState('');
  const [txHash, setTxHash] = useState('');
  const [walletSolBalance, setWalletSolBalance] = useState(0);
  const [side, setSide] = useState('buy'); // buy | sell (devnet simulation)

  const risk = selectedToken ? computeRiskScore(selectedToken) : null;
  const posSize = risk ? getPositionSizeRecommendation(risk.score, portfolioValue) : null;

  const outputMint = selectedToken?.address || selectedToken?.mint || '';
  const isDevnet = SOLANA_CLUSTER === 'devnet';
  const { price } = useSolPrice();
  const { recordPositionIntent, positionIntents } = usePulseProtocol();
  const selectedTokenDecimals = selectedToken?.decimals || 6;
  const tokenPriceUsd = selectedToken?.priceUsd || 0;
  const solPriceUsd = price?.usd || 0;

  const simulatedTokenBalance = isDevnet
    ? positionIntents
        .filter((intent) => intent.tokenMint === outputMint)
        .reduce((acc, intent) => {
          if (intent.side === 0) {
            const solIn = intent.amountLamports / 1e9;
            const tokenOut = solPriceUsd > 0 && tokenPriceUsd > 0 ? (solIn * solPriceUsd) / tokenPriceUsd : 0;
            return acc + tokenOut;
          }
          const tokenSold = intent.amountLamports / Math.pow(10, selectedTokenDecimals);
          return acc - tokenSold;
        }, 0)
    : 0;

  useEffect(() => {
    if (!isDevnet) {
      setSide('buy');
      return;
    }
    setSide(initialSide === 'sell' ? 'sell' : 'buy');
  }, [initialSide, isDevnet, outputMint]);

  useEffect(() => {
    let cancelled = false;
    async function fetchWalletBalance() {
      if (!connected || !publicKey) {
        if (!cancelled) setWalletSolBalance(0);
        return;
      }
      try {
        const lamports = await connection.getBalance(publicKey);
        if (!cancelled) setWalletSolBalance(lamports / LAMPORTS_PER_SOL);
      } catch {
        if (!cancelled) setWalletSolBalance(0);
      }
    }
    fetchWalletBalance();
    return () => { cancelled = true; };
  }, [connected, publicKey, connection, status]);

  // After a successful execution, require user input change before next swap.
  useEffect(() => {
    if (status !== 'done') return;
    setStatus('idle');
    setTxHash('');
    setErrorMsg('');
  }, [amountSol, outputMint, side]);

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
        if (isDevnet) {
          if (side === 'buy') {
            const outAmountTokens = solPriceUsd > 0 && tokenPriceUsd > 0
              ? (amt * solPriceUsd) / tokenPriceUsd
              : 0;
            setQuote({
              outAmount: Math.floor(outAmountTokens * Math.pow(10, selectedTokenDecimals)).toString(),
              routePlan: [],
              isDevnetEstimated: true,
            });
          } else {
            const outAmountSol = solPriceUsd > 0 && tokenPriceUsd > 0
              ? (amt * tokenPriceUsd) / solPriceUsd
              : 0;
            setQuote({
              outAmount: Math.floor(outAmountSol * 1e9).toString(),
              routePlan: [],
              isDevnetEstimated: true,
            });
          }
        } else {
          const lamports = lamportsFromSol(amt);
          const q = await getJupiterQuote(SOL_MINT, outputMint, lamports, slippage);
          setQuote(q);
        }
      } catch (err) {
        console.warn('[Quote]', err.message);
        setQuote(null);
      }
      setQuoteLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [amountSol, isDevnet, outputMint, selectedTokenDecimals, slippage, side, solPriceUsd, tokenPriceUsd]);

  const executeSwap = useCallback(async () => {
    if (!connected || !publicKey || !signTransaction || !quote) return;

    setStatus('signing');
    setErrorMsg('');
    setTxHash('');

    try {
      if (isDevnet) {
        const nonce = BigInt(Date.now());
        const rawAmount = parseFloat(amountSol || '0');
        if (side === 'sell' && rawAmount > simulatedTokenBalance) {
          throw new Error(`Insufficient simulated ${selectedToken.symbol} balance`);
        }
        const amountForIntent = side === 'buy'
          ? lamportsFromSol(rawAmount)
          : Math.floor(rawAmount * Math.pow(10, selectedTokenDecimals));
        const sig = await recordPositionIntent({
          nonce,
          tokenMint: outputMint,
          side: side === 'buy' ? 0 : 1,
          amountLamports: amountForIntent,
          expectedSlippageBps: slippage,
        });
        setTxHash(sig);
        setStatus('done');
        return;
      }

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
      <h2 className="text-xl font-bold">
        Swap {side === 'buy' ? 'SOL' : selectedToken.symbol} → {side === 'buy' ? selectedToken.symbol : 'SOL'}
      </h2>
      {isDevnet && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSide('buy')}
            className={`px-3 py-1.5 text-xs rounded-lg ${side === 'buy' ? 'bg-pulse-accent text-white' : 'bg-slate-800 text-slate-300'}`}
          >
            Buy
          </button>
          <button
            type="button"
            onClick={() => setSide('sell')}
            className={`px-3 py-1.5 text-xs rounded-lg ${side === 'sell' ? 'bg-pulse-accent text-white' : 'bg-slate-800 text-slate-300'}`}
          >
            Sell Back
          </button>
          <span className="text-xs text-slate-400 self-center">
            Sim holdings: {Math.max(0, simulatedTokenBalance).toFixed(4)} {selectedToken.symbol}
          </span>
        </div>
      )}

      {/* Risk Banner */}
      {risk && (
        <div className={`flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center ${
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
          <label className="text-xs text-slate-400 mb-1 block">
            You Pay ({side === 'buy' ? 'SOL' : selectedToken.symbol})
          </label>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-slate-500">
              {side === 'buy'
                ? `Wallet balance: ${walletSolBalance.toFixed(4)} SOL`
                : `Sim holdings: ${Math.max(0, simulatedTokenBalance).toFixed(4)} ${selectedToken.symbol}`}
            </span>
            <button
              onClick={() => setAmountSol(
                side === 'buy'
                  ? Math.max(0, walletSolBalance - 0.005).toFixed(4)
                  : Math.max(0, simulatedTokenBalance).toFixed(4)
              )}
              className="text-[11px] text-pulse-accent hover:underline"
              type="button"
            >
              Use Max
            </button>
          </div>
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
          <label className="text-xs text-slate-400 mb-1 block">
            You Receive ({side === 'buy' ? selectedToken.symbol : 'SOL'})
          </label>
          <div className="w-full bg-slate-800/50 border border-pulse-border rounded-lg px-4 py-3 text-lg font-mono text-white">
            {quoteLoading ? (
              <span className="text-slate-500">Loading quote...</span>
            ) : quote?.outAmount ? (
              side === 'buy'
                ? (parseFloat(quote.outAmount) / Math.pow(10, selectedTokenDecimals)).toFixed(4)
                : (parseFloat(quote.outAmount) / 1e9).toFixed(4)
            ) : (
              <span className="text-slate-600">Enter amount above</span>
            )}
          </div>
        </div>
        {isDevnet && (
          <p className="text-[11px] text-slate-500">
            Devnet quote is estimated from SOL/token USD prices and execution records on-chain intent.
          </p>
        )}

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Slippage Tolerance</label>
          <div className="flex flex-wrap gap-2">
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
            disabled={!quote || status === 'signing' || status === 'confirming' || status === 'done'}
            className={`w-full py-3 rounded-xl font-semibold text-white transition ${
              !quote || status === 'done'
                ? 'bg-slate-700 cursor-not-allowed'
                : status === 'signing' || status === 'confirming'
                ? 'bg-pulse-accent/60 cursor-wait'
                : 'bg-pulse-accent hover:bg-pulse-accent/90'
            }`}
          >
            {status === 'signing' ? 'Signing Transaction...' :
             status === 'confirming' ? 'Confirming on Solana...' :
             status === 'done' ? 'Swap Complete!' :
             'Swap'}
          </button>
        )}

        {/* Status Messages */}
        {status === 'done' && txHash && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
            <p className="text-sm text-pulse-green font-medium">Transaction Confirmed</p>
            <a
              href={`https://solscan.io/tx/${txHash}${isDevnet ? '?cluster=devnet' : ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-pulse-accent hover:underline mt-1 block"
            >
              View on Solscan
            </a>
            <p className="text-[11px] text-slate-400 mt-1">
              Change amount/token/side to start a new swap.
            </p>
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
