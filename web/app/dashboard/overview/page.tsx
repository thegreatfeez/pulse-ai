'use client';

import { ArrowDownLeft, ArrowLeftRightIcon, ArrowUpRight, ExternalLink, LockKeyhole, PlusIcon, Send, TrendingUp } from 'lucide-react';
import { BsBank2 } from 'react-icons/bs';
import { FaArrowRightArrowLeft } from 'react-icons/fa6';
import { useRouter } from 'next/navigation';
import { useUsdcBalance } from '@/hooks/use-usdc-balance';
import { useFlexibleVault } from '@/hooks/use-flexible-vault';
import { useFixedPositions } from '@/hooks/use-fixed-positions';
import { useHistory } from '@/hooks/use-history';
import { formatUsdc, formatUnlockDate, shortenAddress, approximateDateFromBlock } from '@/lib/format';
import { BASESCAN_TX_BASE } from '@/lib/constants';
import type { HistoryEvent } from '@/types';
import { NgnStat } from '@/components/shared/ngn-stat';
import { AllocationChart } from '@/components/shared/allocation-chart';

const Overview = () => {
    const router = useRouter();
    const { balance: walletUsdcRaw } = useUsdcBalance();
    const { depositedUsdc, isLoading: flexLoading } = useFlexibleVault();
    const { totalLocked, lockedPositions, isLoading: fixedLoading } = useFixedPositions();
    const { events, isLoading: histLoading } = useHistory();

    const walletUsdc = walletUsdcRaw ?? 0n;
    const totalNetWorth = walletUsdc + (depositedUsdc ?? 0n) + totalLocked;

    const nextUnlockMs = lockedPositions.length > 0
        ? Math.min(...lockedPositions.map((p) => Number(p.unlockAt) * 1000))
        : null;
    const nextUnlockLabel = nextUnlockMs
        ? formatUnlockDate(BigInt(Math.floor(nextUnlockMs / 1000)))
        : '—';

    const recentEvents = events.slice(0, 5);

    const vaultCards = [
        {
            title: 'Flexible vault',
            tag: 'Instant access',
            balance: `${formatUsdc(depositedUsdc)} USDC`,
            firstLabel: 'Deposited',
            firstValue: depositedUsdc !== undefined && depositedUsdc > 0n ? `${formatUsdc(depositedUsdc)} USDC` : '0.00 USDC',
            secondLabel: 'Withdrawal',
            secondValue: 'Instant',
            icon: <BsBank2 style={{ color: '#052321' }} size={14} />,
            href: '/dashboard/flexible',
            loading: flexLoading,
        },
        {
            title: 'Fixed vault',
            tag: lockedPositions.length > 0 ? `${lockedPositions.length} active lock${lockedPositions.length === 1 ? '' : 's'}` : 'No active locks',
            balance: `${formatUsdc(totalLocked)} USDC`,
            firstLabel: 'Locked',
            firstValue: `${formatUsdc(totalLocked)} USDC`,
            secondLabel: 'Next unlock',
            secondValue: nextUnlockLabel,
            icon: <LockKeyhole style={{ color: '#052321' }} size={14} />,
            href: '/dashboard/fixed',
            loading: fixedLoading,
        },
        {
            title: 'Transfer rail',
            tag: 'On-chain memo',
            balance: `${events.filter((e) => e.type === 'p2p_sent' || e.type === 'p2p_received').length} transfers`,
            firstLabel: 'Sent',
            firstValue: `${events.filter((e) => e.type === 'p2p_sent').length}`,
            secondLabel: 'Received',
            secondValue: `${events.filter((e) => e.type === 'p2p_received').length}`,
            icon: <ArrowLeftRightIcon style={{ color: '#052321' }} size={14} />,
            href: '/dashboard/transfer',
            loading: histLoading,
        },
    ];

    return (
        <section className='overview'>
            <div className="intro">
                <div className="overview-copy">
                    <h1>Institutional Overview</h1>
                    <p>Welcome back. Your assets are fully secured by audited, immutable smart contracts on Base.</p>
                </div>
                <div className='btn'>
                    <button className='btn1' onClick={() => router.push('/dashboard/flexible')}>
                        <PlusIcon size={16} style={{ marginBottom: '-3px', marginRight: '6px' }} />
                        Deposit
                    </button>
                    <button className='btn2' onClick={() => router.push('/dashboard/transfer')}>
                        <span><FaArrowRightArrowLeft size={16} style={{ marginBottom: '-3px', marginRight: '6px' }} /></span>
                        Transfer
                    </button>
                </div>
            </div>

            <div className="net">
                <div className="balCont">
                    <div className="balL">
                        <div className='bal'>
                            <b>Total net worth</b>
                            <div className='totalBal'>
                                <h2>{formatUsdc(totalNetWorth)}</h2>
                                <span>USDC</span>
                            </div>
                        </div>
                        <span className='trend'>
                            <TrendingUp size={14} /> Live on Base
                        </span>
                    </div>
                    <div className="chart">
                        <AllocationChart
                            segments={[
                                { key: 'wallet', label: 'Wallet', value: walletUsdc, color: 'var(--accent-blue)' },
                                { key: 'flexible', label: 'Flexible vault', value: depositedUsdc ?? 0n, color: 'var(--success)' },
                                { key: 'fixed', label: 'Fixed vault', value: totalLocked, color: 'var(--accent-cyan)' },
                            ]}
                            totalLabel="Total net worth"
                        />
                    </div>
                </div>
                <div className='Ayield'>
                    <b>Naira-denominated balance</b>
                    <NgnStat totalUsdcRaw={totalNetWorth} />
                    <button className="yield-an" onClick={() => router.push('/dashboard/flexible')}>
                        Open vault
                    </button>
                </div>
            </div>
            <div className="cont">
                {vaultCards.map((card) => (
                    <button
                        type="button"
                        className='flxb-cont overview-card'
                        key={card.title}
                        onClick={() => router.push(card.href)}
                        style={{ textAlign: 'left', cursor: 'pointer', border: 'none', font: 'inherit' }}
                    >
                        <div className='flex'>
                            <div>
                                <span>{card.icon}</span>
                                <p>{card.title}</p>
                            </div>
                            <span className='overview-card-tag'>{card.tag}</span>
                        </div>
                        <span className='overview-card-label'>Active balance</span>
                        <h2>{card.loading ? '...' : card.balance}</h2>
                        <div className="apy">
                            <div>
                                <span>{card.firstLabel}</span>
                                <h2>{card.firstValue}</h2>
                            </div>
                            <div>
                                <span>{card.secondLabel}</span>
                                <h2>{card.secondValue}</h2>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            <div className="recent-transactions" style={{ width: '90%', margin: '24px auto 40px' }}>
                <div className="transactions-header">
                    <h2>Recent activity</h2>
                </div>
                {histLoading && events.length === 0 ? (
                    <div style={{ padding: '20px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        Loading on-chain history...
                    </div>
                ) : recentEvents.length === 0 ? (
                    <div style={{ padding: '20px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        No on-chain activity yet. Deposit, lock, or send USDC to get started.
                    </div>
                ) : (
                    <div className="transactions-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Detail</th>
                                    <th>Tx</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentEvents.map((e) => (
                                    <ActivityRow key={`${e.txHash}-${e.type}`} event={e} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    );
};

function ActivityRow({ event }: { event: HistoryEvent }) {
    const { label, icon, className, sign } = describeEvent(event);
    return (
        <tr>
            <td>
                <span className={`tx-type ${className}`}>{icon} {label}</span>
            </td>
            <td>
                <span className={`tx-value ${sign === '+' ? 'positive' : ''}`}>
                    {sign}{formatUsdc(event.amount)} USDC
                </span>
            </td>
            <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                {event.counterparty
                    ? `to/from ${shortenAddress(event.counterparty)}`
                    : approximateDateFromBlock(event.blockNumber)}
            </td>
            <td>
                <a
                    href={`${BASESCAN_TX_BASE}${event.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--accent-blue)', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                    {shortenAddress(event.txHash)} <ExternalLink size={12} />
                </a>
            </td>
        </tr>
    );
}

function describeEvent(e: HistoryEvent): { label: string; icon: React.ReactNode; className: string; sign: '+' | '-' } {
    switch (e.type) {
        case 'flex_deposit':
            return { label: 'Flexible deposit', icon: <ArrowDownLeft size={14} />, className: 'deposit', sign: '+' };
        case 'flex_withdraw':
            return { label: 'Flexible withdraw', icon: <ArrowUpRight size={14} />, className: 'withdraw', sign: '-' };
        case 'fixed_open':
            return { label: 'Fixed lock', icon: <LockKeyhole size={14} />, className: 'deposit', sign: '+' };
        case 'fixed_close':
            return { label: 'Fixed unlock', icon: <ArrowUpRight size={14} />, className: 'withdraw', sign: '-' };
        case 'p2p_sent':
            return { label: 'Sent', icon: <Send size={14} />, className: 'withdraw', sign: '-' };
        case 'p2p_received':
            return { label: 'Received', icon: <ArrowDownLeft size={14} />, className: 'deposit', sign: '+' };
    }
}

export default Overview;
