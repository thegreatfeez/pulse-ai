"use client"
import React, { useEffect, useState } from 'react';
import { AlertTriangle, ExternalLink, Loader2, Lock, ShieldCheck, Timer } from 'lucide-react';
import { useUsdcBalance } from '@/hooks/use-usdc-balance';
import { useFixedPositions } from '@/hooks/use-fixed-positions';
import { useFixedDeposit } from '@/hooks/use-fixed-deposit';
import { useFixedWithdraw } from '@/hooks/use-fixed-withdraw';
import { useCountdown } from '@/hooks/use-countdown';
import { useWallet } from '@/app/context/WalletContext';
import { LOCK_DURATIONS, BASESCAN_ADDR_BASE } from '@/lib/constants';
import { FIXED_VAULT_ADDRESS } from '@/lib/contracts';
import {
    formatUsdc,
    parseUsdcInput,
    formatCountdown,
    formatUnlockDate,
    lockSecondsToUnlockDate,
    shortenAddress,
} from '@/lib/format';
import type { FixedPosition } from '@/types';

type DurationDays = 30 | 60 | 90;

const DURATION_TO_SECONDS: Record<DurationDays, bigint> = {
    30: LOCK_DURATIONS.LOCK_30_DAYS,
    60: LOCK_DURATIONS.LOCK_60_DAYS,
    90: LOCK_DURATIONS.LOCK_90_DAYS,
};

const Fixed = () => {
    const { isWrongNetwork, switchToBaseSepolia } = useWallet();
    const [duration, setDuration] = useState<DurationDays>(90);
    const [amountInput, setAmountInput] = useState('');
    const [validationError, setValidationError] = useState<string | null>(null);

    const { balance: walletUsdcRaw } = useUsdcBalance();
    const { activePositions, closedPositions, totalLocked, refetch: refetchPositions } = useFixedPositions();
    const depositFlow = useFixedDeposit();
    const withdrawFlow = useFixedWithdraw();

    const walletUsdc = walletUsdcRaw ?? 0n;
    const lockSeconds = DURATION_TO_SECONDS[duration];

    useEffect(() => {
        if (depositFlow.isSuccess || withdrawFlow.isSuccess) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setAmountInput('');
            void refetchPositions();
            const t = setTimeout(() => {
                depositFlow.reset();
                withdrawFlow.reset();
            }, 4000);
            return () => clearTimeout(t);
        }
    }, [depositFlow, withdrawFlow, refetchPositions]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);
        if (isWrongNetwork) {
            await switchToBaseSepolia().catch(() => {});
            return;
        }
        let amountRaw: bigint;
        try {
            amountRaw = parseUsdcInput(amountInput);
        } catch (err) {
            setValidationError((err as Error).message);
            return;
        }
        if (amountRaw > walletUsdc) {
            setValidationError('Amount exceeds wallet balance.');
            return;
        }
        await depositFlow.deposit(amountRaw, lockSeconds);
    };

    return (
        <section className="fixed-vault">
            <div className="header-card">
                <div className="header-info">
                    <h2>Fixed Savings — Time-locked positions</h2>
                    <p>
                        Lock USDC into independent positions for 30, 60, or 90 days. The unlock timestamp is
                        immutable per position; the contract enforces the lock — no admin can override it.
                    </p>

                    <div className="stats-row">
                        <div className="stat">
                            <span>YOUR TOTAL LOCKED</span>
                            <h3>{formatUsdc(totalLocked)} USDC</h3>
                        </div>
                        <div className="stat">
                            <span>ACTIVE POSITIONS</span>
                            <h3>{activePositions.length}</h3>
                        </div>
                    </div>
                </div>

                <div className="header-security">
                    <div className="security-badge">
                        <ShieldCheck size={18} className="icon-shield" />
                        <span>NON-CUSTODIAL</span>
                    </div>
                    <p className="security-desc">
                        Immutable, admin-free smart contracts on Base. The vault enforces the lock period in
                        code — only you can withdraw your position.
                    </p>

                    <div className="warning-box">
                        <AlertTriangle size={24} className="icon-alert" />
                        <p>
                            No early withdrawals — enforced on-chain. Make sure your liquidity needs are met
                            before locking.
                        </p>
                    </div>
                </div>
            </div>

            <div className="panels-container">
                <form className="lock-panel" onSubmit={handleSubmit}>
                    <h3>Lock USDC</h3>

                    <div className="amount-input">
                        <label>Amount to Lock</label>
                        <div className="input-wrapper">
                            <input
                                type="text"
                                inputMode="decimal"
                                placeholder="0.00"
                                value={amountInput}
                                onChange={(e) => { setAmountInput(e.target.value); setValidationError(null); }}
                                disabled={depositFlow.isPending}
                            />
                            <div className="input-suffix">
                                <span>USDC</span>
                            </div>
                        </div>
                        <span className="wallet-bal">Wallet Balance: {formatUsdc(walletUsdc)} USDC</span>
                    </div>

                    <div className="duration-select">
                        <label>Select Duration</label>
                        <div className="duration-options">
                            {([30, 60, 90] as DurationDays[]).map((d) => (
                                <div
                                    key={d}
                                    className={`duration-card ${duration === d ? 'active' : ''}`}
                                    onClick={() => !depositFlow.isPending && setDuration(d)}
                                    role="button"
                                    aria-pressed={duration === d}
                                    tabIndex={0}
                                >
                                    <h4>{d} Days</h4>
                                    <span>Lock</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="summary">
                        <div className="summary-row">
                            <span>Maturity Date</span>
                            <b>{lockSecondsToUnlockDate(lockSeconds)}</b>
                        </div>
                        <div className="summary-row">
                            <span>Lock Period</span>
                            <b className="yield-val">{duration} days</b>
                        </div>
                    </div>

                    {depositFlow.step !== 'idle' && (
                        <div className='flow-progress'>
                            <span className={['approving', 'waiting_approve'].includes(depositFlow.step) ? 'fp-active' : ['depositing', 'waiting_deposit', 'success'].includes(depositFlow.step) ? 'fp-done' : 'fp-pending'}>
                                {['approving', 'waiting_approve'].includes(depositFlow.step) ? '⏳' : ['depositing', 'waiting_deposit', 'success'].includes(depositFlow.step) ? '✓' : '○'} 1. Approve USDC
                            </span>
                            <span className='fp-line' />
                            <span className={['depositing', 'waiting_deposit'].includes(depositFlow.step) ? 'fp-active' : depositFlow.step === 'success' ? 'fp-done' : 'fp-pending'}>
                                {['depositing', 'waiting_deposit'].includes(depositFlow.step) ? '⏳' : depositFlow.step === 'success' ? '✓' : '○'} 2. Lock
                            </span>
                        </div>
                    )}

                    {(validationError || depositFlow.errorMessage) && (
                        <div className='form-alert form-alert-error'>
                            {validationError ?? depositFlow.errorMessage}
                        </div>
                    )}

                    {depositFlow.isSuccess && (
                        <div className='form-alert form-alert-success'>
                            Position locked successfully.
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={depositFlow.isPending || amountInput.trim() === '' || Number(amountInput) <= 0}
                        className="lock-btn"
                    >
                        {depositFlow.isPending ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                                <Loader2 size={14} className='spin' />
                                {depositFlow.step === 'approving' || depositFlow.step === 'waiting_approve' ? 'Approving...' : 'Locking...'}
                            </span>
                        ) : isWrongNetwork ? 'Switch to Base Sepolia' : 'Lock USDC'}
                    </button>
                </form>

                <div className="positions-panel">
                    <div className="panel-header">
                        <h3>Active Positions</h3>
                        <span className="badge">
                            {activePositions.length} active{activePositions.length === 1 ? '' : 's'}
                        </span>
                    </div>

                    <div className="position-list">
                        {activePositions.length === 0 ? (
                            <div style={{ padding: '24px 12px', color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center' }}>
                                No active positions yet. Lock some USDC to open one.
                            </div>
                        ) : (
                            activePositions.map((p) => (
                                <PositionCard
                                    key={p.positionId}
                                    position={p}
                                    onWithdraw={() => withdrawFlow.withdraw(p.positionId)}
                                    isWithdrawing={withdrawFlow.withdrawingId === p.positionId}
                                />
                            ))
                        )}
                    </div>

                    {withdrawFlow.errorMessage && (
                        <div className='form-alert form-alert-error' style={{ marginTop: 12 }}>
                            {withdrawFlow.errorMessage}
                        </div>
                    )}

                    {closedPositions.length > 0 && (
                        <details style={{ marginTop: 16 }}>
                            <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
                                Show {closedPositions.length} closed position{closedPositions.length === 1 ? '' : 's'}
                            </summary>
                            <div className="position-list" style={{ marginTop: 12, opacity: 0.7 }}>
                                {closedPositions.map((p) => (
                                    <div key={p.positionId} className="position-card">
                                        <div className="pos-icon"><Lock size={20} /></div>
                                        <div className="pos-details">
                                            <div className="pos-amount">
                                                <h4>{formatUsdc(p.amount)} USDC</h4>
                                                <p>Closed • position #{p.positionId}</p>
                                            </div>
                                            <div className="pos-maturity">
                                                <h4 style={{ color: 'var(--text-secondary)' }}>Withdrawn</h4>
                                                <p>Unlocked: {formatUnlockDate(p.unlockAt)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </details>
                    )}

                    <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
                        Vault contract:{' '}
                        <a href={`${BASESCAN_ADDR_BASE}${FIXED_VAULT_ADDRESS}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>
                            {shortenAddress(FIXED_VAULT_ADDRESS)} <ExternalLink size={10} style={{ display: 'inline', marginBottom: -1 }} />
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
};

function PositionCard({
    position,
    onWithdraw,
    isWithdrawing,
}: {
    position: FixedPosition;
    onWithdraw: () => void;
    isWithdrawing: boolean;
}) {
    const remaining = useCountdown(position.unlockAt);
    const isUnlocked = remaining <= 0;

    return (
        <div className="position-card">
            <div className={`pos-icon ${isUnlocked ? '' : 'lock-icon'}`}>
                {isUnlocked ? <Timer size={20} /> : <Lock size={20} />}
            </div>
            <div className="pos-details">
                <div className="pos-amount">
                    <h4>{formatUsdc(position.amount)} USDC</h4>
                    <p>Position #{position.positionId} • <span className="apy-green">{isUnlocked ? 'Unlocked' : 'Locked'}</span></p>
                </div>
                <div className="pos-maturity">
                    <h4 className="maturity-blue">{formatCountdown(remaining)}</h4>
                    <p>Maturity: {formatUnlockDate(position.unlockAt)}</p>
                    <button
                        type="button"
                        onClick={onWithdraw}
                        disabled={!isUnlocked || isWithdrawing}
                        className={`pos-withdraw ${isUnlocked ? '' : 'pos-withdraw-locked'}`}
                    >
                        {isWithdrawing ? 'Withdrawing...' : isUnlocked ? 'Withdraw' : 'Locked'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Fixed;
