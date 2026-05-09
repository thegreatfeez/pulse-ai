'use client';

import { Copy, ExternalLink, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useWallet } from '@/app/context/WalletContext';
import { useUsdcBalance } from '@/hooks/use-usdc-balance';
import {
    USDC_ADDRESS,
    FIXED_VAULT_ADDRESS,
    FLEXIBLE_VAULT_ADDRESS,
    P2P_TRANSFER_ADDRESS,
} from '@/lib/contracts';
import { BASESCAN_ADDR_BASE } from '@/lib/constants';
import { formatUsdc, shortenAddress } from '@/lib/format';

const Settings = () => {
    const { address, chainId, disconnect, isWrongNetwork, switchToBaseSepolia } = useWallet();
    const { balance: walletUsdcRaw } = useUsdcBalance();
    const [copied, setCopied] = useState(false);

    const copy = (value: string) => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <section className='settings-section'>
            <header>
                <h1>Settings</h1>
                <p>Wallet, network, and contract details for your Stash account.</p>
            </header>

            <div className='settings-card'>
                <h3>Wallet</h3>

                <Row label="Address">
                    <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{address ? shortenAddress(address) : '—'}</span>
                    {address && (
                        <button
                            type="button"
                            onClick={() => copy(address)}
                            className='settings-icon-btn'
                            title="Copy address"
                        >
                            <Copy size={14} />
                            {copied && <span style={{ fontSize: 11, marginLeft: 4 }}>copied</span>}
                        </button>
                    )}
                    {address && (
                        <a
                            href={`${BASESCAN_ADDR_BASE}${address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className='settings-icon-btn'
                            title="View on BaseScan"
                        >
                            <ExternalLink size={14} />
                        </a>
                    )}
                </Row>

                <Row label="USDC balance">
                    <span style={{ fontWeight: 600 }}>{formatUsdc(walletUsdcRaw ?? 0n)} USDC</span>
                </Row>

                <Row label="Network">
                    <span className={isWrongNetwork ? 'network-pill network-pill-warn' : 'network-pill'}>
                        {chainId ? `Chain ${parseInt(chainId, 16)}` : 'Base Sepolia'}
                    </span>
                    {isWrongNetwork && (
                        <button type="button" className='settings-icon-btn' onClick={() => switchToBaseSepolia()}>
                            Switch to Base Sepolia
                        </button>
                    )}
                </Row>

                <button
                    type="button"
                    onClick={disconnect}
                    className='settings-disconnect'
                >
                    <LogOut size={14} /> Disconnect wallet
                </button>
            </div>

            <div className='settings-card'>
                <h3>Smart contracts</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>
                    All contracts are immutable, admin-free, and source-verified on BaseScan Sepolia.
                </p>

                <ContractRow label="USDC (Circle)" address={USDC_ADDRESS} />
                <ContractRow label="Flexible vault (svfUSDC)" address={FLEXIBLE_VAULT_ADDRESS} />
                <ContractRow label="Fixed vault" address={FIXED_VAULT_ADDRESS} />
                <ContractRow label="P2P transfer" address={P2P_TRANSFER_ADDRESS} />
            </div>
        </section>
    );
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className='settings-row'>
            <span className='settings-label'>{label}</span>
            <div className='settings-row-value'>{children}</div>
        </div>
    );
}

function ContractRow({ label, address }: { label: string; address: string }) {
    return (
        <div className='settings-row'>
            <span className='settings-label'>{label}</span>
            <a
                href={`${BASESCAN_ADDR_BASE}${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className='settings-contract-link'
            >
                {shortenAddress(address)} <ExternalLink size={12} />
            </a>
        </div>
    );
}

export default Settings;
