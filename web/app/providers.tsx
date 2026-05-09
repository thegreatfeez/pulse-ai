'use client';

import { WalletProvider } from './context/WalletContext';
import { ToastProvider } from './context/ToastContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <ToastProvider>{children}</ToastProvider>
    </WalletProvider>
  );
}
