'use client';

import { useWallet } from '@/app/context/WalletContext';
import { ConnectButton } from './connect-button';

export function ConnectGate({ children }: { children: React.ReactNode }) {
  const { isConnected, isConnecting } = useWallet();

  if (isConnecting) {
    return (
      <div className="connect-gate">
        <div className="connect-gate-skeleton" />
        <div className="connect-gate-skeleton short" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="connect-gate">
        <div className="connect-gate-card">
          <div className="connect-gate-icon" aria-hidden>
            🔐
          </div>
          <h2>Connect to start saving</h2>
          <p>
            Connect a Web3 wallet to access your non-custodial Stash account on Base. Your keys stay
            with you — Stash never holds your funds.
          </p>
          <ConnectButton label="Connect wallet" variant="primary" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
