import { LiFiWidget } from '@lifi/widget';
import { useMemo } from 'react';

export default function BridgePanel({ theme = 'dark' }) {
  const widgetConfig = useMemo(() => ({
    integrator: 'PulseAI',
    allowTestnets: true,
    containerStyle: {
      border: '1px solid var(--pulse-border)',
      borderRadius: '16px',
      display: 'flex',
      maxWidth: '480px',
      margin: '0 auto',
      boxShadow: '0 20px 55px -28px rgba(2, 6, 23, 0.55)',
    },
    appearance: theme === 'dark' ? 'dark' : 'light',
    theme: {
      palette: {
        primary: { main: '#14b8a6' }, // pulse-accent
        secondary: { main: '#6366f1' },
      },
      shape: {
        borderRadius: 12,
        borderRadiusSecondary: 12,
      },
      typography: {
        fontFamily: 'Inter, sans-serif',
      },
    },
    variant: 'compact',
    subvariant: 'default',
    sdkConfig: {
      rpcUrls: {
        [1151111081099710]: ['https://api.mainnet-beta.solana.com'],
      },
    },
    // Customize allowed chains to focus on major ones if desired
    // chains: {
    //   allow: [1, 137, 10, 42161, 8453, 1151111081099710]
    // }
  }), [theme]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-pulse-text">Cross-Chain Bridge</h2>
        <p className="text-pulse-muted max-w-lg mx-auto">
          Move assets seamlessly between Solana, Ethereum, Base, and other chains using Li.Fi's smart routing.
        </p>
      </div>

      <div className="flex justify-center py-4">
        <LiFiWidget config={widgetConfig} />
      </div>

      <div className="bg-pulse-card/50 border border-pulse-border rounded-2xl p-6 max-w-2xl mx-auto">
        <h3 className="text-sm font-semibold text-pulse-text mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-pulse-accent"></span>
          Why use Pulse Bridge?
        </h3>
        <div className="grid md:grid-template-columns-2 gap-6 text-sm">
          <div className="space-y-2">
            <h4 className="font-medium text-pulse-text">Best Execution</h4>
            <p className="text-pulse-muted">Aggregates Mayan, deBridge, and Circle CCTP to find the cheapest route to Solana.</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-pulse-text">Multi-Chain Onboarding</h4>
            <p className="text-pulse-muted">Bridge funds from any EVM chain directly into SOL or Solana USDC in one step.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
