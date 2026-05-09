"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, ExternalLink, Loader2, TrendingUp } from 'lucide-react'
import { useUsdcBalance } from '@/hooks/use-usdc-balance'
import { useFlexibleVault } from '@/hooks/use-flexible-vault'
import { useFlexibleDeposit } from '@/hooks/use-flexible-deposit'
import { useFlexibleWithdraw } from '@/hooks/use-flexible-withdraw'
import { useHistory } from '@/hooks/use-history'
import { useWallet } from '@/app/context/WalletContext'
import { FLEXIBLE_VAULT_ADDRESS } from '@/lib/contracts'
import { BASESCAN_ADDR_BASE, BASESCAN_TX_BASE } from '@/lib/constants'
import { formatUsdc, parseUsdcInput, shortenAddress, approximateDateFromBlock } from '@/lib/format'
import '../../ui/styles/flexible.css'

const Flexible = () => {
    const { isWrongNetwork, switchToBaseSepolia } = useWallet()
    const [activeForm, setActiveForm] = useState<"deposit" | "withdraw">('deposit')
    const [amountInput, setAmountInput] = useState('')
    const [validationError, setValidationError] = useState<string | null>(null)

    const { balance: walletUsdcRaw } = useUsdcBalance()
    const { depositedUsdc, maxWithdrawUsdc, refetch: refetchVault } = useFlexibleVault()
    const { events, refetch: refetchHistory } = useHistory()

    const depositFlow = useFlexibleDeposit()
    const withdrawFlow = useFlexibleWithdraw()

    const walletUsdc = walletUsdcRaw ?? 0n
    const deposited = depositedUsdc ?? 0n
    const maxWithdraw = maxWithdrawUsdc ?? 0n

    const flexEvents = useMemo(
        () => events.filter((e) => e.type === 'flex_deposit' || e.type === 'flex_withdraw').slice(0, 6),
        [events],
    )

    useEffect(() => {
        if (depositFlow.isSuccess || withdrawFlow.isSuccess) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setAmountInput('')
            void refetchVault()
            void refetchHistory()
            const t = setTimeout(() => {
                depositFlow.reset()
                withdrawFlow.reset()
            }, 4000)
            return () => clearTimeout(t)
        }
    }, [depositFlow, withdrawFlow, refetchVault, refetchHistory])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setValidationError(null)
        if (isWrongNetwork) {
            await switchToBaseSepolia().catch(() => { })
            return
        }
        let amountRaw: bigint
        try {
            amountRaw = parseUsdcInput(amountInput)
        } catch (err) {
            setValidationError((err as Error).message)
            return
        }
        if (activeForm === 'deposit') {
            if (amountRaw > walletUsdc) {
                setValidationError('Amount exceeds wallet balance.')
                return
            }
            await depositFlow.deposit(amountRaw)
        } else {
            if (amountRaw > maxWithdraw) {
                setValidationError('Amount exceeds your deposited balance.')
                return
            }
            await withdrawFlow.withdraw(amountRaw)
        }
    }

    const handleMax = () => {
        const max = activeForm === 'deposit' ? walletUsdc : maxWithdraw
        setAmountInput(formatUsdc(max).replace(/,/g, ''))
    }

    const flow = activeForm === 'deposit' ? depositFlow : withdrawFlow
    const isPending = flow.isPending
    const flowError = flow.errorMessage

    return (
        <section className='flexible-section'>
            {/* Header */}
            <div className='flexible-header'>
                <div className='header-content'>
                    <h1 className='header-title'>Flexible Savings Vault</h1>
                    <p className='header-subtitle'>Deposit USDC into a non-custodial ERC-4626 vault on Base. Withdraw any time, no lock-up.</p>
                </div>
                {/* <div className='apy-display'>
                    <span className='apy-label'>VAULT TYPE</span>
                    <div className='apy-value'>
                        <span className='apy-percentage' style={{ fontSize: '20px' }}>ERC-4626</span>
                        <TrendingUp size={20} className='apy-arrow' />
                    </div>
                </div> */}
            </div>

            {/* Summary Card */}
            <div className='summary-card'>
                <div className='summary-item'>
                    <span className='summary-label'>YOUR DEPOSITED</span>
                    <p className='summary-value'>{formatUsdc(deposited)} USDC</p>
                </div>
                <div className='summary-item'>
                    <span className='summary-label'>WALLET BALANCE</span>
                    <p className='summary-value positive'>{formatUsdc(walletUsdc)} USDC</p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className='action-buttons'>
                <button onClick={() => { setActiveForm('deposit'); setValidationError(null); }} className={activeForm === 'deposit' ? 'btn-primary' : 'btn-secondary'} type='button'>Deposit</button>
                <button onClick={() => { setActiveForm('withdraw'); setValidationError(null); }} className={activeForm === 'withdraw' ? 'btn-primary' : 'btn-secondary'} type='button'>Withdraw</button>
            </div>

            {/* Main Content */}
            <div className='flexible-content'>
                <form className='left-section' onSubmit={handleSubmit}>
                    <div className='select-asset-group'>
                        <label className='form-label'>Asset</label>
                        <div className='select-dropdown' style={{ cursor: 'default' }}>
                            <div className='asset-selected'>
                                <div className='asset-icon'>◎</div>
                                <span>USDC</span>
                            </div>
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Base Sepolia</span>
                        </div>
                    </div>

                    <div className='amount-group'>
                        <label className='form-label'>Amount</label>
                        <div className='amount-input-group'>
                            <input
                                type='text'
                                inputMode='decimal'
                                className='amount-input'
                                placeholder='0.00'
                                value={amountInput}
                                onChange={(e) => { setAmountInput(e.target.value); setValidationError(null); }}
                                disabled={isPending}
                            />
                            <button className='max-button' type='button' onClick={handleMax} disabled={isPending}>Max</button>
                        </div>
                        <div className='max-display'>
                            {activeForm === 'deposit' ? 'Wallet:' : 'Withdrawable:'}{' '}
                            <span>{formatUsdc(activeForm === 'deposit' ? walletUsdc : maxWithdraw)} USDC</span>
                        </div>
                    </div>

                    <div className='balance-card'>
                        <label className='balance-label'>YOUR DEPOSITED VALUE</label>
                        <div className='balance-amount'>{formatUsdc(deposited)} USDC</div>
                    </div>

                    <div className='stats-grid'>
                        <div className='stat-card'>
                            <span className='stat-label'>WITHDRAWABLE</span>
                            <h3 className='stat-value'>{formatUsdc(maxWithdraw)} USDC</h3>
                        </div>
                        <div className='stat-card'>
                            <span className='stat-label'>NETWORK</span>
                            <h3 className='stat-value' style={{ fontSize: '16px' }}>Base Sepolia</h3>
                        </div>
                    </div>

                    {flow.step !== 'idle' && (
                        <FlowProgress step={flow.step as string} mode={activeForm} />
                    )}

                    {(validationError || flowError) && (
                        <div className='form-alert form-alert-error'>
                            {validationError ?? flowError}
                        </div>
                    )}

                    {flow.isSuccess && (
                        <div className='form-alert form-alert-success'>
                            {activeForm === 'deposit' ? 'Deposit confirmed.' : 'Withdrawal confirmed.'}
                        </div>
                    )}

                    <button
                        className='btn-confirm-deposit'
                        type='submit'
                        disabled={isPending || amountInput.trim() === '' || Number(amountInput) <= 0}
                    >
                        {isPending ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                                <Loader2 size={14} className='spin' />
                                {flow.step === 'approving' || flow.step === 'waiting_approve' ? 'Approving...' : activeForm === 'deposit' ? 'Depositing...' : 'Withdrawing...'}
                            </span>
                        ) : isWrongNetwork ? 'Switch to Base Sepolia' : (
                            `Confirm ${activeForm === 'deposit' ? 'Deposit' : 'Withdraw'}`
                        )}
                    </button>
                </form>

                <div className='right-section'>
                    <div className='info-card'>
                        {/* <div className='info-row'>
                            <span className='info-label'>Vault standard</span>
                            <span className='info-value'>ERC-4626 (svfUSDC)</span>
                        </div> */}
                        <div className='info-row'>
                            <span className='info-label'>Lock-up</span>
                            <span className='info-value'>None — withdraw anytime</span>
                        </div>
                    </div>

                    <div className='info-card'>
                        <div className='info-row'>
                            <span className='info-label'>Vault contract</span>
                            <a href={`${BASESCAN_ADDR_BASE}${FLEXIBLE_VAULT_ADDRESS}`} target='_blank' rel='noopener noreferrer' className='info-value contract' style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>
                                {shortenAddress(FLEXIBLE_VAULT_ADDRESS)} <ExternalLink size={10} style={{ display: 'inline', marginBottom: -1 }} />
                            </a>
                        </div>
                        <div className='info-row'>
                            <span className='info-label'>Network</span>
                            <span className='info-value'>Base Sepolia (84532)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className='recent-transactions'>
                <div className='transactions-header'>
                    <h2>Recent Transactions</h2>
                    <a href={`${BASESCAN_ADDR_BASE}${FLEXIBLE_VAULT_ADDRESS}`} target='_blank' rel='noopener noreferrer' className='export-link'>View vault on BaseScan</a>
                </div>

                {flexEvents.length === 0 ? (
                    <div style={{ padding: '20px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        No flexible vault activity yet for your wallet.
                    </div>
                ) : (
                    <div className='transactions-table'>
                        <table>
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>When</th>
                                    <th>Tx</th>
                                </tr>
                            </thead>
                            <tbody>
                                {flexEvents.map((e) => (
                                    <tr key={`${e.txHash}-${e.type}`}>
                                        <td>
                                            <span className={`tx-type ${e.type === 'flex_deposit' ? 'deposit' : 'withdraw'}`}>
                                                {e.type === 'flex_deposit' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                                                {e.type === 'flex_deposit' ? ' Deposit' : ' Withdraw'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`tx-value ${e.type === 'flex_deposit' ? 'positive' : ''}`}>
                                                {e.type === 'flex_deposit' ? '+' : '-'}{formatUsdc(e.amount)} USDC
                                            </span>
                                        </td>
                                        <td>{approximateDateFromBlock(e.blockNumber)}</td>
                                        <td>
                                            <a href={`${BASESCAN_TX_BASE}${e.txHash}`} target='_blank' rel='noopener noreferrer' style={{ color: 'var(--accent-blue)', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                {shortenAddress(e.txHash)} <ExternalLink size={12} />
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    )
}

function FlowProgress({ step, mode }: { step: string; mode: 'deposit' | 'withdraw' }) {
    if (mode === 'deposit') {
        const onApprove = step === 'approving' || step === 'waiting_approve';
        const onDeposit = step === 'depositing' || step === 'waiting_deposit';
        const approveDone = step === 'depositing' || step === 'waiting_deposit' || step === 'success';
        return (
            <div className='flow-progress'>
                <span className={onApprove ? 'fp-active' : approveDone ? 'fp-done' : 'fp-pending'}>
                    {onApprove ? '⏳' : approveDone ? '✓' : '○'} 1. Approve USDC
                </span>
                <span className='fp-line' />
                <span className={onDeposit ? 'fp-active' : step === 'success' ? 'fp-done' : 'fp-pending'}>
                    {onDeposit ? '⏳' : step === 'success' ? '✓' : '○'} 2. Deposit
                </span>
            </div>
        );
    }
    return (
        <div className='flow-progress'>
            <span className='fp-active'>
                {step === 'withdrawing' ? '⏳ Confirming in wallet...' : step === 'waiting' ? '⏳ Waiting for on-chain confirmation...' : ''}
            </span>
        </div>
    );
}

export default Flexible;
