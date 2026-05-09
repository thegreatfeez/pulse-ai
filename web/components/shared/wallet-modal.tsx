'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ExternalLink, X, Wallet } from 'lucide-react';
import { useWallet, type EIP6963ProviderDetail } from '@/app/context/WalletContext';

export function WalletModal() {
  const {
    isWalletModalOpen,
    closeWalletModal,
    detectedWallets,
    hasInjectedWallet,
    isConnecting,
    connectWith,
    isConnected,
  } = useWallet();

  const router = useRouter();
  const pathname = usePathname();
  // Tracks whether this modal session was user-initiated (vs auto-reconnect)
  const wasOpenRef = useRef(false);

  // Set flag when modal opens, clear it when modal closes (covers dismiss-without-connect)
  useEffect(() => {
    wasOpenRef.current = isWalletModalOpen;
  }, [isWalletModalOpen]);

  // After a user-initiated connect from the landing page, redirect to dashboard
  useEffect(() => {
    if (wasOpenRef.current && isConnected && !isWalletModalOpen && pathname === '/') {
      wasOpenRef.current = false;
      router.push('/dashboard/overview');
    }
  }, [isConnected, isWalletModalOpen, pathname, router]);

  // Close on Esc
  useEffect(() => {
    if (!isWalletModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeWalletModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isWalletModalOpen, closeWalletModal]);

  if (!isWalletModalOpen) return null;

  const handleSelect = (detail: EIP6963ProviderDetail) => {
    void connectWith(detail.provider, detail.info.rdns);
  };

  const handleLegacyInjected = () => {
    if (window.ethereum) void connectWith(window.ethereum);
  };

  return (
    <div className="wallet-modal-backdrop" onClick={closeWalletModal} role="dialog" aria-modal>
      <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wallet-modal-header">
          <div>
            <h3>Connect a wallet</h3>
            <p>Stash is non-custodial. Your keys never leave your wallet.</p>
          </div>
          <button
            type="button"
            className="wallet-modal-close"
            onClick={closeWalletModal}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="wallet-modal-body">
          {detectedWallets.length === 0 && !hasInjectedWallet && (
            <div className="wallet-empty">
              <Wallet size={32} className="wallet-empty-icon" />
              <p>
                <strong>No Web3 wallet detected.</strong>
              </p>
              <p>
                Install one of these to continue:
              </p>
              <div className="wallet-install-row">
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wallet-install-btn"
                >
                  Get MetaMask <ExternalLink size={12} />
                </a>
                <a
                  href="https://www.coinbase.com/wallet/downloads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wallet-install-btn"
                >
                  Get Coinbase Wallet <ExternalLink size={12} />
                </a>
              </div>
            </div>
          )}

          {detectedWallets.length > 0 && (
            <ul className="wallet-list">
              {detectedWallets.map((detail) => (
                <li key={detail.info.uuid}>
                  <button
                    type="button"
                    className="wallet-list-item"
                    onClick={() => handleSelect(detail)}
                    disabled={isConnecting}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={detail.info.icon} alt="" className="wallet-list-icon" />
                    <span className="wallet-list-name">{detail.info.name}</span>
                    <span className="wallet-list-cta">{isConnecting ? '...' : 'Connect'}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {detectedWallets.length === 0 && hasInjectedWallet && (
            <button
              type="button"
              className="wallet-list-item"
              onClick={handleLegacyInjected}
              disabled={isConnecting}
              style={{ width: '100%' }}
            >
              <Wallet size={20} className="wallet-list-icon" />
              <span className="wallet-list-name">Browser wallet</span>
              <span className="wallet-list-cta">{isConnecting ? '...' : 'Connect'}</span>
            </button>
          )}
        </div>

        <div className="wallet-modal-footer">
          <p>
            Network: <strong>Base Sepolia (84532)</strong>
          </p>
          <p>
            New to crypto?{' '}
            <a href="https://www.coinbase.com/wallet" target="_blank" rel="noopener noreferrer">
              Get a wallet
            </a>{' '}
            ·{' '}
            <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer">
              Get test USDC
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
